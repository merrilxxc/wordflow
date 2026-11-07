/* =====================================================================
   WordFlow — тренажёр английских слов (PWA)
   Весь код приложения в одном файле. Разделы:
     1. Константы и хранилище (localStorage)
     2. Утилиты
     3. Интервальное повторение (SRS)
     4. Импорт / экспорт (CSV, TSV, JSON, Google Таблица)
     5. Озвучка (Web Speech API)
     6. Интерфейс: навигация, модальные окна, уведомления
     7. Экран «Словарь»
     8. Экран «Тренировка» (4 упражнения + отчёт)
     9. Экран «База» (импорт/экспорт)
    10. Экран «Настройки»
    11. Запуск
   ===================================================================== */
'use strict';

/* ---------- 1. Константы и хранилище ---------- */

const LS_WORDS = 'ew.words.v1';
const LS_SETTINGS = 'ew.settings.v1';
const LS_HISTORY = 'ew.history.v1';
const LS_SESSION = 'ew.session.v1';
const LS_STATS = 'ew.stats.v1';       // статистика по дням
const LS_DELETED = 'ew.deleted.v1';   // удалённые слова (чтобы удаление дошло до других устройств)
const LS_DEVICE = 'ew.device.v1';     // идентификатор этого устройства

// Поля, которые выгружаются в CSV/таблицу (порядок колонок)
const FIELDS = [
  'word', 'translation', 'transcription',
  'example1_en', 'example1_ua', 'example2_en', 'example2_ua',
  'interval', 'repetitions', 'priority', 'last_reviewed'
];
const CONTENT_FIELDS = FIELDS.slice(0, 7);
// Колонки, которые хранятся в Google Таблице при синхронизации
const SYNC_FIELDS = [...FIELDS, 'base_id', 'level', 'pos', 'topic', 'ease', 'lapses', 'ex', 'added', 'updated', 'id'];

/* ---------- Общая база слов (data/base.js) ---------- */
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const LEVEL_INFO = {
  A1: 'Начальный', A2: 'Элементарный', B1: 'Средний', B2: 'Выше среднего', C1: 'Продвинутый'
};
const TOPICS = {
  basic: ['Базовые слова', 'Базові слова', 'shapes'], people: ['Люди и семья', 'Люди й родина', 'users'],
  home: ['Дом и быт', 'Дім і побут', 'house'], food: ['Еда', 'Їжа', 'utensils'],
  work: ['Работа', 'Робота', 'briefcase'], money: ['Деньги и покупки', 'Гроші й покупки', 'wallet'],
  travel: ['Путешествия и транспорт', 'Подорожі й транспорт', 'plane'], city: ['Город', 'Місто', 'building-2'],
  time: ['Время', 'Час', 'clock'], nature: ['Природа и погода', 'Природа й погода', 'trees'],
  health: ['Здоровье и тело', "Здоров'я і тіло", 'heart-pulse'], study: ['Учёба и язык', 'Навчання й мова', 'graduation-cap'],
  tech: ['Техника и интернет', 'Техніка й інтернет', 'smartphone'], feelings: ['Чувства', 'Почуття', 'smile'],
  leisure: ['Досуг и спорт', 'Дозвілля й спорт', 'party-popper'], comm: ['Общение', 'Спілкування', 'message-circle'],
  clothes: ['Одежда', 'Одяг', 'shirt'], actions: ['Действия', 'Дії', 'move'],
  qualities: ['Описание и качества', 'Опис і якості', 'palette'], numbers: ['Числа и количество', 'Числа й кількість', 'hash']
};
const POS_NAMES = { n: 'сущ.', v: 'глаг.', adj: 'прил.', adv: 'нареч.', pron: 'местоим.', prep: 'предлог', conj: 'союз', det: 'опред.', num: 'числ.', int: 'межд.', phr: 'фраза' };
const BASE = (() => {
  const raw = window.WF_BASE || { items: [], version: '' };
  const list = raw.items.map(r => ({
    base_id: `${r[1].toLowerCase()}|${r[2]}`,
    level: r[0], word: r[1], pos: r[2], transcription: r[3], ru: r[4], ua: r[5], topic: r[6],
    ex1: r[7], ex1ru: r[8], ex1ua: r[9], ex2: r[10], ex2ru: r[11], ex2ua: r[12], block: r[13]
  }));
  return { list, map: new Map(list.map(b => [b.base_id, b])), version: raw.version };
})();
const topicName = t => (TOPICS[t] || [t, t])[store.settings.lang === 'ua' ? 1 : 0];

const STATUS = {
  active:  { label: 'В работе',          short: 'В работе', icon: 'play',                cls: 'bg-brand-500/15 text-brand-600 dark:text-brand-300' },
  later:   { label: 'В конце очереди',   short: 'Позже',    icon: 'arrow-down-to-line',  cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-300' },
  learned: { label: 'Выучено',           short: 'Выучено',  icon: 'circle-check-big',    cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-300' }
};

const EX_TYPES = [
  { id: 0, name: 'Выбор перевода', icon: 'list-checks' },
  { id: 1, name: 'Сборка слова',   icon: 'puzzle' },
  { id: 2, name: 'Написание',      icon: 'keyboard' },
  { id: 3, name: 'Аудирование',    icon: 'headphones' },
  { id: 4, name: 'Карточки',       icon: 'gallery-horizontal-end' },
  { id: 5, name: 'Новое слово',    icon: 'sparkles' }
];

const DEFAULT_SETTINGS = {
  theme: 'dark',          // dark | light | system
  sessionSize: 10,        // слов за тренировку
  mode: 'cycle',          // cycle — одно упражнение на слово по кругу; full — все 4 на каждое слово; random
  voice: '',              // имя голоса speechSynthesis
  rate: 0.9,              // скорость озвучки
  volume: 0.6,            // громкость озвучки 0..1
  autoplay: true,         // озвучивать слово автоматически
  retryWrong: true,       // повторять ошибочные карточки в конце сессии
  sheetUrl: '',           // ссылка на Google Таблицу для импорта
  cardSide: 'en',         // карточки: en — англ. на лицевой стороне, ru — перевод, mix — вперемешку
  syncUrl: '',            // адрес веб-приложения Google Apps Script для синхронизации
  syncKey: '',            // ключ доступа (если задан в скрипте)
  autoSync: true,         // синхронизировать автоматически
  lastSync: 0,            // время последней синхронизации
  lang: 'ru',             // язык переводов общей базы: ru | ua
  newPerDay: 10,          // новых слов в день
  autoCourse: true,       // автоматически брать новые слова из курса
  courseLevel: 'A1',      // с какого уровня начинать курс
  courseTopics: [],       // темы курса (пусто — все)
  quiet: false,           // тихий режим: без звука, без аудирования
  onboarded: false        // приветствие пройдено
};

const DEVICE = (() => {
  try {
    let id = localStorage.getItem(LS_DEVICE);
    if (!id) { id = 'd' + Math.random().toString(36).slice(2, 10); localStorage.setItem(LS_DEVICE, id); }
    return id;
  } catch { return 'd-local'; }
})();

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) { toast('Не удалось сохранить: память браузера заполнена', 'error'); return false; }
}

const store = {
  words: [],
  settings: { ...DEFAULT_SETTINGS },
  history: [],
  stats: {},     // { 'ГГГГ-ММ-ДД': { идентификатор_устройства: { s, a, c, w, n, t, u } } }
  deleted: {},   // { слово: время удаления }
  init() {
    this.settings = { ...DEFAULT_SETTINGS, ...(load(LS_SETTINGS, {}) || {}) };
    if (!load(LS_SETTINGS, null) && (load(LS_WORDS, []) || []).length) this.settings.onboarded = true;
    this.words = (load(LS_WORDS, []) || []).map(normWord).filter(w => w.word || w.base_id).map(hydrate);
    // слова из первой версии приложения получают метку времени изменения
    for (const w of this.words) if (!w.updated) w.updated = w.last_reviewed ? Date.parse(w.last_reviewed) || 1 : 1;
    this.history = load(LS_HISTORY, []) || [];
    this.deleted = load(LS_DELETED, {}) || {};
    this.stats = load(LS_STATS, null);
    if (!this.stats) {
      // перенос старой истории тренировок в статистику по дням
      this.stats = {};
      for (const h of this.history) {
        const d = statDay(h.date);
        d.s += 1; d.w += h.words || 0; d.a += h.words || 0;
        d.c += Math.round((h.words || 0) * (h.accuracy || 0) / 100); d.u = 1;
      }
      save(LS_STATS, this.stats);
    }
  },
  saveWords(quiet = false) { save(LS_WORDS, this.words); if (!quiet) sync.schedule(); },
  saveSettings() { save(LS_SETTINGS, this.settings); },
  saveHistory() { this.history = this.history.slice(-200); save(LS_HISTORY, this.history); },
  saveStats(quiet = false) { save(LS_STATS, this.stats); if (!quiet) sync.schedule(); },
  saveDeleted() { save(LS_DELETED, this.deleted); },
  markDeleted(w) { this.deleted[keyOf(w)] = Date.now(); this.saveDeleted(); },
  byId(id) { return this.words.find(w => w.id === id); }
};

/* ---------- 2. Утилиты ---------- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function str(v) { return v == null ? '' : String(v).trim(); }
function num(v, d = 0) { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : d; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function pad(n) { return String(n).padStart(2, '0'); }
function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function todayStr() { return dateStr(new Date()); }
function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return dateStr(new Date(y, m - 1, d + Math.round(days)));
}
function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
/** Сравнение ответа: регистр, лишние пробелы, разные апострофы не важны */
function normAnswer(s) {
  return String(s || '').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.!?,;:]+$/g, '').replace(/\s+/g, ' ').trim();
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
/** Подсветить слово в примере предложения */
function highlight(sentence, word) {
  const s = esc(sentence);
  const w = String(word || '').trim();
  if (!w || w.length < 2) return s;
  const stem = w.length > 4 ? w.slice(0, w.length - 1) : w;
  const re = new RegExp(`\\b(${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[a-z']*)`, 'gi');
  return s.replace(re, '<mark class="hl">$1</mark>');
}
function icons() { if (window.lucide) lucide.createIcons(); }

/* ---------- Нормализация слова ---------- */

function normPriority(v) {
  const s = str(v).toLowerCase();
  if (!s) return 'active';
  if (['later', 'end', 'postponed', 'в конец', 'в конец очереди', 'конец', 'позже', 'відкласти', 'потім', '2'].includes(s) || s.includes('конец') || s.includes('кінець')) return 'later';
  if (['learned', 'done', 'known', 'выучено', 'вивчено', 'знаю', '3'].includes(s) || s.startsWith('выуч') || s.startsWith('вивч')) return 'learned';
  return 'active';
}
function normDate(v) {
  const s = str(v);
  if (!s) return '';
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (m) return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`;
  const d = new Date(s);
  return isNaN(d) ? '' : dateStr(d);
}
function normWord(raw = {}) {
  return {
    id: str(raw.id) || uid(),
    word: str(raw.word),
    translation: str(raw.translation),
    transcription: str(raw.transcription),
    example1_en: str(raw.example1_en),
    example1_ua: str(raw.example1_ua),
    example2_en: str(raw.example2_en),
    example2_ua: str(raw.example2_ua),
    interval: Math.max(0, num(raw.interval, 0)),
    repetitions: Math.max(0, Math.round(num(raw.repetitions, 0))),
    priority: normPriority(raw.priority),
    last_reviewed: normDate(raw.last_reviewed),
    // служебные поля
    ease: Math.min(3, Math.max(1.3, num(raw.ease, 2.5))),
    lapses: Math.max(0, Math.round(num(raw.lapses, 0))),
    ex: Math.max(0, Math.round(num(raw.ex, 0))) % 4,
    added: num(raw.added, 0) || Date.now(),
    updated: num(raw.updated, 0),  // время последнего изменения (для синхронизации)
    base_id: str(raw.base_id),     // слово из общей базы (пусто — своё слово)
    level: str(raw.level).toUpperCase(),
    pos: str(raw.pos),
    topic: str(raw.topic)
  };
}
const keyOf = w => w.base_id ? 'b:' + w.base_id : normAnswer(w.word);

/** Подставить текст из общей базы на выбранном языке (переводы, примеры, транскрипцию) */
function hydrate(w) {
  const b = w.base_id && BASE.map.get(w.base_id);
  if (!b) return w;
  const ua = store.settings.lang === 'ua';
  Object.assign(w, {
    word: b.word, transcription: b.transcription, level: b.level, pos: b.pos, topic: b.topic,
    translation: ua ? b.ua : b.ru,
    example1_en: b.ex1, example1_ua: ua ? b.ex1ua : b.ex1ru,
    example2_en: b.ex2, example2_ua: ua ? b.ex2ua : b.ex2ru
  });
  return w;
}
function rehydrateAll() { store.words.forEach(hydrate); }

/** Добавить слово из общей базы в личный словарь */
function addFromBase(b, priority = 'active') {
  const key = 'b:' + b.base_id;
  let w = store.words.find(x => keyOf(x) === key);
  if (w) {
    if (w.priority !== priority && !(priority === 'active' && w.priority === 'learned')) { w.priority = priority; touch(w); }
    return w;
  }
  w = touch(hydrate(normWord({ base_id: b.base_id, priority })));
  if (priority === 'learned') { w.last_reviewed = todayStr(); w.interval = 30; w.repetitions = 3; }
  delete store.deleted[key];
  store.words.push(w);
  return w;
}
function inDict(b) { return store.words.some(w => w.base_id === b.base_id); }

/** Следующие слова курса: уровни от выбранного вверх, затем ниже; по порядку блоков; с учётом выбранных тем */
function courseQueue() {
  const s = store.settings;
  const start = Math.max(0, LEVELS.indexOf(s.courseLevel));
  const order = [...LEVELS.slice(start), ...LEVELS.slice(0, start).reverse()];
  const have = new Set(store.words.map(w => w.base_id).filter(Boolean));
  const topics = s.courseTopics || [];
  return BASE.list
    .filter(b => !have.has(b.base_id) && !store.deleted['b:' + b.base_id] && (!topics.length || topics.includes(b.topic)))
    .sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level) || a.block - b.block);
}
/** Сколько новых слов ещё можно начать сегодня */
function newLeftToday() {
  return Math.max(0, (store.settings.newPerDay || 10) - dayTotals(todayStr()).n);
}
/** Отметить слово как изменённое — при синхронизации побеждает более свежая версия */
function touch(w) { w.updated = Date.now(); return w; }

/* ---------- Статистика по дням ---------- */

function statDay(day) {
  const d = (store.stats[day] ||= {});
  return (d[DEVICE] ||= { s: 0, a: 0, c: 0, w: 0, n: 0, t: 0, u: 0 });
}
/** Сумма по всем устройствам за день: s — сессий, a — ответов, c — верных, w — слов, n — новых слов, t — секунд */
function dayTotals(day) {
  const t = { s: 0, a: 0, c: 0, w: 0, n: 0, t: 0 };
  for (const v of Object.values(store.stats[day] || {})) for (const k in t) t[k] += +v[k] || 0;
  return t;
}
function streak() {
  let day = todayStr(), n = 0;
  if (!dayTotals(day).s) day = addDays(day, -1);
  while (dayTotals(day).s) { n++; day = addDays(day, -1); }
  return n;
}

/* ---------- 3. Интервальное повторение (упрощённый SM-2) ---------- */

function dueOf(w) { return w.last_reviewed ? addDays(w.last_reviewed, w.interval) : ''; }
function isNew(w) { return !w.last_reviewed; }
function isDue(w) { return w.priority === 'active' && (isNew(w) || dueOf(w) <= todayStr()); }

/** Выбор слов для сессии: сначала просроченные, затем новые, затем ближайшие; «в конце очереди» — только если активных не хватает */
function pickSessionWords(n, { extra = true } = {}) {
  const today = todayStr();
  let active = store.words.filter(w => w.priority === 'active');
  const due = active.filter(w => !isNew(w) && dueOf(w) <= today)
    .sort((a, b) => dueOf(a).localeCompare(dueOf(b)) || a.ease - b.ease);
  // новые: сначала уже добавленные в словарь, затем следующие из курса — в пределах дневного лимита
  let freshLimit = Math.min(n - Math.min(due.length, n), newLeftToday());
  let fresh = active.filter(isNew).sort((a, b) => a.added - b.added);
  if (fresh.length < freshLimit && store.settings.autoCourse) {
    const add = courseQueue().slice(0, freshLimit - fresh.length).map(b => addFromBase(b));
    if (add.length) { store.saveWords(); fresh = [...fresh, ...add]; active = [...active, ...add]; }
  }
  // если план на день выполнен, а пользователь хочет ещё — даём новые сверх лимита только когда повторять нечего
  if (!due.length && !fresh.slice(0, freshLimit).length && extra && store.settings.autoCourse && !active.length) {
    const add = courseQueue().slice(0, Math.min(5, n)).map(b => addFromBase(b));
    if (add.length) { store.saveWords(); fresh = add; active = add; freshLimit = add.length; }
  }
  const picked = [...due.slice(0, n), ...fresh.slice(0, Math.max(0, freshLimit))].slice(0, n);
  if (!extra) return picked;
  if (picked.length < n) {
    const rest = active.filter(w => !picked.includes(w)).sort((a, b) => dueOf(a).localeCompare(dueOf(b)));
    picked.push(...rest.slice(0, n - picked.length));
  }
  if (picked.length < n) {
    const later = store.words.filter(w => w.priority === 'later').sort((a, b) => a.added - b.added);
    picked.push(...later.slice(0, n - picked.length));
  }
  return picked;
}

/** Обновление прогресса слова после сессии */
function applySrs(w, ok, wasDue) {
  if (ok) {
    if (wasDue) {
      w.repetitions += 1;
      w.interval = w.repetitions === 1 ? 1 : w.repetitions === 2 ? 3 : Math.round(Math.max(w.interval, 1) * w.ease);
      w.ease = Math.min(3, +(w.ease + 0.05).toFixed(2));
    }
  } else {
    w.repetitions = 0;
    w.interval = 1;          // повторить завтра
    w.lapses += 1;
    w.ease = Math.max(1.3, +(w.ease - 0.2).toFixed(2));
  }
  w.last_reviewed = todayStr();
  touch(w);
}

/* ---------- 4. Импорт / экспорт ---------- */

// Варианты названий колонок (русские, украинские, английские)
const HEADER_ALIASES = {
  word: ['word', 'english', 'en', 'eng', 'слово', 'англ', 'английский', 'англійська', 'англійське', 'englishword'],
  translation: ['translation', 'translate', 'перевод', 'переклад', 'ru', 'ua', 'uk', 'значение', 'значення'],
  transcription: ['transcription', 'транскрипция', 'транскрипція', 'ipa', 'pronunciation'],
  example1_en: ['example1en', 'example1', 'ex1en', 'ex1', 'пример1', 'приклад1', 'example1english'],
  example1_ua: ['example1ua', 'example1ru', 'example1uk', 'example1translation', 'ex1ua', 'ex1ru', 'переводпримера1', 'перекладприкладу1', 'пример1перевод', 'приклад1переклад'],
  example2_en: ['example2en', 'example2', 'ex2en', 'ex2', 'пример2', 'приклад2', 'example2english'],
  example2_ua: ['example2ua', 'example2ru', 'example2uk', 'example2translation', 'ex2ua', 'ex2ru', 'переводпримера2', 'перекладприкладу2', 'пример2перевод', 'приклад2переклад'],
  interval: ['interval', 'интервал', 'інтервал'],
  repetitions: ['repetitions', 'reps', 'повторы', 'повторения', 'повтори', 'повторень'],
  priority: ['priority', 'status', 'приоритет', 'статус', 'пріоритет'],
  last_reviewed: ['lastreviewed', 'lastreview', 'last', 'датаповтора', 'последнийповтор', 'останнійповтор', 'дата'],
  ease: ['ease'], lapses: ['lapses'], ex: ['ex'], id: ['id'], added: ['added']
};
const normHeader = h => String(h || '').toLowerCase().replace(/[\s_\-.()№#]/g, '');
const ALIAS_MAP = Object.fromEntries(Object.entries(HEADER_ALIASES).flatMap(([f, arr]) => arr.map(a => [a, f])));

function detectDelimiter(text) {
  const line = text.split(/\r?\n/).find(l => l.trim()) || '';
  let inQ = false; const counts = { '\t': 0, ';': 0, ',': 0 };
  for (const ch of line) { if (ch === '"') inQ = !inQ; else if (!inQ && ch in counts) counts[ch]++; }
  if (counts['\t']) return '\t';
  return counts[';'] > counts[','] ? ';' : ',';
}

/** Полноценный парсер CSV (кавычки, переносы строк внутри ячеек) */
function parseCSV(text, delim) {
  const rows = []; let row = []; let cell = ''; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += ch;
    } else if (ch === '"' && cell === '') inQ = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim() !== ''));
}

/** Текст (CSV/TSV/JSON) → массив объектов-слов */
function parseImport(text) {
  const t = String(text || '').replace(/^﻿/, '').trim();
  if (!t) throw new Error('Пустой текст');
  if (t.startsWith('[') || t.startsWith('{')) {
    let data;
    try { data = JSON.parse(t); } catch { throw new Error('JSON содержит ошибку'); }
    const arr = Array.isArray(data) ? data : (data.words || []);
    return arr.map(o => {
      const out = {};
      for (const [k, v] of Object.entries(o || {})) { const f = ALIAS_MAP[normHeader(k)] || k; out[f] = v; }
      return out;
    });
  }
  const rows = parseCSV(t, detectDelimiter(t));
  if (!rows.length) throw new Error('Не найдено ни одной строки');
  const head = rows[0].map(h => ALIAS_MAP[normHeader(h)]);
  const hasHeader = head.includes('word') || head.includes('translation');
  const map = hasHeader ? head : FIELDS;
  return rows.slice(hasHeader ? 1 : 0).map(r => {
    const o = {};
    r.forEach((v, i) => { const f = map[i]; if (f) o[f] = v; });
    return o;
  });
}

/** Добавление в базу. mode: merge — обновить существующие (прогресс сохраняется, если в импорте он не новее), replace — заменить всё */
function importWords(rawList, mode = 'merge') {
  const items = rawList.map(normWord).filter(w => w.word && w.translation).map(touch);
  const skipped = rawList.length - items.length;
  if (mode === 'replace') {
    const seen = new Set();
    const fresh = items.filter(w => !seen.has(keyOf(w)) && seen.add(keyOf(w)));
    for (const w of store.words) if (!seen.has(keyOf(w))) store.deleted[keyOf(w)] = Date.now();
    store.saveDeleted();
    store.words = fresh;
    store.saveWords();
    return { added: store.words.length, updated: 0, skipped };
  }
  const index = new Map(store.words.map(w => [keyOf(w), w]));
  let added = 0, updated = 0;
  for (const it of items) {
    const ex = index.get(keyOf(it));
    if (!ex) { store.words.push(it); index.set(keyOf(it), it); added++; delete store.deleted[keyOf(it)]; continue; }
    let changed = false;
    for (const f of CONTENT_FIELDS) if (it[f] && it[f] !== ex[f]) { ex[f] = it[f]; changed = true; }
    const rawPriority = rawList.find(r => normAnswer(r.word) === keyOf(it))?.priority;
    if (it.last_reviewed && it.last_reviewed > (ex.last_reviewed || '')) {
      Object.assign(ex, { interval: it.interval, repetitions: it.repetitions, last_reviewed: it.last_reviewed, priority: it.priority });
      changed = true;
    } else if (str(rawPriority) && it.priority !== ex.priority && !ex.last_reviewed) {
      ex.priority = it.priority; changed = true;
    }
    if (changed) { updated++; touch(ex); }
  }
  store.saveDeleted();
  store.saveWords();
  return { added, updated, skipped };
}

function toRows() {
  return store.words.map(w => FIELDS.map(f => w[f] ?? ''));
}
function csvCell(v, delim) {
  const s = String(v ?? '');
  return /["\n\r]/.test(s) || s.includes(delim) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSV(delim = ',') {
  return [FIELDS, ...toRows()].map(r => r.map(c => csvCell(c, delim)).join(delim)).join('\n');
}
function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}

/** Преобразовать ссылку на Google Таблицу в ссылку для скачивания CSV */
function sheetCsvUrl(url) {
  const u = str(url);
  if (!u) return '';
  if (/\/pub\b/.test(u) || /output=csv/.test(u)) return u.includes('output=') ? u : u + (u.includes('?') ? '&' : '?') + 'output=csv';
  const m = u.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) {
    const gid = (u.match(/[#&?]gid=(\d+)/) || [])[1] || '0';
    return `https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv&gid=${gid}`;
  }
  return u;
}
async function syncFromSheet(url) {
  const csvUrl = sheetCsvUrl(url);
  if (!csvUrl) throw new Error('Укажите ссылку на таблицу');
  const res = await fetch(csvUrl, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Таблица недоступна (код ${res.status}). Проверьте доступ по ссылке.`);
  const text = await res.text();
  if (/^\s*<(!doctype|html)/i.test(text)) throw new Error('Google вернул страницу входа — откройте доступ «Все, у кого есть ссылка» или опубликуйте таблицу.');
  return importWords(parseImport(text), 'merge');
}

/* ---------- 4б. Синхронизация между устройствами (Google Apps Script) ----------
   Схема: приложение скачивает данные из таблицы (pull), объединяет со своими
   (по каждому слову побеждает более свежая версия) и отправляет результат обратно (push). */

function mapHeaders(o) {
  const out = {};
  for (const [k, v] of Object.entries(o || {})) { const f = ALIAS_MAP[normHeader(k)] || k; out[f] = v; }
  return out;
}

async function apiCall(payload) {
  const url = str(store.settings.syncUrl);
  if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) throw new Error('Ссылка должна начинаться с https://script.google.com/');
  let res;
  try {
    // text/plain — «простой» запрос, Google его принимает без дополнительных проверок CORS
    res = await fetch(url, { method: 'POST', body: JSON.stringify({ ...payload, key: store.settings.syncKey }) });
  } catch { throw new Error('Нет связи со скриптом. Проверьте интернет и доступ «Все» при развёртывании.'); }
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('Скрипт ответил не так, как ожидалось. Проверьте, что он развёрнут как веб-приложение с доступом «Все».'); }
  if (!data.ok) throw new Error(data.error || 'Ошибка скрипта');
  return data;
}

/** Объединение данных из таблицы с локальными. Возвращает, изменилось ли что-то здесь и нужно ли отправлять в таблицу */
function mergeRemote(remote) {
  let changedLocal = false, needPush = false;
  const rDel = remote.deleted || {};
  const del = { ...store.deleted };
  for (const [k, ts] of Object.entries(rDel)) if ((+ts || 0) > (del[k] || 0)) { del[k] = +ts; changedLocal = true; }
  for (const [k, ts] of Object.entries(store.deleted)) if ((+rDel[k] || 0) < ts) needPush = true;

  const remoteList = (remote.words || []).map(mapHeaders).map(normWord).filter(w => w.word || w.base_id).map(hydrate);
  const rmap = new Map(remoteList.map(w => [keyOf(w), w]));
  const lmap = new Map(store.words.map(w => [keyOf(w), w]));
  const result = [];
  for (const [k, l] of lmap) {
    const r = rmap.get(k);
    if (!r) { needPush = true; result.push(l); continue; }
    if (r.updated > l.updated) { Object.assign(l, { ...r, id: l.id, added: l.added }); changedLocal = true; }
    else if (l.updated > r.updated) needPush = true;
    result.push(l);
  }
  for (const [k, r] of rmap) if (!lmap.has(k)) { result.push(r); changedLocal = true; }

  // удалённые слова убираем, если после удаления их никто не менял
  const final = result.filter(w => {
    const t = del[keyOf(w)];
    if (t && t >= w.updated) {
      if (rmap.has(keyOf(w))) needPush = true;
      if (lmap.has(keyOf(w))) changedLocal = true;
      return false;
    }
    return true;
  });

  // статистика: по каждому дню и устройству — более свежая запись
  const rStats = remote.stats || {};
  for (const [day, devs] of Object.entries(rStats)) {
    for (const [dev, v] of Object.entries(devs || {})) {
      const l = store.stats[day]?.[dev];
      if (!l || (+v.u || 0) > (+l.u || 0)) { (store.stats[day] ||= {})[dev] = v; changedLocal = true; }
    }
  }
  for (const [day, devs] of Object.entries(store.stats)) {
    for (const [dev, v] of Object.entries(devs)) if ((+rStats[day]?.[dev]?.u || 0) < (+v.u || 0)) needPush = true;
  }

  store.deleted = del; store.saveDeleted();
  store.words = final.map(hydrate); store.saveWords(true);
  store.saveStats(true);
  return { changedLocal, needPush };
}

const sync = {
  state: 'off',          // off | idle | syncing | ok | error
  error: '',
  timer: null,
  running: null,
  again: false,
  /** Google Таблица (Apps Script) подключена */
  gasOn() { return !!str(store.settings.syncUrl); },
  /** Облако Supabase: выполнен вход */
  cloudOn() { return typeof cloud !== 'undefined' && cloud.active(); },
  enabled() { return this.cloudOn() || this.gasOn(); },
  schedule(delay = 4000) {
    if (!this.enabled() || !store.settings.autoSync) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.run(), delay);
  },
  run({ silent = true } = {}) {
    if (!this.enabled()) return Promise.resolve();
    if (this.running) { this.again = true; return this.running; }
    clearTimeout(this.timer);
    this.setState('syncing');
    this.running = (async () => {
      try {
        const useCloud = this.cloudOn();
        const remote = useCloud ? await cloud.pull() : await apiCall({ action: 'pull' });
        let { changedLocal, needPush } = mergeRemote(remote);
        if (useCloud && typeof pstore !== 'undefined') {
          const pm = pstore.merge(remote.practice);
          changedLocal = changedLocal || pm.changedLocal; needPush = needPush || pm.needPush;
        }
        if (needPush || !remote.initialized) {
          const payload = {
            columns: SYNC_FIELDS,
            words: store.words.map(w => Object.fromEntries(SYNC_FIELDS.map(f => [f, w[f] ?? '']))),
            deleted: store.deleted,
            stats: store.stats
          };
          if (useCloud) await cloud.push({ ...payload, practice: typeof pstore !== 'undefined' ? pstore.get() : {} });
          else await apiCall({ action: 'push', ...payload });
        }
        store.settings.lastSync = Date.now(); store.saveSettings();
        this.error = '';
        this.setState('ok');
        if (changedLocal && route.name !== 'train' && !$('#modalRoot').innerHTML) render();
        if (!silent) toast(changedLocal ? 'Синхронизировано: получены изменения с другого устройства' : 'Синхронизировано');
      } catch (e) {
        this.error = e.message;
        this.setState('error');
        if (!silent) toast(e.message, 'error');
      } finally {
        this.running = null;
        if (this.again) { this.again = false; this.schedule(1500); }
      }
    })();
    return this.running;
  },
  setState(s) { this.state = s; updateSyncBadge(); }
};

function syncAgo() {
  const t = store.settings.lastSync;
  if (!t) return 'ещё не выполнялась';
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const d = new Date(t);
  return `${fmtDate(dateStr(d))} в ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function updateSyncBadge() {
  const b = $('#syncBtn');
  if (!b) return;
  b.classList.toggle('hidden', !sync.enabled());
  const map = {
    syncing: ['refresh-cw', 'Синхронизация…', 'animate-spin text-brand-500'],
    ok: ['cloud', `Синхронизировано ${syncAgo()}`, 'text-brand-500'],
    error: ['cloud-off', `Ошибка синхронизации: ${sync.error}`, 'text-rose-500'],
    idle: ['cloud', 'Синхронизировать', ''], off: ['cloud', 'Синхронизировать', '']
  };
  const [icon, title, cls] = map[sync.state] || map.idle;
  b.title = title; b.setAttribute('aria-label', title);
  b.innerHTML = `<i data-lucide="${icon}" class="${cls}"></i>`;
  const st = $('#syncStatus');
  if (st) st.innerHTML = sync.state === 'error'
    ? `<span class="text-rose-500">Ошибка: ${esc(sync.error)}</span>`
    : sync.state === 'syncing' ? 'Синхронизация…' : `Последняя синхронизация: ${syncAgo()}`;
  icons();
}

/* ---------- 5. Озвучка (Web Speech API) ---------- */

const tts = {
  voices: [],
  supported: 'speechSynthesis' in window,
  init() {
    if (!this.supported) return;
    const upd = () => { this.voices = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang)); };
    upd();
    speechSynthesis.addEventListener?.('voiceschanged', () => { upd(); if (route.name === 'settings') render(); });
  },
  voice() {
    return this.voices.find(v => v.name === store.settings.voice)
      || this.voices.find(v => /en-US/i.test(v.lang) && /google|samantha|natural|aria|jenny/i.test(v.name))
      || this.voices.find(v => /en-US/i.test(v.lang)) || this.voices[0] || null;
  },
  vol() { const v = store.settings.volume; return v == null ? 0.6 : Math.max(0, Math.min(1, +v)); },
  speak(text, rate) {
    if (!this.supported) { toast('Озвучка не поддерживается этим браузером', 'error'); return; }
    if (!text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = this.voice();
    if (v) u.voice = v;
    u.lang = v?.lang || 'en-US';
    u.rate = rate || store.settings.rate || 0.9;
    u.volume = this.vol();
    speechSynthesis.speak(u);
  }
};

/* ---------- 6. Интерфейс: навигация, модальные окна, уведомления ---------- */

const NAV = [
  { name: 'course', label: 'Курс', icon: 'graduation-cap' },
  { name: 'dict', label: 'Словарь', icon: 'book-open' },
  { name: 'train', label: 'Учить', icon: 'zap' },
  { name: 'practice', label: 'Практика', icon: 'book-open-text' },
  { name: 'stats', label: 'Прогресс', icon: 'chart-column' },
  { name: 'settings', label: 'Ещё', icon: 'menu' }
];
const HIDDEN_ROUTES = ['base', 'cloud'];   // экраны без пункта в меню (открываются из «Ещё»)
const route = { name: 'dict' };

function renderNav() {
  $('#topNav').innerHTML = NAV.map(n => `
    <a href="#/${n.name}" class="flex items-center gap-2 px-3 h-9 rounded-xl text-sm font-semibold transition
      ${route.name === n.name || (n.name === 'settings' && HIDDEN_ROUTES.includes(route.name)) ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}">
      <i data-lucide="${n.icon}"></i>${n.label}</a>`).join('');
  $('#bottomNav').innerHTML = NAV.map(n => `
    <a href="#/${n.name}" class="flex flex-col items-center justify-center gap-0.5 h-16 text-[10.5px] font-semibold min-w-0
      ${route.name === n.name || (n.name === 'settings' && HIDDEN_ROUTES.includes(route.name)) ? 'text-brand-500' : 'text-slate-400'}">
      <i data-lucide="${n.icon}" style="width:1.35rem;height:1.35rem"></i>${n.label}</a>`).join('');
}

function render() {
  if (typeof closeWordTip === 'function') closeWordTip();
  renderNav();
  const view = $('#view');
  const fn = { course: renderCourse, dict: renderDict, train: renderTrain, practice: renderPractice, stats: renderStats, base: renderBase, settings: renderSettings }[route.name] || renderDict;
  fn(view);
  icons();
}

function onRoute() {
  const name = (location.hash.match(/^#\/(\w+)/) || [])[1] || 'course';
  route.name = NAV.some(n => n.name === name) || HIDDEN_ROUTES.includes(name) ? name : 'course';
  render();
  window.scrollTo(0, 0);
}

function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  const color = kind === 'error' ? 'bg-red-500' : kind === 'info' ? 'bg-slate-800 dark:bg-slate-700' : 'bg-brand-600';
  el.className = `pop pointer-events-auto ${color} text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg max-w-[90vw]`;
  el.textContent = msg;
  $('#toastRoot').replaceChildren(el);   // показываем только последнее уведомление
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2200);
}

let modalOnClose = null;
function openModal(html, { wide = false, onClose = null } = {}) {
  modalOnClose = onClose;
  $('#modalRoot').innerHTML = `
    <div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm fade" data-close></div>
    <div class="fixed z-50 inset-x-0 bottom-0 md:inset-0 md:grid md:place-items-center pointer-events-none">
      <div class="pop pointer-events-auto w-full ${wide ? 'md:max-w-2xl' : 'md:max-w-lg'} max-h-[92vh] overflow-y-auto scroll-thin
        bg-white dark:bg-ink-900 rounded-t-3xl md:rounded-3xl shadow-2xl safe-bottom" role="dialog" aria-modal="true">
        ${html}
      </div>
    </div>`;
  document.body.style.overflow = 'hidden';
  icons();
}
function closeModal() {
  $('#modalRoot').innerHTML = '';
  document.body.style.overflow = '';
  const cb = modalOnClose; modalOnClose = null;
  if (cb) cb();
}
function confirmDialog(text, okLabel = 'Да', danger = false) {
  return new Promise(resolve => {
    openModal(`
      <div class="p-6">
        <p class="text-base font-semibold leading-relaxed">${esc(text)}</p>
        <div class="mt-6 flex gap-2 justify-end">
          <button class="btn btn-ghost" data-r="0">Отмена</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-r="1">${esc(okLabel)}</button>
        </div>
      </div>`, { onClose: () => resolve(false) });
    $$('#modalRoot [data-r]').forEach(b => b.onclick = () => { modalOnClose = null; closeModal(); resolve(b.dataset.r === '1'); });
  });
}

function applyTheme() {
  let t = store.settings.theme;
  if (t === 'system') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', t === 'dark');
  $('meta[name="theme-color"]').setAttribute('content', t === 'dark' ? '#0b1020' : '#f8fafc');
  $('#themeBtn').innerHTML = `<i data-lucide="${t === 'dark' ? 'sun' : 'moon-star'}"></i>`;
  icons();
}

function levelBadge(l) {
  return `<span class="inline-flex text-[11px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-500/10 text-slate-500 dark:text-slate-300">${esc(l)}</span>`;
}
function statusBadge(p) {
  const s = STATUS[p];
  return `<span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.cls}">${s.short}</span>`;
}
function emptyState(title, text, action = '') {
  return `<div class="card p-8 md:p-12 text-center">
    <div class="w-14 h-14 mx-auto rounded-2xl bg-brand-500/15 text-brand-500 grid place-items-center"><i data-lucide="inbox" style="width:1.6rem;height:1.6rem"></i></div>
    <h3 class="mt-4 text-lg font-extrabold">${title}</h3>
    <p class="mt-1 text-slate-500 dark:text-slate-400 max-w-md mx-auto">${text}</p>
    ${action ? `<div class="mt-6 flex flex-wrap gap-2 justify-center">${action}</div>` : ''}
  </div>`;
}

/* ---------- 7. Экран «Словарь» ---------- */

const dictState = { q: '', filter: 'all', sort: 'alpha', limit: 150, level: 'all', topic: 'all' };

/** План на сегодня: сколько повторить и сколько новых (с учётом лимита и курса) */
function todayPlan() {
  const active = store.words.filter(w => w.priority === 'active');
  const due = active.filter(w => !isNew(w) && dueOf(w) <= todayStr()).length;
  const freshInDict = active.filter(isNew).length;
  const left = newLeftToday();
  const fromCourse = store.settings.autoCourse ? courseQueue().length : 0;
  const fresh = Math.min(left, freshInDict + fromCourse);
  return { due, fresh, left, doneNew: dayTotals(todayStr()).n, limit: store.settings.newPerDay };
}

function counts() {
  const c = { all: store.words.length, active: 0, later: 0, learned: 0, due: 0, fresh: 0 };
  for (const w of store.words) {
    c[w.priority]++;
    if (isDue(w)) { isNew(w) ? c.fresh++ : c.due++; }
  }
  return c;
}

function filteredWords() {
  const q = normAnswer(dictState.q);
  let list = store.words.filter(w => {
    if (dictState.level === 'own' && w.base_id) return false;
    if (!['all', 'own'].includes(dictState.level) && w.level !== dictState.level) return false;
    if (dictState.topic !== 'all' && w.topic !== dictState.topic) return false;
    if (dictState.filter === 'due' && !(isDue(w) && !isNew(w))) return false;
    if (['active', 'later', 'learned'].includes(dictState.filter) && w.priority !== dictState.filter) return false;
    if (!q) return true;
    return normAnswer(w.word).includes(q) || normAnswer(w.translation).includes(q);
  });
  const cmp = {
    alpha: (a, b) => a.word.localeCompare(b.word, 'en', { sensitivity: 'base' }),
    alphaDesc: (a, b) => b.word.localeCompare(a.word, 'en', { sensitivity: 'base' }),
    newest: (a, b) => b.added - a.added,
    due: (a, b) => (dueOf(a) || '0').localeCompare(dueOf(b) || '0'),
    progress: (a, b) => b.repetitions - a.repetitions || b.interval - a.interval,
    hard: (a, b) => b.lapses - a.lapses || a.ease - b.ease
  }[dictState.sort];
  return list.sort(cmp);
}

function renderDict(view) {
  const c = counts();
  if (!store.words.length) {
    view.innerHTML = `
      <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight mb-5">Словарь</h1>
      ${emptyState('Словарь пока пуст',
        'Слова появляются здесь, когда вы начинаете их учить. Начните курс — приложение само будет давать новые слова каждый день. Или добавьте свои слова из таблицы.',
        `<a href="#/train" class="btn btn-primary"><i data-lucide="zap"></i>Начать учить</a>
         <a href="#/course" class="btn btn-ghost"><i data-lucide="graduation-cap"></i>Открыть курс</a>
         <a href="#/base" class="btn btn-ghost"><i data-lucide="upload"></i>Свои слова</a>`)}`;
    return;
  }
  const plan = todayPlan();
  const toTrain = plan.due + plan.fresh;
  view.innerHTML = `
    <div class="flex items-end justify-between gap-3 mb-5">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">Словарь</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">${c.all} ${plural(c.all, 'слово', 'слова', 'слов')} в базе</p>
      </div>
      <button class="btn btn-ghost" id="addWordBtn"><i data-lucide="plus"></i><span class="hidden sm:inline">Добавить</span></button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      ${statCard('К повторению', c.due, 'clock', 'text-rose-500')}
      ${statCard('Новые', c.fresh, 'sparkles', 'text-violet-500')}
      ${statCard('В работе', c.active, 'play', 'text-brand-500')}
      ${statCard('Выучено', c.learned, 'circle-check-big', 'text-sky-500')}
    </div>

    <a href="#/train" class="mt-4 card p-4 md:p-5 flex items-center gap-4 hover:border-brand-400 transition group">
      <div class="w-12 h-12 rounded-2xl bg-brand-500 text-white grid place-items-center pulse-ring"><i data-lucide="zap" style="width:1.4rem;height:1.4rem"></i></div>
      <div class="flex-1 min-w-0">
        <div class="font-extrabold">${toTrain ? 'Начать тренировку' : 'Дополнительная практика'}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">${toTrain
          ? `Сегодня ждут: ${plan.due} на повторение, ${plan.fresh} ${plural(plan.fresh, 'новое', 'новых', 'новых')}`
          : 'На сегодня всё повторено — можно закрепить слова заранее'}</div>
      </div>
      <i data-lucide="chevron-right" class="text-slate-400 group-hover:translate-x-1 transition"></i>
    </a>

    <div class="mt-6 flex flex-col md:flex-row gap-3">
      <div class="relative flex-1">
        <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
        <input id="search" class="input !pl-10" placeholder="Поиск по слову или переводу" value="${esc(dictState.q)}" autocomplete="off" />
      </div>
      <div class="grid grid-cols-2 md:flex gap-3">
      <select id="lvlSel" class="input md:!w-40 shrink-0">
        ${[['all', 'Все уровни'], ...LEVELS.filter(l => store.words.some(w => w.level === l)).map(l => [l, l]), ['own', 'Мои слова']]
          .map(([v, l]) => `<option value="${v}" ${dictState.level === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <select id="topicSel" class="input md:!w-48 shrink-0">
        <option value="all">Все темы</option>
        ${Object.keys(TOPICS).filter(t => store.words.some(w => w.topic === t))
          .map(t => `<option value="${t}" ${dictState.topic === t ? 'selected' : ''}>${esc(topicName(t))}</option>`).join('')}
      </select>
      <select id="sort" class="input md:!w-56 shrink-0 col-span-2">
        ${[['alpha', 'По алфавиту A→Z'], ['alphaDesc', 'По алфавиту Z→A'], ['newest', 'Сначала новые'], ['due', 'По дате повтора'], ['progress', 'По прогрессу'], ['hard', 'Сначала трудные']]
          .map(([v, l]) => `<option value="${v}" ${dictState.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      </div>
    </div>
    <div class="mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1" id="filters">
      ${[['all', 'Все', c.all], ['due', 'К повторению', c.due], ['active', 'В работе', c.active], ['later', 'В конце очереди', c.later], ['learned', 'Выучено', c.learned]]
        .map(([v, l, n]) => `<button class="chip ${dictState.filter === v ? 'is-active' : ''}" data-f="${v}">${l}<span class="opacity-70">${n}</span></button>`).join('')}
    </div>
    <div id="wordList" class="mt-4"></div>`;

  renderWordList();

  $('#search').oninput = e => { dictState.q = e.target.value; dictState.limit = 150; renderWordList(); };
  $('#sort').onchange = e => { dictState.sort = e.target.value; renderWordList(); };
  $('#lvlSel').onchange = e => { dictState.level = e.target.value; dictState.limit = 150; renderWordList(); };
  $('#topicSel').onchange = e => { dictState.topic = e.target.value; dictState.limit = 150; renderWordList(); };
  $('#filters').onclick = e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    dictState.filter = b.dataset.f; dictState.limit = 150;
    $$('#filters .chip').forEach(x => x.classList.toggle('is-active', x === b));
    renderWordList();
  };
  $('#addWordBtn').onclick = () => openEditModal(null);
}

function statCard(label, value, icon, color) {
  return `<div class="card p-4">
    <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"><i data-lucide="${icon}" class="${color}" style="width:1rem;height:1rem"></i>${label}</div>
    <div class="mt-1 text-2xl font-extrabold tabular-nums">${value}</div>
  </div>`;
}

function renderWordList() {
  const box = $('#wordList'); if (!box) return;
  const list = filteredWords();
  if (!list.length) {
    box.innerHTML = `<div class="text-center text-slate-500 py-12">Ничего не найдено</div>`;
    return;
  }
  const shown = list.slice(0, dictState.limit);
  box.innerHTML = `
    <div class="card divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
      ${shown.map(wordRow).join('')}
    </div>
    ${list.length > shown.length ? `<div class="text-center mt-4"><button class="btn btn-ghost" id="moreBtn">Показать ещё (${list.length - shown.length})</button></div>` : ''}`;
  box.onclick = onWordListClick;
  const more = $('#moreBtn'); if (more) more.onclick = e => { e.stopPropagation(); dictState.limit += 150; renderWordList(); };
  icons();
}

function wordRow(w) {
  const lvl = Math.min(5, w.repetitions);
  const due = dueOf(w);
  const dueTxt = w.priority !== 'active' ? '' : isNew(w) ? 'новое' : due <= todayStr() ? 'повторить сегодня' : `повтор ${fmtDate(due)}`;
  const actBtn = (p, title) => `<button class="icon-btn !w-9 !h-9 ${w.priority === p ? STATUS[p].cls : ''}" data-act="${p}" data-id="${w.id}" title="${title}" aria-label="${title}"><i data-lucide="${STATUS[p].icon}" style="width:1rem;height:1rem"></i></button>`;
  return `
    <div class="flex items-center gap-3 px-3 md:px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[.02] cursor-pointer" data-open="${w.id}">
      <button class="icon-btn !w-9 !h-9 shrink-0" data-speak="${w.id}" title="Озвучить" aria-label="Озвучить"><i data-lucide="volume-2" style="width:1rem;height:1rem"></i></button>
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2 flex-wrap">
          <span class="font-bold truncate">${esc(w.word)}</span>
          ${w.transcription ? `<span class="text-xs text-slate-400 truncate">${esc(w.transcription)}</span>` : ''}
        </div>
        <div class="text-sm text-slate-500 dark:text-slate-400 truncate">${esc(w.translation)}</div>
        <div class="mt-1.5 flex items-center gap-2">
          <div class="flex gap-0.5">${[1, 2, 3, 4, 5].map(i => `<span class="w-3 h-1 rounded-full ${i <= lvl ? 'bg-brand-500' : 'bg-slate-200 dark:bg-white/10'}"></span>`).join('')}</div>
          ${w.level ? levelBadge(w.level) : ''}
          ${statusBadge(w.priority)}
          ${dueTxt ? `<span class="text-[11px] text-slate-400 hidden sm:inline">${dueTxt}</span>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-0.5 shrink-0">
        ${actBtn('active', 'Оставить в работе')}
        ${actBtn('later', 'Перенести в конец очереди')}
        ${actBtn('learned', 'Отметить как выученное')}
      </div>
    </div>`;
}

function setPriority(id, p) {
  const w = store.byId(id); if (!w || w.priority === p) return;
  w.priority = p;
  touch(w);
  store.saveWords();
  toast(`«${w.word}» — ${STATUS[p].label.toLowerCase()}`, 'info');
}

function onWordListClick(e) {
  const sp = e.target.closest('[data-speak]');
  if (sp) { e.stopPropagation(); tts.speak(store.byId(sp.dataset.speak)?.word); return; }
  const act = e.target.closest('[data-act]');
  if (act) { e.stopPropagation(); setPriority(act.dataset.id, act.dataset.act); renderDict($('#view')); icons(); return; }
  const row = e.target.closest('[data-open]');
  if (row) openWordModal(row.dataset.open);
}

function exampleBlock(en, ua, word) {
  if (!en) return '';
  return `<div class="rounded-2xl bg-slate-50 dark:bg-ink-850 p-4 flex gap-3">
    <button class="icon-btn !w-8 !h-8 shrink-0 -ml-1" data-say="${esc(en)}" title="Озвучить пример"><i data-lucide="volume-2" style="width:.95rem;height:.95rem"></i></button>
    <div class="min-w-0">
      <div class="font-semibold leading-snug">${highlight(en, word)}</div>
      ${ua ? `<div class="text-sm text-slate-500 dark:text-slate-400 mt-1">${esc(ua)}</div>` : ''}
    </div>
  </div>`;
}
function bindSay(root) {
  $$('[data-say]', root).forEach(b => b.onclick = e => { e.stopPropagation(); tts.speak(b.dataset.say, Math.min(store.settings.rate, 0.95)); });
}

function openWordModal(id) {
  const w = store.byId(id); if (!w) return;
  const due = dueOf(w);
  openModal(`
    <div class="p-5 md:p-7">
      <div class="flex items-start gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">${w.level ? levelBadge(w.level) : ''}${statusBadge(w.priority)}
            ${w.pos ? `<span class="text-xs text-slate-400">${esc(POS_NAMES[w.pos] || w.pos)}</span>` : ''}
            ${w.topic ? `<span class="text-xs text-slate-400">· ${esc(topicName(w.topic))}</span>` : ''}</div>
          <h2 class="mt-2 text-3xl font-extrabold tracking-tight break-words">${esc(w.word)}</h2>
          ${w.transcription ? `<div class="text-slate-400 mt-0.5">${esc(w.transcription)}</div>` : ''}
        </div>
        <button class="icon-btn" data-close-btn aria-label="Закрыть"><i data-lucide="x"></i></button>
      </div>
      <div class="mt-3 flex items-center gap-2">
        <button class="btn btn-primary !h-10" data-say="${esc(w.word)}"><i data-lucide="volume-2"></i>Слушать</button>
        <button class="btn btn-ghost !h-10" id="slowBtn"><i data-lucide="snail"></i>Медленно</button>
      </div>
      <div class="mt-5 text-xl font-bold">${esc(w.translation)}</div>

      <div class="mt-5 space-y-3">
        ${exampleBlock(w.example1_en, w.example1_ua, w.word)}
        ${exampleBlock(w.example2_en, w.example2_ua, w.word)}
        ${!w.example1_en && !w.example2_en ? '<div class="text-sm text-slate-400">Примеров пока нет — добавьте их через «Изменить».</div>' : ''}
      </div>

      <div class="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        ${miniStat('Повторов', w.repetitions)}
        ${miniStat('Интервал', `${w.interval} дн.`)}
        ${miniStat('Последний', fmtDate(w.last_reviewed))}
        ${miniStat('Следующий', w.priority === 'learned' ? '—' : isNew(w) ? 'сразу' : fmtDate(due))}
      </div>

      <div class="mt-5">
        <div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Статус в тренировках</div>
        <div class="grid grid-cols-3 gap-2" id="prioSeg">
          ${Object.entries(STATUS).map(([k, s]) => `
            <button data-p="${k}" class="rounded-2xl border-2 p-2.5 text-xs sm:text-sm font-bold flex flex-col items-center gap-1 transition
              ${w.priority === k ? 'border-brand-500 bg-brand-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300'}">
              <i data-lucide="${s.icon}"></i>${s.label}</button>`).join('')}
        </div>
      </div>

      <div class="mt-6 flex gap-2">
        ${w.base_id ? `<p class="flex-1 text-xs text-slate-400 self-center">Слово из общей базы курса.</p>`
          : `<button class="btn btn-ghost flex-1" id="editBtn"><i data-lucide="pencil"></i>Изменить</button>`}
        <button class="btn btn-danger" id="delBtn" aria-label="Удалить"><i data-lucide="trash-2"></i>${w.base_id ? 'Убрать' : ''}</button>
      </div>
    </div>`, { wide: true, onClose: () => { if (route.name === 'dict') { renderDict($('#view')); icons(); } } });

  const root = $('#modalRoot');
  bindSay(root);
  $('[data-close-btn]', root).onclick = closeModal;
  $('[data-close]', root).onclick = closeModal;
  $('#slowBtn').onclick = () => tts.speak(w.word, 0.55);
  $('#prioSeg').onclick = e => {
    const b = e.target.closest('[data-p]'); if (!b) return;
    setPriority(w.id, b.dataset.p);
    openWordModal(w.id);
  };
  if ($('#editBtn')) $('#editBtn').onclick = () => openEditModal(w.id);
  $('#delBtn').onclick = async () => {
    if (await confirmDialog(w.base_id ? `Убрать «${w.word}» из словаря? Курс больше не будет его предлагать (можно вернуть на вкладке «Курс»).` : `Удалить слово «${w.word}» из базы?`, w.base_id ? 'Убрать' : 'Удалить', true)) {
      store.words = store.words.filter(x => x.id !== w.id);
      store.markDeleted(w);
      store.saveWords(); toast('Слово удалено', 'info'); render();
    } else openWordModal(w.id);
  };
}
function miniStat(label, value) {
  return `<div class="rounded-2xl bg-slate-50 dark:bg-ink-850 py-2.5 px-2">
    <div class="text-[11px] text-slate-400 font-semibold">${label}</div>
    <div class="font-bold text-sm mt-0.5">${esc(value)}</div></div>`;
}

function openEditModal(id) {
  const w = id ? store.byId(id) : normWord({});
  const f = (name, label, ph = '') => `
    <label class="block"><span class="text-xs font-bold text-slate-500 dark:text-slate-400">${label}</span>
      <input class="input mt-1" name="${name}" value="${esc(w[name])}" placeholder="${esc(ph)}" /></label>`;
  openModal(`
    <form class="p-5 md:p-7" id="editForm">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-extrabold">${id ? 'Изменить слово' : 'Новое слово'}</h2>
        <button type="button" class="icon-btn" data-close-btn aria-label="Закрыть"><i data-lucide="x"></i></button>
      </div>
      <div class="mt-4 grid sm:grid-cols-2 gap-3">
        ${f('word', 'Слово (англ.) *', 'appointment')}
        ${f('translation', 'Перевод *', 'встреча, приём')}
        ${f('transcription', 'Транскрипция', '[əˈpɔɪntmənt]')}
        <div></div>
        ${f('example1_en', 'Пример 1 (англ.)')}
        ${f('example1_ua', 'Пример 1 (перевод)')}
        ${f('example2_en', 'Пример 2 (англ.)')}
        ${f('example2_ua', 'Пример 2 (перевод)')}
      </div>
      <div class="mt-6 flex gap-2 justify-end">
        <button type="button" class="btn btn-ghost" data-close-btn>Отмена</button>
        <button type="submit" class="btn btn-primary"><i data-lucide="check"></i>Сохранить</button>
      </div>
    </form>`, { wide: true });
  const root = $('#modalRoot');
  $$('[data-close-btn]', root).forEach(b => b.onclick = closeModal);
  $('[data-close]', root).onclick = closeModal;
  $('#editForm [name=word]').focus();
  $('#editForm').onsubmit = e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    for (const k in data) data[k] = data[k].trim();
    if (!data.word || !data.translation) { toast('Заполните слово и перевод', 'error'); return; }
    const dup = store.words.find(x => keyOf(x) === normAnswer(data.word) && x.id !== w.id);
    if (dup) { toast('Такое слово уже есть в базе', 'error'); return; }
    if (id && normAnswer(data.word) !== keyOf(w)) store.markDeleted(w);   // слово переименовано
    Object.assign(w, data);
    touch(w);
    delete store.deleted[keyOf(w)]; store.saveDeleted();
    if (!id) store.words.push(w);
    store.saveWords();
    toast(id ? 'Изменения сохранены' : 'Слово добавлено');
    closeModal(); render();
  };
}

/* ---------- 7б. Экран «Курс»: общая база A1–C1, уровни, блоки, темы ---------- */

const courseState = { level: null, topic: 'all' };

function levelStats(level, topic = 'all') {
  const items = BASE.list.filter(b => b.level === level && (topic === 'all' || b.topic === topic));
  const byId = new Map(store.words.filter(w => w.base_id).map(w => [w.base_id, w]));
  let learned = 0, learning = 0;
  for (const b of items) {
    const w = byId.get(b.base_id);
    if (!w) continue;
    if (w.priority === 'learned' || w.repetitions >= 3) learned++; else learning++;
  }
  return { total: items.length, learned, learning, items, byId };
}

function progressBar(learned, learning, total) {
  const p1 = total ? learned / total * 100 : 0, p2 = total ? learning / total * 100 : 0;
  return `<div class="flex h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-white/10 gap-[2px]">
    ${p1 ? `<span style="width:${p1}%" class="bg-brand-500"></span>` : ''}${p2 ? `<span style="width:${p2}%" class="bg-amber-400"></span>` : ''}</div>`;
}

function renderCourse(view) {
  const s = store.settings;
  const avail = LEVELS.filter(l => BASE.list.some(b => b.level === l));
  if (!courseState.level || !avail.includes(courseState.level)) courseState.level = avail.includes(s.courseLevel) ? s.courseLevel : avail[0];
  const lvl = courseState.level;
  const plan = todayPlan();
  const st = levelStats(lvl, courseState.topic);
  const blocks = {};
  // весь уровень — блоки курса; отдельная тема — свои части по 20 слов
  st.items.forEach((b, i) => (blocks[courseState.topic === 'all' ? b.block : Math.floor(i / 20) + 1] ||= []).push(b));
  const topicsHere = Object.keys(TOPICS).filter(t => BASE.list.some(b => b.level === lvl && b.topic === t));

  view.innerHTML = `
    <div class="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">Курс английского</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">${BASE.list.length} самых нужных слов и фраз · уровни ${avail[0]}–${avail[avail.length - 1]}</p>
      </div>
      <div class="flex gap-1 p-1 rounded-xl bg-slate-500/10" id="langSeg" title="Язык перевода">
        ${[['ru', 'RU'], ['ua', 'UA']].map(([v, l]) => `<button class="px-3 h-8 rounded-lg text-sm font-bold ${s.lang === v ? 'bg-brand-500 text-white' : 'text-slate-500'}" data-lang="${v}">${l}</button>`).join('')}
      </div>
    </div>

    <a href="#/train" class="mt-5 card p-4 md:p-5 flex items-center gap-4 hover:border-brand-400 transition group">
      <div class="w-12 h-12 rounded-2xl bg-brand-500 text-white grid place-items-center pulse-ring"><i data-lucide="zap" style="width:1.4rem;height:1.4rem"></i></div>
      <div class="flex-1 min-w-0">
        <div class="font-extrabold">План на сегодня</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">${plan.due + plan.fresh
          ? `${plan.due} ${plural(plan.due, 'слово', 'слова', 'слов')} повторить · ${plan.fresh} ${plural(plan.fresh, 'новое', 'новых', 'новых')}`
          : `Готово на сегодня: новых ${plan.doneNew} из ${plan.limit}. Можно повторить ещё.`}</div>
      </div>
      <i data-lucide="chevron-right" class="text-slate-400 group-hover:translate-x-1 transition"></i>
    </a>

    <div class="mt-4 card p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
      <div class="text-sm font-bold">Новых слов в день</div>
      <div class="flex gap-2" id="perDaySeg">
        ${[5, 10, 15, 20].map(n => `<button class="chip ${s.newPerDay === n ? 'is-active' : ''}" data-n="${n}">${n}</button>`).join('')}
      </div>
      <label class="flex items-center gap-2 text-sm ml-auto"><input type="checkbox" id="autoCourseChk" class="w-5 h-5 accent-brand-500" ${s.autoCourse ? 'checked' : ''}>
        Брать новые слова из курса автоматически</label>
    </div>

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

    <div class="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1" id="topicChips">
      <button class="chip ${courseState.topic === 'all' ? 'is-active' : ''}" data-t="all">Все темы</button>
      ${topicsHere.map(t => `<button class="chip ${courseState.topic === t ? 'is-active' : ''}" data-t="${t}"><i data-lucide="${TOPICS[t][2]}" style="width:.85rem;height:.85rem"></i>${esc(topicName(t))}</button>`).join('')}
    </div>

    <div class="mt-4 flex items-center justify-between gap-3 flex-wrap">
      <div class="text-sm text-slate-500 dark:text-slate-400">
        <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-brand-500"></span>выучено ${st.learned}</span>
        <span class="inline-flex items-center gap-1 ml-3"><span class="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>изучается ${st.learning}</span>
        <span class="ml-3">всего ${st.total}</span>
      </div>
      <div class="flex gap-2">
        ${s.courseLevel !== lvl ? `<button class="btn btn-ghost !h-9 text-sm" id="startHereBtn"><i data-lucide="flag"></i>Начинать с ${lvl}</button>` : `<span class="text-xs text-brand-500 font-bold self-center">Курс идёт с ${lvl}</span>`}
        <button class="btn btn-ghost !h-9 text-sm" id="knowLevelBtn"><i data-lucide="check-check"></i>Знаю ${courseState.topic === 'all' ? 'весь ' + lvl : 'тему'}</button>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3" id="blockGrid">
      ${Object.entries(blocks).map(([n, items]) => {
        let l = 0, g = 0;
        for (const b of items) { const w = st.byId.get(b.base_id); if (w) { if (w.priority === 'learned' || w.repetitions >= 3) l++; else g++; } }
        const done = l === items.length;
        return `<button class="card p-3 md:p-4 text-left hover:border-brand-400 transition min-w-0" data-block="${n}">
          <div class="flex items-center justify-between gap-2">
            <span class="font-extrabold">${courseState.topic === 'all' ? 'Блок' : 'Часть'} ${n}</span>
            ${done ? '<i data-lucide="circle-check-big" class="text-brand-500"></i>' : `<span class="text-xs text-slate-400 tabular-nums">${l + g}/${items.length}</span>`}
          </div>
          <div class="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">${items.slice(0, 5).map(b => esc(b.word)).join(', ')}…</div>
          <div class="mt-3 flex items-center gap-2"><div class="flex-1">${progressBar(l, g, items.length)}</div>
            <span role="button" tabindex="0" data-train="${n}" title="Тренировать блок" aria-label="Тренировать блок" class="w-8 h-8 -my-1 rounded-xl bg-brand-500/15 text-brand-500 grid place-items-center hover:bg-brand-500 hover:text-white transition"><i data-lucide="play" style="width:.9rem;height:.9rem"></i></span></div>
        </button>`;
      }).join('')}
    </div>
    <p class="text-xs text-slate-400 mt-6">Уровень B2 пополняется, C1 появится в следующих обновлениях базы. Редкие слова уровня C2 в курс не входят.</p>`;

  $('#langSeg').onclick = e => { const b = e.target.closest('[data-lang]'); if (b) setLang(b.dataset.lang); };
  $('#perDaySeg').onclick = e => { const b = e.target.closest('[data-n]'); if (!b) return; s.newPerDay = +b.dataset.n; store.saveSettings(); render(); };
  $('#autoCourseChk').onchange = e => { s.autoCourse = e.target.checked; store.saveSettings(); render(); };
  $('#lvlTabs').onclick = e => { const b = e.target.closest('[data-lvl]'); if (!b) return; courseState.level = b.dataset.lvl; courseState.topic = 'all'; render(); };
  $('#topicChips').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; courseState.topic = b.dataset.t; render(); };
  const sh = $('#startHereBtn'); if (sh) sh.onclick = () => { s.courseLevel = lvl; store.saveSettings(); toast(`Новые слова будут браться с уровня ${lvl}`); render(); };
  $('#knowLevelBtn').onclick = async () => {
    const rest = st.items.filter(b => { const w = st.byId.get(b.base_id); return !w || (w.priority !== 'learned' && w.repetitions < 3); });
    if (!rest.length) { toast('Здесь всё уже выучено'); return; }
    if (!(await confirmDialog(`Отметить ${rest.length} ${plural(rest.length, 'слово', 'слова', 'слов')} как уже известные? Они не попадут в ежедневные тренировки (можно вернуть в словаре).`, 'Отметить'))) return;
    rest.forEach(b => addFromBase(b, 'learned'));
    store.saveWords(); toast('Готово'); render();
  };
  $('#blockGrid').onclick = e => {
    const t = e.target.closest('[data-train]');
    if (t) { const n = t.dataset.train; trainBlock(blocks[n].map(b => b.base_id), `${lvl} · ${courseState.topic === 'all' ? 'Блок' : topicName(courseState.topic) + ', часть'} ${n}`); return; }
    const b = e.target.closest('[data-block]'); if (b) openBlockModal(blocks[b.dataset.block], b.dataset.block);
  };
}

function setLang(lang) {
  if (store.settings.lang === lang) return;
  store.settings.lang = lang; store.saveSettings();
  rehydrateAll(); store.saveWords(true);
  toast(lang === 'ua' ? 'Переклад: українська' : 'Перевод: русский', 'info');
  render();
}

function openBlockModal(items, n) {
  const ua = store.settings.lang === 'ua';
  const byId = new Map(store.words.filter(w => w.base_id).map(w => [w.base_id, w]));
  const state = b => { const w = byId.get(b.base_id); return !w ? 'none' : (w.priority === 'learned' || w.repetitions >= 3) ? 'learned' : w.priority; };
  const label = { none: '', active: 'учу', later: 'позже', learned: 'знаю' };
  openModal(`
    <div class="p-5 md:p-7">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-extrabold">${courseState.level} · ${courseState.topic === 'all' ? 'Блок' : esc(topicName(courseState.topic)) + ', часть'} ${n}</h2>
        <button class="icon-btn" data-close-btn aria-label="Закрыть"><i data-lucide="x"></i></button>
      </div>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">«Тренировать блок» — упражнения только по словам этого блока. Нажмите на слово, чтобы отметить его как известное. «Учить блок» добавит слова в ежедневные тренировки.</p>
      <div class="mt-4 divide-y divide-slate-100 dark:divide-white/5" id="blockList">
        ${items.map(b => `<div class="flex items-center gap-3 py-2.5 cursor-pointer" data-bid="${esc(b.base_id)}">
          <button class="icon-btn !w-8 !h-8 shrink-0" data-say="${esc(b.word)}" aria-label="Озвучить"><i data-lucide="volume-2" style="width:.95rem;height:.95rem"></i></button>
          <div class="flex-1 min-w-0"><div class="font-bold truncate">${esc(b.word)} <span class="text-xs font-normal text-slate-400">${esc(b.transcription)}</span></div>
            <div class="text-sm text-slate-500 dark:text-slate-400 truncate">${esc(ua ? b.ua : b.ru)}</div></div>
          <span class="text-[11px] font-bold ${state(b) === 'learned' ? 'text-sky-500' : 'text-brand-500'}">${label[state(b)]}</span>
          <i data-lucide="${state(b) === 'learned' ? 'circle-check-big' : 'circle'}" class="${state(b) === 'learned' ? 'text-sky-500' : 'text-slate-300 dark:text-slate-600'}"></i>
        </div>`).join('')}
      </div>
      <button class="btn btn-primary btn-lg w-full mt-5" id="trainBlockBtn"><i data-lucide="zap"></i>Тренировать блок</button>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <button class="btn btn-ghost" id="knowAllBtn"><i data-lucide="check-check"></i>Знаю все</button>
        <button class="btn btn-ghost" id="learnBlockBtn"><i data-lucide="list-plus"></i>Учить блок</button>
      </div>
    </div>`, { wide: true, onClose: () => { if (route.name === 'course') render(); } });
  const root = $('#modalRoot');
  bindSay(root);
  $('[data-close-btn]', root).onclick = closeModal;
  $('[data-close]', root).onclick = closeModal;
  $('#blockList').onclick = e => {
    if (e.target.closest('[data-say]')) return;
    const row = e.target.closest('[data-bid]'); if (!row) return;
    const b = BASE.map.get(row.dataset.bid);
    const w = store.words.find(x => x.base_id === b.base_id);
    if (w && (w.priority === 'learned' || w.repetitions >= 3)) { w.priority = 'active'; w.repetitions = Math.min(w.repetitions, 2); touch(w); }
    else addFromBase(b, 'learned');
    store.saveWords(); openBlockModal(items, n);
  };
  const title = `${courseState.level} · ${courseState.topic === 'all' ? 'Блок' : topicName(courseState.topic) + ', часть'} ${n}`;
  $('#trainBlockBtn').onclick = () => { closeModal(); trainBlock(items.map(b => b.base_id), title); };
  $('#knowAllBtn').onclick = () => { items.forEach(b => addFromBase(b, 'learned')); store.saveWords(); closeModal(); toast('Блок отмечен как известный'); };
  $('#learnBlockBtn').onclick = () => {
    const added = items.filter(b => !store.words.some(w => w.base_id === b.base_id)).map(b => addFromBase(b));
    store.saveWords(); closeModal();
    toast(added.length ? `Добавлено в тренировки: ${added.length}` : 'Все слова блока уже в работе');
  };
}

/** Тренировка только по словам одного блока курса (выученные пропускаются, если остались невыученные) */
function trainBlock(bids, label, { all = false } = {}) {
  const words = bids.map(id => BASE.map.get(id)).filter(Boolean).map(b => {
    const w = store.words.find(x => x.base_id === b.base_id);
    if (w) { if (w.priority === 'later') { w.priority = 'active'; touch(w); } return w; }
    return addFromBase(b);
  });
  store.saveWords();
  let pool = all ? words : words.filter(w => w.priority !== 'learned' && w.repetitions < 3);
  if (!pool.length) { pool = words; toast('Все слова блока уже выучены — повторяем весь блок', 'info'); }
  startSession(pool, { label, block: bids });
}

/* ---------- Приветствие при первом запуске ---------- */

function openOnboarding() {
  const s = store.settings;
  const st = { lang: s.lang, level: s.courseLevel, perDay: s.newPerDay };
  const draw = () => {
    openModal(`
      <div class="p-6 md:p-8">
        <div class="w-12 h-12 rounded-2xl bg-brand-500 text-white grid place-items-center"><i data-lucide="languages"></i></div>
        <h2 class="mt-4 text-2xl font-extrabold">Добро пожаловать в WordFlow</h2>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Ежедневные короткие тренировки с интервальным повторением. Три вопроса — и можно начинать.</p>
        <div class="mt-5 text-sm font-bold">Язык перевода</div>
        <div class="mt-2 grid grid-cols-2 gap-2" data-k="lang">
          ${[['ru', 'Русский'], ['ua', 'Українська']].map(([v, l]) => `<button class="chip !h-11 justify-center ${st.lang === v ? 'is-active' : ''}" data-v="${v}">${l}</button>`).join('')}
        </div>
        <div class="mt-5 text-sm font-bold">С какого уровня начать</div>
        <div class="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2" data-k="level">
          ${[['A1', 'С нуля'], ['A2', 'Знаю основы'], ['B1', 'Средний'], ['B2', 'Выше среднего']].map(([v, l]) => `<button class="chip !h-auto py-2 flex-col ${st.level === v ? 'is-active' : ''}" data-v="${v}"><b>${v}</b><span class="text-[11px] opacity-80">${l}</span></button>`).join('')}
        </div>
        <div class="mt-5 text-sm font-bold">Новых слов в день</div>
        <div class="mt-2 grid grid-cols-4 gap-2" data-k="perDay">
          ${[5, 10, 15, 20].map(v => `<button class="chip !h-11 justify-center ${st.perDay === v ? 'is-active' : ''}" data-v="${v}">${v}</button>`).join('')}
        </div>
        <p class="text-xs text-slate-400 mt-2">10 слов в день ≈ 10–15 минут. Всё можно поменять позже.</p>
        <button class="btn btn-primary btn-lg w-full mt-6" id="obGo"><i data-lucide="play"></i>Начать</button>
        <button class="btn btn-ghost w-full mt-2" id="obOwn">У меня свои слова — импортировать</button>
      </div>`, { onClose: finish });
    $$('#modalRoot [data-k]').forEach(g => g.onclick = e => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      const k = g.dataset.k; st[k] = k === 'perDay' ? +b.dataset.v : b.dataset.v; draw();
    });
    $('#obGo').onclick = () => { finish(); closeModal(); location.hash = '#/train'; };
    $('#obOwn').onclick = () => { finish(); closeModal(); location.hash = '#/base'; };
  };
  const finish = () => {
    if (s.onboarded) return;
    Object.assign(s, { lang: st.lang, courseLevel: st.level, newPerDay: st.perDay, onboarded: true });
    store.saveSettings(); rehydrateAll(); render();
  };
  draw();
}

/* ---------- 8. Экран «Тренировка» ---------- */

let session = load(LS_SESSION, null);   // незавершённая сессия переживает перезагрузку
let card = null;                        // состояние текущей карточки (не сохраняется)

function saveSession() { session ? save(LS_SESSION, session) : localStorage.removeItem(LS_SESSION); }

function buildQueue(words, mode) {
  if (mode === 'cards') return shuffle(words).map(w => ({ id: w.id, type: 4 }));
  // Новое слово сначала показывается целиком (знакомство), и только потом идёт упражнение
  const intro = w => isNew(w) ? [{ id: w.id, type: 5 }] : [];
  if (mode === 'full') {
    // Все 4 упражнения: сначала знакомство с новыми словами, затем выбор перевода всем словам, затем сборка и т.д.
    return [...shuffle(words).flatMap(intro), ...[0, 1, 2, 3].flatMap(t => shuffle(words).map(w => ({ id: w.id, type: t })))];
  }
  if (mode === 'random') return shuffle(words).flatMap(w => [...intro(w), { id: w.id, type: Math.floor(Math.random() * 4) }]);
  return shuffle(words).flatMap(w => [...intro(w), { id: w.id, type: w.ex }]);
}

// 0) Знакомство с новым словом: слово, перевод, примеры, озвучка — без оценки
function renderIntro() {
  const { w } = card;
  $('#exercise').innerHTML = `
    <div class="card p-6 md:p-8 pop">
      <div class="text-center">
        <div class="inline-flex items-center gap-1.5 text-xs font-bold text-violet-500 bg-violet-500/10 px-2.5 py-1 rounded-full"><i data-lucide="sparkles" style="width:.85rem;height:.85rem"></i>Новое слово${w.level ? ' · ' + esc(w.level) : ''}</div>
        <div class="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight break-words">${esc(w.word)}</div>
        ${w.transcription ? `<div class="text-slate-400 mt-1">${esc(w.transcription)}</div>` : ''}
        <div class="mt-3 flex justify-center gap-2">
          <button class="btn btn-ghost !h-10" data-say="${esc(w.word)}"><i data-lucide="volume-2"></i>Слушать</button>
          <button class="btn btn-ghost !h-10" id="slowIntro"><i data-lucide="snail"></i>Медленно</button>
        </div>
        <div class="mt-4 text-2xl font-bold text-brand-600 dark:text-brand-300">${esc(w.translation)}</div>
        ${w.pos ? `<div class="text-xs text-slate-400 mt-1">${esc(POS_NAMES[w.pos] || w.pos)}${w.topic ? ' · ' + esc(topicName(w.topic)) : ''}</div>` : ''}
      </div>
      ${w.example1_en || w.example2_en ? `<div class="mt-5 space-y-2">${exampleBlock(w.example1_en, w.example1_ua, w.word)}${exampleBlock(w.example2_en, w.example2_ua, w.word)}</div>` : ''}
    </div>
    <div class="mt-4 grid grid-cols-2 gap-2">
      <button class="btn btn-ghost btn-lg" id="knowIntro"><i data-lucide="check-check"></i>Уже знаю</button>
      <button class="btn btn-primary btn-lg" id="nextIntro">Запомнил <i data-lucide="arrow-right"></i></button>
    </div>`;
  bindSay($('#exercise'));
  $('#slowIntro').onclick = () => tts.speak(w.word, 0.55);
  $('#nextIntro').onclick = nextCard;
  // «Уже знаю»: слово сразу уходит в выученные, его упражнения в этой сессии пропускаются
  $('#knowIntro').onclick = () => {
    w.priority = 'learned'; w.last_reviewed = todayStr(); w.interval = 30; w.repetitions = Math.max(3, w.repetitions); touch(w);
    store.saveWords();
    session.queue = session.queue.filter((q, i) => i <= session.pos || q.id !== w.id);
    toast(`«${w.word}» — в выученных`, 'info');
    nextCard();
  };
  if (autoSpeak() && !card.spoken) { card.spoken = true; setTimeout(() => tts.speak(w.word), 250); }
}

function startSession(words, { label = '', block = null } = {}) {
  if (!words.length) { toast('Нет слов для тренировки', 'error'); return; }
  const today = todayStr();
  session = {
    queue: buildQueue(words, store.settings.mode),
    pos: 0,
    words: Object.fromEntries(words.map(w => [w.id, { due: isNew(w) || dueOf(w) <= today, isNew: isNew(w), ok: true, errTypes: [] }])),
    started: Date.now(),
    answers: 0, correct: 0,
    mode: store.settings.mode,
    label, block,
    finished: false
  };
  card = null;
  saveSession();
  location.hash = '#/train';
  render();
}

function renderTrain(view) {
  if (session && !session.finished && session.pos >= session.queue.length) finishSession();
  if (session?.finished) return renderReport(view);
  if (session && session.pos < session.queue.length) return renderCard(view);
  renderTrainStart(view);
}

function renderTrainStart(view) {
  const c = counts();
  const s = store.settings;
  const plan = todayPlan();
  const canCourse = s.autoCourse && courseQueue().length > 0;
  if (!store.words.length && !canCourse) {
    view.innerHTML = `<h1 class="text-2xl md:text-3xl font-extrabold tracking-tight mb-5">Тренировка</h1>
      ${emptyState('Нет слов для тренировки', 'Включите автоматическую подачу слов на вкладке «Курс» или добавьте свои слова.', `<a href="#/course" class="btn btn-primary"><i data-lucide="graduation-cap"></i>Курс</a><a href="#/base" class="btn btn-ghost"><i data-lucide="upload"></i>Импорт</a>`)}`;
    return;
  }
  const available = store.words.filter(w => w.priority !== 'learned').length + (canCourse ? 1 : 0);
  view.innerHTML = `
    <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">Тренировка</h1>
    <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Слова подбираются по интервальному повторению: сначала те, что пора повторить, затем новые.</p>

    <div class="mt-5 grid grid-cols-3 gap-3">
      ${statCard('Повторить', plan.due, 'clock', 'text-rose-500')}
      ${statCard('Новые сегодня', `${plan.doneNew}/${plan.limit}`, 'sparkles', 'text-violet-500')}
      ${statCard('Серия', `${streak()} дн.`, 'flame', 'text-orange-500')}
    </div>
    <div class="mt-4">
      <button class="btn btn-primary btn-lg w-full" id="startBtn" ${available ? '' : 'disabled'}><i data-lucide="play"></i>${plan.due + plan.fresh ? 'Начать' : 'Дополнительная практика'}</button>
      ${!available ? '<p class="text-sm text-center text-slate-500 mt-2">Все слова отмечены как выученные. Верните часть слов в работу в словаре.</p>' : ''}
    </div>
    ${s.quiet ? `<div class="mt-3 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm px-4 py-3 flex items-center gap-2"><i data-lucide="headphone-off"></i>Тихий режим: без автоозвучки, аудирование заменено написанием.</div>` : ''}

    <div class="card p-5 mt-4 space-y-5">
      <div>
        <div class="text-sm font-bold mb-2">Слов за сессию</div>
        <div class="flex gap-2 flex-wrap" id="sizeSeg">
          ${[5, 10, 15, 20].map(n => `<button class="chip ${s.sessionSize === n ? 'is-active' : ''}" data-n="${n}">${n}</button>`).join('')}
        </div>
      </div>
      <div>
        <div class="text-sm font-bold mb-2">Режим упражнений</div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-2" id="modeSeg">
          ${[['cycle', 'По кругу', 'Каждому слову — следующее из 4 упражнений', 'repeat'],
             ['full', 'Полный цикл', 'Все 4 упражнения на каждое слово', 'layers'],
             ['random', 'Случайно', 'Случайное упражнение для слова', 'shuffle'],
             ['cards', 'Карточки', 'Перевернуть и оценить: помню или нет', 'gallery-horizontal-end']]
            .map(([v, t, d, i]) => `<button data-m="${v}" class="text-left rounded-2xl border-2 p-3 transition ${s.mode === v ? 'border-brand-500 bg-brand-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300'}">
              <div class="flex items-center gap-2 font-bold"><i data-lucide="${i}"></i>${t}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${d}</div></button>`).join('')}
        </div>
      </div>
      ${s.mode === 'cards' ? `<div>
        <div class="text-sm font-bold mb-2">Лицевая сторона карточки</div>
        <div class="flex gap-2 flex-wrap" id="sideSeg">
          ${[['en', 'Английское слово'], ['ru', 'Перевод'], ['mix', 'Вперемешку']]
            .map(([v, l]) => `<button class="chip ${s.cardSide === v ? 'is-active' : ''}" data-side="${v}">${l}</button>`).join('')}
        </div></div>` : `<div class="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
        ${EX_TYPES.slice(0, 4).map(t => `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5"><i data-lucide="${t.icon}" style="width:.85rem;height:.85rem"></i>${t.name}</span>`).join('')}
      </div>`}
    </div>

    ${historyBlock()}`;

  $('#sizeSeg').onclick = e => { const b = e.target.closest('[data-n]'); if (!b) return; s.sessionSize = +b.dataset.n; store.saveSettings(); render(); };
  $('#modeSeg').onclick = e => { const b = e.target.closest('[data-m]'); if (!b) return; s.mode = b.dataset.m; store.saveSettings(); render(); };
  const side = $('#sideSeg');
  if (side) side.onclick = e => { const b = e.target.closest('[data-side]'); if (!b) return; s.cardSide = b.dataset.side; store.saveSettings(); render(); };
  $('#startBtn').onclick = () => startSession(pickSessionWords(s.sessionSize));
}

function historyBlock() {
  const h = store.history.slice(-7).reverse();
  if (!h.length) return '';
  return `<div class="mt-6">
    <div class="text-sm font-bold mb-2">Последние тренировки</div>
    <div class="card divide-y divide-slate-100 dark:divide-white/5">
      ${h.map(x => `<div class="flex items-center justify-between px-4 py-3 text-sm">
        <span class="text-slate-500 dark:text-slate-400">${fmtDate(x.date)}</span>
        <span>${x.words} ${plural(x.words, 'слово', 'слова', 'слов')}</span>
        <span class="font-bold ${x.accuracy >= 80 ? 'text-brand-500' : x.accuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}">${x.accuracy}%</span>
      </div>`).join('')}
    </div></div>`;
}

/* ----- Карточка упражнения ----- */

function currentItem() { return session.queue[session.pos]; }

/** Три неправильных варианта ответа: похожие слова (та же часть речи и уровень) из словаря и общей базы */
function distractors(w, field) {
  const ua = store.settings.lang === 'ua';
  const val = x => field === 'word' ? x.word : x.translation;
  const target = normAnswer(val(w));
  const pool = [
    ...store.words.filter(x => x.id !== w.id).map(x => ({ v: val(x), pos: x.pos, level: x.level })),
    ...BASE.list.map(b => ({ v: field === 'word' ? b.word : (ua ? b.ua : b.ru), pos: b.pos, level: b.level }))
  ].filter(x => x.v && normAnswer(x.v) !== target);
  const score = x => (w.pos && x.pos === w.pos ? 2 : 0) + (w.level && x.level === w.level ? 1 : 0);
  const best = shuffle(pool).sort((a, b) => score(b) - score(a));
  const out = [];
  for (const x of best) {
    if (out.length >= 3) break;
    if (!out.some(o => normAnswer(o) === normAnswer(x.v))) out.push(x.v);
  }
  return out;
}

function makeCard() {
  const it = currentItem();
  const w = store.byId(it.id);
  if (!w) { session.pos++; saveSession(); return null; }
  card = { item: it, w, answered: false, ok: null, given: '' };
  if (it.type === 3 && store.settings.quiet) it.type = 2;   // тихий режим: аудирование заменяется написанием
  if (it.type === 0) card.options = shuffle([w.translation, ...distractors(w, 'translation')]);
  if (it.type === 1) {
    const letters = [...w.word].map((ch, i) => ({ ch, i })).filter(x => x.ch !== ' ');
    let mixed = shuffle(letters);
    if (letters.length > 1 && mixed.map(x => x.ch).join('') === letters.map(x => x.ch).join('')) mixed = [...mixed.slice(1), mixed[0]];
    card.tiles = mixed.map((x, k) => ({ ch: x.ch, k, used: false }));
    card.built = '';
    card.mistakes = 0;
  }
  if (it.type === 4) {
    const side = store.settings.cardSide;
    card.side = side === 'mix' ? (Math.random() < 0.5 ? 'en' : 'ru') : side;
    card.flipped = false;
  }
  if (it.type === 3) {
    card.showOptions = false;
    card.options = shuffle([w.word, ...distractors(w, 'word')]);
  }
  return card;
}

function renderCard(view) {
  if (!card || card.item !== currentItem()) {
    if (!makeCard()) return renderTrain(view);
  }
  const { w, item } = card;
  const total = session.queue.length;
  const ex = EX_TYPES[item.type];
  view.innerHTML = `
    <div class="max-w-xl mx-auto">
      <div class="flex items-center gap-3">
        <button class="icon-btn" id="quitBtn" title="Завершить" aria-label="Завершить"><i data-lucide="x"></i></button>
        <div class="bar flex-1"><span style="width:${(session.pos / total) * 100}%"></span></div>
        <span class="text-sm font-bold tabular-nums text-slate-500">${session.pos + 1}/${total}</span>
      </div>
      <div class="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <i data-lucide="${ex.icon}" style="width:.95rem;height:.95rem"></i>${ex.name}${item.retry ? ' · <span class="text-amber-500">повтор ошибки</span>' : ''}
        ${session.label ? `<span class="ml-auto normal-case tracking-normal text-brand-500 truncate">${esc(session.label)}</span>` : ''}
      </div>
      <div id="exercise" class="mt-3"></div>
      <div id="feedback"></div>
    </div>`;
  $('#quitBtn').onclick = quitSession;
  [renderChoice, renderScramble, renderSpelling, renderListening, renderFlashcard, renderIntro][item.type]();
  if (card.answered && item.type < 4) renderFeedback();
  icons();
}

function promptCard(inner) {
  return `<div class="card p-6 md:p-8 text-center pop">${inner}</div>`;
}

// 1) Выбор перевода
function renderChoice() {
  const { w } = card;
  $('#exercise').innerHTML = `
    ${promptCard(`
      <div class="text-3xl md:text-4xl font-extrabold tracking-tight break-words">${esc(w.word)}</div>
      ${w.transcription ? `<div class="text-slate-400 mt-1">${esc(w.transcription)}</div>` : ''}
      <button class="btn btn-ghost !h-10 mt-4" id="sayBtn"><i data-lucide="volume-2"></i>Слушать</button>`)}
    <div class="mt-4 grid gap-2" id="opts">
      ${card.options.map((o, i) => `<button class="option ${optCls(o, w.translation)}" data-o="${i}" ${card.answered ? 'disabled' : ''}>
        <span class="kbd">${i + 1}</span><span class="flex-1">${esc(o)}</span></button>`).join('')}
    </div>`;
  $('#sayBtn').onclick = () => tts.speak(w.word);
  $('#opts').onclick = e => {
    const b = e.target.closest('[data-o]'); if (!b || card.answered) return;
    const val = card.options[+b.dataset.o];
    answer(val === w.translation, val);
  };
  if (!card.answered && autoSpeak() && !card.spoken) { card.spoken = true; setTimeout(() => tts.speak(w.word), 250); }
}
function optCls(o, correct) {
  if (!card.answered) return '';
  if (o === correct) return 'is-correct';
  if (o === card.given) return 'is-wrong';
  return 'opacity-50';
}

// 2) Сборка слова из букв
function renderScramble() {
  const { w } = card;
  const target = w.word;
  let filled = 0;
  const slots = [...target].map(ch => {
    if (ch === ' ') return `<span class="slot is-space"></span>`;
    const c = card.answered ? ch : card.built[filled];
    filled++;
    return `<span class="slot ${c ? 'is-filled' : ''}">${c ? esc(c) : ''}</span>`;
  }).join('');
  $('#exercise').innerHTML = `
    ${promptCard(`
      <div class="text-sm text-slate-400 font-semibold">Соберите слово</div>
      <div class="text-2xl md:text-3xl font-extrabold mt-1 break-words">${esc(w.translation)}</div>
      <div class="mt-6 flex flex-wrap justify-center gap-1.5" id="slots">${slots}</div>`)}
    <div class="mt-5 flex flex-wrap justify-center gap-2" id="tiles">
      ${card.tiles.map((t, i) => `<button class="tile ${t.used || card.answered ? 'is-used' : ''}" data-t="${i}">${esc(t.ch)}</button>`).join('')}
    </div>
    ${!card.answered ? `<div class="mt-5 flex justify-center gap-2">
      <span class="text-sm text-slate-400 self-center ${card.mistakes ? '' : 'invisible'}">Ошибок: ${card.mistakes}</span>
      <button class="btn btn-ghost" id="skipBtn"><i data-lucide="circle-help"></i>Не знаю</button></div>` : ''}`;
  if (card.answered) return;
  $('#tiles').onclick = e => { const b = e.target.closest('[data-t]'); if (b) pickTile(+b.dataset.t, b); };
  $('#skipBtn').onclick = () => answer(false, '');
}
function scrambleTarget() { return card.w.word.replace(/ /g, ''); }
function pickTile(i, el) {
  if (card.answered) return;
  const t = card.tiles[i]; if (t.used) return;
  const need = scrambleTarget()[card.built.length];
  if (t.ch.toLowerCase() === need.toLowerCase()) {
    t.used = true; card.built += need;
    if (card.built.length === scrambleTarget().length) { answer(card.mistakes === 0, card.mistakes ? `ошибок: ${card.mistakes}` : w0()); return; }
    renderScramble(); icons();
  } else {
    card.mistakes++;
    (el || $(`[data-t="${i}"]`))?.classList.add('shake');
    setTimeout(() => (el || $(`[data-t="${i}"]`))?.classList.remove('shake'), 400);
    if (card.mistakes >= 3) { answer(false, card.built + '…'); return; }
    const m = $('#exercise .invisible'); if (m) { m.classList.remove('invisible'); }
    const counter = $('#exercise .text-slate-400.self-center'); if (counter) counter.textContent = `Ошибок: ${card.mistakes}`;
  }
}
function w0() { return card.w.word; }

// 3) Написание слова по переводу
function renderSpelling() {
  const { w } = card;
  $('#exercise').innerHTML = `
    ${promptCard(`
      <div class="text-sm text-slate-400 font-semibold">Напишите по-английски</div>
      <div class="text-2xl md:text-3xl font-extrabold mt-1 break-words">${esc(w.translation)}</div>
      ${w.transcription ? `<div class="text-slate-400 mt-2 text-lg">${esc(w.transcription)}</div>` : ''}`)}
    ${typeForm()}`;
  bindTypeForm();
}

// 4) Аудирование
function renderListening() {
  const { w } = card;
  $('#exercise').innerHTML = `
    ${promptCard(`
      <div class="text-sm text-slate-400 font-semibold">Прослушайте и ${card.showOptions ? 'выберите' : 'напишите'} слово</div>
      <div class="mt-5 flex items-center justify-center gap-3">
        <button class="w-20 h-20 rounded-full bg-brand-500 text-white grid place-items-center hover:bg-brand-600 transition active:scale-95 ${card.answered ? '' : 'pulse-ring'}" id="playBtn" aria-label="Воспроизвести">
          <i data-lucide="volume-2" style="width:2rem;height:2rem"></i></button>
        <button class="w-12 h-12 rounded-full btn-ghost grid place-items-center" id="slowBtn" title="Медленно" aria-label="Медленно"><i data-lucide="snail"></i></button>
      </div>
      ${card.answered ? `<div class="mt-4 text-2xl font-extrabold">${esc(w.word)}</div>` : ''}`)}
    ${card.showOptions ? `
      <div class="mt-4 grid grid-cols-2 gap-2" id="opts">
        ${card.options.map((o, i) => `<button class="option justify-center ${optCls(o, w.word)}" data-o="${i}" ${card.answered ? 'disabled' : ''}>
          <span class="kbd">${i + 1}</span><span class="flex-1">${esc(o)}</span></button>`).join('')}
      </div>` : typeForm(true)}`;
  $('#playBtn').onclick = () => tts.speak(w.word);
  $('#slowBtn').onclick = () => tts.speak(w.word, 0.5);
  if (card.showOptions) {
    $('#opts').onclick = e => {
      const b = e.target.closest('[data-o]'); if (!b || card.answered) return;
      const val = card.options[+b.dataset.o];
      answer(val === w.word, val);
    };
  } else bindTypeForm();
  if (!card.answered && !card.spoken) { card.spoken = true; setTimeout(() => tts.speak(w.word), 300); }
}

// 5) Карточки-перевёртыши: вспомнить, перевернуть, честно оценить себя
function renderFlashcard() {
  const { w } = card;
  const en = card.side === 'en';
  const speakBtn = `<button class="icon-btn mt-3" data-say="${esc(w.word)}" aria-label="Озвучить"><i data-lucide="volume-2"></i></button>`;
  const front = en
    ? `<div class="text-3xl md:text-4xl font-extrabold tracking-tight break-words">${esc(w.word)}</div>
       ${w.transcription ? `<div class="text-slate-400 mt-1">${esc(w.transcription)}</div>` : ''}${speakBtn}`
    : `<div class="text-sm text-slate-400 font-semibold">Как это по-английски?</div>
       <div class="text-2xl md:text-3xl font-extrabold mt-1 break-words">${esc(w.translation)}</div>`;
  const back = `
    <div class="text-2xl md:text-3xl font-extrabold break-words">${esc(en ? w.translation : w.word)}</div>
    ${!en && w.transcription ? `<div class="text-slate-400 mt-1">${esc(w.transcription)}</div>` : ''}
    ${!en ? speakBtn : `<div class="text-sm text-slate-400 mt-1">${esc(w.word)}</div>`}
    ${w.example1_en || w.example2_en ? `<div class="mt-4 space-y-2 w-full text-left">
      ${exampleBlock(w.example1_en, w.example1_ua, w.word)}${exampleBlock(w.example2_en, w.example2_ua, w.word)}</div>` : ''}`;

  $('#exercise').innerHTML = `
    <div class="flip-scene" id="flipScene">
      <div class="flip-inner ${card.flipped ? 'is-flipped' : ''}" id="flipInner">
        <div class="flip-face card p-6 md:p-8 text-center">
          ${front}
          <div class="mt-6 text-xs font-semibold text-slate-400 flex items-center gap-1.5"><i data-lucide="rotate-3d" style="width:.9rem;height:.9rem"></i>Нажмите, чтобы перевернуть</div>
        </div>
        <div class="flip-face flip-back card p-5 md:p-7 text-center">${back}</div>
      </div>
    </div>
    <div class="mt-4 grid grid-cols-2 gap-2 transition-opacity ${card.flipped ? '' : 'opacity-0 pointer-events-none'}" id="gradeBtns">
      <button class="btn btn-lg btn-danger" id="forgotBtn"><i data-lucide="thumbs-down"></i>Не помню</button>
      <button class="btn btn-lg btn-primary" id="knowBtn"><i data-lucide="thumbs-up"></i>Помню</button>
    </div>
    <p class="text-center text-xs text-slate-400 mt-3">${card.flipped
      ? '<span class="md:hidden">Свайп вправо — помню, влево — не помню</span><span class="hidden md:inline">→ помню · ← не помню</span>'
      : '<span class="hidden md:inline">Пробел — перевернуть</span>'}</p>`;

  bindSay($('#exercise'));
  $('#forgotBtn').onclick = () => gradeCard(false);
  $('#knowBtn').onclick = () => gradeCard(true);

  // Нажатие переворачивает, свайп после переворота оценивает
  const scene = $('#flipScene');
  let x0 = null, dx = 0;
  scene.onpointerdown = e => { if (e.target.closest('[data-say]')) return; x0 = e.clientX; dx = 0; };
  scene.onpointermove = e => {
    if (x0 === null || !card.flipped) return;
    dx = e.clientX - x0;
    scene.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`;
    scene.style.opacity = String(Math.max(0.4, 1 - Math.abs(dx) / 400));
  };
  const end = e => {
    if (x0 === null) return;
    const moved = Math.abs(dx) > 8;
    x0 = null;
    if (card.flipped && Math.abs(dx) > 80) { gradeCard(dx > 0); return; }
    scene.style.transform = ''; scene.style.opacity = '';
    if (!moved && !e.target.closest('[data-say]')) flipCard();
  };
  scene.onpointerup = end;
  scene.onpointercancel = () => { x0 = null; scene.style.transform = ''; scene.style.opacity = ''; };

  if (!card.flipped && en && autoSpeak() && !card.spoken) { card.spoken = true; setTimeout(() => tts.speak(w.word), 250); }
}
function flipCard() {
  card.flipped = !card.flipped;
  $('#flipInner')?.classList.toggle('is-flipped', card.flipped);
  if (card.flipped && card.side === 'ru' && autoSpeak()) tts.speak(card.w.word);
  setTimeout(() => { renderFlashcard(); icons(); }, 260);
}
function gradeCard(ok) {
  if (card.answered || !card.flipped) return;
  answer(ok, ok ? 'помню' : 'не помню');
}

function autoSpeak() { return store.settings.autoplay && !store.settings.quiet; }

function typeForm(listening = false) {
  if (card.answered) {
    return `<div class="mt-4 card p-4 text-center font-bold text-lg ${card.ok ? 'text-brand-500' : 'text-rose-500 line-through'}">${esc(card.given || '—')}</div>`;
  }
  return `<form class="mt-4" id="typeForm" autocomplete="off">
    <input class="input !h-14 text-center text-xl font-bold" id="typeInput" placeholder="Введите слово" autocapitalize="off" autocorrect="off" spellcheck="false" />
    <div class="mt-3 grid grid-cols-2 ${listening ? 'sm:grid-cols-5' : 'sm:grid-cols-3'} gap-2">
      <button type="button" class="btn btn-ghost" id="skipBtn"><i data-lucide="circle-help"></i>Не знаю</button>
      <button type="button" class="btn btn-ghost" id="hintBtn"><i data-lucide="lightbulb"></i>Подсказка</button>
      ${listening ? `<button type="button" class="btn btn-ghost" id="optsBtn"><i data-lucide="list"></i>Варианты</button>
        <button type="button" class="btn btn-ghost" id="muteBtn"><i data-lucide="headphone-off"></i>Без звука</button>` : ''}
      <button type="submit" class="btn btn-primary ${listening ? 'col-span-2 sm:col-span-1' : 'col-span-2 sm:col-span-1'}"><i data-lucide="check"></i>Проверить</button>
    </div>
  </form>`;
}
function bindTypeForm() {
  const f = $('#typeForm'); if (!f) return;
  const inp = $('#typeInput');
  setTimeout(() => inp.focus(), 50);
  f.onsubmit = e => {
    e.preventDefault();
    const val = inp.value;
    if (!val.trim()) { inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); return; }
    const a = normAnswer(val), b = normAnswer(card.w.word);
    if (a === b) return answer(true, val);
    // Одна опечатка в длинном слове засчитывается, но с пометкой
    if (b.length >= 6 && levenshtein(a, b) === 1) { card.typo = true; return answer(true, val); }
    answer(false, val);
  };
  $('#skipBtn').onclick = () => answer(false, '');
  const ob = $('#optsBtn'); if (ob) ob.onclick = () => { card.showOptions = true; renderListening(); icons(); };
  // Подсказка: открывает следующую букву; слово засчитывается, но интервал не растёт
  $('#hintBtn').onclick = () => {
    const word = card.w.word;
    card.hints = (card.hints || 0) + 1;
    if (card.hints >= word.length) { answer(false, ''); return; }
    inp.value = word.slice(0, card.hints);
    inp.focus();
    $('#hintBtn').innerHTML = `<i data-lucide="lightbulb"></i>Подсказка · ${card.hints}`; icons();
  };
  const mb = $('#muteBtn'); if (mb) mb.onclick = () => { setQuiet(true); card.item.type = 2; saveSession(); renderCard($('#view')); };
}

/** Тихий режим (без наушников): без автоозвучки, аудирование заменяется написанием */
function setQuiet(on) {
  store.settings.quiet = on; store.saveSettings();
  if (on) speechSynthesis?.cancel?.();
  updateQuietBtn();
  toast(on ? 'Тихий режим: без звука и аудирования' : 'Звук включён', 'info');
}
function updateQuietBtn() {
  const b = $('#quietBtn'); if (!b) return;
  const q = store.settings.quiet;
  b.title = q ? 'Тихий режим включён — нажмите, чтобы включить звук' : 'Включить тихий режим (без наушников)';
  b.innerHTML = `<i data-lucide="${q ? 'headphone-off' : 'headphones'}" class="${q ? 'text-amber-500' : ''}"></i>`;
  icons();
}

/* ----- Проверка ответа и обратная связь ----- */

function answer(ok, given) {
  if (card.answered) return;
  card.answered = true; card.ok = ok; card.given = given;
  session.answers++;
  if (ok) session.correct++;
  const rec = session.words[card.w.id];
  rec.answered = true;
  if (ok && (card.hints || card.typo)) { rec.hard = true; card.hinted = !!card.hints; }
  if (!ok) {
    rec.ok = false;
    if (!rec.errTypes.includes(card.item.type)) rec.errTypes.push(card.item.type);
    if (store.settings.retryWrong && !card.item.retry) session.queue.push({ ...card.item, retry: true });
  }
  saveSession();
  if (card.item.type === 4) { nextCard(); return; }   // у карточки обратная сторона уже показала пример
  if (ok && autoSpeak()) tts.speak(card.w.word);
  renderCard($('#view'));
}

function renderFeedback() {
  const { w, ok } = card;
  $('#feedback').innerHTML = `
    <div class="mt-4 rounded-3xl p-5 pop ${ok ? 'bg-brand-500/10 border border-brand-500/30' : 'bg-rose-500/10 border border-rose-500/30'}">
      <div class="flex items-center gap-2 font-extrabold ${ok ? 'text-brand-600 dark:text-brand-300' : 'text-rose-600 dark:text-rose-300'}">
        <i data-lucide="${ok ? 'circle-check' : 'circle-x'}"></i>
        ${ok ? (card.hinted ? 'Верно, с подсказкой — повторим скоро' : card.typo ? 'Верно, но с опечаткой' : pickPraise()) : 'Неверно'}
      </div>
      <div class="mt-3 flex items-center gap-3">
        <button class="icon-btn !w-9 !h-9 shrink-0" data-say="${esc(w.word)}" aria-label="Озвучить"><i data-lucide="volume-2"></i></button>
        <div class="min-w-0">
          <div class="text-xl font-extrabold break-words">${esc(w.word)} <span class="text-sm font-semibold text-slate-400">${esc(w.transcription)}</span></div>
          <div class="text-slate-600 dark:text-slate-300">${esc(w.translation)}</div>
        </div>
      </div>
      ${w.example1_en || w.example2_en ? `<div class="mt-4 space-y-2">
        ${exampleBlock(w.example1_en, w.example1_ua, w.word)}
        ${exampleBlock(w.example2_en, w.example2_ua, w.word)}</div>` : ''}
      <button class="btn btn-primary btn-lg w-full mt-4" id="nextBtn">Далее <i data-lucide="arrow-right"></i></button>
    </div>`;
  bindSay($('#feedback'));
  $('#nextBtn').onclick = nextCard;
  setTimeout(() => { $('#nextBtn')?.focus({ preventScroll: true }); $('#feedback')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60);
}
function pickPraise() { return ['Верно!', 'Отлично!', 'Правильно!', 'Так держать!'][Math.floor(Math.random() * 4)]; }

function nextCard() {
  session.pos++;
  card = null;
  if (session.pos >= session.queue.length) finishSession();
  else saveSession();
  render();
}

async function quitSession() {
  const done = session.answers;
  if (!done) { session = null; card = null; saveSession(); location.hash = '#/train'; render(); return; }
  if (await confirmDialog('Завершить тренировку? Прогресс по уже отвеченным словам сохранится.', 'Завершить')) {
    finishSession(true); render();
  }
}

function finishSession(early = false) {
  // Обновляем прогресс только тех слов, на которые был хотя бы один ответ
  // прогресс обновляется только у слов, на которые был хотя бы один ответ (знакомство не считается)
  const answeredIds = new Set(Object.entries(session.words).filter(([, r]) => r.answered).map(([id]) => id));
  const usedTypes = new Set();
  for (const [id, rec] of Object.entries(session.words)) {
    const w = store.byId(id);
    if (!w || !answeredIds.has(id)) continue;
    applySrs(w, rec.ok, rec.due && !rec.hard);
    // для режима «по кругу» следующее упражнение для слова будет другим
    if (!['full', 'cards'].includes(session.mode) && !usedTypes.has(id)) { w.ex = (w.ex + 1) % 4; usedTypes.add(id); }
  }
  store.saveWords(true);
  const words = [...answeredIds].length;
  const ok = Object.entries(session.words).filter(([id, r]) => answeredIds.has(id) && r.ok).length;
  session.report = {
    words, ok,
    accuracy: session.answers ? Math.round((session.correct / session.answers) * 100) : 0,
    seconds: Math.round((Date.now() - session.started) / 1000),
    ids: [...answeredIds]
  };
  // статистика за сегодня
  if (session.answers) {
    const st = statDay(todayStr());
    st.s += 1; st.a += session.answers; st.c += session.correct; st.w += words;
    st.n += [...answeredIds].filter(id => session.words[id]?.isNew).length;
    st.t += Math.min(session.report.seconds, 3 * 3600);
    st.u = Date.now();
    store.saveStats();
  }
  session.finished = true;
  store.history.push({ date: todayStr(), words, accuracy: session.report.accuracy, ok });
  store.saveHistory();
  card = null;
  saveSession();
}

function renderReport(view) {
  const r = session.report;
  const errors = r.ids.filter(id => !session.words[id].ok).map(id => ({ w: store.byId(id), types: session.words[id].errTypes })).filter(x => x.w);
  const good = r.ids.filter(id => session.words[id].ok).map(store.byId.bind(store)).filter(Boolean);
  const mm = Math.floor(r.seconds / 60), ss = r.seconds % 60;
  const emoji = r.accuracy >= 90 ? 'trophy' : r.accuracy >= 60 ? 'thumbs-up' : 'target';
  view.innerHTML = `
    <div class="max-w-xl mx-auto">
      <div class="card p-6 md:p-8 text-center pop">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-brand-500/15 text-brand-500 grid place-items-center"><i data-lucide="${emoji}" style="width:2rem;height:2rem"></i></div>
        <h1 class="mt-4 text-2xl font-extrabold">Тренировка завершена</h1>
        ${session.label ? `<div class="text-sm font-bold text-brand-500 mt-1">${esc(session.label)}</div>` : ''}
        <p class="text-slate-500 dark:text-slate-400 mt-1">${r.accuracy >= 90 ? 'Превосходный результат!' : r.accuracy >= 60 ? 'Хорошая работа, продолжайте!' : 'Ошибки — часть обучения. Повторите их ещё раз.'}</p>
        <div class="mt-6 grid grid-cols-3 gap-2">
          ${miniStat('Слов', r.words)}
          ${miniStat('Точность', r.accuracy + '%')}
          ${miniStat('Время', `${mm}:${pad(ss)}`)}
        </div>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <div class="rounded-2xl bg-brand-500/10 py-3"><div class="text-2xl font-extrabold text-brand-500">${good.length}</div><div class="text-xs font-semibold text-slate-500">без ошибок</div></div>
          <div class="rounded-2xl bg-rose-500/10 py-3"><div class="text-2xl font-extrabold text-rose-500">${errors.length}</div><div class="text-xs font-semibold text-slate-500">с ошибками</div></div>
        </div>
      </div>

      ${errors.length ? `
        <h2 class="mt-6 mb-2 font-extrabold flex items-center gap-2"><i data-lucide="circle-x" class="text-rose-500"></i>Слова с ошибками</h2>
        <div class="card divide-y divide-slate-100 dark:divide-white/5">
          ${errors.map(({ w, types }) => `
            <div class="px-4 py-3 flex items-center gap-3 cursor-pointer" data-open="${w.id}">
              <div class="flex-1 min-w-0">
                <div class="font-bold">${esc(w.word)} <span class="text-xs text-slate-400 font-normal">${esc(w.transcription)}</span></div>
                <div class="text-sm text-slate-500 dark:text-slate-400 truncate">${esc(w.translation)}</div>
              </div>
              <div class="flex gap-1">${types.map(t => `<span class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 grid place-items-center" title="${EX_TYPES[t].name}"><i data-lucide="${EX_TYPES[t].icon}" style="width:.85rem;height:.85rem"></i></span>`).join('')}</div>
            </div>`).join('')}
        </div>` : ''}

      ${good.length ? `
        <details class="mt-4 card">
          <summary class="px-4 py-3 font-bold cursor-pointer flex items-center gap-2"><i data-lucide="circle-check" class="text-brand-500"></i>Без ошибок (${good.length})</summary>
          <div class="px-4 pb-3 flex flex-wrap gap-2">${good.map(w => `<span class="chip cursor-pointer" data-open="${w.id}">${esc(w.word)}</span>`).join('')}</div>
        </details>` : ''}

      <div class="mt-6 grid gap-2 ${errors.length ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}">
        ${errors.length ? `<button class="btn btn-primary" id="retryBtn"><i data-lucide="rotate-ccw"></i>Повторить ошибки</button>` : ''}
        ${session.block ? `<button class="btn ${errors.length ? 'btn-ghost' : 'btn-primary'}" id="blockAgainBtn"><i data-lucide="repeat"></i>Блок ещё раз</button>` : `<button class="btn ${errors.length ? 'btn-ghost' : 'btn-primary'}" id="againBtn"><i data-lucide="zap"></i>Новая сессия</button>`}
        <button class="btn btn-ghost" id="toDictBtn"><i data-lucide="book-open"></i>К словарю</button>
      </div>
    </div>`;

  view.onclick = e => { const o = e.target.closest('[data-open]'); if (o && route.name === 'train') openWordModal(o.dataset.open); };
  const retry = $('#retryBtn');
  if (retry) retry.onclick = () => { const ws = errors.map(x => x.w), { label, block } = session; session = null; view.onclick = null; startSession(ws, { label: label ? label + ' · ошибки' : '', block }); };
  const ba = $('#blockAgainBtn');
  if (ba) ba.onclick = () => { const { block, label } = session; session = null; view.onclick = null; trainBlock(block, label, { all: true }); };
  const ag = $('#againBtn');
  if (ag) ag.onclick = () => { session = null; view.onclick = null; saveSession(); startSession(pickSessionWords(store.settings.sessionSize)); };
  $('#toDictBtn').onclick = () => { session = null; view.onclick = null; saveSession(); location.hash = '#/dict'; };
}

/* ----- Клавиатура (на компьютере) ----- */

document.addEventListener('keydown', e => {
  if ($('#modalRoot').innerHTML) { if (e.key === 'Escape') closeModal(); return; }
  if (route.name !== 'train' || !card || !session || session.finished) return;
  if (card.answered) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextCard(); }
    return;
  }
  const t = card.item.type;
  if (t === 5) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextCard(); } return; }
  if (t === 4) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!card.flipped) flipCard(); }
    else if (card.flipped && (e.key === 'ArrowRight' || e.key === '2')) gradeCard(true);
    else if (card.flipped && (e.key === 'ArrowLeft' || e.key === '1')) gradeCard(false);
    return;
  }
  if ((t === 0 || (t === 3 && card.showOptions)) && /^[1-4]$/.test(e.key)) {
    const b = $(`#opts [data-o="${+e.key - 1}"]`); if (b) b.click();
  }
  if (t === 1 && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    const i = card.tiles.findIndex(x => !x.used && x.ch.toLowerCase() === e.key.toLowerCase());
    const need = scrambleTarget()[card.built.length];
    if (i >= 0 && card.tiles[i].ch.toLowerCase() === need.toLowerCase()) pickTile(i);
    else if (i >= 0 || /\p{L}/u.test(e.key)) {
      const anyIdx = i >= 0 ? i : card.tiles.findIndex(x => !x.used);
      if (anyIdx >= 0) { card.mistakes++; $('#tiles')?.classList.add('shake'); setTimeout(() => $('#tiles')?.classList.remove('shake'), 400);
        if (card.mistakes >= 3) answer(false, card.built + '…'); else { renderScramble(); icons(); } }
    }
  }
});

/* ---------- 8б. Экран «Статистика» ---------- */

const statsState = { days: 14 };

function fmtDuration(sec) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} мин`;
  return `${Math.floor(m / 60)} ч ${m % 60} мин`;
}
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
function dayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${WD[new Date(y, m - 1, d).getDay()]}, ${d}.${pad(m)}`;
}

function renderStats(view) {
  const N = statsState.days;
  const today = todayStr();
  const days = Array.from({ length: N }, (_, i) => addDays(today, i - N + 1));
  const rows = days.map(d => ({ d, ...dayTotals(d) }));
  const sum = rows.reduce((t, r) => { for (const k of ['s', 'a', 'c', 'w', 'n', 't']) t[k] += r[k]; return t; }, { s: 0, a: 0, c: 0, w: 0, n: 0, t: 0 });
  const acc = sum.a ? Math.round(sum.c / sum.a * 100) : null;
  const todayT = dayTotals(today);
  const st = streak();
  const activeDays = rows.filter(r => r.s).length;

  view.innerHTML = `
    <div class="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">Статистика</h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">${sync.enabled() ? 'Учитываются занятия со всех синхронизированных устройств' : 'Занятия на этом устройстве'}</p>
      </div>
      <div class="flex gap-2" id="periodSeg">
        ${[7, 14, 30].map(n => `<button class="chip ${N === n ? 'is-active' : ''}" data-d="${n}">${n} дн.</button>`).join('')}
      </div>
    </div>

    <div class="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
      ${heroTile('Серия', st, plural(st, 'день подряд', 'дня подряд', 'дней подряд'), 'flame', 'text-orange-500')}
      ${heroTile('Сегодня', todayT.a, plural(todayT.a, 'ответ', 'ответа', 'ответов'), 'calendar-days', 'text-brand-500')}
      ${heroTile(`Точность за ${N} дн.`, acc === null ? '—' : acc + '%', `${sum.c} из ${sum.a} верно`, 'target', 'text-sky-500')}
      ${heroTile(`Время за ${N} дн.`, fmtDuration(sum.t), `${activeDays} ${plural(activeDays, 'день', 'дня', 'дней')} с занятиями`, 'timer', 'text-violet-500')}
    </div>

    <section class="card p-4 md:p-5 mt-4">
      <div class="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 class="font-extrabold">Ответов по дням</h2>
        <div class="text-sm text-slate-500 dark:text-slate-400">${sum.w} ${plural(sum.w, 'слово', 'слова', 'слов')} повторено · ${sum.n} ${plural(sum.n, 'новое', 'новых', 'новых')}</div>
      </div>
      <div class="relative mt-3" id="barChart">${sum.a ? '' :`<div class="h-40 grid place-items-center text-sm text-slate-400">За этот период занятий не было</div>`}</div>
      ${sum.a ? `<details class="mt-3 text-sm">
        <summary class="cursor-pointer text-slate-500 dark:text-slate-400 font-semibold">Показать таблицей</summary>
        <div class="mt-2 overflow-x-auto scroll-thin"><table class="w-full text-sm tabular-nums">
          <thead class="text-xs text-slate-400"><tr><th class="text-left py-1.5 pr-2">День</th><th class="text-right px-2">Ответов</th><th class="text-right px-2">Точность</th><th class="text-right px-2">Слов</th><th class="text-right pl-2">Время</th></tr></thead>
          <tbody>${rows.filter(r => r.s).reverse().map(r => `<tr class="border-t border-slate-100 dark:border-white/5">
            <td class="py-1.5 pr-2">${dayLabel(r.d)}</td><td class="text-right px-2">${r.a}</td>
            <td class="text-right px-2">${Math.round(r.c / r.a * 100)}%</td><td class="text-right px-2">${r.w}</td><td class="text-right pl-2">${fmtDuration(r.t)}</td></tr>`).join('')}</tbody>
        </table></div></details>` : ''}
    </section>

    <section class="card p-4 md:p-5 mt-4">
      <h2 class="font-extrabold">Календарь занятий</h2>
      <div class="relative mt-3 overflow-x-auto no-scrollbar" id="heatmap"></div>
    </section>

    <div class="grid md:grid-cols-2 gap-4 mt-4">
      <section class="card p-4 md:p-5">${dictComposition()}</section>
      <section class="card p-4 md:p-5">${hardWords()}</section>
    </div>
    <div class="chart-tip hidden" id="chartTip"></div>`;

  $('#periodSeg').onclick = e => { const b = e.target.closest('[data-d]'); if (!b) return; statsState.days = +b.dataset.d; render(); };
  // график строится по реальной ширине блока, чтобы подписи были читаемы и на телефоне
  const bc = $('#barChart');
  if (sum.a) bc.innerHTML = barChart(rows, bc.clientWidth);
  const hm = $('#heatmap'); hm.innerHTML = heatmap(hm.clientWidth); hm.scrollLeft = hm.scrollWidth;
  bindChartTips(view);
  view.querySelectorAll('[data-open]').forEach(el => el.onclick = () => openWordModal(el.dataset.open));
}

function heroTile(label, value, sub, icon, color) {
  return `<div class="card p-4">
    <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"><i data-lucide="${icon}" class="${color}" style="width:1rem;height:1rem"></i>${label}</div>
    <div class="mt-1 text-2xl md:text-3xl font-extrabold tabular-nums">${value}</div>
    <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${sub}</div>
  </div>`;
}

function niceMax(v) {
  if (v <= 5) return 5;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/** Столбчатая диаграмма «ответов в день» (одна серия, без легенды) */
function barChart(rows, width = 640) {
  const W = Math.max(260, Math.round(width)), H = 200, padL = 30, padR = 6, padT = 10, padB = 24;
  const max = niceMax(Math.max(...rows.map(r => r.a)));
  const n = rows.length, slot = (W - padL - padR) / n;
  const bw = Math.max(4, Math.min(28, slot - 2));
  const y = v => padT + (H - padT - padB) * (1 - v / max);
  const ticks = [0, max / 2, max];
  const labelEvery = slot >= 22 ? 1 : slot >= 11 ? 2 : 5;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="block max-w-full" role="img" aria-label="Количество ответов по дням">`;
  for (const t of ticks) {
    s += `<line x1="${padL}" x2="${W - padR}" y1="${y(t)}" y2="${y(t)}" class="stroke-slate-200 dark:stroke-white/10" stroke-width="1" ${t ? 'stroke-dasharray="3 4"' : ''}/>`;
    s += `<text x="${padL - 6}" y="${y(t) + 4}" text-anchor="end" class="fill-slate-400 text-[11px]">${Math.round(t)}</text>`;
  }
  rows.forEach((r, i) => {
    const cx = padL + slot * i + slot / 2, x = cx - bw / 2;
    if (r.a) {
      const top = y(r.a), base = y(0), rad = Math.min(4, bw / 2, base - top);
      s += `<path d="M${x},${base} V${top + rad} Q${x},${top} ${x + rad},${top} H${x + bw - rad} Q${x + bw},${top} ${x + bw},${top + rad} V${base} Z" class="fill-brand-500 bar-mark"/>`;
    }
    const tip = r.s ? `${dayLabel(r.d)}|${r.a} ${plural(r.a, 'ответ', 'ответа', 'ответов')} · точность ${Math.round(r.c / r.a * 100)}%|${r.w} ${plural(r.w, 'слово', 'слова', 'слов')} · ${fmtDuration(r.t)}` : `${dayLabel(r.d)}|Занятий не было`;
    s += `<rect x="${padL + slot * i}" y="${padT}" width="${slot}" height="${H - padT - padB}" fill="transparent" data-tip="${esc(tip)}" class="cursor-pointer"/>`;
    const [, m, d] = r.d.split('-');
    if ((n - 1 - i) % labelEvery === 0) s += `<text x="${cx}" y="${H - 6}" text-anchor="middle" class="fill-slate-400 text-[11px]">${+d}${n <= 7 ? '.' + m : ''}</text>`;
  });
  return s + '</svg>';
}

/** Календарь активности за ~18 недель (насыщенность цвета = количество ответов) */
function heatmap(width = 640) {
  const cell = 14, gap = 3;
  const weeks = Math.max(8, Math.min(18, Math.floor((width - 24) / (cell + gap))));   // столько недель, сколько помещается
  const today = todayStr();
  const [y, m, d] = today.split('-').map(Number);
  const dow = (new Date(y, m - 1, d).getDay() + 6) % 7;   // пн = 0
  const start = addDays(today, -(weeks - 1) * 7 - dow);
  const vals = [];
  for (let i = 0; i < weeks * 7; i++) { const day = addDays(start, i); if (day > today) break; vals.push([day, dayTotals(day)]); }
  const max = Math.max(1, ...vals.map(([, t]) => t.a));
  const LEVELS = ['fill-slate-100 dark:fill-white/5', 'fill-brand-200 dark:fill-brand-800', 'fill-brand-300 dark:fill-brand-600', 'fill-brand-500 dark:fill-brand-400', 'fill-brand-700 dark:fill-brand-200'];
  const lvl = a => a ? Math.min(4, 1 + Math.floor((a / max) * 3.999)) : 0;
  const W = 22 + weeks * (cell + gap), H = 7 * (cell + gap) + 18;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="block mx-auto" role="img" aria-label="Календарь занятий">`;
  ['пн', '', 'ср', '', 'пт', '', ''].forEach((l, i) => { if (l) s += `<text x="0" y="${i * (cell + gap) + cell - 3}" class="fill-slate-400 text-[10px]">${l}</text>`; });
  let lastMonth = '', lastLabelWk = -9;
  vals.forEach(([day, t], i) => {
    const wk = Math.floor(i / 7), wd = i % 7;
    const x = 22 + wk * (cell + gap), yy = wd * (cell + gap);
    const mon = day.slice(5, 7);
    if (wd === 0 && mon !== lastMonth && wk - lastLabelWk >= 3) {   // подписи месяцев не наползают друг на друга
      lastMonth = mon;
      lastLabelWk = wk;
      s += `<text x="${x}" y="${H - 4}" class="fill-slate-400 text-[10px]">${['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][+mon - 1]}</text>`;
    }
    const tip = `${dayLabel(day)}|${t.a ? `${t.a} ${plural(t.a, 'ответ', 'ответа', 'ответов')} · ${fmtDuration(t.t)}` : 'Занятий не было'}`;
    s += `<rect x="${x}" y="${yy}" width="${cell}" height="${cell}" rx="3" class="${LEVELS[lvl(t.a)]} ${day === today ? 'stroke-slate-400' : ''}" ${day === today ? 'stroke-width="1.5"' : ''} data-tip="${esc(tip)}"/>`;
  });
  s += '</svg>';
  return s + `<div class="flex items-center justify-end gap-1.5 mt-2 text-[11px] text-slate-400">меньше
    ${LEVELS.map(c => `<svg width="12" height="12"><rect width="12" height="12" rx="3" class="${c}"/></svg>`).join('')} больше</div>`;
}

/** Состав словаря: новые / изучаются / позже / выучено */
function dictComposition() {
  const parts = [
    { label: 'Новые', color: '#8b5cf6', n: store.words.filter(w => w.priority === 'active' && isNew(w)).length },
    { label: 'Изучаются', color: '#1fa583', n: store.words.filter(w => w.priority === 'active' && !isNew(w)).length },
    { label: 'Позже', color: '#d97706', n: store.words.filter(w => w.priority === 'later').length },
    { label: 'Выучено', color: '#0284c7', n: store.words.filter(w => w.priority === 'learned').length }
  ];
  const total = store.words.length;
  return `<h2 class="font-extrabold">Состав словаря</h2>
    <div class="text-sm text-slate-500 dark:text-slate-400">${total} ${plural(total, 'слово', 'слова', 'слов')}</div>
    ${total ? `<div class="mt-4 flex h-3 rounded-full overflow-hidden gap-[2px]">
      ${parts.filter(p => p.n).map(p => `<div style="flex:${p.n};background:${p.color}" data-tip="${esc(`${p.label}|${p.n} ${plural(p.n, 'слово', 'слова', 'слов')} · ${Math.round(p.n / total * 100)}%`)}"></div>`).join('')}
    </div>
    <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
      ${parts.map(p => `<div class="flex items-center gap-2 text-sm">
        <span class="w-2.5 h-2.5 rounded-sm shrink-0" style="background:${p.color}"></span>
        <span class="text-slate-500 dark:text-slate-400">${p.label}</span>
        <span class="ml-auto font-bold tabular-nums">${p.n}</span></div>`).join('')}
    </div>` : '<div class="mt-4 text-sm text-slate-400">Словарь пуст</div>'}`;
}

function hardWords() {
  const list = store.words.filter(w => w.lapses > 0).sort((a, b) => b.lapses - a.lapses || a.ease - b.ease).slice(0, 5);
  return `<h2 class="font-extrabold">Трудные слова</h2>
    <div class="text-sm text-slate-500 dark:text-slate-400">Чаще всего с ошибками</div>
    ${list.length ? `<div class="mt-3 divide-y divide-slate-100 dark:divide-white/5">
      ${list.map(w => `<div class="flex items-center gap-3 py-2 cursor-pointer" data-open="${w.id}">
        <div class="flex-1 min-w-0"><div class="font-bold truncate">${esc(w.word)}</div><div class="text-xs text-slate-500 dark:text-slate-400 truncate">${esc(w.translation)}</div></div>
        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">${w.lapses} ${plural(w.lapses, 'ошибка', 'ошибки', 'ошибок')}</span>
      </div>`).join('')}</div>` : '<div class="mt-4 text-sm text-slate-400">Ошибок пока нет — отличный результат!</div>'}`;
}

/** Всплывающие подсказки для графиков (наведение мышью или касание) */
function bindChartTips(root) {
  const tip = $('#chartTip');
  if (!tip) return;
  let active = null;
  const show = (el, x, y) => {
    const [title, ...lines] = el.dataset.tip.split('|');
    tip.innerHTML = `<div class="font-bold">${esc(title)}</div>${lines.map(l => `<div class="opacity-80">${esc(l)}</div>`).join('')}`;
    tip.classList.remove('hidden');
    const r = tip.getBoundingClientRect();
    let left = x - r.width / 2, top = y - r.height - 14;
    left = Math.max(8, Math.min(left, window.innerWidth - r.width - 8));
    if (top < 8) top = y + 18;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
    if (active && active !== el) active.classList.remove('is-hover');
    active = el;
    const mark = el.previousElementSibling?.classList.contains('bar-mark') ? el.previousElementSibling : null;
    root.querySelectorAll('.bar-mark.is-dim').forEach(m => m.classList.remove('is-dim'));
    if (mark) root.querySelectorAll('.bar-mark').forEach(m => m !== mark && m.classList.add('is-dim'));
  };
  const hide = () => {
    tip.classList.add('hidden'); active = null;
    root.querySelectorAll('.bar-mark.is-dim').forEach(m => m.classList.remove('is-dim'));
  };
  root.addEventListener('pointermove', e => {
    const el = e.target.closest('[data-tip]');
    if (el) show(el, e.clientX, e.clientY); else if (e.pointerType === 'mouse') hide();
  });
  root.addEventListener('pointerdown', e => { const el = e.target.closest('[data-tip]'); if (el) show(el, e.clientX, e.clientY); else hide(); });
  root.addEventListener('pointerleave', hide);
  window.addEventListener('scroll', hide, { passive: true, once: true });
}

/* ---------- 9. Экран «База»: импорт и экспорт ---------- */

function renderBase(view) {
  const s = store.settings;
  view.innerHTML = `
    <a href="#/settings" class="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-500 mb-2"><i data-lucide="chevron-left"></i>Ещё</a>
    <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">Свои слова и синхронизация</h1>
    <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Синхронизация между устройствами, импорт из Google Таблицы, CSV или JSON и выгрузка прогресса.</p>

    <div id="cloudSection"></div>

    <section class="card p-5 mt-4 ${sync.gasOn() && !sync.cloudOn() ? 'border-brand-500/40' : ''}">
      <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="sheet" class="text-brand-500"></i>Синхронизация через Google Таблицу</h2>
      ${sync.cloudOn() ? '<p class="text-xs text-amber-600 dark:text-amber-300 mt-1">Сейчас вы вошли в облако WordFlow — синхронизация идёт через него, таблица не используется.</p>' : ''}
      ${sync.gasOn() ? `
        <p class="text-sm mt-1" id="syncStatus"></p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Слова, статусы, прогресс и статистика хранятся в вашей Google Таблице (лист «WordFlow»). Подключите ту же ссылку на всех устройствах.</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button class="btn btn-primary" id="syncNowBtn"><i data-lucide="refresh-cw"></i>Синхронизировать сейчас</button>
          <button class="btn btn-ghost" id="syncEditBtn"><i data-lucide="settings"></i>Изменить</button>
          <button class="btn btn-danger" id="syncOffBtn"><i data-lucide="cloud-off"></i>Отключить</button>
        </div>
        <label class="mt-4 flex items-center justify-between gap-4">
          <span><span class="text-sm font-bold block">Автоматически</span><span class="text-xs text-slate-500 dark:text-slate-400">При открытии приложения и после изменений</span></span>
          <input type="checkbox" id="autoSyncChk" class="w-5 h-5 accent-brand-500" ${s.autoSync ? 'checked' : ''}></label>` : ''}
      <div id="syncForm" class="${sync.gasOn() ? 'hidden' : ''}">
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Прогресс будет общим на всех устройствах. Нужен один раз установить небольшой скрипт в Google Таблицу — пошагово в файле <b>ИНСТРУКЦИЯ.md</b> (раздел «Синхронизация»), код скрипта — в файле <b>google-apps-script.gs</b>.</p>
        <div class="mt-3 grid gap-2">
          <input id="syncUrl" class="input" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(s.syncUrl)}" autocomplete="off" />
          <input id="syncKey" class="input" placeholder="Ключ доступа (если задали его в скрипте)" value="${esc(s.syncKey)}" autocomplete="off" />
          <button class="btn btn-primary" id="syncConnectBtn"><i data-lucide="link"></i>Подключить и синхронизировать</button>
        </div>
      </div>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="clipboard-paste" class="text-brand-500"></i>Вставить данные</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Выделите ячейки в Google Таблице (вместе со строкой заголовков), скопируйте <b>Ctrl+C</b> и вставьте сюда.
        Подходит также CSV (разделитель «,» или «;») и JSON.</p>
      <textarea id="importText" class="input mt-3 font-mono text-xs" rows="8" placeholder="word	translation	transcription	example1_en	example1_ua ..."></textarea>
      <div class="mt-3 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div class="flex gap-4 text-sm">
          <label class="flex items-center gap-2"><input type="radio" name="imode" value="merge" checked class="accent-brand-500"> Объединить</label>
          <label class="flex items-center gap-2"><input type="radio" name="imode" value="replace" class="accent-brand-500"> Заменить всё</label>
        </div>
        <div class="sm:ml-auto flex gap-2">
          <label class="btn btn-ghost cursor-pointer"><i data-lucide="file-up"></i>Файл<input type="file" id="fileInput" accept=".csv,.tsv,.txt,.json" class="hidden"></label>
          <button class="btn btn-ghost" id="previewBtn"><i data-lucide="eye"></i>Проверить</button>
          <button class="btn btn-primary" id="importBtn"><i data-lucide="download"></i>Импорт</button>
        </div>
      </div>
      <div id="previewBox"></div>
      <p class="text-xs text-slate-400 mt-3">«Объединить» — новые слова добавятся, у существующих обновятся текст и примеры, а ваш прогресс сохранится (если в данных нет более свежей даты повтора).</p>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="sheet" class="text-brand-500"></i>Импорт слов по ссылке на таблицу</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Только чтение: подтягивает новые слова из вашей таблицы со словами. Вставьте ссылку на таблицу с доступом «Все, у кого есть ссылка (читатель)» или ссылку из «Файл → Поделиться → Опубликовать в интернете → CSV».</p>
      <div class="mt-3 flex flex-col sm:flex-row gap-2">
        <input id="sheetUrl" class="input" placeholder="https://docs.google.com/spreadsheets/d/…" value="${esc(s.sheetUrl)}" />
        <button class="btn btn-primary shrink-0" id="syncBtn"><i data-lucide="refresh-cw"></i>Загрузить</button>
      </div>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="upload" class="text-brand-500"></i>Выгрузить прогресс</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Скопируйте базу с прогрессом и вставьте в Google Таблицу (ячейка A1) — или сохраните файл как резервную копию.</p>
      <div class="mt-3 grid sm:grid-cols-3 gap-2">
        <button class="btn btn-primary" id="copyTsvBtn" ${store.words.length ? '' : 'disabled'}><i data-lucide="copy"></i>Копировать для таблицы</button>
        <button class="btn btn-ghost" id="csvBtn" ${store.words.length ? '' : 'disabled'}><i data-lucide="file-spreadsheet"></i>Скачать CSV</button>
        <button class="btn btn-ghost" id="jsonBtn" ${store.words.length ? '' : 'disabled'}><i data-lucide="file-json"></i>Скачать JSON</button>
      </div>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="table-2" class="text-brand-500"></i>Формат таблицы</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Первая строка — заголовки. Обязательны только <b>word</b> и <b>translation</b>, остальные колонки можно оставить пустыми. Названия колонок можно писать и по-русски (слово, перевод, транскрипция…).</p>
      <div class="mt-3 overflow-x-auto scroll-thin rounded-xl border border-slate-200 dark:border-white/10">
        <table class="text-xs w-full">
          <thead class="bg-slate-50 dark:bg-ink-850"><tr>${FIELDS.map(f => `<th class="px-3 py-2 text-left font-bold whitespace-nowrap">${f}</th>`).join('')}</tr></thead>
          <tbody><tr>${['appointment', 'встреча, приём', '[əˈpɔɪntmənt]', 'I have an appointment at 3.', 'У меня встреча в 3.', 'She made an appointment.', 'Она записалась на приём.', '0', '0', 'active', '']
            .map(v => `<td class="px-3 py-2 whitespace-nowrap text-slate-500">${esc(v)}</td>`).join('')}</tr></tbody>
        </table>
      </div>
      <p class="text-xs text-slate-400 mt-2">priority: <b>active</b> (в работе), <b>later</b> (в конце очереди), <b>learned</b> (выучено). last_reviewed — дата ГГГГ-ММ-ДД или ДД.ММ.ГГГГ.</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn btn-ghost" id="copyHeadBtn"><i data-lucide="copy"></i>Копировать заголовки</button>

      </div>
    </section>`;

  // --- синхронизация ---
  updateSyncBadge();
  const connect = $('#syncConnectBtn');
  if (connect) connect.onclick = async () => {
    const url = $('#syncUrl').value.trim();
    if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) { toast('Вставьте ссылку веб-приложения: https://script.google.com/macros/s/…/exec', 'error'); return; }
    s.syncUrl = url; s.syncKey = $('#syncKey').value.trim(); store.saveSettings();
    connect.disabled = true; connect.innerHTML = '<i data-lucide="loader-circle" class="animate-spin"></i>Подключение…'; icons();
    await sync.run({ silent: false });
    if (sync.state === 'error') { s.syncUrl = ''; store.saveSettings(); }
    render();
  };
  if (sync.gasOn()) {
    $('#syncNowBtn').onclick = () => sync.run({ silent: false });
    $('#syncEditBtn').onclick = () => $('#syncForm').classList.toggle('hidden');
    $('#autoSyncChk').onchange = e => { s.autoSync = e.target.checked; store.saveSettings(); };
    $('#syncOffBtn').onclick = async () => {
      if (!(await confirmDialog('Отключить синхронизацию на этом устройстве? Данные здесь и в таблице сохранятся.', 'Отключить'))) return;
      s.syncUrl = ''; store.saveSettings(); sync.setState(sync.enabled() ? 'idle' : 'off'); render();
    };
  }

  const getMode = () => $('input[name=imode]:checked').value;
  $('#previewBtn').onclick = () => {
    try {
      const list = parseImport($('#importText').value);
      const ok = list.filter(x => str(x.word) && str(x.translation));
      $('#previewBox').innerHTML = `
        <div class="mt-4 text-sm"><b>${ok.length}</b> ${plural(ok.length, 'слово готово', 'слова готовы', 'слов готовы')} к импорту${list.length - ok.length ? `, пропущено ${list.length - ok.length} (нет слова или перевода)` : ''}.</div>
        <div class="mt-2 overflow-x-auto scroll-thin rounded-xl border border-slate-200 dark:border-white/10">
          <table class="text-xs w-full"><thead class="bg-slate-50 dark:bg-ink-850"><tr>
            ${['word', 'translation', 'transcription', 'example1_en', 'priority'].map(f => `<th class="px-3 py-2 text-left">${f}</th>`).join('')}</tr></thead>
          <tbody>${ok.slice(0, 5).map(x => `<tr class="border-t border-slate-100 dark:border-white/5">${['word', 'translation', 'transcription', 'example1_en', 'priority']
            .map(f => `<td class="px-3 py-2 whitespace-nowrap max-w-[14rem] truncate">${esc(f === 'priority' ? normPriority(x[f]) : x[f])}</td>`).join('')}</tr>`).join('')}</tbody></table>
        </div>`;
    } catch (err) { toast(err.message, 'error'); }
  };
  $('#importBtn').onclick = async () => {
    try {
      const list = parseImport($('#importText').value);
      const mode = getMode();
      if (mode === 'replace' && store.words.length &&
          !(await confirmDialog(`Заменить всю базу (${store.words.length} слов) новыми данными? Текущий прогресс будет удалён.`, 'Заменить', true))) return;
      const r = importWords(list, mode);
      toast(`Добавлено: ${r.added}, обновлено: ${r.updated}${r.skipped ? `, пропущено: ${r.skipped}` : ''}`);
      $('#importText').value = '';
      render();
    } catch (err) { toast(err.message, 'error'); }
  };
  $('#fileInput').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    $('#importText').value = await file.text();
    $('#previewBtn').click();
  };
  $('#syncBtn').onclick = async () => {
    const url = $('#sheetUrl').value.trim();
    s.sheetUrl = url; store.saveSettings();
    const btn = $('#syncBtn'); btn.disabled = true; btn.innerHTML = '<i data-lucide="loader-circle" class="animate-spin"></i>Загрузка'; icons();
    try {
      const r = await syncFromSheet(url);
      toast(`Синхронизировано. Новых: ${r.added}, обновлено: ${r.updated}`);
      render();
    } catch (err) {
      toast(err.message.includes('Failed to fetch') ? 'Нет доступа к таблице (проверьте интернет и доступ по ссылке)' : err.message, 'error');
      btn.disabled = false; btn.innerHTML = '<i data-lucide="refresh-cw"></i>Загрузить'; icons();
    }
  };
  $('#copyTsvBtn').onclick = async () => { if (await copyText(toCSV('\t'))) toast(`Скопировано ${store.words.length} строк — вставьте в ячейку A1 таблицы`); };
  $('#csvBtn').onclick = () => download(`wordflow-${todayStr()}.csv`, '﻿' + toCSV(','), 'text/csv;charset=utf-8');
  $('#jsonBtn').onclick = () => download(`wordflow-${todayStr()}.json`, JSON.stringify({ app: 'WordFlow', exported: new Date().toISOString(), words: store.words }, null, 2), 'application/json');
  $('#copyHeadBtn').onclick = async () => { if (await copyText(FIELDS.join('\t'))) toast('Заголовки скопированы — вставьте в первую строку таблицы'); };
  if (typeof renderCloudSection === 'function') renderCloudSection($('#cloudSection'));
}

/* ---------- 10. Экран «Настройки» ---------- */

function renderSettings(view) {
  const s = store.settings;
  const voices = tts.voices;
  view.innerHTML = `
    <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">Ещё</h1>

    <a href="#/base" class="card p-4 mt-5 flex items-center gap-4 hover:border-brand-400 transition group">
      <div class="w-11 h-11 rounded-2xl bg-brand-500/15 text-brand-500 grid place-items-center"><i data-lucide="database"></i></div>
      <div class="flex-1 min-w-0"><div class="font-extrabold">Свои слова и синхронизация</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Импорт из Google Таблицы, выгрузка, синхронизация устройств</div></div>
      <i data-lucide="chevron-right" class="text-slate-400"></i>
    </a>

    <section class="card p-5 mt-4 space-y-5">
      <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="graduation-cap" class="text-brand-500"></i>Обучение</h2>
      <div>
        <div class="text-sm font-bold mb-2">Язык перевода</div>
        <div class="flex gap-2" id="langSeg2">
          ${[['ru', 'Русский'], ['ua', 'Українська']].map(([v, l]) => `<button class="chip ${s.lang === v ? 'is-active' : ''}" data-lang="${v}">${l}</button>`).join('')}
        </div>
      </div>
      <div>
        <div class="text-sm font-bold mb-2">Новых слов в день</div>
        <div class="flex gap-2" id="perDaySeg2">
          ${[5, 10, 15, 20, 30].map(n => `<button class="chip ${s.newPerDay === n ? 'is-active' : ''}" data-n="${n}">${n}</button>`).join('')}
        </div>
      </div>
      <label class="flex items-center justify-between gap-4">
        <span><span class="text-sm font-bold block">Тихий режим (без наушников)</span><span class="text-xs text-slate-500 dark:text-slate-400">Без автоозвучки; аудирование заменяется написанием. Переключатель — значок наушников вверху</span></span>
        <input type="checkbox" id="quietChk" class="w-5 h-5 accent-brand-500" ${s.quiet ? 'checked' : ''}></label>
    </section>

    <section class="card p-5 mt-4 space-y-5">
      <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="palette" class="text-brand-500"></i>Оформление</h2>
      <div>
        <div class="text-sm font-bold mb-2">Тема оформления</div>
        <div class="flex gap-2 flex-wrap" id="themeSeg">
          ${[['dark', 'Тёмная', 'moon-star'], ['light', 'Светлая', 'sun'], ['system', 'Как в системе', 'monitor-smartphone']]
            .map(([v, l, i]) => `<button class="chip ${s.theme === v ? 'is-active' : ''}" data-v="${v}"><i data-lucide="${i}" style="width:.9rem;height:.9rem"></i>${l}</button>`).join('')}
        </div>
      </div>
      <label class="flex items-center justify-between gap-4">
        <span><span class="text-sm font-bold block">Повторять ошибки в конце сессии</span><span class="text-xs text-slate-500 dark:text-slate-400">Неправильно отвеченная карточка покажется ещё раз</span></span>
        <input type="checkbox" id="retryChk" class="w-5 h-5 accent-brand-500" ${s.retryWrong ? 'checked' : ''}></label>
    </section>

    <section class="card p-5 mt-4 space-y-5">
      <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="audio-lines" class="text-brand-500"></i>Озвучка</h2>
      ${!tts.supported ? '<p class="text-sm text-rose-500">Этот браузер не поддерживает озвучку. Используйте Chrome, Edge или Safari.</p>' : `
      <label class="block"><span class="text-sm font-bold">Голос</span>
        <select id="voiceSel" class="input mt-1">
          <option value="">Автоматически (${esc(tts.voice()?.name || 'системный')})</option>
          ${voices.map(v => `<option value="${esc(v.name)}" ${s.voice === v.name ? 'selected' : ''}>${esc(v.name)} — ${esc(v.lang)}</option>`).join('')}
        </select>
        ${!voices.length ? '<span class="text-xs text-slate-400">Английские голоса не найдены. На Android установите «Синтез речи Google», на Windows — английский языковой пакет.</span>' : ''}
      </label>
      <label class="block"><span class="text-sm font-bold">Скорость: <span id="rateVal">${s.rate}</span></span>
        <input type="range" id="rateRange" min="0.5" max="1.3" step="0.05" value="${s.rate}" class="w-full mt-2 accent-brand-500"></label>
      <label class="block"><span class="text-sm font-bold">Громкость: <span id="volVal">${Math.round(tts.vol() * 100)}%</span></span>
        <input type="range" id="volRange" min="0.05" max="1" step="0.05" value="${tts.vol()}" class="w-full mt-2 accent-brand-500">
        <span class="text-xs text-slate-400">Работает в Chrome и Edge на компьютере. На некоторых телефонах браузер игнорирует эту настройку — тогда регулируйте громкость кнопками телефона.</span></label>
      <label class="flex items-center justify-between gap-4">
        <span class="text-sm font-bold">Автоматически озвучивать слово</span>
        <input type="checkbox" id="autoChk" class="w-5 h-5 accent-brand-500" ${s.autoplay ? 'checked' : ''}></label>
      <button class="btn btn-ghost !h-auto py-2.5 !whitespace-normal text-left" id="testVoice"><i data-lucide="volume-2"></i>Проверить: «Practice makes perfect»</button>`}
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-extrabold flex items-center gap-2"><i data-lucide="smartphone" class="text-brand-500"></i>Установить как приложение</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Android (Chrome): меню ⋮ → «Установить приложение» / «Добавить на гл. экран». iPhone (Safari): «Поделиться» → «На экран „Домой“». Компьютер (Chrome/Edge): значок установки в адресной строке.</p>
      <button class="btn btn-primary mt-3 hidden" id="installBtn"><i data-lucide="download"></i>Установить</button>
    </section>

    <section class="card p-5 mt-4">
      <h2 class="font-extrabold flex items-center gap-2 text-rose-500"><i data-lucide="triangle-alert"></i>Опасная зона</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Перед этим сделайте выгрузку: «Ещё» → «Свои слова и синхронизация».</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn btn-danger" id="resetProgress"><i data-lucide="rotate-ccw"></i>Сбросить прогресс</button>
        <button class="btn btn-danger" id="wipeAll"><i data-lucide="trash-2"></i>Удалить все слова</button>
      </div>
    </section>
    <p class="text-center text-xs text-slate-400 mt-6">WordFlow · данные хранятся в этом браузере${sync.cloudOn() ? ' и в облаке WordFlow' : sync.gasOn() ? ' и в вашей Google Таблице' : ''}</p>`;

  $('#themeSeg').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; s.theme = b.dataset.v; store.saveSettings(); applyTheme(); render(); };
  $('#retryChk').onchange = e => { s.retryWrong = e.target.checked; store.saveSettings(); };
  $('#langSeg2').onclick = e => { const b = e.target.closest('[data-lang]'); if (b) setLang(b.dataset.lang); };
  $('#perDaySeg2').onclick = e => { const b = e.target.closest('[data-n]'); if (!b) return; s.newPerDay = +b.dataset.n; store.saveSettings(); render(); };
  $('#quietChk').onchange = e => setQuiet(e.target.checked);
  if (tts.supported) {
    $('#voiceSel').onchange = e => { s.voice = e.target.value; store.saveSettings(); tts.speak('Hello'); };
    $('#rateRange').oninput = e => { s.rate = +e.target.value; $('#rateVal').textContent = s.rate; store.saveSettings(); };
    $('#volRange').oninput = e => { s.volume = +e.target.value; $('#volVal').textContent = Math.round(s.volume * 100) + '%'; store.saveSettings(); };
    $('#volRange').onchange = () => tts.speak('Hello');
    $('#autoChk').onchange = e => { s.autoplay = e.target.checked; store.saveSettings(); };
    $('#testVoice').onclick = () => tts.speak('Practice makes perfect');
  }
  if (deferredInstall) { const b = $('#installBtn'); b.classList.remove('hidden'); b.onclick = async () => { deferredInstall.prompt(); deferredInstall = null; b.classList.add('hidden'); }; }
  $('#resetProgress').onclick = async () => {
    if (!(await confirmDialog('Сбросить прогресс всех слов? Слова останутся, интервалы и статусы обнулятся.', 'Сбросить', true))) return;
    store.words.forEach(w => touch(Object.assign(w, { interval: 0, repetitions: 0, priority: 'active', last_reviewed: '', ease: 2.5, lapses: 0, ex: 0 })));
    store.saveWords(); store.history = []; store.saveHistory(); session = null; saveSession(); toast('Прогресс сброшен'); render();
  };
  $('#wipeAll').onclick = async () => {
    if (!(await confirmDialog(`Удалить все ${store.words.length} слов?${sync.enabled() ? ' Они удалятся и на других синхронизированных устройствах.' : ''} Это действие нельзя отменить.`, 'Удалить всё', true))) return;
    store.words.forEach(w => { store.deleted[keyOf(w)] = Date.now(); }); store.saveDeleted();
    store.words = []; store.saveWords(); session = null; saveSession(); toast('База очищена', 'info'); render();
  };
}

/* ---------- 11. Запуск ---------- */

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (route.name === 'settings') render(); });

function boot() {
  store.init();
  tts.init();
  applyTheme();
  $('#themeBtn').onclick = () => {
    const isDark = document.documentElement.classList.contains('dark');
    store.settings.theme = isDark ? 'light' : 'dark';
    store.saveSettings(); applyTheme();
    if (route.name === 'settings') render();
  };
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (store.settings.theme === 'system') applyTheme(); });
  document.addEventListener('click', e => { if (e.target.matches('[data-close]')) closeModal(); });
  // Синхронизация между вкладками
  window.addEventListener('storage', e => { if (e.key === LS_WORDS) { store.init(); if (route.name !== 'train') render(); } });
  window.addEventListener('hashchange', onRoute);
  onRoute();

  // Синхронизация: при запуске, при возврате в приложение и при появлении интернета
  $('#syncBtn').onclick = () => sync.run({ silent: false });
  $('#quietBtn').onclick = () => { setQuiet(!store.settings.quiet); if (['settings', 'train'].includes(route.name) && !card) render(); };
  updateQuietBtn();
  if (!store.settings.onboarded) setTimeout(openOnboarding, 300);
  updateSyncBadge();
  if (sync.enabled() && store.settings.autoSync) setTimeout(() => sync.run(), 400);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sync.schedule(800);
  });
  window.addEventListener('online', () => sync.schedule(800));
  setInterval(() => { if (sync.state === 'ok') updateSyncBadge(); }, 60000);
  // графики перестраиваются при повороте экрана / изменении размера окна
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (route.name === 'stats') render(); }, 250); });

  // Service Worker — офлайн-режим и установка (работает только через http/https)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
