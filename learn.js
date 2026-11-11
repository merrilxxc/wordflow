/* =====================================================================
   WordFlow — learn.js
   1. Состояние слова: касания, «знаю / учу / слабое»
   2. Курс по модулям: слова + грамматика + текст с озвучкой + тест
   3. Словарь: «Мои слова» и «Вся база» (энциклопедия без ограничений)
   4. Анализ обучения и рекомендации «что учить сегодня»
   5. Памятка «Как устроено приложение»
   Подключается после app.js и practice.js.
   ===================================================================== */
'use strict';

/* ---------- 1. Состояние слова ---------- */

/** Сколько раз слово тренировалось (для старых записей — оценка по повторениям и ошибкам) */
function touches(w) {
  if (!w) return 0;
  if (w.seen > 0) return w.seen;
  return w.last_reviewed ? Math.max(1, (w.repetitions || 0) + (w.lapses || 0)) : 0;
}
function isKnown(w) { return !!w && (w.priority === 'learned' || w.repetitions >= 3); }
/** Слабое: начато, но повторено 0–1 раз, или часто ошибки */
function isWeak(w) { return !!w && !isKnown(w) && (touches(w) <= 1 || w.lapses >= 2); }
function wordState(w) { return !w ? 'none' : isKnown(w) ? 'known' : isWeak(w) ? 'weak' : 'learning'; }
function wordIndex() { return new Map(store.words.filter(w => w.base_id).map(w => [w.base_id, w])); }
const STATE_UI = {
  none:     { label: 'не начато', cls: 'text-slate-400', dot: 'bg-slate-300 dark:bg-slate-600' },
  weak:     { label: 'слабое',    cls: 'text-rose-500',  dot: 'bg-rose-500' },
  learning: { label: 'учу',       cls: 'text-amber-500', dot: 'bg-amber-400' },
  known:    { label: 'знаю',      cls: 'text-brand-500', dot: 'bg-brand-500' }
};
const L10 = (ru, ua) => store.settings.lang === 'ua' ? ua : ru;

/* ---------- 2. Курс по модулям ---------- */

let MODULES = null;
/** Модули строятся из базы: каждому уроку грамматики и тексту уровня — свой модуль,
    слова уровня распределяются по модулям (сначала слова темы текста, затем по порядку блоков). */
function courseModules() {
  if (MODULES) return MODULES;
  MODULES = {};
  for (const L of LEVELS) {
    const words = BASE.list.filter(b => b.level === L);
    if (!words.length) continue;
    const lessons = SENT.lessons.filter(l => l.level === L);
    const texts = TEXTS.filter(t => t.level === L);
    const n = Math.max(lessons.length, texts.length);
    let mods = [];
    if (n) {
      const target = Math.ceil(words.length / n);
      mods = Array.from({ length: n }, (_, i) => ({ lesson: lessons[i] || null, text: texts[i] || null, topics: texts[i] ? [texts[i].topic] : [], items: [] }));
      const used = new Set();
      for (const m of mods) {
        if (!m.topics.length) continue;
        for (const b of words) {
          if (m.items.length >= Math.round(target * 0.6)) break;
          if (!used.has(b.base_id) && b.topic === m.topics[0]) { m.items.push(b); used.add(b.base_id); }
        }
      }
      const rest = words.filter(b => !used.has(b.base_id));
      for (const m of mods) while (m.items.length < target && rest.length) m.items.push(rest.shift());
      mods[mods.length - 1].items.push(...rest);
      for (const m of mods) {   // главные темы модуля — для названия
        const cnt = {};
        m.items.forEach(b => cnt[b.topic] = (cnt[b.topic] || 0) + 1);
        const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]);
        m.topics = [...new Set([...m.topics, ...top])].slice(0, 2);
      }
    } else {
      // нет грамматики и текстов — модули по темам, ~50–70 слов
      const byT = {};
      words.forEach(b => (byT[b.topic] ||= []).push(b));
      let cur = null;
      for (const t of Object.keys(byT).sort((a, b) => byT[b].length - byT[a].length)) {
        for (let i = 0; i < byT[t].length; i += 60) {
          const chunk = byT[t].slice(i, i + 60);
          if (!cur || cur.items.length >= 45) { cur = { lesson: null, text: null, topics: [], items: [] }; mods.push(cur); }
          cur.items.push(...chunk);
          if (!cur.topics.includes(t)) cur.topics.push(t);
        }
      }
    }
    mods.forEach((m, i) => {
      m.id = `${L}-${i + 1}`; m.level = L; m.n = i + 1;
      m.items.sort((a, b) => a.block - b.block);
      m.parts = [];
      for (let k = 0; k < m.items.length; k += 20) m.parts.push(m.items.slice(k, k + 20));
      const last = m.parts[m.parts.length - 1];
      if (m.parts.length > 1 && last.length < 8) { m.parts.pop(); m.parts[m.parts.length - 1].push(...last); }
    });
    MODULES[L] = mods;
  }
  return MODULES;
}
function moduleById(id) { return Object.values(courseModules()).flat().find(m => m.id === id); }
function moduleTitle(m) { return m.topics.slice(0, 2).map(topicName).join(' · ') || `Модуль ${m.n}`; }
function moduleResult(id) { return ((pstore.get().m || {})[id]) || null; }

function moduleProgress(m, idx = wordIndex()) {
  const c = { known: 0, learning: 0, weak: 0, none: 0 };
  for (const b of m.items) c[wordState(idx.get(b.base_id))]++;
  const words = m.items.length;
  const g = m.lesson ? pstore.get().s[m.lesson.id] : null;
  const tx = m.text ? pstore.get().t[m.text.id] : null;
  const test = moduleResult(m.id);
  const steps = [
    { k: 'words', w: 50, p: (c.known + 0.5 * c.learning + 0.25 * c.weak) / words, done: c.known / words >= 0.8 },
    m.lesson && { k: 'grammar', w: 20, p: g ? Math.min(1, g.best / 80) : 0, done: !!g && g.best >= 70 },
    m.text && { k: 'text', w: 15, p: tx ? 1 : 0, done: !!tx },
    { k: 'test', w: 15, p: test ? Math.min(1, test.best / 80) : 0, done: !!test && test.best >= 80 }
  ].filter(Boolean);
  const tw = steps.reduce((s, x) => s + x.w, 0);
  const pct = Math.round(steps.reduce((s, x) => s + x.w * x.p, 0) / tw * 100);
  return { ...c, words, steps, pct, done: steps.every(s => s.done), g, tx, test, started: c.known + c.learning + c.weak > 0 };
}
/** Текущий модуль уровня: первый незавершённый */
function currentModule(L) {
  const mods = courseModules()[L] || [];
  const idx = wordIndex();
  return mods.find(m => !moduleProgress(m, idx).done) || null;
}
function nextPart(m, idx = wordIndex()) {
  const i = m.parts.findIndex(p => p.some(b => !isKnown(idx.get(b.base_id))));
  return i < 0 ? null : { i, items: m.parts[i] };
}

const courseState = { level: null, module: null };

function renderCourse(view) {
  if (courseState.module) return renderModule(view, moduleById(courseState.module));
  const s = store.settings;
  const mods = courseModules();
  const avail = LEVELS.filter(l => mods[l]);
  if (!courseState.level || !avail.includes(courseState.level)) courseState.level = analyze().focus || avail[0];
  const lvl = courseState.level;
  const list = mods[lvl];
  const idx = wordIndex();
  const progs = list.map(m => moduleProgress(m, idx));
  const cur = list.find((m, i) => !progs[i].done);
  const plan = todayPlan();
  const nL = SENT.lessons.filter(l => l.level === lvl).length, nT = TEXTS.filter(t => t.level === lvl).length;
  const lvWords = BASE.list.filter(b => b.level === lvl).length;

  view.innerHTML = `
    <div class="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">Курс английского</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Пошаговая программа: в каждом модуле слова, грамматика, текст с озвучкой и итоговый тест</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-ghost !h-9 text-sm" id="guideBtn"><i data-lucide="circle-help"></i><span class="hidden sm:inline">Как пользоваться</span></button>
        <div class="flex gap-1 p-1 rounded-xl bg-slate-500/10" id="langSeg" title="Язык перевода">
          ${[['ru', 'RU'], ['ua', 'UA']].map(([v, l]) => `<button class="px-3 h-8 rounded-lg text-sm font-bold ${s.lang === v ? 'bg-brand-500 text-white' : 'text-slate-500'}" data-lang="${v}">${l}</button>`).join('')}
        </div>
      </div>
    </div>

    <a href="#/train" class="mt-5 card p-4 md:p-5 flex items-center gap-4 hover:border-brand-400 transition group">
      <div class="w-12 h-12 rounded-2xl bg-brand-500 text-white grid place-items-center pulse-ring"><i data-lucide="zap" style="width:1.4rem;height:1.4rem"></i></div>
      <div class="flex-1 min-w-0">
        <div class="font-extrabold">План и рекомендации на сегодня</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">${plan.due + plan.fresh
          ? `${plan.due} ${plural(plan.due, 'слово', 'слова', 'слов')} повторить · ${plan.fresh} ${plural(plan.fresh, 'новое', 'новых', 'новых')}`
          : `Новых сегодня: ${plan.doneNew} из ${plan.limit}. Посмотрите, что ещё советует приложение.`}</div>
      </div>
      <i data-lucide="chevron-right" class="text-slate-400 group-hover:translate-x-1 transition"></i>
    </a>

    <div class="mt-6 grid grid-cols-3 md:grid-cols-5 gap-2" id="lvlTabs">
      ${LEVELS.map(l => {
        const has = avail.includes(l);
        const ls = has ? levelStats(l) : null;
        return `<button ${has ? `data-lvl="${l}"` : 'disabled'} class="text-left rounded-2xl border-2 p-3 transition ${l === lvl ? 'border-brand-500 bg-brand-500/10' : 'border-slate-200 dark:border-white/10'} ${has ? 'hover:border-slate-300' : 'opacity-50'}">
          <div class="flex items-center justify-between"><span class="text-lg font-extrabold">${l}</span>${has ? '' : '<i data-lucide="lock" style="width:.9rem;height:.9rem"></i>'}</div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 truncate">${has ? LEVEL_INFO[l] : 'скоро'}</div>
          ${has ? `<div class="mt-2">${progressBar(ls.learned, ls.learning, ls.total)}</div><div class="text-[11px] text-slate-400 mt-1 tabular-nums">${ls.learned}/${ls.total}</div>` : ''}
        </button>`;
      }).join('')}
    </div>

    <div class="mt-4 flex items-center justify-between gap-3 flex-wrap">
      <div class="text-sm text-slate-500 dark:text-slate-400">${list.length} ${plural(list.length, 'модуль', 'модуля', 'модулей')} · ${lvWords} слов · ${nL} ${plural(nL, 'урок', 'урока', 'уроков')} грамматики · ${nT} ${plural(nT, 'текст', 'текста', 'текстов')}</div>
      <div class="flex gap-2">
        ${s.courseLevel !== lvl ? `<button class="btn btn-ghost !h-9 text-sm" id="startHereBtn"><i data-lucide="flag"></i>Начинать с ${lvl}</button>` : `<span class="text-xs text-brand-500 font-bold self-center">Курс идёт с ${lvl}</span>`}
        <button class="btn btn-ghost !h-9 text-sm" id="knowLevelBtn"><i data-lucide="check-check"></i>Знаю весь ${lvl}</button>
      </div>
    </div>

    <div class="mt-3 space-y-2" id="modList">
      ${list.map((m, i) => moduleCard(m, progs[i], m === cur)).join('')}
    </div>
    ${!nL && !nT ? `<p class="text-xs text-slate-400 mt-4">Грамматика и тексты для ${lvl} появятся в следующих обновлениях. Пока модули ${lvl} — это слова по темам и итоговые тесты.</p>` : ''}`;

  $('#guideBtn').onclick = openGuide;
  $('#langSeg').onclick = e => { const b = e.target.closest('[data-lang]'); if (b) setLang(b.dataset.lang); };
  $('#lvlTabs').onclick = e => { const b = e.target.closest('[data-lvl]'); if (!b) return; courseState.level = b.dataset.lvl; render(); };
  const sh = $('#startHereBtn'); if (sh) sh.onclick = () => { s.courseLevel = lvl; store.saveSettings(); toast(`Новые слова будут браться с уровня ${lvl}`); render(); };
  $('#knowLevelBtn').onclick = async () => {
    const rest = BASE.list.filter(b => b.level === lvl && !isKnown(idx.get(b.base_id)));
    if (!rest.length) { toast('Здесь всё уже выучено'); return; }
    if (!(await confirmDialog(`Отметить ${rest.length} ${plural(rest.length, 'слово', 'слова', 'слов')} уровня ${lvl} как уже известные? Они не попадут в ежедневные тренировки (можно вернуть в словаре).`, 'Отметить'))) return;
    rest.forEach(b => addFromBase(b, 'learned'));
    store.saveWords(); toast('Готово'); render();
  };
  $('#modList').onclick = e => { const b = e.target.closest('[data-mod]'); if (!b) return; courseState.module = b.dataset.mod; render(); window.scrollTo(0, 0); };
}

const STEP_UI = {
  words:   ['Слова', 'book-a'],
  grammar: ['Грамматика', 'text-cursor-input'],
  text:    ['Текст', 'headphones'],
  test:    ['Тест', 'badge-check']
};

function moduleCard(m, p, isCur) {
  return `<button class="w-full card p-4 text-left hover:border-brand-400 transition ${isCur ? '!border-brand-500 ring-2 ring-brand-500/20' : ''}" data-mod="${m.id}">
    <div class="flex items-start gap-3">
      <div class="w-11 h-11 shrink-0 rounded-2xl grid place-items-center font-extrabold ${p.done ? 'bg-brand-500 text-white' : isCur ? 'bg-brand-500/15 text-brand-500' : 'bg-slate-500/10 text-slate-500'}">${p.done ? '<i data-lucide="check"></i>' : m.n}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap"><span class="font-extrabold">Модуль ${m.n} · ${esc(moduleTitle(m))}</span>${isCur ? '<span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white">сейчас</span>' : ''}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">${[m.lesson && esc(loc(m.lesson, 'title')), m.text && esc(m.text.title)].filter(Boolean).join(' · ') || `${m.items.length} слов по темам`}</div>
        <div class="mt-2 flex flex-wrap gap-1.5">
          ${p.steps.map(st => `<span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${st.done ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300' : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'}"><i data-lucide="${st.done ? 'circle-check' : STEP_UI[st.k][1]}" style="width:.75rem;height:.75rem"></i>${STEP_UI[st.k][0]}${st.k === 'words' ? ` ${m.items.length}` : ''}</span>`).join('')}
        </div>
        <div class="mt-2.5 flex items-center gap-2"><div class="flex-1">${progressBar(p.known, p.learning + p.weak, p.words)}</div><span class="text-xs text-slate-400 tabular-nums w-9 text-right">${p.pct}%</span></div>
      </div>
    </div>
  </button>`;
}

function renderModule(view, m) {
  if (!m) { courseState.module = null; return renderCourse(view); }
  const idx = wordIndex();
  const p = moduleProgress(m, idx);
  const np = nextPart(m, idx);
  const touched = m.items.map(b => idx.get(b.base_id)).filter(w => w && touches(w) > 0);
  const step = (n, k, title, body, done) => `
    <section class="card p-4 md:p-5">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 shrink-0 rounded-xl grid place-items-center font-extrabold ${done ? 'bg-brand-500 text-white' : 'bg-slate-500/10 text-slate-500'}">${done ? '<i data-lucide="check" style="width:1rem;height:1rem"></i>' : n}</div>
        <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="${STEP_UI[k][1]}" class="text-brand-500" style="width:1.05rem;height:1.05rem"></i>${title}</h2>
      </div>
      <div class="mt-3">${body}</div>
    </section>`;
  let n = 0;
  view.innerHTML = `
    <button class="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-500 mb-2" id="backBtn"><i data-lucide="chevron-left"></i>Курс ${m.level}</button>
    <div class="flex items-center gap-2">${levelBadge(m.level)}<span class="text-xs text-slate-400">Модуль ${m.n} из ${courseModules()[m.level].length}</span></div>
    <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">${esc(moduleTitle(m))}</h1>
    <div class="mt-3 flex items-center gap-3"><div class="flex-1">${progressBar(p.known, p.learning + p.weak, p.words)}</div><span class="text-sm font-bold tabular-nums">${p.pct}%</span></div>
    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">знаю ${p.known} · учу ${p.learning} · слабые ${p.weak} · не начато ${p.none}</div>

    <div class="mt-5 space-y-3">
      ${step(++n, 'words', `Слова модуля · ${m.items.length}`, `
        <p class="text-sm text-slate-500 dark:text-slate-400">Слова разбиты на части по 20. Учите по порядку: сначала знакомство с каждым словом, потом упражнения.</p>
        <div class="mt-3 divide-y divide-slate-100 dark:divide-white/5" id="partList">
          ${m.parts.map((part, i) => {
            let k = 0, g = 0; part.forEach(b => { const s = wordState(idx.get(b.base_id)); if (s === 'known') k++; else if (s !== 'none') g++; });
            return `<div class="flex items-center gap-3 py-2.5">
              <button class="flex-1 min-w-0 text-left" data-view="${i}">
                <div class="font-bold text-sm">Часть ${i + 1} ${np && np.i === i ? '<span class="text-[11px] text-brand-500 font-bold ml-1">следующая</span>' : ''}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 truncate">${part.slice(0, 6).map(b => esc(b.word)).join(', ')}…</div>
                <div class="mt-1.5 max-w-xs">${progressBar(k, g, part.length)}</div>
              </button>
              <span class="text-xs text-slate-400 tabular-nums">${k}/${part.length}</span>
              <button class="btn ${np && np.i === i ? 'btn-primary' : 'btn-ghost'} !h-9 !px-3 text-sm" data-part="${i}"><i data-lucide="play"></i><span class="hidden sm:inline">Учить</span></button>
            </div>`;
          }).join('')}
        </div>`, p.steps[0].done)}

      ${m.lesson ? step(++n, 'grammar', 'Грамматика', `
        <div class="font-bold">${esc(loc(m.lesson, 'title'))}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">${esc(loc(m.lesson, 'sub'))}</div>
        <div class="mt-3 flex items-center gap-3 flex-wrap">
          <button class="btn btn-primary !h-10" id="openLesson"><i data-lucide="book-open"></i>Правило и упражнения</button>
          <span class="text-sm ${p.g ? (p.g.best >= 70 ? 'text-brand-500' : 'text-amber-500') : 'text-slate-400'} font-semibold">${p.g ? `лучший результат ${p.g.best}%` : 'ещё не пройдено'}</span>
        </div>`, p.steps.find(s => s.k === 'grammar').done) : ''}

      ${m.text ? step(++n, 'text', 'Текст с озвучкой', `
        <div class="font-bold">${esc(m.text.title)} <span class="font-normal text-slate-400">— ${esc(isUA() && m.text.ua ? m.text.ua.name : m.text.ru)}</span></div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Слушайте и читайте одновременно — слово подсвечивается во время чтения. Нажмите на любое слово, чтобы увидеть перевод.</div>
        <div class="mt-3 flex items-center gap-3 flex-wrap">
          <button class="btn btn-primary !h-10" id="openText"><i data-lucide="headphones"></i>Читать и слушать</button>
          <span class="text-sm ${p.tx ? 'text-brand-500' : 'text-slate-400'} font-semibold">${p.tx ? `прочитано · вопросы ${p.tx.score}/${p.tx.total}` : 'ещё не прочитано'}</span>
        </div>`, !!p.tx) : ''}

      ${step(++n, 'test', 'Итоговый тест модуля', `
        <p class="text-sm text-slate-500 dark:text-slate-400">15 слов модуля вперемешку в разных упражнениях. Модуль закрыт при результате от 80%.</p>
        <div class="mt-3 flex items-center gap-3 flex-wrap">
          <button class="btn ${touched.length >= 8 ? 'btn-primary' : 'btn-ghost'} !h-10" id="testBtn" ${touched.length >= 8 ? '' : 'disabled'}><i data-lucide="badge-check"></i>Пройти тест</button>
          <span class="text-sm font-semibold ${p.test ? (p.test.best >= 80 ? 'text-brand-500' : 'text-amber-500') : 'text-slate-400'}">${p.test ? `лучший результат ${p.test.best}%` : touched.length >= 8 ? 'ещё не пройден' : `откроется после ${8 - touched.length} ${plural(8 - touched.length, 'выученного слова', 'выученных слов', 'выученных слов')}`}</span>
        </div>`, !!p.test && p.test.best >= 80)}
    </div>`;

  $('#backBtn').onclick = () => { courseState.module = null; render(); };
  $('#partList').onclick = e => {
    const t = e.target.closest('[data-part]');
    const label = i => `${m.level} · Модуль ${m.n}, часть ${+i + 1}`;
    if (t) { trainBlock(m.parts[t.dataset.part].map(b => b.base_id), label(t.dataset.part)); return; }
    const v = e.target.closest('[data-view]');
    if (v) openBlockModal(m.parts[v.dataset.view], label(v.dataset.view));
  };
  const ol = $('#openLesson'); if (ol) ol.onclick = () => openFromCourse('lesson', m.lesson.id);
  const ot = $('#openText'); if (ot) ot.onclick = () => openFromCourse('text', m.text.id);
  $('#testBtn').onclick = () => startModuleTest(m);
}

function openFromCourse(kind, id) {
  Object.assign(practice, { lesson: null, text: null, run: null, quiz: {}, from: 'course' });
  practice[kind] = id;
  location.hash = '#/practice';
}

function startModuleTest(m) {
  const idx = wordIndex();
  const pool = m.items.map(b => idx.get(b.base_id)).filter(w => w && touches(w) > 0);
  // в первую очередь слабые и давно не повторённые
  const pick = shuffle(pool).sort((a, b) => (isWeak(b) - isWeak(a))).slice(0, 15);
  startSession(shuffle(pick), { label: `Тест · ${m.level}, модуль ${m.n}`, mode: 'random', module: m.id });
}

/** Результат теста модуля сохраняется в прогресс практики (синхронизируется между устройствами) */
function saveModuleResult(id, accuracy) {
  const d = pstore.get();
  d.m ||= {};
  const prev = d.m[id];
  d.m[id] = { best: Math.max(prev?.best || 0, accuracy), last: accuracy, n: (prev?.n || 0) + 1, u: Date.now() };
  pstore.save();
}

/* ---------- 3. Словарь: «Мои слова» и «Вся база» ---------- */

const encState = { q: '', level: 'all', topic: 'all', status: 'all', sort: 'course', limit: 100 };
const dictTab = { v: null };

function renderDict(view) {
  if (!dictTab.v) dictTab.v = store.words.length ? 'mine' : 'all';
  if (dictTab.v === 'all') renderEncyclopedia(view); else renderMyWords(view);
  const bar = document.createElement('div');
  bar.className = 'grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-500/10 max-w-md mb-4';
  bar.innerHTML = [['mine', 'Мои слова', 'bookmark', store.words.length], ['all', 'Вся база', 'library', BASE.list.length]]
    .map(([v, l, i, n]) => `<button data-dt="${v}" class="h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${dictTab.v === v ? 'bg-white dark:bg-ink-800 shadow-sm text-brand-600 dark:text-brand-300' : 'text-slate-500'}"><i data-lucide="${i}"></i>${l}<span class="opacity-60 font-semibold">${n}</span></button>`).join('');
  bar.onclick = e => { const b = e.target.closest('[data-dt]'); if (!b) return; dictTab.v = b.dataset.dt; render(); };
  view.prepend(bar);
  icons();
}

function encFiltered(idx) {
  const q = normAnswer(encState.q);
  const list = BASE.list.filter(b => {
    if (encState.level !== 'all' && b.level !== encState.level) return false;
    if (encState.topic !== 'all' && b.topic !== encState.topic) return false;
    if (encState.status !== 'all' && wordState(idx.get(b.base_id)) !== encState.status) return false;
    if (!q) return true;
    return normAnswer(b.word).includes(q) || normAnswer(b.ru).includes(q) || normAnswer(b.ua).includes(q);
  });
  if (q) {   // точные совпадения и начало слова — выше
    const rank = b => { const w = normAnswer(b.word); return w === q ? 0 : w.startsWith(q) ? 1 : 2; };
    list.sort((a, b) => rank(a) - rank(b) || a.word.localeCompare(b.word, 'en', { sensitivity: 'base' }));
  } else if (encState.sort === 'alpha') list.sort((a, b) => a.word.localeCompare(b.word, 'en', { sensitivity: 'base' }));
  else list.sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.block - b.block);
  return list;
}

function renderEncyclopedia(view) {
  const idx = wordIndex();
  const avail = LEVELS.filter(l => BASE.list.some(b => b.level === l));
  view.innerHTML = `
    <div class="flex items-end justify-between gap-3 mb-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">Словарь</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Вся база WordFlow: ${BASE.list.length} слов и фраз ${avail[0]}–${avail[avail.length - 1]}. Открывайте любые слова — без ограничений.</p>
      </div>
    </div>
    <div class="flex flex-col md:flex-row gap-3">
      <div class="relative flex-1">
        <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input id="encSearch" class="input !pl-10" placeholder="Слово или перевод (англ., рус., укр.)" value="${esc(encState.q)}" autocomplete="off" />
      </div>
      <div class="grid grid-cols-3 md:flex gap-2">
        <select id="encLvl" class="input md:!w-32">${[['all', 'Все уровни'], ...avail.map(l => [l, l])].map(([v, l]) => `<option value="${v}" ${encState.level === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select id="encTopic" class="input md:!w-48"><option value="all">Все темы</option>${Object.keys(TOPICS).map(t => `<option value="${t}" ${encState.topic === t ? 'selected' : ''}>${esc(topicName(t))}</option>`).join('')}</select>
        <select id="encSort" class="input md:!w-40">${[['course', 'По курсу'], ['alpha', 'A→Z']].map(([v, l]) => `<option value="${v}" ${encState.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div>
    </div>
    <div class="mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1" id="encStatus"></div>
    <div id="encList" class="mt-3"></div>`;
  const draw = () => {
    const base = BASE.list.filter(b => (encState.level === 'all' || b.level === encState.level) && (encState.topic === 'all' || b.topic === encState.topic));
    const cnt = { all: base.length, none: 0, weak: 0, learning: 0, known: 0 };
    base.forEach(b => cnt[wordState(idx.get(b.base_id))]++);
    $('#encStatus').innerHTML = [['all', 'Все'], ['none', 'Не начатые'], ['learning', 'Учу'], ['weak', 'Слабые'], ['known', 'Знаю']]
      .map(([v, l]) => `<button class="chip ${encState.status === v ? 'is-active' : ''}" data-st="${v}">${l}<span class="opacity-70">${cnt[v]}</span></button>`).join('');
    const list = encFiltered(idx);
    const shown = list.slice(0, encState.limit);
    const ua = store.settings.lang === 'ua';
    const toTrain = list.filter(b => !isKnown(idx.get(b.base_id))).slice(0, 20);
    $('#encList').innerHTML = !list.length ? `<div class="text-center text-slate-500 py-12">Ничего не найдено${encState.q ? ` по запросу «${esc(encState.q)}»` : ''}</div>` : `
      <div class="flex items-center justify-between gap-2 mb-2 text-sm text-slate-500 dark:text-slate-400">
        <span>${list.length} ${plural(list.length, 'слово', 'слова', 'слов')}</span>
        ${toTrain.length ? `<button class="btn btn-ghost !h-9 text-sm" id="encTrain"><i data-lucide="zap"></i>Учить ${toTrain.length} из списка</button>` : ''}
      </div>
      <div class="card divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
        ${shown.map(b => { const st = wordState(idx.get(b.base_id)); return `<div class="flex items-center gap-3 px-3 md:px-4 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5" data-bid="${esc(b.base_id)}">
          <button class="icon-btn !w-8 !h-8 shrink-0" data-say="${esc(b.word)}" aria-label="Озвучить"><i data-lucide="volume-2" style="width:.95rem;height:.95rem"></i></button>
          <div class="flex-1 min-w-0">
            <div class="font-bold truncate">${esc(b.word)} <span class="text-xs font-normal text-slate-400">${esc(b.transcription)}</span></div>
            <div class="text-sm text-slate-500 dark:text-slate-400 truncate">${esc(ua ? b.ua : b.ru)}</div>
          </div>
          <span class="hidden sm:inline text-[11px] text-slate-400">${esc(topicName(b.topic))}</span>
          ${levelBadge(b.level)}
          <span class="inline-flex items-center gap-1 text-[11px] font-bold w-[72px] ${STATE_UI[st].cls}"><span class="w-2 h-2 rounded-full ${STATE_UI[st].dot}"></span>${STATE_UI[st].label}</span>
        </div>`; }).join('')}
      </div>
      ${list.length > shown.length ? `<div class="text-center mt-4"><button class="btn btn-ghost" id="encMore">Показать ещё (${list.length - shown.length})</button></div>` : ''}`;
    bindSay($('#encList'));
    const more = $('#encMore'); if (more) more.onclick = () => { encState.limit += 150; draw(); };
    const tr = $('#encTrain'); if (tr) tr.onclick = () => trainBlock(toTrain.map(b => b.base_id), 'Из словаря');
    icons();
  };
  draw();
  let tm;
  $('#encSearch').oninput = e => { clearTimeout(tm); tm = setTimeout(() => { encState.q = e.target.value; encState.limit = 100; draw(); }, 150); };
  $('#encLvl').onchange = e => { encState.level = e.target.value; encState.limit = 100; draw(); };
  $('#encTopic').onchange = e => { encState.topic = e.target.value; encState.limit = 100; draw(); };
  $('#encSort').onchange = e => { encState.sort = e.target.value; draw(); };
  $('#encStatus').onclick = e => { const b = e.target.closest('[data-st]'); if (!b) return; encState.status = b.dataset.st; encState.limit = 100; draw(); };
  $('#encList').onclick = e => {
    if (e.target.closest('[data-say]') || e.target.closest('button')) return;
    const row = e.target.closest('[data-bid]'); if (row) openBaseWordModal(BASE.map.get(row.dataset.bid));
  };
}

/** Карточка слова из общей базы (если слово уже изучается — открывается обычная карточка словаря) */
function openBaseWordModal(b) {
  if (!b) return;
  const w = store.words.find(x => x.base_id === b.base_id);
  if (w) return openWordModal(w.id);
  const ua = store.settings.lang === 'ua';
  openModal(`
    <div class="p-5 md:p-7">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">${levelBadge(b.level)}<span class="text-xs text-slate-400">${esc(POS_NAMES[b.pos] || b.pos)} · ${esc(topicName(b.topic))}</span></div>
          <div class="mt-2 text-3xl font-extrabold tracking-tight break-words">${esc(b.word)}</div>
          <div class="text-slate-400">${esc(b.transcription)}</div>
        </div>
        <button class="icon-btn" data-close-btn aria-label="Закрыть"><i data-lucide="x"></i></button>
      </div>
      <div class="mt-3 flex gap-2">
        <button class="btn btn-ghost !h-10" data-say="${esc(b.word)}"><i data-lucide="volume-2"></i>Слушать</button>
        <button class="btn btn-ghost !h-10" id="bwSlow"><i data-lucide="snail"></i>Медленно</button>
      </div>
      <div class="mt-4 text-2xl font-bold text-brand-600 dark:text-brand-300">${esc(ua ? b.ua : b.ru)}</div>
      <div class="mt-4 space-y-2">${exampleBlock(b.ex1, ua ? b.ex1ua : b.ex1ru, b.word)}${exampleBlock(b.ex2, ua ? b.ex2ua : b.ex2ru, b.word)}</div>
      <div class="mt-5 grid grid-cols-2 gap-2">
        <button class="btn btn-ghost btn-lg" id="bwKnow"><i data-lucide="check-check"></i>Уже знаю</button>
        <button class="btn btn-primary btn-lg" id="bwLearn"><i data-lucide="list-plus"></i>Учить</button>
      </div>
    </div>`, { wide: true });
  const root = $('#modalRoot');
  bindSay(root);
  $('[data-close-btn]', root).onclick = closeModal;
  $('#bwSlow').onclick = () => tts.speak(b.word, 0.55);
  $('#bwKnow').onclick = () => { addFromBase(b, 'learned'); store.saveWords(); closeModal(); toast(`«${b.word}» — в выученных`); render(); };
  $('#bwLearn').onclick = () => { addFromBase(b); store.saveWords(); closeModal(); toast(`«${b.word}» добавлено в изучение`); render(); };
  if (autoSpeak()) tts.speak(b.word);
}

/* ---------- 4. Анализ и рекомендации ---------- */

function analyze() {
  const idx = wordIndex();
  const lv = {};
  for (const L of LEVELS) {
    const items = BASE.list.filter(b => b.level === L);
    if (!items.length) continue;
    const r = { L, total: items.length, known: 0, learning: 0, weak: 0, none: 0, weakList: [] };
    for (const b of items) { const w = idx.get(b.base_id); const s = wordState(w); r[s]++; if (s === 'weak') r.weakList.push(w); }
    r.mastery = r.known / r.total;
    r.touched = (r.known + r.learning + r.weak) / r.total;
    lv[L] = r;
  }
  const levels = LEVELS.filter(L => lv[L]);
  const start = Math.max(0, levels.indexOf(store.settings.courseLevel));
  const focus = levels.slice(start).find(L => lv[L].mastery < 0.7) || levels[levels.length - 1];
  let est = null;   // оценка словарного запаса: подряд идущие уровни, где знаю ≥ 70%
  for (const L of levels) { if (lv[L].mastery >= 0.7) est = L; else break; }
  const ownWeak = store.words.filter(w => !w.base_id && isWeak(w));
  const lower = levels.slice(0, levels.indexOf(focus));
  const today = todayStr();
  const due = store.words.filter(w => w.priority === 'active' && !isNew(w) && dueOf(w) <= today)
    .sort((a, b) => dueOf(a).localeCompare(dueOf(b)) || a.ease - b.ease);
  const hard = store.words.filter(w => w.lapses >= 2 && !isKnown(w)).sort((a, b) => b.lapses - a.lapses);
  // слабые слова без тех, что уже стоят в повторении по графику (чтобы рекомендации не дублировались)
  const dueSet = new Set(due.map(w => w.id));
  const notDue = list => list.filter(w => !dueSet.has(w.id));
  const lowerWeak = notDue([...lower.flatMap(L => lv[L].weakList), ...ownWeak]);
  const mod = currentModule(focus);
  const prog = pstore.get();
  const lessonsUpTo = SENT.lessons.filter(l => LEVELS.indexOf(l.level) <= LEVELS.indexOf(focus));
  const weakGrammar = lessonsUpTo.filter(l => prog.s[l.id] && prog.s[l.id].best < 70);
  const nextGrammar = mod?.lesson && !(prog.s[mod.lesson.id]?.best >= 70) ? mod.lesson
    : SENT.lessons.find(l => l.level === focus && !prog.s[l.id]);
  const nextText = mod?.text && !prog.t[mod.text.id] ? mod.text : TEXTS.find(t => t.level === focus && !prog.t[t.id]);
  // по темам: доля ошибок среди начатых слов
  const topics = {};
  for (const w of store.words) {
    if (!w.base_id || !touches(w)) continue;
    const t = (topics[w.topic] ||= { t: w.topic, n: 0, err: 0, tou: 0, weak: [] });
    t.n++; t.err += w.lapses; t.tou += touches(w);
    if (isWeak(w) || w.lapses >= 2) t.weak.push(w);
  }
  const topicList = Object.values(topics).filter(t => t.n >= 5).map(t => ({ ...t, rate: t.err / Math.max(1, t.tou) })).sort((a, b) => b.rate - a.rate);
  // динамика: последние 30 дней против предыдущих 30
  const period = (from, to) => {
    const s = { s: 0, a: 0, c: 0, n: 0, t: 0, days: 0 };
    for (let i = from; i < to; i++) { const d = dayTotals(addDays(today, -i)); if (d.s) s.days++; for (const k of ['s', 'a', 'c', 'n', 't']) s[k] += d[k]; }
    s.acc = s.a ? Math.round(s.c / s.a * 100) : null;
    return s;
  };
  return { lv, levels, focus, est, lowerWeak, lower, due, hard, mod, weakGrammar, nextGrammar, nextText, topicList,
    focusWeak: notDue(lv[focus]?.weakList || []), last: period(0, 30), prev: period(30, 60), prog };
}

function levelRange(arr) { return !arr.length ? '' : arr.length === 1 ? arr[0] : `${arr[0]}–${arr[arr.length - 1]}`; }

/** Список рекомендаций: что делать сегодня и в каком порядке */
function recommendations(a = analyze()) {
  const size = store.settings.sessionSize || 10;
  const R = [];
  const byTouch = list => [...list].sort((x, y) => touches(x) - touches(y) || y.lapses - x.lapses);
  if (a.due.length) R.push({ tag: 'Сначала', icon: 'clock', color: 'text-rose-500 bg-rose-500/10',
    title: `Повторить по графику: ${a.due.length} ${plural(a.due.length, 'слово', 'слова', 'слов')}`,
    sub: 'Срок повторения подошёл — так слова не забываются', go: () => startSession(a.due.slice(0, Math.max(size, 15)), { label: 'Повторение по графику' }) });
  if (a.lowerWeak.length) {
    const lv = [...new Set(a.lowerWeak.map(w => w.level || 'мои'))];
    R.push({ tag: 'Закрепить', icon: 'shield-check', color: 'text-amber-500 bg-amber-500/10',
      title: `Слабые слова ${levelRange(a.lower) || ''}${lv.includes('мои') ? (a.lower.length ? ' и свои' : 'свои') : ''}: ${a.lowerWeak.length}`,
      sub: 'Начаты, но повторены 0–1 раз или с ошибками. Закрепите их перед новым материалом',
      go: () => startSession(byTouch(a.lowerWeak).slice(0, size), { label: 'Закрепление слабых слов' }) });
  }
  if (a.mod) {
    const np = nextPart(a.mod);
    if (np) R.push({ tag: 'Новое', icon: 'sparkles', color: 'text-violet-500 bg-violet-500/10',
      title: `Новые слова ${a.focus}: модуль ${a.mod.n}, часть ${np.i + 1}`,
      sub: `${moduleTitle(a.mod)} · ${np.items.length} слов. Приоритет — уровень ${a.focus}`,
      go: () => trainBlock(np.items.map(b => b.base_id), `${a.focus} · Модуль ${a.mod.n}, часть ${np.i + 1}`) });
  }
  if (a.focusWeak.length >= 5) R.push({ tag: 'Закрепить', icon: 'repeat', color: 'text-amber-500 bg-amber-500/10',
    title: `Доучить слова ${a.focus}: ${a.focusWeak.length}`, sub: 'Уже начаты на текущем уровне, но ещё не держатся в памяти',
    go: () => startSession(byTouch(a.focusWeak).slice(0, size), { label: `Доучить ${a.focus}` }) });
  const g = a.weakGrammar[0] || a.nextGrammar;
  if (g) {
    const r = a.prog.s[g.id];
    R.push({ tag: r ? 'Повторить' : 'Грамматика', icon: 'text-cursor-input', color: 'text-sky-500 bg-sky-500/10',
      title: `Грамматика: ${loc(g, 'title')}`, sub: r ? `Лучший результат ${r.best}% — пройдите ещё раз до 70%+` : `${loc(g, 'sub')} · правило и упражнения`,
      go: () => openFromCourse('lesson', g.id) });
  }
  if (a.nextText) R.push({ tag: 'Чтение', icon: 'headphones', color: 'text-brand-500 bg-brand-500/10',
    title: `Прочитать и послушать: ${a.nextText.title}`, sub: `Текст ${a.nextText.level} с озвучкой и вопросами`,
    go: () => openFromCourse('text', a.nextText.id) });
  if (a.hard.length >= 5) R.push({ tag: 'Трудные', icon: 'flame', color: 'text-orange-500 bg-orange-500/10',
    title: `Трудные слова: ${a.hard.length}`, sub: 'Ошибки 2 раза и больше — отдельная короткая тренировка',
    go: () => startSession(a.hard.slice(0, size), { label: 'Трудные слова', mode: 'cycle' }) });
  if (!R.length) R.push({ tag: 'Совет', icon: 'party-popper', color: 'text-brand-500 bg-brand-500/10',
    title: 'Всё по плану выполнено', sub: 'Можно пройти итоговый тест модуля или выбрать слова в словаре', go: () => { location.hash = '#/course'; } });
  return R;
}

let RECO = [];
/** Блок «Рекомендации на сегодня» для экрана «Учить» */
function recoBlock() {
  const a = analyze();
  RECO = recommendations(a).slice(0, 5);
  const lv = a.levels.map(L => `${L} ${Math.round(a.lv[L].mastery * 100)}%`).join(' · ');
  return `<section class="mt-5">
    <div class="flex items-baseline justify-between gap-2 flex-wrap">
      <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="compass" class="text-brand-500"></i>Рекомендации на сегодня</h2>
      <a href="#/stats" class="text-xs font-semibold text-slate-500 hover:text-brand-500">Фокус: ${a.focus} · подробный анализ →</a>
    </div>
    <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Знаю слов по уровням: ${lv}</div>
    <div class="mt-3 space-y-2" id="recoList">
      ${RECO.map((r, i) => `<button class="w-full card p-3.5 flex items-center gap-3 text-left hover:border-brand-400 transition" data-reco="${i}">
        <span class="w-6 text-center text-sm font-extrabold text-slate-400">${i + 1}</span>
        <span class="w-10 h-10 shrink-0 rounded-xl grid place-items-center ${r.color}"><i data-lucide="${r.icon}"></i></span>
        <span class="flex-1 min-w-0">
          <span class="flex items-center gap-2"><span class="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">${r.tag}</span></span>
          <span class="block font-bold leading-snug">${esc(r.title)}</span>
          <span class="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">${esc(r.sub)}</span>
        </span>
        <i data-lucide="chevron-right" class="text-slate-400 shrink-0"></i>
      </button>`).join('')}
    </div>
  </section>`;
}
function bindReco(root = document) {
  const box = $('#recoList', root); if (!box) return;
  box.onclick = e => { const b = e.target.closest('[data-reco]'); if (b) RECO[+b.dataset.reco]?.go(); };
}

/** Раздел «Анализ обучения» на экране «Прогресс» */
function analysisSection() {
  const a = analyze();
  const L = a.levels;
  const totalKnown = L.reduce((s, l) => s + a.lv[l].known, 0) + store.words.filter(w => !w.base_id && isKnown(w)).length;
  const diff = (x, y) => x == null || y == null ? '' : x === y ? ' (без изменений)' : ` (${x > y ? '+' : ''}${x - y}% к прошлому месяцу)`;
  const notes = [];
  if (a.est) notes.push(`Словарный запас уровня <b>${a.est}</b> освоен: знаете больше 70% его слов.`);
  else notes.push('Пока ни один уровень не освоен на 70% — продолжайте с базовых слов, это даёт самый быстрый прогресс.');
  notes.push(`Сейчас приоритет — <b>${a.focus}</b>: знаю ${Math.round(a.lv[a.focus].mastery * 100)}%, начато ${Math.round(a.lv[a.focus].touched * 100)}% слов уровня.`);
  if (a.lowerWeak.length) notes.push(`На предыдущих уровнях ${a.lowerWeak.length} ${plural(a.lowerWeak.length, 'слабое слово', 'слабых слова', 'слабых слов')} (0–1 повторение или ошибки) — их стоит закрепить.`);
  if (a.topicList.length >= 2) {
    const worst = a.topicList.slice(0, 2).map(t => `«${topicName(t.t)}»`).join(' и ');
    const best = a.topicList[a.topicList.length - 1];
    notes.push(`Больше всего ошибок в темах ${worst}; лучше всего идёт «${topicName(best.t)}».`);
  }
  if (a.last.days) notes.push(`За 30 дней: ${a.last.days} ${plural(a.last.days, 'день', 'дня', 'дней')} с занятиями, ${a.last.n} новых слов, точность ${a.last.acc ?? '—'}%${diff(a.last.acc, a.prev.acc)}.`);
  else notes.push('За последние 30 дней занятий не было — начните с короткой тренировки на 5 слов.');
  if (a.weakGrammar.length) notes.push(`Грамматика ниже 70%: ${a.weakGrammar.map(l => `«${esc(loc(l, 'title'))}»`).slice(0, 3).join(', ')}.`);
  const texts = Object.keys(a.prog.t).length, lessons = Object.keys(a.prog.s).length;

  return `<section class="card p-4 md:p-5">
    <div class="flex items-baseline justify-between gap-2 flex-wrap">
      <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="brain" class="text-brand-500"></i>Анализ обучения</h2>
      <a href="#/train" class="text-sm font-bold text-brand-500">Рекомендации на сегодня →</a>
    </div>
    <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
      ${miniKpi('Уровень (слова)', a.est || 'до A1', 'освоен на 70%+')}
      ${miniKpi('Фокус сейчас', a.focus, 'новые слова отсюда')}
      ${miniKpi('Знаю слов', totalKnown, 'из базы и своих')}
      ${miniKpi('Грамматика · тексты', `${lessons}/${SENT.lessons.length} · ${texts}/${TEXTS.length}`, 'пройдено')}
    </div>
    <div class="mt-4 space-y-2.5">
      ${L.map(l => { const r = a.lv[l]; const seg = (n, c) => n ? `<span style="width:${n / r.total * 100}%" class="${c}"></span>` : '';
        return `<div class="flex items-center gap-3">
          <span class="w-8 font-extrabold text-sm">${l}</span>
          <div class="flex-1 flex h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 gap-[2px]">${seg(r.known, 'bg-brand-500')}${seg(r.learning, 'bg-amber-400')}${seg(r.weak, 'bg-rose-500')}</div>
          <span class="text-xs text-slate-500 dark:text-slate-400 tabular-nums w-24 text-right">${r.known}/${r.total}${r.weak ? ` · <span class="text-rose-500">${r.weak}</span>` : ''}</span>
        </div>`; }).join('')}
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pl-11">
        <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-brand-500"></span>знаю</span>
        <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>учу</span>
        <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>слабые (0–1 повтор или ошибки)</span>
      </div>
    </div>
    <ul class="mt-4 space-y-1.5 text-sm leading-relaxed list-disc pl-5 marker:text-brand-500">${notes.map(n => `<li>${n}</li>`).join('')}</ul>
    ${a.topicList.length ? `<details class="mt-3 text-sm"><summary class="cursor-pointer font-semibold text-slate-500 dark:text-slate-400">Темы: где больше всего ошибок</summary>
      <div class="mt-2 divide-y divide-slate-100 dark:divide-white/5">${a.topicList.slice(0, 8).map(t => `<div class="flex items-center gap-3 py-2">
        <span class="flex-1">${esc(topicName(t.t))}</span><span class="text-xs text-slate-400">${t.n} слов</span>
        <span class="text-xs font-bold w-20 text-right ${t.rate > 0.25 ? 'text-rose-500' : t.rate > 0.1 ? 'text-amber-500' : 'text-brand-500'}">ошибок ${Math.round(t.rate * 100)}%</span>
        ${t.weak.length ? `<button class="btn btn-ghost !h-8 !px-2.5 text-xs" data-topic-train="${t.t}">Учить ${Math.min(t.weak.length, 15)}</button>` : '<span class="w-[70px]"></span>'}
      </div>`).join('')}</div></details>` : ''}
  </section>`;
}
function miniKpi(label, value, sub) {
  return `<div class="rounded-2xl bg-slate-500/5 dark:bg-white/5 p-3"><div class="text-xs font-semibold text-slate-500 dark:text-slate-400">${label}</div><div class="text-xl font-extrabold mt-0.5">${value}</div><div class="text-[11px] text-slate-400">${sub}</div></div>`;
}
function bindAnalysis(root) {
  root.querySelectorAll('[data-topic-train]').forEach(b => b.onclick = () => {
    const t = b.dataset.topicTrain;
    const list = store.words.filter(w => w.topic === t && (isWeak(w) || w.lapses >= 2)).sort((x, y) => touches(x) - touches(y)).slice(0, 15);
    startSession(list, { label: `Тема: ${topicName(t)}` });
  });
}

/* ---------- 5. Памятка ---------- */

function openGuide() {
  const row = (icon, title, text) => `<div class="flex gap-3"><span class="w-10 h-10 shrink-0 rounded-xl bg-brand-500/15 text-brand-500 grid place-items-center"><i data-lucide="${icon}"></i></span><div><div class="font-extrabold">${title}</div><div class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">${text}</div></div></div>`;
  openModal(`<div class="p-6 md:p-8">
    <div class="flex items-center justify-between"><h2 class="text-xl font-extrabold">Как устроен WordFlow</h2><button class="icon-btn" data-close-btn aria-label="Закрыть"><i data-lucide="x"></i></button></div>
    <div class="mt-5 space-y-4">
      ${row('graduation-cap', 'Курс — программа по шагам', 'Уровни A1–B2 разбиты на модули. В модуле: слова по частям, урок грамматики, текст с озвучкой и итоговый тест. Проходите модули по порядку.')}
      ${row('zap', 'Учить — ежедневная тренировка', 'Каждый день открывайте этот раздел: приложение само подскажет, что повторить, что закрепить и что учить дальше.')}
      ${row('book-open', 'Словарь — вся база и ваши слова', '«Вся база» — энциклопедия всех слов: ищите и открывайте любые. «Мои слова» — то, что вы уже учите, со статусами и сроками повторения.')}
      ${row('book-open-text', 'Практика — грамматика и тексты', 'Правила простым языком с упражнениями и тексты с переводом слова по нажатию и озвучкой диктором.')}
      ${row('chart-column', 'Прогресс — анализ', 'Сколько слов каждого уровня вы знаете, где слабые места и как меняется точность.')}
    </div>
    <div class="mt-6 rounded-2xl bg-brand-500/10 p-4 text-sm leading-relaxed"><b>С чего начать:</b> откройте «Учить» и выполните первую рекомендацию. 10–15 минут в день достаточно.</div>
    <button class="btn btn-primary btn-lg w-full mt-5" id="guideGo"><i data-lucide="zap"></i>Перейти к тренировке</button>
  </div>`, { wide: true });
  $('#modalRoot [data-close-btn]').onclick = closeModal;
  $('#guideGo').onclick = () => { closeModal(); location.hash = '#/train'; };
}
