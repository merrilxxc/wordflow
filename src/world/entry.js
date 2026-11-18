/* Точка входа бандла: всё, что нужно приложению, кладётся в window.WF3D. */
import { createWorld, worldSize, worldHealth } from './engine.js';
import { REWARDS, BIO, SEASONS, seasonOf } from './art.js';

/** Сопоставить модули курса с объектами-наградами.
    Сначала по «уровень-номер», остальные — по порядку. */
function defsFromModules(mods) {
  const byKey = new Map();
  REWARDS.forEach((r, i) => byKey.set(`${r[0]}-${r[1]}`, { r, i, used: false }));
  const spare = () => REWARDS.map((r, i) => ({ r, i })).filter(x => !byKey.get(`${x.r[0]}-${x.r[1]}`).used);
  const out = [];
  const pick = m => {
    const hit = byKey.get(`${m.level}-${m.n}`);
    if (hit && !hit.used) { hit.used = true; return hit.r; }
    const s = spare()[0];
    if (s) { byKey.get(`${s.r[0]}-${s.r[1]}`).used = true; return s.r; }
    return REWARDS[out.length % REWARDS.length];
  };
  mods.forEach(m => {
    const r = pick(m);
    out.push({ moduleId: m.id, level: m.level, n: m.n, moduleTopic: m.topic || r[2],
               name: r[3], kind: r[4], word: r[5], ipa: r[6], ru: r[7], where: r[8], artLevel: r[0] });
  });
  return out;
}

/** Дни из store.stats: 'full' — норма выполнена, 'part' — была сессия, 'miss' — пропуск. */
function daysFromStats(stats, perDay = 10, back = 120) {
  const out = [], now = new Date();
  for (let i = back - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let s = 0, a = 0, n = 0;
    for (const v of Object.values(stats[key] || {})) { s += +v.s || 0; a += +v.a || 0; n += +v.n || 0; }
    out.push(!s ? 'miss' : (n >= perDay || a >= 40) ? 'full' : 'part');
  }
  return out;
}

window.WF3D = { create: createWorld, worldSize, worldHealth, defsFromModules, daysFromStats,
                REWARDS, BIO, SEASONS, seasonOf, version: 1 };
