/* =====================================================================
   WordFlow — облако Supabase: вход по email и синхронизация прогресса.
   Все данные пользователя лежат одной строкой (jsonb) в таблице wordflow_state.
   Схема и правила доступа — в файле supabase.sql.
   Объединение с данными других устройств делает тот же код, что и для Google Таблицы
   (mergeRemote в app.js): по каждому слову побеждает более свежая версия.
   ===================================================================== */

const cloud = {
  client: null,
  user: null,
  loading: null,
  error: '',
  conf() {
    const c = window.WF_CONFIG || {};
    const s = store.settings;
    return { url: str(s.sbUrl || c.supabaseUrl).replace(/\/+$/, ''), key: str(s.sbKey || c.supabaseKey) };
  },
  configured() { const c = this.conf(); return /^https:\/\/.+/.test(c.url) && c.key.length > 20; },
  active() { return !!(this.client && this.user); },

  /** Библиотека Supabase лежит в папке vendor и загружается только если облако настроено */
  loadLib() {
    if (window.supabase?.createClient) return Promise.resolve();
    if (this.loading) return this.loading;
    this.loading = new Promise((ok, fail) => {
      const sc = document.createElement('script');
      sc.src = 'vendor/supabase.js';
      sc.onload = () => ok();
      sc.onerror = () => { this.loading = null; fail(new Error('Не удалось загрузить модуль облака. Проверьте интернет.')); };
      document.head.appendChild(sc);
    });
    return this.loading;
  },

  async init() {
    this.takeSetupLink();
    if (!this.configured()) return;
    try {
      await this.loadLib();
      const { url, key } = this.conf();
      this.client = window.supabase.createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'ew.cloud.auth' }
      });
      const { data } = await this.client.auth.getSession();
      this.user = data?.session?.user || null;
      this.client.auth.onAuthStateChange((event, session) => {
        const was = this.user?.id;
        this.user = session?.user || null;
        if (this.user && this.user.id !== was) { sync.setState('idle'); sync.run(); }
        if (!this.user && was) sync.setState(sync.enabled() ? 'idle' : 'off');
        updateSyncBadge();
        if (route.name === 'base') renderCloudSection($('#cloudSection'));
        // после входа по ссылке из письма в адресе остаются служебные данные — убираем
        if (/access_token|error_description/.test(location.hash)) history.replaceState(null, '', location.pathname + '#/base');
      });
      this.error = '';
      updateSyncBadge();
      if (this.user && store.settings.autoSync) sync.schedule(600);
    } catch (e) {
      this.error = e.message;
    }
    if (route.name === 'base') renderCloudSection($('#cloudSection'));
  },

  /** Ссылка-настройка для телефона: …#/base?sb=адрес&k=ключ */
  takeSetupLink() {
    const m = location.hash.match(/[?&]sb=([^&]+)&k=([^&]+)/);
    if (!m) return;
    store.settings.sbUrl = decodeURIComponent(m[1]);
    store.settings.sbKey = decodeURIComponent(m[2]);
    store.saveSettings();
    history.replaceState(null, '', location.pathname + '#/base');
    setTimeout(() => toast('Облако настроено — теперь войдите по email'), 500);
  },
  setupLink() {
    const { url, key } = this.conf();
    return `${location.origin}${location.pathname}#/base?sb=${encodeURIComponent(url)}&k=${encodeURIComponent(key)}`;
  },

  async pull() {
    const { data, error } = await this.client.from('wordflow_state').select('data').eq('user_id', this.user.id).maybeSingle();
    if (error) throw new Error(cloudError(error));
    const d = data?.data || {};
    return { ok: true, initialized: !!data, words: d.words || [], deleted: d.deleted || {}, stats: d.stats || {}, practice: d.practice || {} };
  },
  async push(payload) {
    const data = { v: 1, device: DEVICE, words: payload.words, deleted: payload.deleted, stats: payload.stats, practice: payload.practice || {} };
    const { error } = await this.client.from('wordflow_state').upsert({ user_id: this.user.id, data, updated_at: new Date().toISOString() });
    if (error) throw new Error(cloudError(error));
  },

  redirectUrl() { return location.origin + location.pathname; },
  async signIn(email, password) {
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(cloudError(error));
  },
  async signUp(email, password) {
    const { data, error } = await this.client.auth.signUp({ email, password, options: { emailRedirectTo: this.redirectUrl() } });
    if (error) throw new Error(cloudError(error));
    return !!data.session;   // false — нужно подтвердить email
  },
  async magicLink(email) {
    const { error } = await this.client.auth.signInWithOtp({ email, options: { emailRedirectTo: this.redirectUrl() } });
    if (error) throw new Error(cloudError(error));
  },
  async signOut() { await this.client.auth.signOut(); this.user = null; }
};

function cloudError(e) {
  const m = String(e?.message || e || '');
  if (/Invalid login credentials/i.test(m)) return 'Неверный email или пароль';
  if (/Email not confirmed/i.test(m)) return 'Email не подтверждён — откройте письмо от Supabase и нажмите ссылку';
  if (/User already registered/i.test(m)) return 'Такой пользователь уже есть — нажмите «Войти»';
  if (/Password should be at least/i.test(m)) return 'Пароль слишком короткий — нужно минимум 6 символов';
  if (/rate limit|too many/i.test(m)) return 'Слишком много попыток. Подождите минуту и повторите';
  if (/relation .*wordflow_state.* does not exist|Could not find the table/i.test(m)) return 'В проекте нет таблицы wordflow_state — выполните файл supabase.sql в SQL Editor';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Нет связи с облаком. Проверьте интернет и адрес проекта';
  if (/Invalid API key|No API key/i.test(m)) return 'Неверный ключ проекта (anon key)';
  return m || 'Ошибка облака';
}

/* ---------- Блок «Облако WordFlow» на экране «Свои слова и синхронизация» ---------- */

function renderCloudSection(root) {
  if (!root) return;
  const s = store.settings;
  const conf = cloud.conf();
  const fromFile = !!(window.WF_CONFIG?.supabaseUrl && !s.sbUrl);
  let inner;
  if (!cloud.configured()) {
    inner = `
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Вход по email — и прогресс, статистика, тексты и уроки общие на телефоне и компьютере. Нужно один раз создать бесплатный проект Supabase (пошагово — в <b>ИНСТРУКЦИЯ.md</b>, раздел «Облако Supabase») и вставить сюда его адрес и ключ.</p>
      <div class="mt-3 grid gap-2">
        <input id="sbUrl" class="input" placeholder="https://xxxx.supabase.co" value="${esc(s.sbUrl || '')}" autocomplete="off" />
        <input id="sbKey" class="input font-mono text-xs" placeholder="anon public key (длинный ключ eyJ… или sb_publishable_…)" value="${esc(s.sbKey || '')}" autocomplete="off" />
        <button class="btn btn-primary" id="sbSave"><i data-lucide="plug"></i>Подключить облако</button>
      </div>`;
  } else if (!cloud.client) {
    inner = cloud.error
      ? `<p class="text-sm text-rose-500 mt-2">${esc(cloud.error)}</p><button class="btn btn-ghost mt-3" id="sbRetry"><i data-lucide="refresh-cw"></i>Повторить</button>`
      : `<p class="text-sm text-slate-500 mt-2 flex items-center gap-2"><i data-lucide="loader-circle" class="animate-spin"></i>Подключение к облаку…</p>`;
  } else if (!cloud.user) {
    inner = `
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Войдите — и данные этого устройства объединятся с облаком. На другом устройстве войдите с тем же email.</p>
      <form id="sbForm" class="mt-3 grid gap-2">
        <input id="sbEmail" type="email" class="input" placeholder="Email" autocomplete="email" required value="${esc(s.sbEmail || '')}" />
        <input id="sbPass" type="password" class="input" placeholder="Пароль (не меньше 6 символов)" autocomplete="current-password" />
        <div class="grid grid-cols-2 gap-2">
          <button class="btn btn-primary" data-act="in"><i data-lucide="log-in"></i>Войти</button>
          <button class="btn btn-ghost" data-act="up" type="button"><i data-lucide="user-plus"></i>Создать аккаунт</button>
        </div>
        <button class="btn btn-ghost !h-auto py-2 !whitespace-normal text-sm" data-act="link" type="button"><i data-lucide="mail"></i>Войти без пароля — прислать ссылку на почту</button>
      </form>
      <p class="text-xs text-slate-400 mt-2">Проект: ${esc(conf.url.replace('https://', ''))}${fromFile ? '' : ` · <button class="underline" id="sbReset">изменить</button>`}</p>`;
  } else {
    inner = `
      <p class="text-sm mt-1">Вы вошли как <b>${esc(cloud.user.email || '')}</b></p>
      <p class="text-sm mt-1" id="syncStatus"></p>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Слова, прогресс, статистика, уроки и тексты синхронизируются автоматически: при открытии приложения и через несколько секунд после изменений.</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn btn-primary" id="sbSync"><i data-lucide="refresh-cw"></i>Синхронизировать сейчас</button>
        ${fromFile ? '' : '<button class="btn btn-ghost" id="sbLink"><i data-lucide="smartphone"></i>Ссылка для телефона</button>'}
        <button class="btn btn-danger" id="sbOut"><i data-lucide="log-out"></i>Выйти</button>
      </div>
      <label class="mt-4 flex items-center justify-between gap-4">
        <span><span class="text-sm font-bold block">Автоматически</span><span class="text-xs text-slate-500 dark:text-slate-400">При открытии приложения и после изменений</span></span>
        <input type="checkbox" id="sbAuto" class="w-5 h-5 accent-brand-500" ${s.autoSync ? 'checked' : ''}></label>`;
  }
  root.innerHTML = `<section class="card p-5 mt-5 ${cloud.active() ? 'border-brand-500/40' : ''}">
    <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="cloud" class="text-brand-500"></i>Облако WordFlow (вход по email)
      <span class="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${cloud.active() ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300' : 'bg-slate-500/10 text-slate-500'}">${cloud.active() ? 'подключено' : 'рекомендуется'}</span></h2>
    ${inner}</section>`;
  icons();
  updateSyncBadge();

  const save = $('#sbSave', root);
  if (save) save.onclick = async () => {
    let url = $('#sbUrl').value.trim(), key = $('#sbKey').value.trim();
    const m = url.match(/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)/i);
    if (m) url = m[0];
    if (!/^https:\/\//.test(url) || key.length < 20) { toast('Вставьте адрес проекта (https://….supabase.co) и ключ anon', 'error'); return; }
    s.sbUrl = url; s.sbKey = key; store.saveSettings();
    cloud.client = null; cloud.error = '';
    renderCloudSection(root);
    await cloud.init();
  };
  const retry = $('#sbRetry', root);
  if (retry) retry.onclick = () => { cloud.error = ''; renderCloudSection(root); cloud.init(); };
  const reset = $('#sbReset', root);
  if (reset) reset.onclick = () => { s.sbUrl = ''; s.sbKey = ''; store.saveSettings(); cloud.client = null; renderCloudSection(root); };
  const form = $('#sbForm', root);
  if (form) {
    const go = async act => {
      const email = $('#sbEmail').value.trim(), pass = $('#sbPass').value;
      if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Введите email', 'error'); return; }
      s.sbEmail = email; store.saveSettings();
      const btns = $$('button', form); btns.forEach(b => b.disabled = true);
      try {
        if (act === 'link') { await cloud.magicLink(email); toast('Ссылка отправлена — откройте письмо на этом устройстве'); }
        else if (pass.length < 6) { toast('Пароль — минимум 6 символов', 'error'); }
        else if (act === 'up') {
          const logged = await cloud.signUp(email, pass);
          toast(logged ? 'Аккаунт создан' : 'Аккаунт создан. Подтвердите email по ссылке из письма, затем нажмите «Войти»');
        } else { await cloud.signIn(email, pass); toast('Вы вошли — синхронизирую'); }
      } catch (e) { toast(e.message, 'error'); }
      btns.forEach(b => b.disabled = false);
    };
    form.onsubmit = e => { e.preventDefault(); go('in'); };
    $$('[data-act]', form).forEach(b => { if (b.dataset.act !== 'in') b.onclick = () => go(b.dataset.act); });
  }
  const sn = $('#sbSync', root); if (sn) sn.onclick = () => sync.run({ silent: false });
  const au = $('#sbAuto', root); if (au) au.onchange = e => { s.autoSync = e.target.checked; store.saveSettings(); };
  const ln = $('#sbLink', root);
  if (ln) ln.onclick = async () => { if (await copyText(cloud.setupLink())) toast('Ссылка скопирована — откройте её на телефоне, облако настроится само'); };
  const out = $('#sbOut', root);
  if (out) out.onclick = async () => {
    if (!(await confirmDialog('Выйти из облака на этом устройстве? Данные здесь и в облаке сохранятся.', 'Выйти'))) return;
    await cloud.signOut(); renderCloudSection(root); render();
  };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(() => cloud.init(), 50));
else setTimeout(() => cloud.init(), 50);
