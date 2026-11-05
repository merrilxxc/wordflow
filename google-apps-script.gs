/**
 * WordFlow — синхронизация прогресса между устройствами через Google Таблицу.
 *
 * Как установить (подробно — в ИНСТРУКЦИЯ.md):
 *   1. Откройте свою Google Таблицу → Расширения → Apps Script.
 *   2. Удалите всё в редакторе и вставьте этот код целиком. Сохраните (значок дискеты).
 *   3. Развернуть → Новое развертывание → Тип: Веб-приложение.
 *      Выполнять от имени: «Я». Доступ: «Все». → Развернуть → Разрешить доступ.
 *   4. Скопируйте «URL веб-приложения» (заканчивается на /exec) и вставьте его
 *      в WordFlow: вкладка «База» → «Синхронизация телефона и компьютера».
 *
 * Скрипт создаст два листа:
 *   WordFlow       — все слова с прогрессом (можно редактировать вручную и добавлять строки);
 *   WordFlow_meta  — служебные данные: удалённые слова и статистика по дням (не трогайте).
 */

// Необязательный ключ доступа. Если впишете сюда, например, 'my-secret-123',
// то в приложении нужно будет указать такой же ключ. Пусто — без ключа.
const SECRET = '';

const SHEET_WORDS = 'WordFlow';
const SHEET_META = 'WordFlow_meta';

/** Проверка в браузере: откройте ссылку /exec — увидите, что скрипт работает. */
function doGet() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_WORDS);
  return json_({ ok: true, message: 'WordFlow: синхронизация работает', words: sh ? Math.max(0, sh.getLastRow() - 1) : 0 });
}

/** Приложение отправляет сюда запросы: pull — получить данные, push — сохранить. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (SECRET && data.key !== SECRET) return json_({ ok: false, error: 'Неверный ключ доступа' });
    if (data.action === 'push') return json_(push_(data));
    return json_(pull_());
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function pull_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(SHEET_WORDS);
  const words = [];
  if (sh && sh.getLastRow() > 1 && sh.getLastColumn() > 0) {
    const values = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getDisplayValues();
    const head = values[0].map(String);
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row.some(function (c) { return String(c).trim() !== ''; })) continue;
      const o = {};
      head.forEach(function (h, j) { if (h) o[h] = row[j]; });
      words.push(o);
    }
  }
  const deleted = {}, stats = {};
  const meta = ss.getSheetByName(SHEET_META);
  if (meta && meta.getLastRow() > 0) {
    meta.getRange(1, 1, meta.getLastRow(), 3).getDisplayValues().forEach(function (r) {
      if (r[0] === 'deleted') deleted[r[1]] = Number(r[2]) || 0;
      if (r[0] === 'stats') { try { stats[r[1]] = JSON.parse(r[2]); } catch (x) {} }
    });
  }
  return { ok: true, initialized: !!sh, words: words, deleted: deleted, stats: stats };
}

function push_(data) {
  const ss = SpreadsheetApp.getActive();
  const cols = data.columns || [];
  const rows = [cols].concat((data.words || []).map(function (w) {
    return cols.map(function (c) { return w[c] == null ? '' : String(w[c]); });
  }));

  const sh = ss.getSheetByName(SHEET_WORDS) || ss.insertSheet(SHEET_WORDS);
  sh.clearContents();
  const range = sh.getRange(1, 1, rows.length, cols.length);
  range.setNumberFormat('@');                    // всё как текст: даты и числа не искажаются
  range.setValues(rows);
  sh.getRange(1, 1, 1, cols.length).setFontWeight('bold');
  sh.setFrozenRows(1);

  const metaRows = [];
  Object.keys(data.deleted || {}).forEach(function (k) { metaRows.push(['deleted', k, String(data.deleted[k])]); });
  Object.keys(data.stats || {}).forEach(function (d) { metaRows.push(['stats', d, JSON.stringify(data.stats[d])]); });
  let meta = ss.getSheetByName(SHEET_META);
  if (!meta) { meta = ss.insertSheet(SHEET_META); meta.hideSheet(); }
  meta.clearContents();
  if (metaRows.length) {
    const r = meta.getRange(1, 1, metaRows.length, 3);
    r.setNumberFormat('@');
    r.setValues(metaRows);
  }
  return { ok: true, saved: rows.length - 1 };
}

/**
 * Ручные правки на листе WordFlow: отмечаем время изменения строки,
 * чтобы при следующей синхронизации приложение взяло вашу правку.
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (sh.getName() !== SHEET_WORDS) return;
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const col = head.indexOf('updated') + 1;
  if (!col) return;
  const r1 = Math.max(2, e.range.getRow()), r2 = e.range.getLastRow();
  if (r2 < r1) return;
  if (e.range.getColumn() === col && e.range.getNumColumns() === 1) return;
  const now = String(Date.now());
  const vals = [];
  for (let i = r1; i <= r2; i++) vals.push([now]);
  sh.getRange(r1, col, vals.length, 1).setNumberFormat('@').setValues(vals);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
