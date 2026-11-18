/* =====================================================================
   WordFlow — world.js
   Остров прогресса: связь приложения с движком (world3d.js).
   Движок грузится по требованию, один на всё приложение: канва
   переезжает между экранами, вне экрана рендер останавливается.
   Подключается после learn.js.
   ===================================================================== */
'use strict';

const LS_WORLD_SEEN = 'wf.world.seen.v1';

const WORLD = {
  engine: null,          // движок (создаётся при первом показе)
  loading: null,         // промис загрузки world3d.js
  defs: null,            // 48 объектов, сопоставленных модулям курса
  mods: null,            // список модулей в порядке курса
  failed: false,
  host: null
};

/* ---------- формула (дубль из движка: нужна до его загрузки) ---------- */
function wSize(known, mods, total) {
  const w = Math.min(1, known / 2500), m = Math.min(1, mods / Math.max(1, total));
  return Math.min(1, Math.pow(w, 0.75) * 0.65 + m * 0.35);
}
function wDays(stats, perDay = 10, back = 120) {
  const out = [], now = new Date();
  for (let i = back - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    let s = 0, a = 0, n = 0;
    for (const v of Object.values(stats[key] || {})) { s += +v.s || 0; a += +v.a || 0; n += +v.n || 0; }
    out.push(!s ? 'miss' : (n >= perDay || a >= 40) ? 'full' : 'part');
  }
  return out;
}
function wHealth(days) {
  let hp = 60, miss = 0;
  for (const d of days) {
    if (d === 'full') { hp += 12; miss = 0; }
    else if (d === 'part') { hp += 6; miss = 0; }
    else { miss++; hp -= Math.min(10, 5 + miss); }
    hp = Math.max(0, Math.min(100, hp));
  }
  return Math.round(hp);
}

/* ---------- доступность ---------- */
function worldSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}
function worldEnabled() { return store.settings.world3d !== 'off' && worldSupported() && !WORLD.failed; }

/* ---------- данные из приложения ---------- */
/** модули курса в порядке уровней — ровно тот порядок, в котором открываются награды */
function worldModules() {
  const mods = courseModules();
  const out = [];
  for (const L of LEVELS) for (const m of (mods[L] || [])) out.push({ id: m.id, level: m.level, n: m.n, topic: moduleTitle(m) });
  return out;
}
function worldDefs() {
  if (!WORLD.defs) {
    WORLD.mods = worldModules();
    WORLD.defs = window.WF3D.defsFromModules(WORLD.mods);
  }
  return WORLD.defs;
}
/** сколько модулей закрыто подряд с начала курса и сколько всего */
function worldDoneModules() {
  const idx = wordIndex();
  const all = worldModules();
  let done = 0;
  const flags = all.map(m => {
    const mod = moduleById(m.id);
    return mod ? moduleProgress(mod, idx).done : false;
  });
  /* награда за модуль выдаётся по его номеру: считаем все закрытые,
     но объект i появляется только если закрыт i-й по счёту модуль */
  for (const f of flags) if (f) done++;
  return { done, flags, all };
}
function worldState() {
  const idx = wordIndex();
  let known = 0;
  for (const b of BASE.list) if (isKnown(idx.get(b.base_id))) known++;
  const { done, all } = worldDoneModules();
  const hp = wHealth(wDays(store.stats, store.settings.newPerDay || 10));
  return { known, mods: done, hp, total: all.length };
}

/* ---------- загрузка движка ---------- */
function loadWorldEngine() {
  if (window.WF3D) return Promise.resolve();
  if (WORLD.loading) return WORLD.loading;
  WORLD.loading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'world3d.js';
    s.onload = () => res();
    s.onerror = () => { WORLD.failed = true; rej(new Error('world3d')); };
    document.head.appendChild(s);
  });
  return WORLD.loading;
}

/* ---------- монтирование ---------- */
function worldQuality() {
  const q = store.settings.worldQ || 'auto';
  return q === 'auto' ? undefined : q;
}
async function worldAttach(el, mode) {
  if (!worldEnabled() || !el) return;
  try { await loadWorldEngine(); } catch { worldFallback(el); return; }
  if (!WORLD.engine) {
    WORLD.engine = window.WF3D.create({
      quality: worldQuality() || 'auto',
      onPick: worldPick
    });
  }
  const eng = WORLD.engine;
  if (!eng.isBuilt()) {
    const season = store.settings.worldSeason === false ? 'summer' : window.WF3D.seasonOf();
    eng.build(worldDefs(), { season });
  }
  eng.mount(el, mode);
  eng.setState(worldState(), false);
  WORLD.host = el;
  el.classList.remove('is-loading');
  if (WORLD.flyTo != null) { eng.flyToReward(WORLD.flyTo); WORLD.flyTo = null; }
  if (!WORLD.firstRender) { WORLD.firstRender = true; render(); }
}
function worldDetach() {
  if (WORLD.engine) WORLD.engine.setActive(false);
  WORLD.host = null;
}
function worldFallback(el) {
  el.innerHTML = `<div class="absolute inset-0 grid place-items-center text-center px-6 text-sm text-slate-400">
    Трёхмерный остров не запустился на этом устройстве. Прогресс от этого не теряется.</div>`;
}
/** вызывается из render(): канва переезжает на текущий экран или засыпает */
function worldSync() {
  const el = document.getElementById('worldHost');
  if (!el) { worldDetach(); return; }
  worldAttach(el, el.dataset.mode || 'full');
}

/* ---------- карточка объекта ---------- */
function worldPick(ev) {
  const d = ev.def;
  const mod = moduleById(d.moduleId);
  const p = mod ? moduleProgress(mod) : null;
  const badge = levelBadge(d.level);
  if (ev.unlocked) {
    openModal(`<div class="p-5 md:p-6">
      <div class="flex items-center gap-2 mb-1">${badge}<span class="text-xs text-slate-400">Модуль ${d.n} · ${d.moduleTopic}</span></div>
      <h3 class="text-xl font-extrabold">${d.name}</h3>
      <div class="mt-3 rounded-2xl bg-slate-100 dark:bg-white/5 p-4">
        <div class="text-lg font-bold">${d.word} <span class="text-sm font-normal text-slate-400">${d.ipa}</span></div>
        <div class="text-slate-500 dark:text-slate-400">${d.ru}</div>
      </div>
      <div class="mt-4 flex gap-2 flex-wrap">
        <button class="btn btn-ghost" id="wSay"><i data-lucide="volume-2"></i>Слушать</button>
        <button class="btn btn-primary" id="wGo"><i data-lucide="graduation-cap"></i>К модулю</button>
      </div></div>`);
    const say = document.getElementById('wSay');
    if (say) say.onclick = () => tts.speak(d.word);
  } else {
    openModal(`<div class="p-5 md:p-6">
      <div class="flex items-center gap-2 mb-1">${badge}<span class="text-xs text-slate-400">Модуль ${d.n} · ${d.moduleTopic}</span></div>
      <h3 class="text-xl font-extrabold">Пока закрыто: ${d.name}</h3>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">Появится на острове, когда закроете этот модуль курса.</p>
      ${p ? `<div class="mt-3">
        <div class="flex justify-between text-xs mb-1"><span class="text-slate-400">Готовность</span><b>${p.pct}%</b></div>
        <div class="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden"><div class="h-full bg-brand-500" style="width:${p.pct}%"></div></div>
      </div>` : ''}
      <div class="mt-4 flex gap-2 flex-wrap">
        <button class="btn btn-primary" id="wGo"><i data-lucide="play"></i>Пройти модуль</button>
        <button class="btn btn-ghost" id="wClose">Позже</button>
      </div></div>`);
    const cl = document.getElementById('wClose');
    if (cl) cl.onclick = closeModal;
  }
  const go = document.getElementById('wGo');
  if (go) go.onclick = () => { closeModal(); courseState.level = d.level; courseState.module = d.moduleId; location.hash = '#/course'; };
  icons();
}

/* ---------- «на острове открылась награда» ---------- */
function worldSeen() { return load(LS_WORLD_SEEN, null); }
function worldCheckUnlocks() {
  if (!worldEnabled() || typeof BASE === 'undefined') return;
  let seen = worldSeen();
  const { done, all } = worldDoneModules();
  if (seen === null) { save(LS_WORLD_SEEN, done); return; }   // первый запуск — молча запоминаем
  if (done <= seen) { if (done < seen) save(LS_WORLD_SEEN, done); return; }
  const defs = (window.WF3D ? worldDefs() : null);
  save(LS_WORLD_SEEN, done);
  const fresh = defs ? defs.slice(seen, done) : null;
  const d = fresh && fresh.length ? fresh[fresh.length - 1] : null;
  const many = fresh && fresh.length > 1;
  openModal(`
    <div class="text-center p-5 md:p-6">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-brand-500/15 text-brand-500 grid place-items-center mb-3"><i data-lucide="sparkles" style="width:1.8rem;height:1.8rem"></i></div>
      <h3 class="text-xl font-extrabold">${many ? 'На острове новые объекты' : 'На острове новый объект'}</h3>
      ${d ? `<p class="text-slate-500 dark:text-slate-400 mt-2">${many ? `Открылось ${fresh.length}, последний — ` : ''}<b class="text-slate-900 dark:text-white">${d.name}</b>${many ? '' : ` за модуль ${d.level}-${d.n}`}.</p>` : ''}
      <div class="mt-5 flex gap-2 justify-center flex-wrap">
        <button class="btn btn-primary" id="wSee"><i data-lucide="map"></i>Посмотреть</button>
        <button class="btn btn-ghost" id="wLater">Потом</button>
      </div>
    </div>`);
  document.getElementById('wLater').onclick = closeModal;
  document.getElementById('wSee').onclick = () => {
    closeModal();
    WORLD.flyTo = done - 1;
    location.hash = '#/world';
  };
  icons();
}

/* ---------- блоки на экранах ---------- */
function worldHostHtml(mode, h) {
  return `<div id="worldHost" data-mode="${mode}" class="relative overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 to-sky-400 dark:from-ink-850 dark:to-ink-900" style="height:${h}"></div>`;
}
/** большой блок на «Прогрессе» */
function worldBlock() {
  if (!worldEnabled()) return '';
  const st = worldState();
  const next = worldNextReward();
  return `
    <div class="card p-4 md:p-5 mt-4">
      <div class="flex items-end justify-between gap-3 flex-wrap mb-3">
        <div>
          <div class="font-extrabold text-lg">Ваш остров</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">Растёт от выученных слов и закрытых модулей, вянет от пропусков</div>
        </div>
        <a href="#/world" class="btn btn-ghost btn-sm"><i data-lucide="maximize-2"></i>Во весь экран</a>
      </div>
      ${worldHostHtml('full', 'min(52vh,360px)')}
      <div class="grid grid-cols-3 gap-2 mt-3 text-center">
        <div class="rounded-xl bg-slate-100 dark:bg-white/5 py-2">
          <div class="text-lg font-extrabold">${Math.round(wSize(st.known, st.mods, st.total) * 100)}%</div>
          <div class="text-[11px] text-slate-500">размер</div></div>
        <div class="rounded-xl bg-slate-100 dark:bg-white/5 py-2">
          <div class="text-lg font-extrabold ${st.hp >= 80 ? 'text-brand-500' : st.hp >= 45 ? 'text-amber-500' : 'text-rose-500'}">${st.hp}%</div>
          <div class="text-[11px] text-slate-500">здоровье</div></div>
        <div class="rounded-xl bg-slate-100 dark:bg-white/5 py-2">
          <div class="text-lg font-extrabold">${st.mods}/${st.total}</div>
          <div class="text-[11px] text-slate-500">объектов</div></div>
      </div>
      ${next ? `<div class="mt-3 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <i data-lucide="lock" style="width:1rem;height:1rem"></i>Следующий объект — <b class="text-slate-700 dark:text-slate-200">${next.def.name}</b> за модуль ${next.def.level}-${next.def.n}${next.pct != null ? ` (${next.pct}%)` : ''}</div>` : ''}
    </div>`;
}
/** узкая полоска на «Учить» */
function worldStrip() {
  if (!worldEnabled()) return '';
  const st = worldState();
  return `
    <a href="#/world" class="block mt-4 relative">
      ${worldHostHtml('strip', '116px')}
      <div class="absolute inset-x-0 bottom-0 p-2.5 flex items-center gap-2 text-xs font-semibold
                  bg-gradient-to-t from-black/55 to-transparent text-white pointer-events-none">
        <i data-lucide="map" style="width:.95rem;height:.95rem"></i>Остров: ${st.mods} из ${st.total} объектов · здоровье ${st.hp}%
        <span class="ml-auto opacity-80">открыть</span>
      </div>
    </a>`;
}
function worldNextReward() {
  if (!window.WF3D) return null;
  const defs = worldDefs();
  const { done } = worldDoneModules();
  const d = defs[done];
  if (!d) return null;
  const mod = moduleById(d.moduleId);
  return { def: d, pct: mod ? moduleProgress(mod).pct : null };
}

/* ---------- полноэкранный режим ---------- */
function renderWorld(view) {
  if (!worldEnabled()) {
    view.innerHTML = `<h1 class="text-2xl font-extrabold tracking-tight mb-4">Остров</h1>
      ${emptyState('Остров выключен', 'Включите его в «Ещё → Обучение», если устройство тянет трёхмерную графику.',
        `<a href="#/settings" class="btn btn-primary"><i data-lucide="settings"></i>Настройки</a>`)}`;
    return;
  }
  const st = worldState();
  const next = worldNextReward();
  view.innerHTML = `
    <div class="flex items-center gap-2 mb-3">
      <a href="#/stats" class="btn btn-ghost btn-sm"><i data-lucide="arrow-left"></i>Назад</a>
      <div class="ml-auto flex gap-1.5">
        <button class="icon-btn" id="wNight" title="День или ночь"><i data-lucide="moon-star"></i></button>
        <button class="icon-btn" id="wFly" title="Облёт"><i data-lucide="rotate-3d"></i></button>
        <button class="icon-btn" id="wFit" title="Весь остров"><i data-lucide="scan"></i></button>
      </div>
    </div>
    ${worldHostHtml('full', 'calc(100vh - 13rem)')}
    <div class="mt-3 flex items-center gap-3 flex-wrap text-sm">
      <span class="chip is-active">${st.mods} из ${st.total} объектов</span>
      <span class="chip">здоровье ${st.hp}%</span>
      <button class="chip" id="wList"><i data-lucide="list"></i>Все объекты</button>
      ${next ? `<span class="text-slate-500 dark:text-slate-400">Следующий: <b>${next.def.name}</b> · модуль ${next.def.level}-${next.def.n}</span>` : ''}
    </div>
    <p class="text-xs text-slate-400 mt-2">Тап по объекту — карточка. Светящиеся силуэты — ближайшие награды: нажмите, чтобы перейти к нужному модулю.</p>`;
  const n = document.getElementById('wNight');
  if (n) n.onclick = () => { if (WORLD.engine) WORLD.engine.toggleNight(); };
  const f = document.getElementById('wFly');
  if (f) f.onclick = () => { if (WORLD.engine) WORLD.engine.setFly(true); };
  const ft = document.getElementById('wFit');
  if (ft) ft.onclick = () => { if (WORLD.engine) WORLD.engine.fit(false); };
  const ls = document.getElementById('wList');
  if (ls) ls.onclick = worldListModal;
}

function worldListModal() {
  const defs = worldDefs();
  const { done } = worldDoneModules();
  openModal(`<div class="p-5 md:p-6"><h3 class="text-xl font-extrabold mb-1">Объекты острова</h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Один закрытый модуль курса — один объект.</p>
    <div class="max-h-[60vh] overflow-auto -mx-1 px-1 space-y-1.5">
      ${defs.map((d, i) => {
        const open = i < done;
        return `<button data-i="${i}" class="w-full text-left rounded-xl px-3 py-2 flex items-center gap-3
            ${open ? 'bg-brand-500/10' : 'bg-slate-100 dark:bg-white/5'}">
          <span class="w-7 h-7 rounded-lg grid place-items-center text-xs font-bold ${open ? 'bg-brand-500 text-white' : 'bg-slate-300 dark:bg-white/10 text-slate-500'}">${i + 1}</span>
          <span class="min-w-0">
            <span class="block font-semibold truncate">${open ? d.name : '???'}</span>
            <span class="block text-[11px] text-slate-500">${d.level}-${d.n} · ${d.moduleTopic}</span>
          </span>
          ${open ? `<span class="ml-auto text-xs text-slate-400">${d.word}</span>` : '<i data-lucide="lock" class="ml-auto text-slate-400" style="width:.9rem;height:.9rem"></i>'}
        </button>`;
      }).join('')}
    </div></div>`, { wide: true });
  document.querySelector('#modalRoot [data-i]')?.closest('div')?.addEventListener('click', e => {
    const b = e.target.closest('[data-i]');
    if (!b) return;
    const i = +b.dataset.i;
    closeModal();
    if (i < done) { if (WORLD.engine) WORLD.engine.flyToReward(i); }
    else worldPick({ def: defs[i], unlocked: false, index: i });
  });
  icons();
}
