/* =====================================================================
   WordFlow — вкладка «Практика»: «Предложения» (грамматика простым языком,
   разбор по частям, упражнения) и «Тексты» (чтение по уровням, перевод
   слова по нажатию, вопросы на понимание).
   Подключается после app.js и использует его функции (store, tts, toast…).
   ===================================================================== */

const LS_PRACTICE = 'ew.practice.v1';
const SENT = window.WF_SENT || { roles: {}, lessons: [] };
const TEXTS = window.WF_TEXTS || [];
const ROLES = SENT.roles;

const practice = {
  tab: 'sent',        // sent | texts
  level: 'all',
  lesson: null,       // id открытого урока
  text: null,         // id открытого текста
  run: null,          // текущая серия упражнений по предложениям
  showTr: false,      // показывать перевод всего текста
  quiz: {}            // ответы на вопросы к тексту: { индекс: выбранный вариант }
};

/* ---------- Прогресс практики (хранится локально и синхронизируется через Supabase) ---------- */

const pstore = {
  data: null,
  get() {
    if (!this.data) {
      const d = load(LS_PRACTICE, null) || {};
      this.data = { s: d.s || {}, t: d.t || {} };
    }
    return this.data;
  },
  save(quiet = false) { save(LS_PRACTICE, this.get()); if (!quiet && typeof sync !== 'undefined') sync.schedule(); },
  /** Объединение с данными другого устройства: по каждому уроку/тексту побеждает более свежая запись */
  merge(remote) {
    const d = this.get();
    let changedLocal = false, needPush = false;
    for (const k of ['s', 't']) {
      const r = (remote && remote[k]) || {};
      for (const [id, v] of Object.entries(r)) {
        if (!d[k][id] || (+v.u || 0) > (+d[k][id].u || 0)) { d[k][id] = v; changedLocal = true; }
      }
      for (const [id, v] of Object.entries(d[k])) if (!r[id] || (+r[id].u || 0) < (+v.u || 0)) needPush = true;
    }
    if (changedLocal) this.save(true);
    return { changedLocal, needPush };
  }
};

function addPracticeStats(answers, correct, seconds) {
  if (!answers) return;
  const st = statDay(todayStr());
  st.s += 1; st.a += answers; st.c += correct;
  st.t += Math.min(Math.round(seconds), 3 * 3600);
  st.u = Date.now();
  store.saveStats();
}

/* ---------- Разбор предложения ---------- */

/** «[S:I] [V*:am] [A:a manager].» → части с ролями */
function parseSent(markup) {
  const parts = [];
  const re = /\[([A-Z])(\*?):([^\]]+)\]|([^\[]+)/g;
  let m;
  while ((m = re.exec(markup))) {
    if (m[4] != null) parts.push({ role: '', text: m[4], gap: false });
    else parts.push({ role: m[1], text: m[3], gap: !!m[2] });
  }
  return parts;
}
const sentPlain = markup => parseSent(markup).map(p => p.text).join('');

function roleColor(r) { return (ROLES[r] || [])[3] || '#64748b'; }
function roleName(r) { return (ROLES[r] || [r])[store.settings.lang === 'ua' ? 1 : 0]; }
/** Українська версія поля уроку/тексту (data/ua.js), якщо обрано UA */
const isUA = () => store.settings.lang === 'ua';
const loc = (o, k) => (isUA() && o && o.ua && o.ua[k] != null) ? o.ua[k] : o[k];
function roleDesc(r) { const x = ROLES[r] || []; return (isUA() && x[4]) || x[2] || ''; }

/** Цветной разбор: каждая часть подписана своей ролью */
function sentBreakdown(markup) {
  const items = [];
  for (const p of parseSent(markup)) {
    if (!p.role) {
      const t = p.text.trim();
      if (!t) continue;
      // знаки препинания «прилипают» к предыдущей части, чтобы не переноситься отдельно
      if (!/[A-Za-z0-9]/.test(t) && items.length) { items[items.length - 1].tail += t; continue; }
      items.push({ html: `<span class="text-lg font-semibold pt-0.5">${esc(t)}</span>`, tail: '' });
      continue;
    }
    const c = roleColor(p.role);
    items.push({ html: `<span class="inline-flex flex-col items-center">
      <span class="text-lg font-bold px-1.5 py-0.5 rounded-lg" style="background:${c}22;color:${c}">${esc(p.text)}</span>
      <span class="text-[10px] font-semibold mt-0.5 opacity-80" style="color:${c}">${esc(roleName(p.role))}</span></span>`, tail: '' });
  }
  return `<div class="flex flex-wrap items-start gap-x-1.5 gap-y-2 leading-tight">${items.map(i =>
    `<span class="inline-flex items-start">${i.html}${i.tail ? `<span class="text-lg font-semibold pt-0.5">${esc(i.tail)}</span>` : ''}</span>`).join('')}</div>`;
}

/** Формула урока: [S] + am / is / are → цветные метки */
function formulaHtml(f) {
  return esc(f).replace(/\[([A-Z])(?::([^\]]+))?\]/g, (_, r, t) =>
    `<span class="inline-block px-1.5 rounded-md font-bold" style="background:${roleColor(r)}22;color:${roleColor(r)}">${t ? t : roleName(r)}</span>`);
}

/* ---------- Проверка перевода ---------- */

const SPELL_US = { centre: 'center', colour: 'color', favourite: 'favorite', organise: 'organize', theatre: 'theater', travelling: 'traveling', cancelled: 'canceled', practise: 'practice', neighbour: 'neighbor' };

function normEn(s) {
  let t = String(s || '').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[—–-]/g, ' ');
  t = t.replace(/\bwon't\b/g, 'will not').replace(/\bcan't\b/g, 'can not').replace(/\bcannot\b/g, 'can not')
    .replace(/\bshan't\b/g, 'shall not').replace(/n't\b/g, ' not')
    .replace(/'m\b/g, ' am').replace(/'re\b/g, ' are').replace(/'ll\b/g, ' will').replace(/'ve\b/g, ' have').replace(/'d\b/g, ' would');
  t = t.replace(/[.,!?;:"()«»]/g, ' ').replace(/\s+/g, ' ').trim();
  return t.split(' ').map(w => SPELL_US[w] || w).join(' ');
}
/** Варианты ответа пользователя: «'s» может быть is или has */
function answerVariants(s) {
  const base = normEn(s);
  if (!/'s\b/.test(base)) return [base];
  return [base.replace(/'s\b/g, ' is'), base.replace(/'s\b/g, ' has'), base.replace(/'s\b/g, '')].map(x => x.replace(/\s+/g, ' ').trim());
}
function checkTranslation(given, refs) {
  const goods = refs.map(r => normEn(r).replace(/'s\b/g, m => m));
  const expanded = goods.flatMap(g => /'s\b/.test(g) ? [g.replace(/'s\b/g, ' is'), g.replace(/'s\b/g, ' has')].map(x => x.replace(/\s+/g, ' ').trim()) : [g]);
  const vars = answerVariants(given);
  if (vars.some(v => expanded.includes(v))) return 'ok';
  const best = Math.min(...vars.flatMap(v => expanded.map(g => levenshtein(v, g))));
  const len = expanded[0]?.length || 10;
  return best <= Math.max(1, Math.floor(len / 18)) ? 'typo' : 'wrong';
}

/* ---------- Экран «Практика» ---------- */

function renderPractice(view) {
  if (practice.run) return renderSentRun(view);
  if (practice.lesson) return renderLesson(view);
  if (practice.text) return renderReader(view);
  const tabs = [['sent', 'Предложения', 'text-cursor-input'], ['texts', 'Тексты', 'book-open']];
  view.innerHTML = `
    <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">Практика</h1>
    <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">${practice.tab === 'sent'
      ? 'Как строится английское предложение: правило простым языком, разбор по частям и упражнения.'
      : 'Короткие и длинные тексты по уровням. Нажмите на любое слово — увидите перевод и сможете добавить его в изучение.'}</p>
    <div class="mt-4 grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-500/10 max-w-md" id="pTabs">
      ${tabs.map(([v, l, i]) => `<button data-tab="${v}" class="h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${practice.tab === v ? 'bg-white dark:bg-ink-800 shadow-sm text-brand-600 dark:text-brand-300' : 'text-slate-500'}"><i data-lucide="${i}"></i>${l}</button>`).join('')}
    </div>
    <div class="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4" id="pLevels">
      ${['all', 'A1', 'A2', 'B1'].map(l => `<button class="chip ${practice.level === l ? 'is-active' : ''}" data-l="${l}">${l === 'all' ? 'Все уровни' : l}</button>`).join('')}
    </div>
    <div id="pList" class="mt-4"></div>`;
  $('#pTabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (!b) return; practice.tab = b.dataset.tab; render(); };
  $('#pLevels').onclick = e => { const b = e.target.closest('[data-l]'); if (!b) return; practice.level = b.dataset.l; render(); };
  if (practice.tab === 'sent') renderLessonList($('#pList')); else renderTextList($('#pList'));
}

function levelOk(l) { return practice.level === 'all' || practice.level === l; }

function renderLessonList(root) {
  const prog = pstore.get().s;
  const lessons = SENT.lessons.filter(l => levelOk(l.level));
  const mine = myExampleWords().length;
  root.innerHTML = `
    <button class="w-full card p-4 flex items-center gap-4 hover:border-brand-400 transition text-left" id="myExBtn">
      <div class="w-11 h-11 rounded-2xl bg-violet-500/15 text-violet-500 grid place-items-center shrink-0"><i data-lucide="sparkles"></i></div>
      <div class="flex-1 min-w-0"><div class="font-extrabold">Предложения из моих слов</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Примеры к словам, которые вы учите: собрать фразу и вставить слово${mine ? ` · доступно ${mine}` : ' · сначала начните учить слова'}</div></div>
      <i data-lucide="play" class="text-brand-500"></i>
    </button>
    ${['A1', 'A2', 'B1'].filter(levelOk).map(lv => {
      const ls = lessons.filter(l => l.level === lv);
      if (!ls.length) return '';
      return `<h2 class="mt-6 mb-2 font-extrabold flex items-center gap-2">${levelBadge(lv)} ${LEVEL_INFO[lv]}</h2>
      <div class="grid md:grid-cols-2 gap-2">${ls.map(l => {
        const p = prog[l.id];
        return `<button class="card p-4 text-left hover:border-brand-400 transition min-w-0" data-lesson="${l.id}">
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="font-extrabold leading-snug">${esc(loc(l, 'title'))}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">${esc(loc(l, 'sub'))}</div>
            </div>
            ${p ? `<span class="shrink-0 text-xs font-bold px-2 py-1 rounded-full ${p.best >= 80 ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300' : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'}">${p.best}%</span>` : '<span class="shrink-0 text-xs text-slate-400">новый</span>'}
          </div>
          <div class="text-xs text-slate-400 mt-2">${l.s.length} предложений</div>
        </button>`;
      }).join('')}</div>`;
    }).join('')}`;
  root.onclick = e => {
    const b = e.target.closest('[data-lesson]');
    if (b) { practice.lesson = b.dataset.lesson; render(); window.scrollTo(0, 0); return; }
    if (e.target.closest('#myExBtn')) startMyExamples();
  };
}

/* ---------- Урок ---------- */

function lessonById(id) { return SENT.lessons.find(l => l.id === id); }
const sentTr = s => store.settings.lang === 'ua' ? (s[2] || s[1]) : s[1];

function renderLesson(view) {
  const l = lessonById(practice.lesson);
  if (!l) { practice.lesson = null; return renderPractice(view); }
  const p = pstore.get().s[l.id];
  const usedRoles = [...new Set(l.s.flatMap(s => parseSent(s[0]).map(x => x.role)).filter(Boolean))];
  view.innerHTML = `
    <button class="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-500 mb-2" id="backBtn"><i data-lucide="chevron-left"></i>Предложения</button>
    <div class="flex items-start gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">${levelBadge(l.level)}${p ? `<span class="text-xs font-bold text-brand-500">лучший результат ${p.best}%</span>` : ''}</div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">${esc(loc(l, 'title'))}</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">${esc(loc(l, 'sub'))}</p>
      </div>
    </div>

    <section class="card p-5 mt-5">
      <div class="text-xs font-bold uppercase tracking-wider text-slate-400">Схема</div>
      <div class="mt-2 space-y-1.5">${loc(l, 'formula').map(f => `<div class="font-mono text-[15px] font-semibold leading-relaxed">${formulaHtml(f)}</div>`).join('')}</div>
      <div class="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">${loc(l, 'explain').map(t => `<p>${t}</p>`).join('')}</div>
    </section>

    <button class="btn btn-primary btn-lg w-full mt-4" id="practiceBtn"><i data-lucide="play"></i>Практика: ${l.s.length} упражнений</button>

    <h2 class="mt-6 font-extrabold flex items-center gap-2"><i data-lucide="scan-text" class="text-brand-500"></i>Разбор предложений</h2>
    <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">${usedRoles.map(r => `<span class="inline-flex items-center gap-1" title="${esc(roleDesc(r))}"><span class="w-2.5 h-2.5 rounded-sm" style="background:${roleColor(r)}"></span>${esc(roleName(r))} — <span class="text-slate-400">${esc(roleDesc(r))}</span></span>`).join('')}</div>
    <div class="mt-3 space-y-2">
      ${l.s.map(s => `<div class="card p-4 flex gap-3">
        <button class="icon-btn !w-9 !h-9 shrink-0" data-say="${esc(sentPlain(s[0]))}" aria-label="Озвучить"><i data-lucide="volume-2"></i></button>
        <div class="min-w-0 flex-1">${sentBreakdown(s[0])}
          <div class="text-sm text-slate-500 dark:text-slate-400 mt-2">${esc(sentTr(s))}</div></div>
      </div>`).join('')}
    </div>
    <button class="btn btn-primary btn-lg w-full mt-5" id="practiceBtn2"><i data-lucide="play"></i>Практика</button>`;
  bindSay(view);
  $('#backBtn').onclick = () => { practice.lesson = null; render(); };
  $('#practiceBtn').onclick = $('#practiceBtn2').onclick = () => startLessonRun(l);
}

/* ---------- Упражнения по предложениям ----------
   build — собрать предложение из слов по переводу
   gap   — выбрать пропущенную часть
   trans — написать перевод самостоятельно */

function tokensOf(text) {
  return text.replace(/\s+/g, ' ').trim().split(' ').map(t => t.replace(/^[«"(]+|[.,!?;:»")]+$/g, '')).filter(Boolean);
}

function startLessonRun(l) {
  const types = ['build', 'gap', 'trans'];
  let k = Math.floor(Math.random() * 3);
  const items = shuffle(l.s).map(s => {
    let t = types[k++ % 3];
    const gapPart = parseSent(s[0]).find(p => p.gap);
    if (t === 'gap' && (!gapPart || !(s[3] || []).length)) t = 'build';
    return { kind: 'lesson', t, s };
  });
  practice.run = { title: loc(l, 'title'), lessonId: l.id, items, pos: 0, answers: 0, correct: 0, started: Date.now(), wrong: [] };
  practice.ex = null;
  render(); window.scrollTo(0, 0);
}

/** Слова из словаря с примерами — для «Предложений из моих слов» */
function myExampleWords() {
  return store.words.filter(w => w.priority !== 'later' && w.example1_en && w.example1_ua && tokensOf(w.example1_en).length >= 3 && tokensOf(w.example1_en).length <= 12);
}
function startMyExamples() {
  const ws = myExampleWords();
  if (!ws.length) { toast('Сначала начните учить слова — на вкладке «Курс» или «Учить»', 'info'); return; }
  // сначала слова, которые сейчас в работе, затем остальные
  const pick = [...shuffle(ws.filter(w => w.priority === 'active')), ...shuffle(ws.filter(w => w.priority !== 'active'))].slice(0, 10);
  const items = pick.map((w, i) => {
    const useSecond = w.example2_en && Math.random() < 0.5 && tokensOf(w.example2_en).length <= 12;
    const en = useSecond ? w.example2_en : w.example1_en, tr = useSecond ? w.example2_ua : w.example1_ua;
    return { kind: 'word', t: i % 2 ? 'gap' : 'build', en, tr, w };
  });
  practice.run = { title: 'Предложения из моих слов', items, pos: 0, answers: 0, correct: 0, started: Date.now(), wrong: [] };
  practice.ex = null;
  render(); window.scrollTo(0, 0);
}

/** Подготовка состояния текущего упражнения */
function makeEx() {
  const it = practice.run.items[practice.run.pos];
  const ex = { it, answered: false, ok: null };
  if (it.kind === 'lesson') {
    ex.en = sentPlain(it.s[0]); ex.tr = sentTr(it.s); ex.refs = [ex.en, ...(it.s[4] || [])];
  } else {
    ex.en = it.en; ex.tr = it.tr; ex.refs = [it.en];
  }
  if (it.t === 'build') {
    ex.target = tokensOf(ex.en);
    let mixed = shuffle(ex.target.map((w, i) => ({ w, i })));
    if (mixed.length > 1 && mixed.every((x, j) => x.i === j)) mixed = [...mixed.slice(1), mixed[0]];
    ex.pool = mixed.map((x, k) => ({ w: x.w, k, used: false }));
    ex.built = [];
  }
  if (it.t === 'gap') {
    if (it.kind === 'lesson') {
      const parts = parseSent(it.s[0]);
      const gp = parts.find(p => p.gap);
      ex.answer = gp.text;
      ex.before = parts.slice(0, parts.indexOf(gp)).map(p => p.text).join('');
      ex.after = parts.slice(parts.indexOf(gp) + 1).map(p => p.text).join('');
      ex.options = shuffle([gp.text, ...it.s[3].slice(0, 3)]);
    } else {
      // прячем изучаемое слово в примере
      const w = it.w;
      const stem = w.word.length > 4 ? w.word.slice(0, -1) : w.word;
      const re = new RegExp(`\\b(${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[a-z']*)`, 'i');
      const m = ex.en.match(re);
      if (!m) { it.t = 'build'; return makeEx(); }
      ex.answer = m[1];
      ex.before = ex.en.slice(0, m.index); ex.after = ex.en.slice(m.index + m[1].length);
      const others = distractors(w, 'word').slice(0, 3);
      ex.options = shuffle([m[1], ...others]);
    }
  }
  practice.ex = ex;
  return ex;
}

function renderSentRun(view) {
  const run = practice.run;
  if (run.pos >= run.items.length) return renderRunReport(view);
  const ex = practice.ex && practice.ex.it === run.items[run.pos] ? practice.ex : makeEx();
  const names = { build: ['Собери предложение', 'puzzle'], gap: ['Вставь пропуск', 'text-cursor-input'], trans: ['Переведи на английский', 'keyboard'] };
  const [nm, ic] = names[ex.it.t];
  view.innerHTML = `
    <div class="max-w-xl mx-auto">
      <div class="flex items-center gap-3">
        <button class="icon-btn" id="pQuit" aria-label="Завершить"><i data-lucide="x"></i></button>
        <div class="bar flex-1"><span style="width:${run.pos / run.items.length * 100}%"></span></div>
        <span class="text-sm font-bold tabular-nums text-slate-500">${run.pos + 1}/${run.items.length}</span>
      </div>
      <div class="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <i data-lucide="${ic}" style="width:.95rem;height:.95rem"></i>${nm}
        <span class="ml-auto normal-case tracking-normal text-brand-500 truncate">${esc(run.title)}</span>
      </div>
      <div id="pEx" class="mt-3"></div>
      <div id="pFb"></div>
    </div>`;
  $('#pQuit').onclick = async () => {
    if (run.answers && !(await confirmDialog('Завершить практику? Результат будет сохранён.', 'Завершить'))) return;
    if (run.answers) { run.items = run.items.slice(0, run.pos + (ex.answered ? 1 : 0)); run.pos = run.items.length; finishRun(); render(); }
    else { practice.run = null; render(); }
  };
  ({ build: drawBuild, gap: drawGap, trans: drawTrans })[ex.it.t](ex);
  if (ex.answered) drawPFeedback(ex);
  icons();
}

function promptBox(text, sub = '') {
  return `<div class="text-center"><div class="text-xl md:text-2xl font-extrabold leading-snug">${esc(text)}</div>${sub ? `<div class="text-xs text-slate-400 mt-1">${sub}</div>` : ''}</div>`;
}

function drawBuild(ex) {
  const done = ex.answered;
  const anim = ex.drawn ? '' : 'pop'; ex.drawn = true;
  $('#pEx').innerHTML = `
    <div class="card p-5 md:p-7 ${anim}">
      ${promptBox(ex.tr, 'Нажимайте на слова по порядку')}
      <div id="bAns" class="mt-5 min-h-[3.2rem] rounded-2xl border-2 border-dashed ${done ? (ex.ok ? 'border-brand-500' : 'border-rose-500') : 'border-slate-300 dark:border-white/15'} p-2 flex flex-wrap gap-1.5">
        ${ex.built.map((k, j) => `<button class="wtile is-in" data-out="${j}" ${done ? 'disabled' : ''}>${esc(ex.pool[k].w)}</button>`).join('') || '<span class="text-sm text-slate-400 self-center px-2">Здесь появится ваш ответ</span>'}
      </div>
      <div id="bPool" class="mt-4 flex flex-wrap gap-1.5 justify-center">
        ${ex.pool.map((p, k) => `<button class="wtile ${p.used ? 'is-used' : ''}" data-in="${k}" ${done ? 'disabled' : ''}>${esc(p.w)}</button>`).join('')}
      </div>
    </div>
    ${done ? '' : `<div class="mt-4 grid grid-cols-[auto,1fr] gap-2">
      <button class="btn btn-ghost btn-lg" id="bClear" aria-label="Очистить"><i data-lucide="eraser"></i></button>
      <button class="btn btn-primary btn-lg" id="bCheck" ${ex.built.length === ex.pool.length ? '' : 'disabled'}>Проверить</button></div>`}`;
  if (done) return;
  $('#bPool').onclick = e => { const b = e.target.closest('[data-in]'); if (!b) return; const k = +b.dataset.in; ex.pool[k].used = true; ex.built.push(k); drawBuild(ex); icons(); };
  $('#bAns').onclick = e => { const b = e.target.closest('[data-out]'); if (!b) return; const j = +b.dataset.out; ex.pool[ex.built[j]].used = false; ex.built.splice(j, 1); drawBuild(ex); icons(); };
  $('#bClear').onclick = () => { ex.pool.forEach(p => p.used = false); ex.built = []; drawBuild(ex); icons(); };
  $('#bCheck').onclick = () => {
    const given = ex.built.map(k => ex.pool[k].w);
    const ok = given.map(w => w.toLowerCase()).join(' ') === ex.target.map(w => w.toLowerCase()).join(' ');
    pAnswer(ex, ok, given.join(' '));
  };
}

function drawGap(ex) {
  const done = ex.answered;
  $('#pEx').innerHTML = `
    <div class="card p-5 md:p-7 ${done ? '' : 'pop'}">
      <div class="text-xl md:text-2xl font-bold leading-relaxed text-center">${esc(ex.before)}<span class="inline-block min-w-[4rem] border-b-[3px] ${done ? (ex.ok ? 'border-brand-500 text-brand-500' : 'border-rose-500 text-rose-500') : 'border-slate-400'} px-1">${done ? esc(ex.answer) : '&nbsp;'}</span>${esc(ex.after)}</div>
      <div class="text-sm text-slate-500 dark:text-slate-400 text-center mt-3">${esc(ex.tr)}</div>
    </div>
    <div class="mt-4 grid gap-2" id="gOpts">
      ${ex.options.map((o, i) => `<button class="option ${done ? (o === ex.answer ? 'is-correct' : o === ex.given ? 'is-wrong' : '') : ''}" data-o="${i}" ${done ? 'disabled' : ''}><span class="kbd">${i + 1}</span>${esc(o)}</button>`).join('')}
    </div>`;
  if (done) return;
  $('#gOpts').onclick = e => { const b = e.target.closest('[data-o]'); if (!b) return; const o = ex.options[+b.dataset.o]; pAnswer(ex, o === ex.answer, o); };
}

function drawTrans(ex) {
  const done = ex.answered;
  $('#pEx').innerHTML = `
    <div class="card p-5 md:p-7 ${done ? '' : 'pop'}">
      ${promptBox(ex.tr, 'Напишите по-английски. Регистр и точка в конце не важны')}
      <form id="tForm" class="mt-5">
        <textarea id="tIn" rows="2" class="input text-lg" placeholder="Ваш перевод…" autocomplete="off" autocapitalize="off" spellcheck="false" ${done ? 'disabled' : ''}>${esc(ex.given || '')}</textarea>
        ${done ? '' : `<div class="mt-3 grid grid-cols-[auto,1fr] gap-2">
          <button type="button" class="btn btn-ghost btn-lg" id="tHint" title="Подсказка: первые слова"><i data-lucide="lightbulb"></i></button>
          <button class="btn btn-primary btn-lg">Проверить</button></div>`}
      </form>
    </div>`;
  if (done) return;
  const inp = $('#tIn');
  setTimeout(() => inp.focus({ preventScroll: true }), 50);
  inp.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#tForm').requestSubmit(); } };
  $('#tHint').onclick = () => {
    ex.hints = (ex.hints || 0) + 1;
    const words = tokensOf(ex.en).slice(0, ex.hints * 2).join(' ');
    inp.value = words + ' '; inp.focus();
  };
  $('#tForm').onsubmit = e => {
    e.preventDefault();
    const v = inp.value.trim();
    if (!v) return;
    const r = checkTranslation(v, ex.refs);
    ex.typo = r === 'typo';
    pAnswer(ex, r !== 'wrong', v);
  };
}

function pAnswer(ex, ok, given) {
  if (ex.answered) return;
  ex.answered = true; ex.ok = ok; ex.given = given;
  const run = practice.run;
  run.answers++; if (ok) run.correct++; else run.wrong.push(ex.it);
  if (ok && autoSpeak()) tts.speak(ex.en);
  renderSentRun($('#view'));
}

function drawPFeedback(ex) {
  const l = ex.it.kind === 'lesson';
  $('#pFb').innerHTML = `
    <div class="mt-4 rounded-3xl p-5 pop ${ex.ok ? 'bg-brand-500/10 border border-brand-500/30' : 'bg-rose-500/10 border border-rose-500/30'}">
      <div class="flex items-center gap-2 font-extrabold ${ex.ok ? 'text-brand-600 dark:text-brand-300' : 'text-rose-600 dark:text-rose-300'}">
        <i data-lucide="${ex.ok ? 'circle-check' : 'circle-x'}"></i>${ex.ok ? (ex.typo ? 'Верно, с небольшой опечаткой' : pickPraise()) : 'Не совсем'}
      </div>
      <div class="mt-3 flex gap-3">
        <button class="icon-btn !w-9 !h-9 shrink-0" data-say="${esc(ex.en)}" aria-label="Озвучить"><i data-lucide="volume-2"></i></button>
        <div class="min-w-0 flex-1">${l ? sentBreakdown(ex.it.s[0]) : `<div class="text-lg font-bold">${highlight(ex.en, ex.it.w.word)}</div>`}
          <div class="text-sm text-slate-500 dark:text-slate-400 mt-2">${esc(ex.tr)}</div>
          ${!ex.ok && ex.it.t !== 'gap' ? `<div class="text-sm mt-2"><span class="text-slate-400">Ваш ответ:</span> <span class="line-through decoration-rose-500/60">${esc(ex.given)}</span></div>` : ''}
        </div>
      </div>
      ${!ex.ok && ex.it.t === 'trans' ? `<button class="btn btn-ghost w-full mt-3 !h-auto py-2 !whitespace-normal" id="pOverride"><i data-lucide="check"></i>Мой вариант тоже правильный — засчитать</button>` : ''}
      <button class="btn btn-primary btn-lg w-full mt-3" id="pNext">Далее <i data-lucide="arrow-right"></i></button>
    </div>`;
  bindSay($('#pFb'));
  const ov = $('#pOverride');
  if (ov) ov.onclick = () => { const run = practice.run; ex.ok = true; run.correct++; run.wrong = run.wrong.filter(x => x !== ex.it); renderSentRun($('#view')); };
  $('#pNext').onclick = pNext;
  setTimeout(() => { $('#pNext')?.focus({ preventScroll: true }); $('#pFb')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60);
}

function pNext() {
  const run = practice.run;
  run.pos++; practice.ex = null;
  if (run.pos >= run.items.length) finishRun();
  render();
}

function finishRun() {
  const run = practice.run;
  if (run.finished) return;
  run.finished = true;
  run.pct = run.answers ? Math.round(run.correct / run.answers * 100) : 0;
  run.seconds = (Date.now() - run.started) / 1000;
  if (run.lessonId && run.answers) {
    const p = pstore.get().s;
    const old = p[run.lessonId];
    p[run.lessonId] = { best: Math.max(old?.best || 0, run.pct), last: run.pct, n: (old?.n || 0) + 1, u: Date.now() };
    pstore.save();
  }
  addPracticeStats(run.answers, run.correct, run.seconds);
}

function renderRunReport(view) {
  const run = practice.run;
  if (!run.finished) finishRun();
  const l = run.lessonId && lessonById(run.lessonId);
  view.innerHTML = `
    <div class="max-w-xl mx-auto">
      <div class="card p-6 md:p-8 text-center pop">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-brand-500/15 text-brand-500 grid place-items-center"><i data-lucide="${run.pct >= 90 ? 'trophy' : run.pct >= 60 ? 'thumbs-up' : 'target'}" style="width:2rem;height:2rem"></i></div>
        <h1 class="mt-4 text-2xl font-extrabold">Практика завершена</h1>
        <div class="text-sm font-bold text-brand-500 mt-1">${esc(run.title)}</div>
        <div class="mt-6 grid grid-cols-3 gap-2">
          ${miniStat('Заданий', run.answers)}${miniStat('Верно', run.correct)}${miniStat('Точность', run.pct + '%')}
        </div>
      </div>
      ${run.wrong.length ? `<h2 class="mt-6 mb-2 font-extrabold flex items-center gap-2"><i data-lucide="circle-x" class="text-rose-500"></i>Стоит повторить</h2>
        <div class="space-y-2">${run.wrong.map(it => `<div class="card p-4">
          ${it.kind === 'lesson' ? sentBreakdown(it.s[0]) : `<div class="font-bold">${esc(it.en)}</div>`}
          <div class="text-sm text-slate-500 dark:text-slate-400 mt-2">${esc(it.kind === 'lesson' ? sentTr(it.s) : it.tr)}</div></div>`).join('')}</div>` : ''}
      <div class="mt-6 grid gap-2 sm:grid-cols-${run.wrong.length ? 3 : 2}">
        ${run.wrong.length ? '<button class="btn btn-primary" id="rWrong"><i data-lucide="rotate-ccw"></i>Повторить ошибки</button>' : ''}
        <button class="btn ${run.wrong.length ? 'btn-ghost' : 'btn-primary'}" id="rAgain"><i data-lucide="repeat"></i>Ещё раз</button>
        <button class="btn btn-ghost" id="rBack"><i data-lucide="${l ? 'book-open-text' : 'list'}"></i>${l ? 'К уроку' : 'К списку'}</button>
      </div>
    </div>`;
  const rw = $('#rWrong');
  if (rw) rw.onclick = () => {
    const items = shuffle(run.wrong).map(it => ({ ...it }));
    practice.run = { title: run.title + ' · ошибки', lessonId: null, items, pos: 0, answers: 0, correct: 0, started: Date.now(), wrong: [] };
    practice.ex = null; render();
  };
  $('#rAgain').onclick = () => { practice.run = null; if (l) startLessonRun(l); else startMyExamples(); };
  $('#rBack').onclick = () => { practice.run = null; if (!l) practice.lesson = null; render(); window.scrollTo(0, 0); };
}

/* =====================================================================
   Тексты
   ===================================================================== */

function textWords(t) { return (t.text.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length; }

function renderTextList(root) {
  const prog = pstore.get().t;
  const list = TEXTS.filter(t => levelOk(t.level));
  root.innerHTML = ['A1', 'A2', 'B1'].filter(levelOk).map(lv => {
    const ts = list.filter(t => t.level === lv);
    if (!ts.length) return '';
    return `<h2 class="mt-2 mb-2 font-extrabold flex items-center gap-2">${levelBadge(lv)} ${LEVEL_INFO[lv]}</h2>
      <div class="grid md:grid-cols-2 gap-2 mb-5">${ts.map(t => {
        const p = prog[t.id], n = textWords(t);
        const topic = TOPICS[t.topic];
        return `<button class="card p-4 text-left hover:border-brand-400 transition flex gap-3 min-w-0" data-text="${t.id}">
          <div class="w-11 h-11 rounded-2xl ${p ? 'bg-brand-500 text-white' : 'bg-brand-500/15 text-brand-500'} grid place-items-center shrink-0"><i data-lucide="${p ? 'check' : topic ? topic[2] : 'book-open'}"></i></div>
          <div class="flex-1 min-w-0">
            <div class="font-extrabold truncate">${esc(t.title)}</div>
            <div class="text-sm text-slate-500 dark:text-slate-400 truncate">${esc(isUA() && t.ua ? t.ua.name : t.ru)}</div>
            <div class="text-xs text-slate-400 mt-1">${n} ${plural(n, 'слово', 'слова', 'слов')} · ~${Math.max(1, Math.round(n / 90))} мин${p ? ` · <span class="text-brand-500 font-bold">вопросы ${p.score}/${p.total}</span>` : ''}</div>
          </div>
        </button>`;
      }).join('')}</div>`;
  }).join('') + `<p class="text-xs text-slate-400">Новые тексты будут добавляться с обновлениями базы.</p>`;
  root.onclick = e => { const b = e.target.closest('[data-text]'); if (!b) return; practice.text = b.dataset.text; practice.quiz = {}; practice.showTr = false; practice.openedAt = Date.now(); render(); window.scrollTo(0, 0); };
}

/* ----- Поиск слова в общей базе: простые формы (-s, -ed, -ing) и неправильные глаголы ----- */

const IRREGULAR = {
  was: 'be', were: 'be', been: 'be', is: 'be', are: 'be', am: 'be', went: 'go', gone: 'go', had: 'have', has: 'have',
  did: 'do', done: 'do', does: 'do', made: 'make', got: 'get', gotten: 'get', said: 'say', saw: 'see', seen: 'see',
  took: 'take', taken: 'take', came: 'come', knew: 'know', known: 'know', thought: 'think', told: 'tell', found: 'find',
  gave: 'give', given: 'give', left: 'leave', felt: 'feel', became: 'become', began: 'begin', begun: 'begin', kept: 'keep',
  brought: 'bring', bought: 'buy', wrote: 'write', written: 'write', sat: 'sit', stood: 'stand', lost: 'lose', paid: 'pay',
  met: 'meet', ran: 'run', ate: 'eat', eaten: 'eat', drank: 'drink', drunk: 'drink', slept: 'sleep', spent: 'spend',
  sent: 'send', built: 'build', taught: 'teach', caught: 'catch', fell: 'fall', fallen: 'fall', woke: 'wake', woken: 'wake',
  heard: 'hear', understood: 'understand', spoke: 'speak', spoken: 'speak', broke: 'break', broken: 'break', chose: 'choose',
  drove: 'drive', driven: 'drive', forgot: 'forget', forgotten: 'forget', grew: 'grow', grown: 'grow', held: 'hold',
  led: 'lead', meant: 'mean', put: 'put', read: 'read', rode: 'ride', rang: 'ring', rose: 'rise', sold: 'sell', shook: 'shake',
  shone: 'shine', sang: 'sing', stole: 'steal', stolen: 'steal', swam: 'swim', threw: 'throw', thrown: 'throw', wore: 'wear',
  won: 'win', children: 'child', men: 'man', women: 'woman', people: 'person', feet: 'foot', teeth: 'tooth', mice: 'mouse',
  better: 'good', best: 'good', worse: 'bad', worst: 'bad', me: 'i', him: 'he', her: 'she', us: 'we', them: 'they',
  my: 'i', his: 'he', our: 'we', their: 'they', your: 'you', its: 'it', an: 'a'
};

let BASE_WORDS = null;
function baseIndex() {
  if (BASE_WORDS) return BASE_WORDS;
  BASE_WORDS = new Map();
  for (const b of BASE.list) { const k = b.word.toLowerCase(); if (!BASE_WORDS.has(k)) BASE_WORDS.set(k, b); }
  return BASE_WORDS;
}
function lemmaCandidates(raw) {
  const w = raw.toLowerCase().replace(/[’]/g, "'").replace(/'s$|'$/, '');
  const c = [w];
  if (IRREGULAR[w]) c.push(IRREGULAR[w]);
  const add = x => { if (x && x.length > 1 && !c.includes(x)) c.push(x); };
  if (w.endsWith('ies')) add(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) add(w.slice(0, -2));
  if (w.endsWith('s')) add(w.slice(0, -1));
  if (w.endsWith('ied')) add(w.slice(0, -3) + 'y');
  if (w.endsWith('ed')) { add(w.slice(0, -2)); add(w.slice(0, -1)); if (/(.)\1ed$/.test(w)) add(w.slice(0, -3)); }
  if (w.endsWith('ing')) { add(w.slice(0, -3)); add(w.slice(0, -3) + 'e'); if (/(.)\1ing$/.test(w)) add(w.slice(0, -4)); }
  if (w.endsWith('er')) { add(w.slice(0, -2)); add(w.slice(0, -1)); if (/(.)\1er$/.test(w)) add(w.slice(0, -3)); }
  if (w.endsWith('est')) { add(w.slice(0, -3)); add(w.slice(0, -2)); if (/(.)\1est$/.test(w)) add(w.slice(0, -4)); }
  if (w.endsWith('ier')) add(w.slice(0, -3) + 'y');
  if (w.endsWith('iest')) add(w.slice(0, -4) + 'y');
  if (w.endsWith('ily')) add(w.slice(0, -3) + 'y');
  if (w.endsWith('ly')) add(w.slice(0, -2));
  if (w.endsWith('ves')) { add(w.slice(0, -3) + 'f'); add(w.slice(0, -3) + 'fe'); }
  // американское написание → британское (в базе британское): color → colour, center → centre, realize → realise
  for (const x of [...c]) {
    if (/[^aeiou]or(s|ed|ing)?$/.test(x)) add(x.replace(/or(s|ed|ing)?$/, 'our$1'));
    if (/[^aeiou]er$/.test(x)) add(x.replace(/er$/, 're'));
    if (/iz(e|ed|es|ing)$/.test(x)) add(x.replace(/iz(e|ed|es|ing)$/, 'is$1'));
    if (/og$/.test(x)) add(x + 'ue');
    if (/am$/.test(x)) add(x + 'me');
    if (/ense$/.test(x)) add(x.replace(/ense$/, 'ence'));
  }
  return c;
}

/* Сокращённые формы: полная форма + перевод [ru, ua] */
const CONTR = (() => {
  const neg = { do: 'do', does: 'does', did: 'did', is: 'is', are: 'are', was: 'was', were: 'were', could: 'could', would: 'would',
    should: 'should', have: 'have', has: 'has', had: 'had', must: 'must', need: 'need' };
  const m = {};
  for (const k in neg) m[k + "n't"] = [k + ' not', 'не (отрицание)', 'не (заперечення)'];
  m["can't"] = ['cannot', 'не могу, нельзя', 'не можу, не можна'];
  m["won't"] = ['will not', 'не буду, не будет', 'не буду, не буде'];
  m["shan't"] = ['shall not', 'не буду', 'не буду'];
  m["ain't"] = ['am not / is not (разг.)', 'не (разговорное)', 'не (розмовне)'];
  const pr = { i: ['я', 'я'], you: ['ты, вы', 'ти, ви'], he: ['он', 'він'], she: ['она', 'вона'], it: ['это, оно', 'це, воно'],
    we: ['мы', 'ми'], they: ['они', 'вони'], that: ['это, то', 'це, те'], there: ['там (есть)', 'там (є)'], what: ['что', 'що'],
    who: ['кто', 'хто'], here: ['вот, здесь', 'ось, тут'], where: ['где', 'де'], how: ['как', 'як'] };
  const be = { i: 'am', you: 'are', we: 'are', they: 'are' };
  for (const k in pr) {
    const [ru, ua] = pr[k];
    m[k + (be[k] === 'am' ? "'m" : be[k] ? "'re" : "'s")] = [k + ' ' + (be[k] || 'is'), ru + ' + есть/является', ua + ' + є'];
    m[k + "'ll"] = [k + ' will', ru + ' + будущее время', ua + ' + майбутній час'];
    m[k + "'ve"] = [k + ' have', ru + ' + have (иметь / перфект)', ua + ' + have (мати / перфект)'];
    m[k + "'d"] = [k + ' would / ' + k + ' had', ru + ' + бы / уже (had)', ua + ' + би / вже (had)'];
  }
  m["let's"] = ['let us', 'давай(те)', 'давай(те)'];
  m["o'clock"] = null;
  return m;
})();

/* Имена собственные из текстов: [ru, ua] */
const PROPER = {
  ukraine: ['Украина', 'Україна'], kyiv: ['Киев', 'Київ'], dnipro: ['Днепр (город, река)', 'Дніпро (місто, річка)'], lviv: ['Львов', 'Львів'],
  odesa: ['Одесса', 'Одеса'], kharkiv: ['Харьков', 'Харків'], zaporizhzhia: ['Запорожье', 'Запоріжжя'], europe: ['Европа', 'Європа'],
  london: ['Лондон', 'Лондон'], paris: ['Париж', 'Париж'], vienna: ['Вена', 'Відень'], berlin: ['Берлин', 'Берлін'], warsaw: ['Варшава', 'Варшава'],
  poland: ['Польша', 'Польща'], brazil: ['Бразилия', 'Бразилія'], finland: ['Финляндия', 'Фінляндія'], ethiopia: ['Эфиопия', 'Ефіопія'],
  yemen: ['Йемен', 'Ємен'], england: ['Англия', 'Англія'], britain: ['Британия', 'Британія'], america: ['Америка', 'Америка'],
  usa: ['США', 'США'], germany: ['Германия', 'Німеччина'], france: ['Франция', 'Франція'], italy: ['Италия', 'Італія'], spain: ['Испания', 'Іспанія'],
  japan: ['Япония', 'Японія'], china: ['Китай', 'Китай'], africa: ['Африка', 'Африка'], asia: ['Азия', 'Азія'],
  ukrainian: ['украинский; украинец', 'український; українець'], polish: ['польский; поляк', 'польський; поляк'],
  english: ['английский', 'англійська'], european: ['европейский', 'європейський'], british: ['британский', 'британський'],
  american: ['американский', 'американський'], german: ['немецкий', 'німецький'], french: ['французский', 'французький'],
  monday: ['понедельник', 'понеділок'], tuesday: ['вторник', 'вівторок'], wednesday: ['среда', 'середа'], thursday: ['четверг', 'четвер'],
  friday: ['пятница', "п'ятниця"], saturday: ['суббота', 'субота'], sunday: ['воскресенье', 'неділя']
};
function lookupWord(raw, t) {
  const idx = baseIndex();
  const low = raw.toLowerCase().replace(/[’]/g, "'");
  if (CONTR[low]) return { contr: CONTR[low], form: low };
  const cands = lemmaCandidates(raw);
  for (const c of cands) if (idx.has(c)) return { b: idx.get(c), form: c };
  // свои слова из словаря
  for (const c of cands) { const w = store.words.find(x => !x.base_id && x.word.toLowerCase() === c); if (w) return { own: w }; }
  const g = (t && loc(t, 'gloss')) || {};
  for (const c of [raw.toLowerCase(), ...cands]) if (g[c]) return { gloss: g[c], form: c };
  for (const c of cands) if (PROPER[c]) return { proper: PROPER[c], form: raw };
  // составные слова через дефис: fifty-five, well-handled
  if (/-/.test(raw)) {
    const parts = raw.split('-').map(x => ({ x, r: lookupWord(x, t) })).filter(p => p.r?.b);
    if (parts.length) return { parts, form: raw };
  }
  if (/^[A-Z]/.test(raw)) return { name: true, form: raw };
  return null;
}

/* ----- Читалка ----- */

function textById(id) { return TEXTS.find(t => t.id === id); }

function wrapWords(par) {
  // сначала делим исходный текст на слова, потом экранируем (иначе апостроф в don't превращается в &#39;)
  const re = /[A-Za-zÀ-ÿ](?:[A-Za-zÀ-ÿ'’-]*[A-Za-zÀ-ÿ])?/g;
  let out = '', last = 0, m;
  while ((m = re.exec(par))) {
    out += esc(par.slice(last, m.index)) + `<span class="tw" data-w="${esc(m[0])}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return (out + esc(par.slice(last))).replace(/\n/g, '<br>');
}

function renderReader(view) {
  const t = textById(practice.text);
  if (!t) { practice.text = null; return renderPractice(view); }
  const pars = t.text.split(/\n\s*\n/), trs = (loc(t, 'tr') || '').split(/\n\s*\n/);
  const p = pstore.get().t[t.id];
  const n = textWords(t);
  view.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <button class="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-500 mb-2" id="backBtn"><i data-lucide="chevron-left"></i>Тексты</button>
      <div class="flex items-center gap-2">${levelBadge(t.level)}<span class="text-xs text-slate-400">${n} ${plural(n, 'слово', 'слова', 'слов')} · ~${Math.max(1, Math.round(n / 90))} мин</span>${p ? `<span class="text-xs font-bold text-brand-500">прочитано · ${p.score}/${p.total}</span>` : ''}</div>
      <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">${esc(t.title)}</h1>
      <p class="text-slate-500 dark:text-slate-400">${esc(isUA() && t.ua ? t.ua.name : t.ru)}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <button class="btn btn-ghost !h-10" id="listenBtn"><i data-lucide="${readAloud.on ? 'square' : 'volume-2'}"></i>${readAloud.on ? 'Стоп' : 'Слушать текст'}</button>
        <button class="btn btn-ghost !h-10" id="trAllBtn"><i data-lucide="languages"></i>${practice.showTr ? 'Скрыть перевод' : 'Показать перевод'}</button>
      </div>
      <div class="mt-3 rounded-2xl bg-brand-500/10 text-sm px-4 py-2.5 flex items-center gap-2 text-brand-700 dark:text-brand-200"><i data-lucide="pointer"></i>Нажмите на незнакомое слово — появится перевод.</div>

      <article class="card p-5 md:p-7 mt-4 space-y-4 text-[17px] leading-[1.75]" id="reader">
        ${pars.map((par, i) => `<div class="group">
          <p data-par="${i}">${wrapWords(par)}</p>
          <div class="par-tr ${practice.showTr ? '' : 'hidden'} text-[15px] leading-relaxed text-slate-500 dark:text-slate-400 mt-1.5 pl-3 border-l-2 border-brand-500/40">${esc(trs[i] || '').replace(/\n/g, '<br>')}</div>
          <div class="flex gap-3 mt-1">
            <button class="text-xs font-semibold text-slate-400 hover:text-brand-500 inline-flex items-center gap-1" data-trp="${i}"><i data-lucide="languages" style="width:.8rem;height:.8rem"></i>перевод</button>
            <button class="text-xs font-semibold text-slate-400 hover:text-brand-500 inline-flex items-center gap-1" data-sayp="${i}"><i data-lucide="volume-2" style="width:.8rem;height:.8rem"></i>слушать</button>
          </div>
        </div>`).join('')}
      </article>

      <h2 class="mt-7 font-extrabold flex items-center gap-2"><i data-lucide="circle-help" class="text-brand-500"></i>Вопросы к тексту</h2>
      <div id="quiz" class="mt-3 space-y-3"></div>
    </div>`;
  $('#backBtn').onclick = () => { readAloud.stop(); closeWordTip(); practice.text = null; render(); };
  $('#trAllBtn').onclick = () => { practice.showTr = !practice.showTr; render(); };
  $('#listenBtn').onclick = () => { if (readAloud.on) readAloud.stop(); else readAloud.start(pars); render(); };
  $('#reader').onclick = e => {
    const w = e.target.closest('.tw');
    if (w) { openWordPopup(w.dataset.w, t, w.closest('p').textContent, w); return; }
    const tp = e.target.closest('[data-trp]');
    if (tp) { tp.parentElement.previousElementSibling.classList.toggle('hidden'); return; }
    const sp = e.target.closest('[data-sayp]');
    if (sp) { readAloud.start([pars[+sp.dataset.sayp]]); }
  };
  drawQuiz(t);
}

/** Чтение вслух по предложениям (длинный текст одной фразой браузеры обрезают) */
const readAloud = {
  on: false,
  start(pars) {
    if (!tts.supported) { toast('Озвучка не поддерживается этим браузером', 'error'); return; }
    speechSynthesis.cancel();
    const parts = pars.join(' ').replace(/\n/g, ' ').match(/[^.!?]+[.!?]*["»]?/g) || [];
    this.on = true;
    const v = tts.voice();
    parts.forEach((txt, i) => {
      const u = new SpeechSynthesisUtterance(txt.trim());
      if (v) u.voice = v;
      u.lang = v?.lang || 'en-US';
      u.rate = Math.min(store.settings.rate || 0.9, 0.95);
      u.volume = tts.vol();
      if (i === parts.length - 1) u.onend = () => { this.on = false; if (route.name === 'practice' && practice.text) { const b = $('#listenBtn'); if (b) { b.innerHTML = '<i data-lucide="volume-2"></i>Слушать текст'; icons(); } } };
      speechSynthesis.speak(u);
    });
  },
  stop() { if (this.on && tts.supported) speechSynthesis.cancel(); this.on = false; }
};

/** На компьютере (мышь + широкий экран) перевод показывается небольшой подсказкой над словом */
function wpDesktop() { return window.matchMedia('(min-width: 768px) and (pointer: fine)').matches; }

let wpCleanup = null;
function closeWordTip() {
  const tip = document.getElementById('wordTip'); if (tip) tip.remove();
  document.querySelectorAll('.tw.is-picked').forEach(x => x.classList.remove('is-picked'));
  if (wpCleanup) { wpCleanup(); wpCleanup = null; }
}

function openWordPopup(raw, t, context, el) {
  const ua = store.settings.lang === 'ua';
  const desk = !!el && wpDesktop();
  const big = desk ? 'text-lg' : 'text-2xl', mid = desk ? 'text-base' : 'text-xl';
  const r = lookupWord(raw, t);
  let body = '', actions = '';
  if (r?.b) {
    const b = r.b;
    const w = store.words.find(x => x.base_id === b.base_id);
    body = `<div class="flex items-center gap-2 flex-wrap"><span class="${big} font-extrabold">${esc(b.word)}</span>${levelBadge(b.level)}<span class="text-sm text-slate-400">${esc(b.transcription)}</span></div>
      ${r.form !== raw.toLowerCase() ? `<div class="text-xs text-slate-400 mt-0.5">в тексте: ${esc(raw)}</div>` : ''}
      <div class="${mid} font-bold text-brand-600 dark:text-brand-300 mt-1">${esc(ua ? b.ua : b.ru)}</div>
      <div class="text-xs text-slate-400 mt-0.5">${esc(POS_NAMES[b.pos] || b.pos)}${b.topic ? ' · ' + esc(topicName(b.topic)) : ''}</div>
      ${b.ex1 && !desk ? `<div class="mt-3">${exampleBlock(b.ex1, ua ? b.ex1ua : b.ex1ru, b.word)}</div>` : ''}
      ${b.ex1 && desk ? `<div class="mt-2 text-sm leading-snug"><div>${esc(b.ex1)}</div><div class="text-slate-500 dark:text-slate-400">${esc(ua ? b.ex1ua : b.ex1ru)}</div></div>` : ''}`;
    actions = w ? `<div class="text-sm text-center text-slate-500 py-1">Уже в словаре: ${statusBadge(w.priority)}</div>`
      : `<button class="btn btn-primary w-full ${desk ? '!h-9 text-sm' : ''}" id="wpAdd"><i data-lucide="list-plus"></i>Учить это слово</button>`;
  } else if (r?.own) {
    body = `<div class="${big} font-extrabold">${esc(r.own.word)}</div><div class="${mid} font-bold text-brand-600 dark:text-brand-300 mt-1">${esc(r.own.translation)}</div>`;
    actions = `<div class="text-sm text-center text-slate-500 py-1">Уже в словаре: ${statusBadge(r.own.priority)}</div>`;
  } else if (r?.parts) {
    body = `<div class="${big} font-extrabold">${esc(raw)}</div><div class="text-xs text-slate-400 mt-0.5">составное слово</div>
      ${r.parts.map(p => `<div class="mt-1"><b>${esc(p.x)}</b> — <span class="font-bold text-brand-600 dark:text-brand-300">${esc(ua ? p.r.b.ua : p.r.b.ru)}</span></div>`).join('')}`;
  } else if (r?.contr) {
    body = `<div class="${big} font-extrabold">${esc(raw)}</div><div class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">сокращение от <b>${esc(r.contr[0])}</b></div>
      <div class="${mid} font-bold text-brand-600 dark:text-brand-300 mt-1">${esc(ua ? r.contr[2] : r.contr[1])}</div>`;
  } else if (r?.proper) {
    body = `<div class="${big} font-extrabold">${esc(raw)}</div><div class="${mid} font-bold text-brand-600 dark:text-brand-300 mt-1">${esc(ua ? r.proper[1] : r.proper[0])}</div>
      <div class="text-xs text-slate-400 mt-0.5">имя собственное / название</div>`;
  } else if (r?.name) {
    body = `<div class="${big} font-extrabold">${esc(raw)}</div><div class="${mid} font-bold text-brand-600 dark:text-brand-300 mt-1">Имя или название</div>
      <div class="text-xs text-slate-400 mt-0.5">Имена людей и названия не переводятся.</div>`;
  } else if (r?.gloss) {
    const exists = store.words.some(x => normAnswer(x.word) === normAnswer(r.form));
    body = `<div class="${big} font-extrabold">${esc(r.form)}</div><div class="${mid} font-bold text-brand-600 dark:text-brand-300 mt-1">${esc(r.gloss)}</div>
      <div class="text-xs text-slate-400 mt-1">Подсказка к тексту — этого слова пока нет в общей базе</div>`;
    actions = exists ? '<div class="text-sm text-center text-slate-500 py-1">Уже в словаре</div>' : `<button class="btn btn-primary w-full ${desk ? '!h-9 text-sm' : ''}" id="wpAddOwn"><i data-lucide="list-plus"></i>Добавить в мои слова</button>`;
  } else {
    body = `<div class="${big} font-extrabold">${esc(raw)}</div><div class="text-slate-500 mt-1 text-sm">Этого слова нет в базе WordFlow (имя, название или редкое слово).</div>`;
    actions = `<a class="btn btn-ghost w-full ${desk ? '!h-9 text-sm' : ''}" target="_blank" rel="noopener" href="https://translate.google.com/?sl=en&tl=${ua ? 'uk' : 'ru'}&text=${encodeURIComponent(raw)}"><i data-lucide="external-link"></i>Google Переводчик</a>`;
  }
  const sayWord = r?.b?.word || r?.form || raw;
  const inner = `<div class="flex items-start gap-${desk ? 2 : 3}">
        <button class="icon-btn shrink-0 ${desk ? '!w-8 !h-8' : ''}" data-say="${esc(sayWord)}" aria-label="Озвучить"><i data-lucide="volume-2"></i></button>
        <div class="flex-1 min-w-0">${body}</div>
        <button class="icon-btn shrink-0 ${desk ? '!w-8 !h-8' : ''}" data-close-btn aria-label="Закрыть"><i data-lucide="x"></i></button>
      </div>
      <div class="mt-${desk ? 2 : 4}">${actions}</div>`;

  let root, close;
  if (desk) {
    closeWordTip();
    el.classList.add('is-picked');
    root = document.createElement('div');
    root.id = 'wordTip';
    root.className = 'word-tip pop';
    root.innerHTML = inner + '<div class="word-tip-arrow"></div>';
    document.body.appendChild(root);
    // позиция: над словом, если сверху мало места — под словом
    const rc = el.getBoundingClientRect(), tw = root.offsetWidth, th = root.offsetHeight;
    let left = rc.left + rc.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, document.documentElement.clientWidth - tw - 8));
    const above = rc.top - th - 10 > 8;
    const top = above ? rc.top - th - 10 : rc.bottom + 10;
    root.style.left = (left + window.scrollX) + 'px';
    root.style.top = (top + window.scrollY) + 'px';
    root.classList.add(above ? 'is-above' : 'is-below');
    const arrow = root.querySelector('.word-tip-arrow');
    arrow.style.left = Math.max(14, Math.min(tw - 14, rc.left + rc.width / 2 - left)) + 'px';
    close = closeWordTip;
    const onDoc = e => { if (!root.contains(e.target) && !e.target.closest('.tw')) closeWordTip(); };
    const onKey = e => { if (e.key === 'Escape') closeWordTip(); };
    const onResize = () => closeWordTip();
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    wpCleanup = () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize); };
    icons();
  } else {
    openModal(`<div class="p-5 md:p-6">${inner}</div>`);
    root = $('#modalRoot');
    close = closeModal;
  }
  bindSay(root);
  $('[data-close-btn]', root).onclick = close;
  if (autoSpeak()) tts.speak(sayWord);
  const add = $('#wpAdd', root);
  if (add) add.onclick = () => { addFromBase(r.b); store.saveWords(); close(); toast(`«${r.b.word}» добавлено в изучение`); };
  const addOwn = $('#wpAddOwn', root);
  if (addOwn) addOwn.onclick = () => {
    const sentence = (context.match(new RegExp(`[^.!?]*\\b${raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[^.!?]*[.!?]?`, 'i')) || [''])[0].trim();
    const w = touch(normWord({ word: r.form, translation: r.gloss, example1_en: sentence, priority: 'active' }));
    delete store.deleted[keyOf(w)];
    store.words.push(w); store.saveWords(); close(); toast(`«${r.form}» добавлено в мои слова`);
  };
}

function drawQuiz(t) {
  const root = $('#quiz');
  const q = t.q || [];
  const ans = practice.quiz;
  const done = q.length && q.every((_, i) => ans[i] != null);
  const score = q.filter((x, i) => ans[i] === x[2]).length;
  root.innerHTML = q.map((x, i) => `<div class="card p-4">
      <div class="font-bold">${i + 1}. ${esc(x[0])}</div>
      <div class="mt-3 grid gap-2">${x[1].map((o, j) => {
        const picked = ans[i] != null;
        const cls = picked ? (j === x[2] ? 'is-correct' : j === ans[i] ? 'is-wrong' : '') : '';
        return `<button class="option !py-2.5 ${cls}" data-q="${i}" data-a="${j}" ${picked ? 'disabled' : ''}>${esc(o)}</button>`;
      }).join('')}</div>
    </div>`).join('') + (done ? `<div class="card p-5 text-center pop">
      <div class="text-3xl font-extrabold ${score === q.length ? 'text-brand-500' : ''}">${score} / ${q.length}</div>
      <div class="text-slate-500 dark:text-slate-400 mt-1">${score === q.length ? 'Отлично, всё понято!' : 'Перечитайте текст — ответы в нём.'}</div>
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button class="btn btn-ghost" id="qAgain"><i data-lucide="rotate-ccw"></i>Заново</button>
        <button class="btn btn-primary" id="qNext"><i data-lucide="arrow-right"></i>Следующий текст</button>
      </div></div>` : '');
  root.onclick = e => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    const i = +b.dataset.q; if (ans[i] != null) return;
    ans[i] = +b.dataset.a;
    if (!practice.quizStart) practice.quizStart = Date.now();
    if (q.every((_, k) => ans[k] != null)) {
      const sc = q.filter((x, k) => ans[k] === x[2]).length;
      const pt = pstore.get().t, old = pt[t.id];
      pt[t.id] = { score: Math.max(sc, old?.score || 0), last: sc, total: q.length, n: (old?.n || 0) + 1, u: Date.now() };
      pstore.save();
      addPracticeStats(q.length, sc, Math.min((Date.now() - (practice.openedAt || Date.now())) / 1000, 1800));
    }
    drawQuiz(t); icons();
  };
  const again = $('#qAgain');
  if (again) again.onclick = () => { practice.quiz = {}; drawQuiz(t); icons(); };
  const next = $('#qNext');
  if (next) next.onclick = () => {
    const list = TEXTS.filter(x => x.level === t.level);
    const nx = list[(list.indexOf(t) + 1) % list.length];
    practice.text = nx.id; practice.quiz = {}; practice.showTr = false; practice.openedAt = Date.now(); render(); window.scrollTo(0, 0);
  };
}
