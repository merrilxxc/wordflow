/* Строители 48 объектов-наград. Арт целиком рисуется кодом, без внешних файлов. */
import * as THREE from 'three';
import { hash2 } from './noise.js';

const M = (c, o = {}) => new THREE.MeshStandardMaterial({
  color: c, roughness: o.r ?? 0.85, metalness: o.m ?? 0,
  flatShading: o.flat !== false, emissive: o.e || 0x000000, emissiveIntensity: o.ei ?? 1,
  transparent: !!o.t, opacity: o.o ?? 1, side: o.side || THREE.FrontSide
});
const MAT = {
  wood: M('#8a5f3a'), dark: M('#5a4029'), stone: M('#9b9a94'), stoneD: M('#76756f'),
  white: M('#eef2f6'), red: M('#c0473f'), roof: M('#8d4a3c'), roof2: M('#4a6b8a'),
  leaf: M('#5f9a46'), pink: M('#f3a7c4'), gold: M('#e3b857', { m: .3, r: .4 }),
  glow: M('#ffd98a', { e: 0xffb347, ei: 2.4 }), glass: M('#9fd8e8', { t: 1, o: .42, r: .15 })
};
MAT.fur = M('#a97b4f'); MAT.furD = M('#7d5a39'); MAT.furR = M('#d2763c');
MAT.furW = M('#efe9e0'); MAT.metal = M('#b9c2ca', { m: .55, r: .35 });

const add = (p, o) => { p.add(o); return o; };
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, s = 8) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), mat);
const cone = (r, h, mat, s = 6) => new THREE.Mesh(new THREE.ConeGeometry(r, h, s), mat);
const ico = (r, mat, d = 0) => new THREE.Mesh(new THREE.IcosahedronGeometry(r, d), mat);
const put = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };

/* --- базовые кирпичи --- */
function house({ w = 1.5, d = 1.3, h = 1.1, wall = MAT.white, roof = MAT.roof, type = 'gable', windows = true }) {
  const g = new THREE.Group();
  g.add(put(box(w, h, d, wall), 0, h / 2, 0));
  if (type === 'gable') {
    const r = cone(Math.max(w, d) * 0.78, h * 0.72, roof, 4);
    r.rotation.y = Math.PI / 4; g.add(put(r, 0, h + h * 0.36, 0));
  } else if (type === 'dome') {
    const dm = new THREE.Mesh(new THREE.SphereGeometry(w * 0.56, 12, 8, 0, 6.283, 0, Math.PI / 2), roof);
    g.add(put(dm, 0, h, 0));
  } else {
    g.add(put(box(w * 1.1, h * 0.14, d * 1.1, roof), 0, h + h * 0.07, 0));
  }
  if (windows) for (const sx of [-1, 1]) {
    const win = box(w * 0.2, h * 0.24, 0.06, MAT.glow);
    win.userData.lamp = true;
    g.add(put(win, sx * w * 0.26, h * 0.5, d / 2 + 0.03));
  }
  return g;
}
function towerBuild({ h = 3.2, r = 0.5, body = MAT.stone, cap = MAT.roof, stripes = false, lamp = false, clock = false }) {
  const g = new THREE.Group();
  const b = cyl(r * 0.82, r, h, body, 10); g.add(put(b, 0, h / 2, 0));
  if (stripes) for (let i = 0; i < 3; i++) {
    const s = cyl(r * 0.84 + 0.02, r * 0.95 + 0.02, h * 0.14, MAT.red, 10);
    g.add(put(s, 0, h * (0.22 + i * 0.26), 0));
  }
  g.add(put(cyl(r * 1.25, r * 1.25, h * 0.08, MAT.stoneD, 10), 0, h, 0));
  if (lamp) {
    const l = cyl(r * 0.72, r * 0.72, h * 0.18, MAT.glow, 8); l.userData.lamp = true;
    g.add(put(l, 0, h + h * 0.13, 0));
    const pl = new THREE.PointLight(0xffc96b, 0, 24); pl.position.set(0, h + h * 0.13, 0);
    pl.userData.lamp = true; g.add(pl);
  }
  if (clock) {
    const f = cyl(r * 0.6, r * 0.6, 0.08, MAT.white, 12); f.rotation.x = Math.PI / 2;
    g.add(put(f, 0, h * 0.82, r * 0.8));
  }
  g.add(put(cone(r * 1.35, h * 0.42, cap, 8), 0, h + h * 0.26, 0));
  return g;
}
function animal({ fur = MAT.fur, s = 1, antlers = false, tail = false, long = false }) {
  const g = new THREE.Group();
  const bw = 0.62 * s, bh = 0.34 * s;
  g.add(put(box(bw, bh, 0.3 * s, fur), 0, 0.42 * s, 0));
  for (const dx of [-1, 1]) for (const dz of [-1, 1])
    g.add(put(cyl(0.05 * s, 0.05 * s, 0.4 * s, fur, 5), dx * bw * 0.33, 0.2 * s, dz * 0.1 * s));
  const nk = cyl(0.09 * s, 0.11 * s, 0.3 * s, fur, 6); nk.rotation.z = -0.3;
  g.add(put(nk, bw * 0.46, 0.62 * s, 0));
  const hd = box(0.26 * s, 0.2 * s, 0.19 * s, fur);
  g.add(put(hd, bw * 0.62, 0.76 * s, 0));
  for (const dz of [-1, 1]) {
    const ear = cone(0.05 * s, 0.13 * s, fur, 4);
    g.add(put(ear, bw * 0.58, 0.88 * s, dz * 0.07 * s));
  }
  if (antlers) for (const dz of [-1, 1]) {
    const a = new THREE.Group();
    a.add(put(cyl(0.02 * s, 0.025 * s, 0.34 * s, MAT.dark, 4), 0, 0.17 * s, 0));
    add(a, put(cyl(0.015 * s, 0.02 * s, 0.2 * s, MAT.dark, 4), 0.09 * s, 0.3 * s, 0)).rotation.z = -0.7;
    a.rotation.z = dz * 0.22; a.position.set(bw * 0.58, 0.86 * s, dz * 0.08 * s);
    g.add(a);
  }
  if (tail) { const t = cone(0.09 * s, 0.34 * s, MAT.furW, 5); t.rotation.z = 1.5;
    g.add(put(t, -bw * 0.62, 0.46 * s, 0)); }
  g.traverse(o => o.isMesh && (o.castShadow = true));
  return g;
}
function treeObj(kind) {
  const g = new THREE.Group();
  if (kind === 'sakura') {
    g.add(put(cyl(0.12, 0.22, 1.6, MAT.wood, 6), 0, 0.8, 0));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.283, rr = 0.55 + (i % 3) * 0.22;
      const b = ico(0.52 + (i % 2) * 0.16, MAT.pink, 0);
      b.scale.y = 0.72;
      g.add(put(b, Math.cos(a) * rr, 1.7 + (i % 3) * 0.26, Math.sin(a) * rr));
    }
  } else {
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * 6.283;
      const t = new THREE.Group();
      t.add(put(cyl(0.08, 0.13, 0.85, MAT.wood, 5), 0, 0.42, 0));
      const c = ico(0.46, MAT.leaf, 0); c.scale.y = 0.85;
      t.add(put(c, 0, 1.0, 0));
      for (let f = 0; f < 4; f++) {
        const fa = f * 1.57;
        t.add(put(ico(0.07, MAT.red, 0), Math.cos(fa) * 0.34, 0.95 + (f % 2) * 0.16, Math.sin(fa) * 0.34));
      }
      g.add(put(t, Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95));
    }
  }
  g.traverse(o => o.isMesh && (o.castShadow = true));
  return g;
}
function boatObj(s = 1, sail = false, big = false) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.17 * s, 1.5 * s, 5, 1, false, 0, Math.PI), MAT.wood);
  hull.rotation.set(0, 0, Math.PI / 2); hull.rotation.x = Math.PI;
  g.add(put(hull, 0, 0.14 * s, 0));
  if (big) g.add(put(box(0.5 * s, 0.3 * s, 0.4 * s, MAT.white), -0.25 * s, 0.33 * s, 0));
  if (sail) {
    g.add(put(cyl(0.025 * s, 0.03 * s, 1.5 * s, MAT.dark, 5), 0.1 * s, 0.9 * s, 0));
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(0.75 * s, 1.0 * s),
      M('#f3efe4', { side: THREE.DoubleSide }));
    g.add(put(sl, 0.1 * s, 1.0 * s, 0, Math.PI / 2));
  }
  g.traverse(o => o.isMesh && (o.castShadow = true));
  return g;
}

/* --- таблица строителей --- */
const BUILD = {
  campfire: () => { const g = new THREE.Group();
    for (let i = 0; i < 6; i++) { const a = i * 1.047;
      add(g, put(cyl(0.05, 0.07, 0.55, MAT.wood, 4), Math.cos(a) * 0.17, 0.26, Math.sin(a) * 0.17)).rotation.z = Math.cos(a) * 0.35; }
    for (let i = 0; i < 8; i++) { const a = i * 0.785;
      g.add(put(ico(0.1, MAT.stoneD, 0), Math.cos(a) * 0.52, 0.05, Math.sin(a) * 0.52)); }
    const f = cone(0.26, 0.7, M('#ff9a3c', { e: 0xff6a1a, ei: 2.6 }), 5);
    f.userData.flame = true; g.add(put(f, 0, 0.5, 0));
    const pl = new THREE.PointLight(0xff8a3c, 2.4, 11); pl.position.set(0, 0.7, 0);
    pl.userData.fire = true; g.add(pl); return g; },
  house_s:  () => house({ w: 1.3, d: 1.1, h: 0.95, wall: M('#e4d6bd'), roof: M('#8d4a3c') }),
  house_s2: () => house({ w: 1.25, d: 1.1, h: 1.0, wall: M('#d8e2e8'), roof: M('#4a6b8a') }),
  house_m:  () => { const g = house({ w: 1.9, d: 1.5, h: 1.2, wall: M('#efe3cc'), roof: M('#a4533f') });
    g.add(put(cyl(0.14, 0.16, 0.7, MAT.stoneD, 6), 0.6, 1.75, 0)); return g; },
  house_l:  () => { const g = house({ w: 2.8, d: 1.9, h: 1.7, wall: M('#e9e2d4'), roof: M('#6a5a7a'), type: 'flat' });
    for (let i = -1; i <= 1; i++) g.add(put(cyl(0.11, 0.11, 1.7, MAT.white, 8), i * 0.85, 0.85, 1.02));
    add(g, put(cone(1.6, 0.6, M('#6a5a7a'), 4), 0, 2.05, 0)).rotation.y = Math.PI / 4; return g; },
  well:     () => { const g = new THREE.Group();
    g.add(put(cyl(0.42, 0.45, 0.5, MAT.stone, 10), 0, 0.25, 0));
    for (const dx of [-1, 1]) g.add(put(cyl(0.05, 0.05, 0.95, MAT.wood, 4), dx * 0.34, 0.72, 0));
    add(g, put(cone(0.62, 0.42, MAT.roof, 4), 0, 1.4, 0)).rotation.y = Math.PI / 4;
    g.add(put(box(0.16, 0.16, 0.16, MAT.dark), 0, 0.95, 0)); return g; },
  garden:   () => { const g = new THREE.Group();
    for (let r = 0; r < 3; r++) { g.add(put(box(1.5, 0.12, 0.26, M('#6b4a32')), 0, 0.06, (r - 1) * 0.38));
      for (let c = 0; c < 5; c++) g.add(put(ico(0.12, M('#4f8a3a'), 0), (c - 2) * 0.32, 0.2, (r - 1) * 0.38)); }
    return g; },
  scarecrow:() => { const g = new THREE.Group();
    g.add(put(cyl(0.05, 0.06, 1.5, MAT.wood, 4), 0, 0.75, 0));
    g.add(put(box(1.1, 0.07, 0.07, MAT.wood), 0, 1.15, 0));
    g.add(put(box(0.38, 0.5, 0.2, M('#c2543f')), 0, 1.0, 0));
    g.add(put(ico(0.21, M('#e0cb8a'), 0), 0, 1.45, 0));
    g.add(put(cone(0.36, 0.22, M('#caa85e'), 7), 0, 1.62, 0)); return g; },
  dog:      () => animal({ fur: M('#c8a06a'), s: 0.68, tail: true }),
  goat:     () => { const g = new THREE.Group();
    g.add(put(animal({ fur: MAT.furW, s: 0.72 }), 0, 0, 0));
    g.add(put(animal({ fur: M('#d8cec0'), s: 0.6 }), 0.9, 0, 0.5, 1.1)); return g; },
  deer:     () => animal({ fur: M('#9c6b42'), s: 1.1, antlers: true }),
  fox:      () => animal({ fur: MAT.furR, s: 0.72, tail: true }),
  vane:     () => { const g = new THREE.Group();
    g.add(put(cyl(0.05, 0.07, 2.0, MAT.dark, 5), 0, 1.0, 0));
    const a = new THREE.Group();
    add(a, put(cone(0.13, 0.42, MAT.gold, 4), 0.3, 0, 0)).rotation.z = -1.57;
    a.add(put(box(0.34, 0.2, 0.03, MAT.gold), -0.22, 0, 0));
    a.userData.spin = 0.4; g.add(put(a, 0, 2.05, 0)); return g; },
  lanterns: () => { const g = new THREE.Group();
    for (let i = 0; i < 6; i++) { const x = (i - 2.5) * 0.62, z = Math.sin(i * 0.9) * 0.4;
      g.add(put(cyl(0.035, 0.045, 0.9, MAT.dark, 4), x, 0.45, z));
      const l = ico(0.13, MAT.glow, 0); l.userData.lamp = true; g.add(put(l, x, 1.0, z)); }
    const pl = new THREE.PointLight(0xffc96b, 0, 9); pl.position.set(0, 1.1, 0);
    pl.userData.lamp = true; g.add(pl); return g; },
  swing:    () => { const g = new THREE.Group();
    g.add(put(cyl(0.16, 0.24, 1.9, MAT.wood, 6), 0, 0.95, 0));
    const c = ico(0.95, MAT.leaf, 0); c.scale.y = 0.72; g.add(put(c, 0, 2.2, 0));
    g.add(put(ico(0.6, M('#4f8a3a'), 0), 0.6, 2.05, 0.3));
    for (const dz of [-1, 1]) g.add(put(cyl(0.012, 0.012, 0.9, MAT.dark, 3), 0.75, 1.1, dz * 0.17));
    const s = box(0.5, 0.06, 0.3, MAT.wood); s.userData.sway = true;
    g.add(put(s, 0.75, 0.66, 0)); return g; },
  windmill: () => { const g = new THREE.Group();
    g.add(put(cyl(0.52, 0.78, 2.2, M('#e6ddc8'), 8), 0, 1.1, 0));
    g.add(put(cone(0.95, 0.65, MAT.roof, 8), 0, 2.5, 0));
    const bl = new THREE.Group();
    for (let i = 0; i < 4; i++) { const a = i * 1.5708;
      const b = box(0.12, 1.5, 0.04, M('#d9cfb6'));
      b.position.set(Math.sin(a) * 0.75, Math.cos(a) * 0.75, 0); b.rotation.z = -a; bl.add(b); }
    bl.userData.spin = 0.55; bl.position.set(0, 2.2, 0.85); g.add(bl); return g; },
  turbine:  () => { const g = new THREE.Group();
    g.add(put(cyl(0.1, 0.19, 3.4, MAT.white, 9), 0, 1.7, 0));
    const bl = new THREE.Group();
    for (let i = 0; i < 3; i++) { const a = i * 2.094;
      const b = box(0.1, 1.5, 0.03, MAT.white);
      b.position.set(Math.sin(a) * 0.75, Math.cos(a) * 0.75, 0); b.rotation.z = -a; bl.add(b); }
    bl.userData.spin = 1.1; bl.position.set(0, 3.45, 0.14); g.add(bl); return g; },
  pier:     () => { const g = new THREE.Group();
    for (let i = 0; i < 6; i++) for (const dz of [-1, 1])
      g.add(put(cyl(0.06, 0.06, 1.1, MAT.dark, 4), i * 0.5 - 1.2, -0.1, dz * 0.35));
    g.add(put(box(3.4, 0.1, 0.9, MAT.wood), 0.3, 0.42, 0));
    g.add(put(cyl(0.09, 0.09, 0.5, MAT.dark, 6), 1.85, 0.6, 0.3)); return g; },
  boat:     () => boatObj(1, true),
  ship:     () => boatObj(2.1, true, true),
  pond:     () => { const g = new THREE.Group();
    const w = new THREE.Mesh(new THREE.CircleGeometry(1.25, 18), M('#3f93a8', { t: 1, o: .82, r: .2 }));
    w.rotation.x = -Math.PI / 2; g.add(put(w, 0, 0.06, 0));
    for (let i = 0; i < 10; i++) { const a = i * 0.628, rr = 1.3 + (i % 2) * 0.12;
      g.add(put(ico(0.15, MAT.stoneD, 0), Math.cos(a) * rr, 0.04, Math.sin(a) * rr)); }
    for (let i = 0; i < 5; i++) { const a = i * 1.26, rr = 0.5 + (i % 3) * 0.25;
      const p = new THREE.Mesh(new THREE.CircleGeometry(0.22, 7), M('#4f8a3a', { side: THREE.DoubleSide }));
      p.rotation.x = -Math.PI / 2; g.add(put(p, Math.cos(a) * rr, 0.09, Math.sin(a) * rr));
      if (i % 2) g.add(put(ico(0.08, MAT.pink, 0), Math.cos(a) * rr, 0.16, Math.sin(a) * rr)); }
    return g; },
  hives:    () => { const g = new THREE.Group();
    for (let i = 0; i < 3; i++) { const x = (i - 1) * 0.72;
      g.add(put(box(0.46, 0.5, 0.42, M('#e0c070')), x, 0.25, 0));
      g.add(put(box(0.54, 0.08, 0.5, MAT.dark), x, 0.54, 0)); }
    return g; },
  sakura:   () => treeObj('sakura'),
  orchard:  () => treeObj('fruit'),
  bridge:   () => { const g = new THREE.Group();
    const seg = 9;
    for (let i = 0; i < seg; i++) { const t = i / (seg - 1), x = (t - 0.5) * 4.2;
      const y = Math.sin(t * Math.PI) * 0.6;
      g.add(put(box(0.55, 0.12, 1.0, MAT.stone), x, y + 0.3, 0));
      if (i % 2 === 0) for (const dz of [-1, 1])
        g.add(put(cyl(0.05, 0.05, 0.42, MAT.stoneD, 4), x, y + 0.56, dz * 0.42)); }
    return g; },
  waterfall:() => { const g = new THREE.Group();
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.6), M('#bfe6f2', { t: 1, o: .72, side: THREE.DoubleSide }));
    w.userData.flow = true; g.add(put(w, 0, 1.3, 0));
    for (let i = 0; i < 7; i++) { const a = i * 0.9;
      g.add(put(ico(0.3 + (i % 3) * 0.14, MAT.stoneD, 0), Math.cos(a) * 0.95, 0.2 + (i % 2) * 0.3, Math.sin(a) * 0.75)); }
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.85, 14), M('#9fdcea', { t: 1, o: .8 }));
    f.rotation.x = -Math.PI / 2; g.add(put(f, 0, 0.1, 0)); return g; },
  watchtower:() => { const g = new THREE.Group();
    for (const dx of [-1, 1]) for (const dz of [-1, 1])
      add(g, put(cyl(0.06, 0.1, 2.2, MAT.wood, 4), dx * 0.38, 1.1, dz * 0.38)).rotation.set(dz * 0.05, 0, -dx * 0.05);
    g.add(put(box(1.3, 0.1, 1.3, MAT.wood), 0, 2.2, 0));
    for (const dz of [-1, 1]) g.add(put(box(1.3, 0.35, 0.07, MAT.wood), 0, 2.42, dz * 0.62));
    add(g, put(cone(1.1, 0.55, MAT.roof, 4), 0, 2.95, 0)).rotation.y = Math.PI / 4; return g; },
  rockgarden:() => { const g = new THREE.Group();
    const s = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), M('#ded5c2'));
    s.rotation.x = -Math.PI / 2; g.add(put(s, 0, 0.07, 0));
    for (let i = 0; i < 5; i++) { const a = i * 1.26, rr = 0.3 + (i % 3) * 0.45;
      const r = ico(0.22 + (i % 3) * 0.14, MAT.stoneD, 0); r.scale.y = 1.3 + (i % 2) * 0.5;
      g.add(put(r, Math.cos(a) * rr, 0.16, Math.sin(a) * rr, a)); }
    return g; },
  tents:    () => { const g = new THREE.Group();
    const CL = ['#c9553f', '#3f7fc9', '#d9a63f'];
    for (let i = 0; i < 3; i++) { const a = i * 2.09;
      const t = cone(0.55, 0.85, M(CL[i]), 4); t.rotation.y = Math.PI / 4;
      g.add(put(t, Math.cos(a) * 0.9, 0.42, Math.sin(a) * 0.9)); }
    g.add(put(BUILD.campfire(), 0, 0, 0)); return g; },
  lighthouse:() => towerBuild({ h: 4.0, r: 0.6, body: MAT.white, cap: M('#b8463c'), stripes: true, lamp: true }),
  tower:    () => towerBuild({ h: 4.6, r: 0.75, body: M('#b6b2a6'), cap: M('#5c6f8a') }),
  clocktower:() => towerBuild({ h: 3.4, r: 0.55, body: M('#ddd3bf'), cap: M('#7a4a5c'), clock: true }),
  observatory:() => { const g = new THREE.Group();
    g.add(put(cyl(1.0, 1.15, 1.0, M('#dcd7cc'), 12), 0, 0.5, 0));
    const d = new THREE.Mesh(new THREE.SphereGeometry(1.02, 16, 10, 0, 6.283, 0, Math.PI / 2), MAT.metal);
    g.add(put(d, 0, 1.0, 0));
    const tb = cyl(0.13, 0.17, 1.2, MAT.dark, 7); tb.rotation.z = -0.65;
    g.add(put(tb, 0.3, 1.5, 0)); return g; },
  greenhouse:() => { const g = new THREE.Group();
    g.add(put(box(2.0, 0.9, 1.3, MAT.glass), 0, 0.45, 0));
    g.add(put(box(2.05, 0.08, 1.35, MAT.white), 0, 0.06, 0));
    const r = cone(1.35, 0.5, MAT.glass, 4); r.rotation.y = Math.PI / 4;
    g.add(put(r, 0, 1.15, 0));
    for (let i = 0; i < 4; i++) g.add(put(ico(0.16, M('#4f8a3a'), 0), (i - 1.5) * 0.45, 0.3, 0)); return g; },
  spring:   () => { const g = new THREE.Group();
    const w = new THREE.Mesh(new THREE.CircleGeometry(1.0, 16), M('#8fd4d8', { t: 1, o: .85, e: 0x2a6a70, ei: .4 }));
    w.rotation.x = -Math.PI / 2; g.add(put(w, 0, 0.1, 0));
    for (let i = 0; i < 9; i++) { const a = i * 0.7;
      g.add(put(ico(0.2 + (i % 3) * 0.1, M('#8a8580'), 0), Math.cos(a) * 1.1, 0.08, Math.sin(a) * 1.1)); }
    for (let i = 0; i < 4; i++) { const s = ico(0.22, M('#ffffff', { t: 1, o: .2 }), 0);
      s.userData.steam = i; g.add(put(s, (i % 2 - .5) * 0.5, 0.5 + i * 0.3, (i % 3 - 1) * 0.3)); }
    return g; },
  ropeway:  () => { const g = new THREE.Group();
    for (const dx of [-1, 1]) { const p = new THREE.Group();
      for (const dz of [-1, 1]) p.add(put(cyl(0.05, 0.08, 2.4, MAT.metal, 4), 0, 1.2, dz * 0.25));
      p.add(put(box(0.6, 0.1, 0.7, MAT.metal), 0, 2.4, 0));
      g.add(put(p, dx * 2.6, 0, 0)); }
    const rope = cyl(0.02, 0.02, 5.2, MAT.dark, 4); rope.rotation.z = Math.PI / 2;
    g.add(put(rope, 0, 2.45, 0));
    const cab = box(0.5, 0.45, 0.4, M('#d9544a')); cab.userData.ride = true;
    g.add(put(cab, 0, 2.1, 0)); return g; },
  temple:   () => { const g = new THREE.Group();
    g.add(put(box(2.6, 0.3, 2.0, MAT.stone), 0, 0.15, 0));
    g.add(put(box(2.2, 0.22, 1.7, M('#c9c2b2')), 0, 0.4, 0));
    for (const dx of [-1, 0, 1]) for (const dz of [-1, 1])
      g.add(put(cyl(0.1, 0.11, 1.1, M('#b8503f'), 8), dx * 0.8, 1.05, dz * 0.62));
    g.add(put(box(2.5, 0.12, 1.9, MAT.dark), 0, 1.65, 0));
    const r = cone(1.8, 0.75, M('#8e3f33'), 4); r.rotation.y = Math.PI / 4;
    g.add(put(r, 0, 2.05, 0));
    g.add(put(ico(0.14, MAT.gold, 0), 0, 2.5, 0)); return g; },
  torii:    () => { const g = new THREE.Group();
    for (const dx of [-1, 1]) g.add(put(cyl(0.11, 0.14, 2.2, M('#c2493c'), 7), dx * 0.85, 1.1, 0));
    g.add(put(box(2.5, 0.16, 0.22, M('#c2493c')), 0, 2.0, 0));
    g.add(put(box(2.9, 0.18, 0.3, M('#a83c30')), 0, 2.28, 0)); return g; },
  waterwheel:() => { const g = new THREE.Group();
    const w = new THREE.Group();
    add(w, put(cyl(0.12, 0.12, 0.5, MAT.wood, 8), 0, 0, 0)).rotation.x = Math.PI / 2;
    for (let i = 0; i < 10; i++) { const a = i * 0.628;
      const b = box(0.12, 0.9, 0.5, MAT.wood);
      b.position.set(Math.sin(a) * 0.52, Math.cos(a) * 0.52, 0); b.rotation.z = -a; w.add(b); }
    for (const dz of [-1, 1]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.05, 6, 16), MAT.dark);
      w.add(put(rim, 0, 0, dz * 0.28)); }
    w.userData.spin = 0.5; g.add(put(w, 0, 1.0, 0));
    g.add(put(box(0.7, 1.4, 0.9, MAT.stone), -1.0, 0.7, 0)); return g; },
  statue:   () => { const g = new THREE.Group();
    g.add(put(box(0.9, 0.25, 0.9, MAT.stoneD), 0, 0.12, 0));
    g.add(put(box(0.65, 0.2, 0.65, MAT.stone), 0, 0.33, 0));
    g.add(put(cyl(0.2, 0.26, 0.9, M('#cfcabc'), 8), 0, 0.88, 0));
    g.add(put(ico(0.19, M('#cfcabc'), 0), 0, 1.45, 0));
    const arm = cyl(0.07, 0.07, 0.6, M('#cfcabc'), 5); arm.rotation.z = -0.9;
    g.add(put(arm, 0.24, 1.15, 0)); return g; },
  balloon:  () => { const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 12), M('#e0584f'));
    b.scale.y = 1.25; g.add(put(b, 0, 1.6, 0));
    for (let i = 0; i < 4; i++) { const a = i * 1.57;
      g.add(put(cyl(0.012, 0.012, 0.6, MAT.dark, 3), Math.cos(a) * 0.3, 0.75, Math.sin(a) * 0.3)); }
    g.add(put(box(0.45, 0.35, 0.45, MAT.wood), 0, 0.3, 0));
    g.userData.bob = true; return g; },
  cranes:   () => { const g = new THREE.Group();
    for (let i = 0; i < 5; i++) { const b = new THREE.Group();
      add(b, put(cyl(0.07, 0.1, 0.5, MAT.white, 5), 0, 0, 0)).rotation.z = Math.PI / 2;
      for (const dz of [-1, 1]) { const w = box(0.5, 0.03, 0.22, MAT.white);
        w.userData.wing = dz; b.add(put(w, 0, 0.03, dz * 0.2)); }
      add(b, put(cone(0.05, 0.18, MAT.dark, 4), 0.3, 0, 0)).rotation.z = -1.57;
      b.position.set((i % 3 - 1) * 1.4, (i % 2) * 0.7, Math.floor(i / 3) * 1.3);
      g.add(b); }
    g.userData.flock = true; return g; },
  whales:   () => { const g = new THREE.Group();
    for (let i = 0; i < 2; i++) { const w = new THREE.Group();
      const b = ico(0.9, M('#44576e'), 1); b.scale.set(2.2, 0.7, 0.85); w.add(b);
      const t = cone(0.5, 0.8, M('#44576e'), 4); t.rotation.z = 1.9;
      w.add(put(t, -2.0, 0.1, 0));
      w.add(put(box(0.1, 0.5, 0.1, M('#cfe6f0', { t: 1, o: .6 })), 0.4, 0.8, 0));
      w.position.set(i * 3.4, 0, i * 1.6); w.rotation.y = i * 0.4;
      w.userData.swim = i; g.add(w); }
    return g; },
  fireflies:() => { const g = new THREE.Group();
    for (let i = 0; i < 3; i++) { const a = i * 2.09;
      g.add(put(cyl(0.11, 0.17, 1.5, MAT.wood, 5), Math.cos(a) * 0.8, 0.75, Math.sin(a) * 0.8));
      const c = ico(0.55, M('#3d6b35'), 0); c.scale.y = .8;
      g.add(put(c, Math.cos(a) * 0.8, 1.75, Math.sin(a) * 0.8)); }
    const n = 46, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const a = hash2(i, 401) * 6.283, rr = hash2(i, 403) * 1.8;
      pos[i*3] = Math.cos(a) * rr; pos[i*3+1] = 0.4 + hash2(i, 405) * 1.8; pos[i*3+2] = Math.sin(a) * rr; }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(bg, new THREE.PointsMaterial({ color: 0xffe79a, size: 0.16,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pts.userData.flies = true; g.add(pts); return g; },
  crystals: () => { const g = new THREE.Group();
    for (let i = 0; i < 7; i++) { const a = i * 0.9, rr = 0.2 + (i % 3) * 0.4;
      const c = cone(0.16 + (i % 3) * 0.08, 0.8 + (i % 4) * 0.5,
        M(['#7fd8ff', '#b98dff', '#7ff0d0'][i % 3], { t: 1, o: .78, e: 0x3a6fa0, ei: .9, r: .15 }), 5);
      c.userData.lamp = true;
      add(g, put(c, Math.cos(a) * rr, 0.4 + (i % 4) * 0.25, Math.sin(a) * rr, a)).rotation.z = Math.cos(a) * 0.2; }
    const pl = new THREE.PointLight(0x7fd8ff, 0.9, 10); pl.position.y = 1;
    pl.userData.lamp = true; g.add(pl); return g; },
  fountain: () => { const g = new THREE.Group();
    g.add(put(cyl(1.15, 1.2, 0.34, MAT.stone, 14), 0, 0.17, 0));
    const w = new THREE.Mesh(new THREE.CircleGeometry(1.02, 16), M('#6fc3d8', { t: 1, o: .85 }));
    w.rotation.x = -Math.PI / 2; g.add(put(w, 0, 0.3, 0));
    g.add(put(cyl(0.16, 0.2, 0.7, MAT.stone, 8), 0, 0.6, 0));
    g.add(put(cyl(0.55, 0.1, 0.12, MAT.stone, 12), 0, 0.98, 0));
    const j = cyl(0.04, 0.09, 0.8, M('#cfeef6', { t: 1, o: .6 }), 6);
    j.userData.jet = true; g.add(put(j, 0, 1.4, 0)); return g; },
  circle:   () => { const g = new THREE.Group();
    for (let i = 0; i < 8; i++) { const a = i * 0.785;
      const s = box(0.3, 1.3 + (i % 3) * 0.3, 0.22, MAT.stoneD);
      g.add(put(s, Math.cos(a) * 1.5, 0.65 + (i % 3) * 0.15, Math.sin(a) * 1.5, a)); }
    g.add(put(box(1.1, 0.2, 0.7, MAT.stone), 0, 0.1, 0)); return g; },
  aurora:   () => { const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(44, 13, 26, 1),
        M(['#5cf2b0', '#56c8f0', '#a07ef0', '#5cf2d8'][i], { t: 1, o: .2, side: THREE.DoubleSide,
          e: 0x224466, ei: .6, flat: false }));
      p.material.depthWrite = false; p.material.blending = THREE.AdditiveBlending;
      p.userData.aur = i; g.add(put(p, (i - 1.5) * 7, 24 + i * 2.2, -30 - i * 5, i * 0.12)); }
    g.userData.sky = true; return g; }
};

export { BUILD, MAT, M, box, cyl, cone, ico, put, add, house };
