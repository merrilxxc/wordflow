/* =====================================================================
   WordFlow — остров прогресса. Движок.
   Весь арт рисуется кодом: ни одного внешнего файла, работает офлайн.
   ===================================================================== */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { hash2, fbm, setSeed, rngFrom } from './noise.js';
import { BUILD, M } from './builders.js';
import { REWARDS, BIO, SEASONS, seasonOf } from './art.js';

/* ---------- геометрия сетки ---------- */
const HS = 1.55, R_RINGS = 23, STEP = 0.62;
const hexX = q => HS * 1.5 * q;
const hexZ = (q, r) => HS * Math.sqrt(3) * (r + q / 2);
const hexDist = (q, r) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
const TYPE = { SAND: 1, GRASS: 2, ROCK: 3, SNOW: 4 };
const TYPE_COL = {
  [TYPE.SAND]:  ['#e8d7a6', '#dcc893', '#d9c48c'],
  [TYPE.GRASS]: ['#6fa84f', '#5e9544', '#7fb75c', '#558a3e'],
  [TYPE.ROCK]:  ['#8d8c88', '#7d7c79'],
  [TYPE.SNOW]:  ['#f0f4f8', '#e2e9f0']
};
const DRY_COL = {
  [TYPE.SAND]: ['#d8c49a'], [TYPE.GRASS]: ['#a98f4f', '#997f45', '#b59a58'],
  [TYPE.ROCK]: ['#7f7e7a'], [TYPE.SNOW]: ['#d9dee4']
};

/* ---------- палитры дня и ночи ---------- */
const C = h => new THREE.Color(h);
const DAY = {
  top: C('#79b7e8'), bot: C('#d9eaf6'), sun: C('#fff3d8'), sunI: 2.5,
  hemiS: C('#cfe6ff'), hemiG: C('#6f7a52'), hemiI: 0.88, amb: 0.36,
  fog: C('#cfe2f0'), fogN: 95, fogF: 400, water: C('#1f6f93'), waterSh: C('#5fc2c6'),
  expo: 1.16, bloom: 0.22
};
const NIGHT = {
  top: C('#0a1430'), bot: C('#1d2a4a'), sun: C('#9fb6e8'), sunI: 0.42,
  hemiS: C('#31446e'), hemiG: C('#141a26'), hemiI: 0.42, amb: 0.14,
  fog: C('#101a32'), fogN: 70, fogF: 330, water: C('#071a2c'), waterSh: C('#14425a'),
  expo: 1.22, bloom: 0.72
};

/* ---------- формула: статистика → размер и здоровье ---------- */
export function worldSize(knownWords, doneModules, totalModules = 48) {
  const w = Math.min(1, knownWords / 2500);
  const m = Math.min(1, doneModules / Math.max(1, totalModules));
  return Math.min(1, Math.pow(w, 0.75) * 0.65 + m * 0.35);
}
export function worldHealth(days) {
  let hp = 60, miss = 0;
  for (const d of days) {
    if (d === 'full') { hp += 12; miss = 0; }
    else if (d === 'part') { hp += 6; miss = 0; }
    else { miss++; hp -= Math.min(10, 5 + miss); }
    hp = Math.max(0, Math.min(100, hp));
  }
  return Math.round(hp);
}

const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(),
      tmpP = new THREE.Vector3(), tmpS = new THREE.Vector3(), tmpE = new THREE.Euler();
const setI = (mesh, i, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) => {
  tmpE.set(rx, ry, rz); tmpQ.setFromEuler(tmpE);
  tmpM.compose(tmpP.set(x, y, z), tmpQ, tmpS.set(sx, sy, sz));
  mesh.setMatrixAt(i, tmpM);
};
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const smooth = v => { v = clamp01(v); return v * v * (3 - 2 * v); };

/* =====================================================================
   Движок
   ===================================================================== */
export function createWorld(options = {}) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';

  const ua = navigator.userAgent;
  const isPhone = /Android|iPhone|iPad|iPod/i.test(ua) || Math.min(innerWidth, innerHeight) < 700;
  let Q = options.quality && options.quality !== 'auto' ? options.quality : (isPhone ? 'mid' : 'high');
  const LOD = {
    low:  { grass: 0,    flowers: 140, trees: 0.42, shadow: 0,    px: 1,    bloom: 0.6, fxaa: false, clouds: 5 },
    mid:  { grass: 4200, flowers: 320, trees: 0.70, shadow: 1024, px: 1.4,  bloom: 0.85, fxaa: false, clouds: 7 },
    high: { grass: 13000, flowers: 650, trees: 1.0, shadow: 2048, px: 2,    bloom: 1, fxaa: true, clouds: 9 }
  };
  let lod = LOD[Q] || LOD.mid;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lod.px));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = DAY.expo;
  renderer.shadowMap.enabled = lod.shadow > 0;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(DAY.fog.clone(), DAY.fogN, DAY.fogF);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 2000);

  /* небо */
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: DAY.top.clone() }, bot: { value: DAY.bot.clone() } },
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 top,bot; varying float h; void main(){ gl_FragColor = vec4(mix(bot,top,clamp(h*1.25+0.22,0.,1.)),1.); }'
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), skyMat);
  scene.add(sky);

  /* звёзды */
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { op: { value: 0 }, t: { value: 0 } },
    vertexShader: 'attribute float sz; varying float vs; void main(){ vs=sz; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=sz*(300./-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform float op,t; varying float vs; void main(){ float d=length(gl_PointCoord-0.5); if(d>0.5) discard; float a=(1.-d*2.)*op*(0.6+0.4*sin(t*2.+vs*40.)); gl_FragColor=vec4(1.,0.98,0.92,a); }'
  });
  {
    const n = 420, pos = new Float32Array(n * 3), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = hash2(i, 901), v = hash2(i, 903), th = u * 6.283, ph = Math.acos(v * 0.9);
      pos[i * 3] = Math.sin(ph) * Math.cos(th) * 700;
      pos[i * 3 + 1] = Math.abs(Math.cos(ph)) * 700;
      pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * 700;
      sz[i] = 1 + hash2(i, 905) * 2.4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('sz', new THREE.BufferAttribute(sz, 1));
    scene.add(new THREE.Points(g, starMat));
  }

  /* свет */
  const sun = new THREE.DirectionalLight(DAY.sun.clone(), DAY.sunI);
  sun.position.set(58, 78, 34);
  if (lod.shadow) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(lod.shadow, lod.shadow);
    sun.shadow.camera.left = -95; sun.shadow.camera.right = 95;
    sun.shadow.camera.top = 95; sun.shadow.camera.bottom = -95;
    sun.shadow.camera.near = 10; sun.shadow.camera.far = 320;
    sun.shadow.bias = -0.0012; sun.shadow.normalBias = 0.035;
  }
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(DAY.hemiS.clone(), DAY.hemiG.clone(), DAY.hemiI);
  const amb = new THREE.AmbientLight(0xffffff, DAY.amb);
  const fill = new THREE.DirectionalLight(0x9fc4ff, 0.5);
  fill.position.set(-50, 30, -40);
  scene.add(hemi, amb, fill);

  /* постобработка */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), DAY.bloom * lod.bloom, 0.75, 0.82);
  composer.addPass(bloom);
  let fxaa = null;
  if (lod.fxaa) { fxaa = new ShaderPass(FXAAShader); composer.addPass(fxaa); }

  const world = new THREE.Group(); scene.add(world);
  const clouds = new THREE.Group(); scene.add(clouds);

  /* ---------- состояние ---------- */
  let TILES = [], MAXD = 0, PEAK = { x: 0, z: 0 }, SEASON = SEASONS.summer;
  let tileMesh = null, seaMesh = null, grassMesh = null, flowerMesh = null, rockMesh = null;
  const veg = { meshes: [], items: [] };
  let rewards = [], rewardDefs = [];
  const state = { known: 0, mods: 0, hp: 100, total: 48, size: 0, rings: 0, aliveRings: 0, night: 0 };
  let nightWant = 0, animT0 = 0, settle = false, built = false;
  let disposed = false, active = false, rafId = 0, host = null;
  const cb = { pick: options.onPick || null, ready: options.onReady || null };
  let S_SEED = options.seed ?? 20261118;

  /* =================================================================
     Остров: рельеф
     Гора смещена к краю, центр — зелёный луг: ранние стадии должны быть
     красивыми, а не серо-белыми.
     ================================================================= */
  function hexGeo() {
    const g = new THREE.CylinderGeometry(HS, HS * 0.997, 1, 6, 1, false);
    g.translate(0, -0.5, 0);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const k = 1 - Math.pow(Math.min(1, -p.getY(i)), 0.62) * 0.62;
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }

  function buildTerrain() {
    TILES = []; MAXD = 0;
    /* гора — на внешней трети острова, чтобы центр оставался луговым */
    const a = hash2(7, 13) * 6.283, rr = (0.74 + hash2(3, 29) * 0.12) * R_RINGS * HS;
    PEAK = { x: Math.cos(a) * rr, z: Math.sin(a) * rr };
    const pr = Math.hypot(PEAK.x, PEAK.z) / (R_RINGS * HS);

    for (let q = -R_RINGS; q <= R_RINGS; q++) {
      const lo = Math.max(-R_RINGS, -q - R_RINGS), hi = Math.min(R_RINGS, -q + R_RINGS);
      for (let r = lo; r <= hi; r++) {
        const d = hexDist(q, r), x = hexX(q), z = hexZ(q, r);
        const n = fbm(x * 0.0185 + 37, z * 0.0185 + 91, 3);
        const hills = fbm(x * 0.041 + 133, z * 0.041 + 77, 3);
        const coast = fbm(x * 0.062 + 211, z * 0.062 + 177, 3);
        const fine = fbm(x * 0.115 + 61, z * 0.115 + 23, 2);
        const fo = Math.pow(d / R_RINGS, 2.3) * 1.16;
        const pd = Math.hypot(x - PEAK.x, z - PEAK.z) / (R_RINGS * HS);
        const peak = Math.pow(Math.max(0, 1 - pd / 0.33), 1.12) * 2.5;
        /* центр притянут к низине: сердце острова — ровный луг */
        const heart = Math.pow(Math.max(0, 1 - d / 5.0), 1.6);
        const calm = Math.pow(Math.max(0, 1 - pd / 0.30), 1.0);   // у вершины шум глушится
        let e = n * (0.98 - calm * 0.45) + hills * (0.64 - calm * 0.42) + coast * 0.3
              + fine * (0.12 - calm * 0.1) + peak - fo - 0.30;
        e = e * (1 - heart * 0.62) + heart * 0.16;
        if (e < -0.04) continue;
        const steps = Math.max(-1, Math.round(e * 13));
        let y = steps * STEP;
        /* внутренние озёра: дают берег и воду на любом удалении от центра,
           поэтому пристань и лодка всегда оказываются у воды */
        const lk = fbm(x * 0.047 + 903, z * 0.047 + 311, 2);
        const lake = lk > 0.655 && d > 2.6 && d < R_RINGS * 0.86 && pd > 0.26 && y < 5.4;
        if (lake) y = 0;
        let type;
        if (y < 1.0) type = TYPE.SAND;
        else if (pd < 0.17 && y > 12.5) type = TYPE.SNOW;
        else if (pd < 0.32 && y > 5.8) type = TYPE.ROCK;
        else type = TYPE.GRASS;
        TILES.push({ q, r, x, z, y, d, pd, type, lake, land: y > 0, rise: 0, yEff: y, free: true });
        MAXD = Math.max(MAXD, d);
      }
    }
    /* лёгкое сглаживание: каждый тайл подтягивается к соседям, пропадают
       одинокие столбы и рельеф читается склонами, а не кубиками */
    {
      const key = (q, r) => q * 1000 + r;
      const map = new Map(TILES.map(t => [key(t.q, t.r), t]));
      const NBS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
      for (let pass = 0; pass < 4; pass++) {
        const next = TILES.map(t => {
          if (!t.land || t.lake) return t.y;
          let sum = t.y * 1.8, n = 1.8;
          for (const [dq, dr] of NBS) {
            const nb = map.get(key(t.q + dq, t.r + dr));
            if (nb && nb.land && !nb.lake) { sum += nb.y; n++; }
          }
          return Math.round(sum / n / STEP) * STEP;
        });
        TILES.forEach((t, i) => { t.y = next[i]; });
      }
      TILES.forEach(t => {
        t.land = t.y > 0 && !t.lake;
        t.type = t.y < 1.0 ? TYPE.SAND
               : (t.pd < 0.17 && t.y > 12.5) ? TYPE.SNOW
               : (t.pd < 0.32 && t.y > 5.8) ? TYPE.ROCK : TYPE.GRASS;
      });
    }
    TILES.sort((a, b) => a.d - b.d || a.q - b.q);
    TILES.forEach((t, i) => t.i = i);

    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.94, metalness: 0 });
    tileMesh = new THREE.InstancedMesh(hexGeo(), mat, TILES.length);
    tileMesh.castShadow = tileMesh.receiveShadow = !!lod.shadow;
    tileMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const c = new THREE.Color(), sandW = new THREE.Color(TYPE_COL[TYPE.SAND][0]);
    TILES.forEach((t, i) => {
      const pal = TYPE_COL[t.type], dry = DRY_COL[t.type];
      const k = Math.floor(hash2(t.q * 7 + 3, t.r * 11 + 5) * pal.length);
      t.cWet = new THREE.Color(pal[k % pal.length]);
      t.cDry = new THREE.Color(dry[k % dry.length]);
      if (t.type === TYPE.GRASS) {
        const [h, s, l] = SEASON.grass;
        t.cWet.setHSL(h + (hash2(t.q, t.r) - 0.5) * 0.04, s, l * (0.88 + hash2(t.r, t.q) * 0.2));
      }
      if (SEASON.snow && t.type === TYPE.GRASS) t.cWet.lerp(new THREE.Color('#e6edf4'), SEASON.snow * (0.55 + hash2(t.r, t.q) * 0.3));
      const j = 0.92 + hash2(t.q * 3, t.r * 17) * 0.16;
      t.cWet.multiplyScalar(j * SEASON.tile); t.cDry.multiplyScalar(j);
      t.cSand = sandW.clone().multiplyScalar(j);
      tileMesh.setColorAt(i, c.copy(t.cWet));
    });
    tileMesh.instanceColor.needsUpdate = true;
    world.add(tileMesh);
  }

  /* ---------- вода ---------- */
  function buildSea() {
    const g = new THREE.PlaneGeometry(1700, 1700, 140, 140);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.ShaderMaterial({
      transparent: true, fog: true,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        { t: { value: 0 }, deep: { value: DAY.water.clone() }, shallow: { value: DAY.waterSh.clone() },
          sky: { value: DAY.top.clone() }, murk: { value: 0 }, shelf: { value: 62 } }
      ]),
      vertexShader: `
        #include <fog_pars_vertex>
        uniform float t; varying vec3 vW; varying float vH;
        void main(){
          vec3 p = position;
          float w = sin(p.x*.26+t*1.05)*.035 + sin(p.z*.19-t*.78)*.04 + sin((p.x+p.z)*.11+t*.5)*.025;
          p.y += w; vH = w;
          vec4 wp = modelMatrix*vec4(p,1.); vW = wp.xyz;
          vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `
        #include <fog_pars_fragment>
        uniform vec3 deep, shallow, sky; uniform float murk, t, shelf;
        varying vec3 vW; varying float vH;
        void main(){
          vec3 V = normalize(cameraPosition - vW);
          vec3 N = normalize(vec3(-vH*.6, 1.0, -vH*.6));
          float fres = pow(1.0 - max(dot(N,V),0.0), 3.0);
          float dist = length(vW.xz);
          float sh = smoothstep(shelf, shelf*0.48, dist);
          vec3 base = mix(deep, shallow, sh*0.7);
          base = mix(base, vec3(dot(base,vec3(.33))*1.02), murk*0.75);
          vec3 col = mix(base, sky, fres*0.45);
          col += max(vH,0.0)*0.35*(1.0-murk);
          float foam = smoothstep(0.82, 1.0, sh) * (0.5 + 0.5*sin(dist*1.6 - t*1.4));
          col = mix(col, vec3(0.90,0.96,1.0), clamp(foam,0.0,1.0)*0.16);
          gl_FragColor = vec4(col, mix(0.99, 0.90, sh) - murk*0.08);
          #include <fog_fragment>
        }`
    });
    seaMesh = new THREE.Mesh(g, m);
    seaMesh.position.y = 0.05;
    seaMesh.renderOrder = 2;
    world.add(seaMesh);
  }

  /* =================================================================
     Растительность
     Семь пород с разными силуэтами. Крона всегда «надета» на ствол:
     геометрии посажены основанием в ноль, поэтому висящих в воздухе
     кусков больше не бывает.
     ================================================================= */
  /** икосаэдр, продавленный шумом: крона получается рваной, а не шариком */
  function crownGeo(variant) {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = hash2(Math.round((x + 2) * 97) + variant * 31, Math.round((y + 2) * 89) + Math.round((z + 2) * 61));
      const k = 0.74 + n * 0.5;
      p.setXYZ(i, x * k, y * k * (0.86 + n * 0.2), z * k);
    }
    g.computeVertexNormals();
    return g;
  }
  function baseGeo(g) { g.translate(0, 0.5, 0); return g; }

  const GEO = {};
  function initGeo() {
    GEO.trunk = baseGeo(new THREE.CylinderGeometry(0.1, 0.19, 1, 5));
    GEO.slim = baseGeo(new THREE.CylinderGeometry(0.075, 0.105, 1, 6));
    GEO.cone = baseGeo(new THREE.ConeGeometry(1, 1, 7));
    GEO.crown0 = crownGeo(0); GEO.crown1 = crownGeo(1); GEO.crown2 = crownGeo(2);
    GEO.leaf = (() => { const g = new THREE.ConeGeometry(0.3, 1, 4); g.translate(0, 0.5, 0); g.scale(1, 1, 0.25); return g; })();
    GEO.blade = (() => {
      const g = new THREE.ConeGeometry(0.055, 1, 3, 1, true);
      g.translate(0, 0.5, 0);
      const p = g.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const k = 0.72 + p.getY(i) * 0.45;
        col[i * 3] = k * 0.96; col[i * 3 + 1] = k; col[i * 3 + 2] = k * 0.72;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return g;
    })();
  }

  const TRUNK_COL = { oak: '#7a5a3c', spruce: '#6b4a30', birch: '#cfcabb', poplar: '#7d6244', palm: '#8a6a44', dead: '#8d8275' };

  function buildPlants() {
    const rng = rngFrom(S_SEED);
    const grassTiles = TILES.filter(t => t.type === TYPE.GRASS);
    const sandTiles = TILES.filter(t => t.type === TYPE.SAND && t.land);
    const bucket = {};
    const B = (name, geo, mat) => (bucket[name] ||= { geo, mat, items: [] });
    const crownMat = () => new THREE.MeshStandardMaterial({ roughness: 0.88, flatShading: true });
    const trunkMat = () => new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true });
    const bT = B('trunk', GEO.trunk, trunkMat());
    const bS = B('slim', GEO.slim, trunkMat());
    const bC = [B('crown0', GEO.crown0, crownMat()), B('crown1', GEO.crown1, crownMat()), B('crown2', GEO.crown2, crownMat())];
    const bCone = B('cone', GEO.cone, crownMat());
    const bLeaf = B('leaf', GEO.leaf, crownMat());

    const leafHSL = (k, lighten = 0, dark = 0, turned = false) => {
      const [h, s, l] = turned ? SEASON.turnLeaf[Math.floor(k * 3) % 3] : SEASON.leaf;
      return [h + (k - 0.5) * 0.04 - dark * 0.045, Math.max(0.05, s + (k - 0.5) * 0.12 + dark * 0.1),
              Math.max(0.08, l * (0.86 + k * 0.26) + lighten)];
    };
    const col = new THREE.Color();
    const addCrown = (t, x, y, z, r, sy, k, opt = {}) => {
      const b = bC[Math.floor(rng() * 3) % 3];
      const [h, s, l] = opt.hsl || leafHSL(k, opt.lighten || 0, opt.dark || 0, opt.turned);
      b.items.push({ t, kind: 'crown', x, y, z, sx: r * (opt.sx || 1), sy: r * sy, sz: r * (opt.sz || 1),
                     ry: rng() * 6.283, hsl: [h, s, l], k });
    };
    const addTrunk = (b, t, x, y, z, w, h, species, lean = 0) => {
      col.set(TRUNK_COL[species]);
      b.items.push({ t, kind: 'trunk', x, y, z, sx: w, sy: h, sz: w, ry: rng() * 6.283,
                     rz: lean, rgb: [col.r, col.g, col.b] });
    };

    /* плотность леса шумом: получаются чащи и проплешины, а не ровная сетка */
    const dens = (t) => fbm(t.x * 0.028 + 401, t.z * 0.028 + 157, 2);
    const budget = lod.trees;
    for (const t of grassTiles) {
      const d = dens(t);
      let n = d < 0.36 ? 0 : d < 0.48 ? 1 : d < 0.62 ? 2 : 3;
      if (t.y > 4.2) n = Math.min(n, 1);
      n = Math.round(n * budget);
      for (let j = 0; j < n; j++) {
        const a = rng() * 6.283, rr = rng() * HS * 0.58;
        const x = t.x + Math.cos(a) * rr, z = t.z + Math.sin(a) * rr, y = t.y, k = rng();
        const turned = rng() < SEASON.turn, bare = rng() < SEASON.bare;
        const CO = { turned };
        const pick = rng();
        const sp = pick < 0.40 ? 'oak' : pick < 0.64 ? 'spruce' : pick < 0.76 ? 'birch'
                 : pick < 0.86 ? 'poplar' : pick < 0.965 ? 'bush' : 'dead';
        if (sp === 'oak') {
          const h = 1.5 + k * 1.4, cr = 0.60 + k * 0.34;
          addTrunk(bT, t, x, y, z, 1.25 + k * 0.4, h, 'oak');
          const nb = bare ? 0 : 4 + (rng() < 0.5 ? 1 : 0);
          for (let b = 0; b < nb; b++) {
            const ba = rng() * 6.283, br = b === 0 ? 0 : rng() * cr * 0.52;
            const sc = b === 0 ? cr : cr * (0.52 + rng() * 0.38);
            addCrown(t, x + Math.cos(ba) * br, y + h + (b === 0 ? sc * 0.35 : (rng() - 0.3) * cr * 0.7),
                     z + Math.sin(ba) * br, sc, 0.78 + rng() * 0.2, k, CO);
          }
        } else if (sp === 'spruce') {
          const h = 0.42 + k * 0.4, cr = 0.78 + k * 0.42;
          addTrunk(bT, t, x, y, z, 1.05 + k * 0.3, h + 0.1, 'spruce');
          const hh = [1.32, 1.12, 0.92], rr2 = [1.0, 0.72, 0.46], off = [0, 0.74, 1.42];
          for (let b = 0; b < 3; b++) {
            const [hs, ss, ls] = leafHSL(k, 0, 0.55 + b * 0.06);
            bCone.items.push({ t, kind: 'crown', x, y: y + h + off[b] * cr, z,
                               sx: cr * rr2[b], sy: cr * hh[b] * 1.35, sz: cr * rr2[b],
                               ry: rng() * 6.283, hsl: [hs, ss, ls], k });
          }
        } else if (sp === 'birch') {
          const h = 2.0 + k * 1.5, lean = (rng() - 0.5) * 0.1, cr = 0.40 + k * 0.2;
          addTrunk(bS, t, x, y, z, 1, h, 'birch', lean);
          for (let b = 0; b < (bare ? 0 : 3); b++) {
            const ba = rng() * 6.283, br = rng() * cr * 0.6;
            addCrown(t, x + Math.cos(ba) * br - lean * h * 0.5, y + h * 0.9 + b * cr * 0.52,
                     z + Math.sin(ba) * br, cr * (0.72 + rng() * 0.45), 0.9, k, { lighten: 0.07, turned });
          }
        } else if (sp === 'poplar') {
          const h = 1.0 + k * 0.7, cr = 0.5 + k * 0.16;
          addTrunk(bS, t, x, y, z, 1.1, h, 'poplar');
          if (!bare) addCrown(t, x, y + h + cr * 1.55, z, cr, 2.0, k, { sx: 0.78, sz: 0.78, dark: 0.2, turned });
        } else if (sp === 'bush') {
          const cr = 0.28 + k * 0.24;
          for (let b = 0; b < 2; b++)
            addCrown(t, x + (rng() - 0.5) * cr * 0.8, y + cr * (0.55 + b * 0.35), z + (rng() - 0.5) * cr * 0.8,
                     cr * (0.8 + rng() * 0.4), 0.8, k, { lighten: -0.03, turned });
        } else {
          const h = 1.7 + k * 1.1;
          addTrunk(bT, t, x, y, z, 1.1, h, 'dead');
          for (let b = 0; b < 2; b++)
            bS.items.push({ t, kind: 'trunk', x, y: y + h * 0.62, z, sx: 0.5, sy: h * 0.42, sz: 0.5,
                            ry: rng() * 6.283, rz: (b ? 1 : -1) * 0.85, rgb: [0.55, 0.51, 0.46] });
        }
      }
    }
    /* пальмы на песке у воды — редкие, но сразу выдают «остров» */
    for (const t of sandTiles) {
      if (rng() > 0.1 * budget) continue;
      const x = t.x + (rng() - 0.5) * HS * 0.6, z = t.z + (rng() - 0.5) * HS * 0.6, k = rng();
      const h = 1.9 + k * 1.1, lean = (rng() - 0.5) * 0.3;
      addTrunk(bS, t, x, t.y, z, 1.1, h, 'palm', lean);
      const tx = x - Math.sin(lean) * h * 0.55, ty = t.y + h * 0.97;
      for (let b = 0; b < 5; b++) {
        const a = b / 5 * 6.283 + k;
        bLeaf.items.push({ t, kind: 'crown', x: tx, y: ty, z, sx: 1.5, sy: 1.5 + k * 0.5, sz: 1.5,
                           ry: a, rz: 1.15, hsl: [0.27, 0.45, 0.3 + k * 0.08], k });
      }
    }

    /* сборка инстансов */
    veg.meshes = []; veg.items = [];
    for (const [name, b] of Object.entries(bucket)) {
      const n = b.items.length;
      if (!n) continue;
      const mesh = new THREE.InstancedMesh(b.geo, b.mat, n);
      mesh.castShadow = mesh.receiveShadow = !!lod.shadow;
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3).fill(1), 3);
      b.items.forEach((it, i) => {
        it.mesh = mesh; it.idx = i;
        setI(mesh, i, it.x, it.y, it.z, it.sx, it.sy, it.sz, it.ry || 0, 0, it.rz || 0);
        if (it.rgb) mesh.setColorAt(i, col.setRGB(it.rgb[0], it.rgb[1], it.rgb[2]));
        else mesh.setColorAt(i, col.setHSL(it.hsl[0], it.hsl[1], it.hsl[2]));
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
      mesh.name = name;
      world.add(mesh);
      veg.meshes.push(mesh);
      veg.items.push(...b.items);
    }

    /* трава */
    const N_G = lod.grass;
    if (N_G && grassTiles.length) {
      grassMesh = new THREE.InstancedMesh(GEO.blade,
        new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }), N_G);
      grassMesh.receiveShadow = !!lod.shadow;
      grassMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N_G * 3), 3);
      grassMesh.userData.tiles = [];
      const [gh, gs, gl] = SEASON.grass;
      for (let i = 0; i < N_G; i++) {
        const t = grassTiles[Math.floor(hash2(i, 11) * grassTiles.length)] || grassTiles[0];
        const a = hash2(i, 3) * 6.283, rr = Math.sqrt(hash2(i, 5)) * HS * 0.78;
        const h = 0.3 + hash2(i, 7) * 0.36;
        setI(grassMesh, i, t.x + Math.cos(a) * rr, t.y, t.z + Math.sin(a) * rr,
             1, h, 1, hash2(i, 13) * 6.283, (hash2(i, 17) - 0.5) * 0.3, (hash2(i, 19) - 0.5) * 0.3);
        grassMesh.setColorAt(i, col.setHSL(gh + hash2(i, 23) * 0.05, gs, gl * (0.78 + hash2(i, 29) * 0.34)));
        grassMesh.userData.tiles.push(t);
      }
      grassMesh.instanceColor.needsUpdate = true;
      world.add(grassMesh);
    }

    /* цветы */
    const N_F = Math.round(lod.flowers * SEASON.flowers);
    if (N_F && grassTiles.length) {
      flowerMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.1, 0),
        new THREE.MeshStandardMaterial({ roughness: 0.7, flatShading: true }), N_F);
      const FC = ['#f2e26b', '#ef7f9b', '#ffffff', '#c58df0', '#ff9f52'];
      flowerMesh.userData.tiles = [];
      for (let i = 0; i < N_F; i++) {
        const t = grassTiles[Math.floor(hash2(i, 101) * grassTiles.length)];
        const a = hash2(i, 103) * 6.283, rr = Math.sqrt(hash2(i, 107)) * HS * 0.7;
        setI(flowerMesh, i, t.x + Math.cos(a) * rr, t.y + 0.17, t.z + Math.sin(a) * rr, 1, 1.25, 1);
        flowerMesh.setColorAt(i, col.set(FC[i % FC.length]));
        flowerMesh.userData.tiles.push(t);
      }
      flowerMesh.instanceColor.needsUpdate = true;
      world.add(flowerMesh);
    }

    /* камни */
    const stoneTiles = TILES.filter(t => t.land && (t.type === TYPE.ROCK || t.type === TYPE.SAND));
    const N_R = Math.round(150 * budget) || 40;
    if (stoneTiles.length) {
      rockMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.42, 0),
        new THREE.MeshStandardMaterial({ color: '#8a8984', roughness: 0.95, flatShading: true }), N_R);
      rockMesh.castShadow = rockMesh.receiveShadow = !!lod.shadow;
      rockMesh.userData.tiles = [];
      for (let i = 0; i < N_R; i++) {
        const t = stoneTiles[Math.floor(hash2(i, 211) * stoneTiles.length)];
        const a = hash2(i, 213) * 6.283, rr = hash2(i, 217) * HS * 0.6;
        const s = 0.55 + hash2(i, 219) * 0.9;
        setI(rockMesh, i, t.x + Math.cos(a) * rr, t.y + 0.1, t.z + Math.sin(a) * rr,
             s, s * (0.6 + hash2(i, 223) * 0.5), s, hash2(i, 227) * 6.283);
        rockMesh.userData.tiles.push(t);
      }
      world.add(rockMesh);
    }
  }

  /* ---------- облака ---------- */
  function buildClouds() {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true, transparent: true, opacity: 0.8 });
    for (let i = 0; i < lod.clouds; i++) {
      const g = new THREE.Group();
      const n = 3 + Math.floor(hash2(i, 301) * 3);
      for (let j = 0; j < n; j++) {
        const s = 1.8 + hash2(i * 7 + j, 303) * 2.4;
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), m);
        b.position.set((j - n / 2) * s * 1.05, hash2(i + j, 305) * s * 0.4, hash2(i + j, 307) * s * 0.6);
        b.scale.y = 0.52; g.add(b);
      }
      const R = Math.max(30, MAXD * HS * 1.5);
      const a = (i / lod.clouds) * 6.283, rr = R * (2.4 + hash2(i, 309) * 1.4);
      g.position.set(Math.cos(a) * rr, R * (1.35 + hash2(i, 311) * 0.6), Math.sin(a) * rr);
      g.userData = { a, rr, sp: 0.012 + hash2(i, 313) * 0.016 };
      clouds.add(g);
    }
  }

  /* =================================================================
     Награды: один закрытый модуль курса = один объект на острове
     Ранние — ближе к центру, поздние — к краю, чтобы объект появлялся
     на уже открытой земле.
     ================================================================= */
  const GHOST_MAT = new THREE.MeshStandardMaterial({
    color: '#8fd8ff', transparent: true, opacity: 0.2, roughness: 0.4,
    emissive: new THREE.Color('#4aa8d8'), emissiveIntensity: 0.5, depthWrite: false, flatShading: true
  });

  function placeRewards(defs) {
    rewardDefs = defs;
    const land = TILES.filter(t => t.land);
    const isWater = (q, r) => !TILES.some(t => t.q === q && t.r === r && t.land);
    const NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    const pools = {
      mid: land.filter(t => t.type === TYPE.GRASS).sort((a, b) => a.d - b.d),
      far: land.filter(t => t.type === TYPE.GRASS).sort((a, b) => a.d - b.d),
      lake: TILES.filter(t => t.lake).sort((a, b) => a.d - b.d),
      hill: land.filter(t => t.y > 1.6).sort((a, b) => a.d - b.d),
      shore: land.filter(t => NB.some(([dq, dr]) => isWater(t.q + dq, t.r + dr))).sort((a, b) => a.d - b.d),
      water: TILES.filter(t => t.lake).sort((a, b) => a.d - b.d)
    };
    if (!pools.hill.length) pools.hill = pools.mid.slice();
    if (!pools.shore.length) pools.shore = pools.mid;
    if (!pools.water.length) pools.water = pools.shore;
    const used = [];
    const okFar = (x, z, min) => used.every(u => (u.x - x) ** 2 + (u.z - z) ** 2 > min * min);
    const N = defs.length;

    defs.forEach((def, i) => {
      const g = new THREE.Group();
      const obj = BUILD[def.kind] ? BUILD[def.kind]() : BUILD.house_s();
      obj.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = !!lod.shadow; o.userData.mat0 = o.material; } });
      g.add(obj);

      /* объект i должен уместиться в кольцо, открытое примерно к i-му модулю */
      const dmax = MAXD * (0.22 + 0.80 * (i + 1) / N);
      let tile = null, x = 0, y = 0, z = 0, min = def.kind === 'aurora' ? 0 : 10.5;
      if (def.where === 'sky') {
        if (def.kind === 'aurora') { x = 0; y = 0; z = 0; }
        else { const a = i * 1.7; x = Math.cos(a) * 34; y = 20 + (i % 3) * 4; z = Math.sin(a) * 34; }
      } else if (def.where === 'sea') {
        const a = 2.2 + i * 0.3, rr = R_RINGS * HS * 1.6 + 12;
        x = Math.cos(a) * rr; y = 0.1; z = Math.sin(a) * rr;
      } else {
        const pool = pools[def.where] || pools.mid;
        const fit = pool.filter(t => t.d <= dmax);
        const list = fit.length ? fit : pool;
        tile = list.filter(t => t.free && okFar(t.x, t.z, min)).sort((a, b) => b.d - a.d)[0]
            || list.filter(t => t.free && okFar(t.x, t.z, min * 0.6)).pop()
            || list.filter(t => t.free).pop() || pool[0];
        if (tile) {
          tile.free = false;
          for (const [dq, dr] of NB) { const nb = TILES.find(t => t.q === tile.q + dq && t.r === tile.r + dr); if (nb) nb.free = false; }
          x = tile.x; z = tile.z; y = def.where === 'water' ? 0.08 : tile.y;
        }
      }
      used.push({ x, z });
      g.position.set(x, y, z);
      g.rotation.y = hash2(i * 13, 77) * 6.283;
      obj.scale.setScalar(2.0);
      g.visible = false;
      g.scale.setScalar(0.001);
      g.userData = { reward: i };

      /* луч-метка над будущей наградой, чтобы её было видно и легко нажать */
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 1.5, 11, 6, 1, true),
        new THREE.MeshBasicMaterial({ color: '#7fd4ff', transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide })
      );
      beam.position.y = 6.5; beam.visible = false;
      g.add(beam);

      world.add(g);
      rewards.push({ def, group: g, obj, beam, tile, i, bio: BIO.has(def.kind), kind: def.kind,
                     grow: 0, ghost: false, dark: false });
    });
  }

  function setGhost(r, on) {
    if (r.ghost === on) return;
    r.ghost = on;
    r.obj.traverse(o => {
      if (!o.isMesh) return;
      o.material = on ? GHOST_MAT : (o.userData.mat0 || o.material);
      o.castShadow = on ? false : !!lod.shadow;
    });
    r.beam.visible = on;
  }

  /* =================================================================
     Состояние мира
     ================================================================= */
  function applyState(animate = true) {
    state.size = worldSize(state.known, state.mods, state.total);
    let rings = Math.max(2.4, 1.2 + state.size * (MAXD - 1.2));
    for (const r of rewards) if (r.i < state.mods && r.tile) rings = Math.max(rings, r.tile.d + 1.4);
    rings = Math.min(rings, MAXD);
    state.rings = rings;
    state.aliveRings = rings * (state.hp / 100) + 0.35;

    const c = new THREE.Color();
    TILES.forEach((t, i) => {
      const vis = t.d <= rings;
      t.want = vis ? 1 : 0;
      if (!animate) t.rise = t.want;
      /* берег достраивается по кромке открытого круга: остров выглядит
         законченным на любой стадии, а не обрубленным в море */
      const edge = rings - t.d;
      const kEdge = smooth(edge / 2.6);
      t.beach = vis && t.land && kEdge < 0.5;
      t.yT = t.land ? Math.max(0.22, 0.22 + (t.y - 0.22) * kEdge) : t.y;
      const dry = t.d > state.aliveRings;
      t.dry = dry && t.land && !t.beach;
      c.copy(t.beach ? t.cSand : t.dry ? t.cDry : t.cWet);
      if (!vis) c.multiplyScalar(0.0001);
      tileMesh.setColorAt(i, c);
    });
    tileMesh.instanceColor.needsUpdate = true;
    TILES.forEach(t => { t.from = t.rise; t.yFrom = t.yShown ?? t.yT; });
    animT0 = performance.now();
    settle = true;

    /* растительность: прячется вне открытого круга и на достроенном берегу */
    const hsl = new THREE.Color();
    for (const m of veg.meshes) m.__dirtyC = m.__dirtyM = false;
    for (const it of veg.items) {
      const t = it.t;
      const vis = t.d <= rings && !t.beach;
      const dry = t.dry;
      if (it.kind === 'crown') {
        const [h, s, l] = it.hsl;
        hsl.setHSL(dry ? 0.085 : h, dry ? 0.32 : s, dry ? 0.24 + it.k * 0.06 : l);
        if (!vis) hsl.multiplyScalar(0.0001);
        it.mesh.setColorAt(it.idx, hsl);
        it.mesh.__dirtyC = true;
      }
      const want = vis ? 1 : 0.0001;
      /* сухие деревья стоят стволами, кроны прячутся только при полном увядании */
      const sc = it.kind === 'crown' && dry && state.hp < 25 ? 0.0001 : want;
      if (it.shown !== sc) {
        it.shown = sc;
        setI(it.mesh, it.idx, it.x, it.y, it.z, it.sx * sc, it.sy * sc, it.sz * sc, it.ry || 0, 0, it.rz || 0);
        it.mesh.__dirtyM = true;
      }
    }
    for (const m of veg.meshes) {
      if (m.__dirtyC && m.instanceColor) m.instanceColor.needsUpdate = true;
      if (m.__dirtyM) m.instanceMatrix.needsUpdate = true;
    }

    const hideScatter = (mesh) => {
      if (!mesh) return;
      const tiles = mesh.userData.tiles;
      for (let i = 0; i < tiles.length && i < mesh.count; i++) {
        const t = tiles[i];
        const alive = t && t.d <= rings && !t.dry && !t.beach;
        mesh.getMatrixAt(i, tmpM);
        tmpM.decompose(tmpP, tmpQ, tmpS);
        const base = mesh.userData.sv?.[i] || ((mesh.userData.sv ||= [])[i] = tmpS.clone());
        tmpS.copy(base).multiplyScalar(alive ? 1 : 0.0001);
        tmpM.compose(tmpP, tmpQ, tmpS);
        mesh.setMatrixAt(i, tmpM);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    hideScatter(grassMesh); hideScatter(flowerMesh); hideScatter(rockMesh);

    /* награды: открытые растут, ближайшие будущие стоят призрачными силуэтами */
    const ghostAhead = 5;
    rewards.forEach(r => {
      const unlocked = r.i < state.mods;
      const nearFuture = !unlocked && r.i < state.mods + ghostAhead && (!r.tile || r.tile.d <= rings);
      const dry = r.tile ? r.tile.d > state.aliveRings : state.hp < 45;
      setGhost(r, nearFuture);
      r.wantScale = unlocked ? ((r.bio && dry && state.hp < 55) ? 0.001 : 1) : (nearFuture ? 0.72 : 0.001);
      if ((unlocked || nearFuture) && !r.group.visible) r.group.visible = true;
      r.dark = dry;
      r.group.traverse(o => {
        if (o.userData.lamp) {
          if (o.isLight) o.intensity = (state.night * (dry ? 0.25 : 1)) * (r.kind === 'crystals' ? 1.2 : 2.2);
          else if (o.material && 'emissiveIntensity' in o.material)
            o.material.emissiveIntensity = (0.15 + state.night * 2.4) * (dry ? 0.2 : 1);
        }
      });
    });

    if (seaMesh) {
      seaMesh.material.uniforms.murk.value = 1 - state.hp / 100;
      seaMesh.material.uniforms.shelf.value = Math.max(16, rings * HS * 1.45);
    }
  }

  /* =================================================================
     Камера и попадание по объекту
     ================================================================= */
  const cam = { az: -0.75, el: 0.46, dist: 128, tAz: -0.75, tEl: 0.46, tDist: 128,
                tgt: new THREE.Vector3(0, 4, 0), tTgt: new THREE.Vector3(0, 4, 0), fly: false };
  let dragging = false, moved = 0, lastX = 0, lastY = 0, pinch = 0, interactive = true, userMoved = false;

  function fitCamera(instant = false) {
    const radius = Math.max(6, state.rings * HS * 1.55);
    const portrait = camera.aspect < 1;
    if (!interactive || !userMoved)
      cam.tEl = portrait ? Math.max(0.50, Math.min(0.86, 1.05 - radius * 0.011))
                         : Math.max(0.33, Math.min(0.88, 0.95 - radius * 0.016));
    /* дистанция считается из угла обзора, а не подбирается на глаз */
    const vHalf = camera.fov * Math.PI / 360;
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    const el = cam.tEl;
    const dH = radius * 1.0 / Math.tan(hHalf);
    const dV = (radius * Math.sin(el) * 1.12 + 9 * Math.cos(el)) / Math.tan(vHalf);
    cam.tDist = Math.min(340, Math.max(22, Math.max(dH, dV)));
    cam.tTgt.set(0, Math.min(6, radius * 0.08), 0);
    if (instant) { cam.dist = cam.tDist; cam.el = cam.tEl; cam.tgt.copy(cam.tTgt); }
  }

  canvas.addEventListener('pointerdown', e => {
    if (!interactive) return;
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    cam.fly = false;
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    cam.tAz -= dx * 0.005; userMoved = true;
    cam.tEl = Math.max(0.09, Math.min(1.32, cam.tEl + dy * 0.004));
  });
  const endDrag = e => { if (dragging && moved < 8) pick(e); dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', () => dragging = false);
  canvas.addEventListener('wheel', e => {
    if (!interactive) return;
    e.preventDefault();
    cam.tDist = Math.max(14, Math.min(360, cam.tDist * (1 + Math.sign(e.deltaY) * 0.11)));
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    if (!interactive || e.touches.length !== 2) return;
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (pinch) cam.tDist = Math.max(14, Math.min(360, cam.tDist * (pinch / d)));
    pinch = d; dragging = false;
  }, { passive: true });
  canvas.addEventListener('touchend', () => pinch = 0);

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(ev) {
    if (!cb.pick || !built) return;
    const b = canvas.getBoundingClientRect();
    ndc.set((ev.clientX - b.left) / b.width * 2 - 1, -((ev.clientY - b.top) / b.height * 2 - 1));
    ray.setFromCamera(ndc, camera);
    const vis = rewards.filter(r => r.group.visible).map(r => r.group);
    const hits = ray.intersectObjects(vis, true);
    if (!hits.length) return;
    let o = hits[0].object;
    while (o && o.userData.reward === undefined) o = o.parent;
    if (!o) return;
    const r = rewards[o.userData.reward];
    flyTo(r.group);
    cb.pick({ index: r.i, def: r.def, unlocked: r.i < state.mods });
  }
  function flyTo(obj) {
    const p = new THREE.Vector3(); obj.getWorldPosition(p);
    cam.tTgt.copy(p);
    cam.tDist = Math.max(15, Math.min(cam.tDist, 30));
    cam.tEl = 0.4; cam.fly = false;
  }

  /* =================================================================
     Анимация
     ================================================================= */
  const clock = new THREE.Clock();
  let spinners = [], specials = [];
  function collectAnimated() {
    spinners = []; specials = [];
    world.traverse(o => {
      if (o.userData.spin) spinners.push(o);
      if (o.userData.flame || o.userData.sway || o.userData.bob || o.userData.flock ||
          o.userData.flies || o.userData.swim !== undefined || o.userData.aur !== undefined ||
          o.userData.jet || o.userData.steam !== undefined || o.userData.ride || o.userData.flow)
        specials.push(o);
    });
    specials.forEach(o => o.userData.base = o.position.clone());
  }

  function lerpPalette() {
    const A = DAY, B = NIGHT, t = state.night;
    skyMat.uniforms.top.value.copy(A.top).lerp(B.top, t).multiplyScalar(SEASON.sky);
    skyMat.uniforms.bot.value.copy(A.bot).lerp(B.bot, t);
    sun.color.copy(A.sun).lerp(B.sun, t).multiplyScalar(SEASON.warm);
    sun.intensity = A.sunI + (B.sunI - A.sunI) * t;
    hemi.color.copy(A.hemiS).lerp(B.hemiS, t);
    hemi.groundColor.copy(A.hemiG).lerp(B.hemiG, t);
    hemi.intensity = A.hemiI + (B.hemiI - A.hemiI) * t;
    amb.intensity = A.amb + (B.amb - A.amb) * t;
    fill.intensity = 0.5 - 0.3 * t;
    scene.fog.color.copy(A.fog).lerp(B.fog, t);
    const fk = Math.max(1, cam.dist / 130);
    scene.fog.near = (A.fogN + (B.fogN - A.fogN) * t) * fk;
    scene.fog.far = (A.fogF + (B.fogF - A.fogF) * t) * fk;
    renderer.toneMappingExposure = A.expo + (B.expo - A.expo) * t;
    bloom.strength = (A.bloom + (B.bloom - A.bloom) * t) * lod.bloom;
    starMat.uniforms.op.value = t;
    if (seaMesh) {
      seaMesh.material.uniforms.deep.value.copy(A.water).lerp(B.water, t);
      seaMesh.material.uniforms.shallow.value.copy(A.waterSh).lerp(B.waterSh, t);
      seaMesh.material.uniforms.sky.value.copy(A.top).lerp(B.top, t);
    }
  }

  function tick() {
    if (!active || disposed) { rafId = 0; return; }
    rafId = requestAnimationFrame(tick);
    const dt = Math.min(0.05, clock.getDelta()), now = performance.now(), T = clock.elapsedTime;

    if (Math.abs(cam.dist - (tick.lastD || 0)) > 4) { tick.lastD = cam.dist; lerpPalette(); }
    if (Math.abs(state.night - nightWant) > 0.001) {
      state.night += (nightWant - state.night) * Math.min(1, dt * 1.8);
      lerpPalette();
      rewards.forEach(r => r.group.traverse(o => {
        if (o.userData.lamp) {
          if (o.isLight) o.intensity = state.night * (r.dark ? 0.3 : 1) * 2.2;
          else if (o.material && 'emissiveIntensity' in o.material)
            o.material.emissiveIntensity = (0.15 + state.night * 2.4) * (r.dark ? 0.2 : 1);
        }
      }));
    }

    /* подъём тайлов и достройка берега — строго по времени */
    if (settle) {
      const el = (now - animT0) / 1000;
      const done = el >= 2.9;
      for (const t of TILES) {
        let p = (el - t.d * 0.035) / 0.85;
        p = p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p);
        if (done) p = 1;
        const s = Math.max(0.0001, t.from + (t.want - t.from) * p);
        const yv = (t.yFrom ?? t.yT) + (t.yT - (t.yFrom ?? t.yT)) * p;
        t.yShown = yv;
        const xz = Math.min(1, s * 2.2), depth = yv + 2.1;
        setI(tileMesh, t.i, t.x, yv - (1 - s) * 4.2, t.z, xz, depth * s, xz);
        t.rise = s;
      }
      tileMesh.instanceMatrix.needsUpdate = true;
      if (done) settle = false;
    }

    for (const r of rewards) {
      const w = r.wantScale ?? 0.001;
      if (Math.abs(r.grow - w) > 0.002) {
        r.grow += (w - r.grow) * Math.min(1, dt * 3.2 + 0.02);
        r.group.scale.setScalar(Math.max(0.001, r.grow));
        if (r.grow < 0.005 && w < 0.01) r.group.visible = false;
      }
    }

    for (const o of spinners) o.rotation.z += o.userData.spin * dt;

    for (const o of specials) {
      const u = o.userData, b = u.base;
      if (u.flame) { const k = 1 + Math.sin(T * 13 + o.id) * 0.13 + Math.sin(T * 7.3) * 0.08; o.scale.set(k, 1 / k * 1.15, k); }
      if (u.sway) o.rotation.x = Math.sin(T * 1.7) * 0.22;
      if (u.bob) o.position.y = b.y + Math.sin(T * 0.7) * 1.4;
      if (u.flow) o.material.opacity = 0.6 + Math.sin(T * 6) * 0.12;
      if (u.jet) o.scale.y = 1 + Math.sin(T * 8) * 0.2;
      if (u.steam !== undefined) { const ph = (T * 0.4 + u.steam * 0.25) % 1; o.position.y = b.y + ph * 1.6; o.material.opacity = 0.22 * (1 - ph); }
      if (u.ride) o.position.x = b.x + Math.sin(T * 0.35) * 2.3;
      if (u.flies) { o.rotation.y = T * 0.2; o.position.y = b.y + Math.sin(T * 1.3) * 0.25; o.material.opacity = 0.45 + state.night * 0.55; o.material.transparent = true; }
      if (u.swim !== undefined) { o.position.y = b.y + Math.sin(T * 0.6 + u.swim * 2) * 0.35; o.rotation.z = Math.sin(T * 0.6 + u.swim * 2) * 0.09; }
      if (u.aur !== undefined) {
        o.material.opacity = (0.04 + 0.2 * state.night) * (0.6 + 0.4 * Math.sin(T * 0.5 + u.aur));
        o.position.x = b.x + Math.sin(T * 0.22 + u.aur) * 5;
        const p = o.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 0.18 + T * 0.8 + u.aur) * 2.6);
        p.needsUpdate = true;
      }
      if (u.flock) {
        o.rotation.y = T * 0.085;
        o.children.forEach((c, i) => {
          c.position.y = (i % 2) * 0.7 + Math.sin(T * 1.4 + i) * 0.3;
          c.children.forEach(w => { if (w.userData.wing) w.rotation.x = Math.sin(T * 7 + i) * 0.6 * w.userData.wing; });
        });
      }
    }
    for (const r of rewards) if (r.ghost) r.group.children[1].material.opacity = 0.07 + 0.05 * Math.sin(T * 1.6 + r.i);

    clouds.children.forEach(c => {
      c.userData.a += c.userData.sp * dt;
      c.position.x = Math.cos(c.userData.a) * c.userData.rr;
      c.position.z = Math.sin(c.userData.a) * c.userData.rr;
    });

    if (seaMesh) seaMesh.material.uniforms.t.value = T;
    starMat.uniforms.t.value = T;

    if (cam.fly) cam.tAz += dt * 0.08;
    const k = Math.min(1, dt * 5.5);
    cam.az += (cam.tAz - cam.az) * k;
    cam.el += (cam.tEl - cam.el) * k;
    cam.dist += (cam.tDist - cam.dist) * k;
    cam.tgt.lerp(cam.tTgt, Math.min(1, dt * 3));
    const cd = Math.cos(cam.el) * cam.dist;
    camera.position.set(cam.tgt.x + Math.cos(cam.az) * cd, cam.tgt.y + Math.sin(cam.el) * cam.dist, cam.tgt.z + Math.sin(cam.az) * cd);
    camera.lookAt(cam.tgt);
    sun.target.position.copy(cam.tgt);

    composer.render();
  }

  /* =================================================================
     Сборка и внешний интерфейс
     ================================================================= */
  function clearWorld() {
    for (const o of [...world.children]) {
      world.remove(o);
      o.traverse?.(c => { if (c.geometry) c.geometry.dispose?.(); });
    }
    for (const o of [...clouds.children]) clouds.remove(o);
    rewards = [];
    tileMesh = seaMesh = grassMesh = flowerMesh = rockMesh = null;
    veg.meshes = []; veg.items = [];
  }

  function build(defs, opts = {}) {
    S_SEED = opts.seed ?? S_SEED;
    setSeed(S_SEED);
    SEASON = SEASONS[opts.season] || SEASONS[seasonOf()];
    clearWorld();
    initGeo();
    buildTerrain();
    buildSea();
    buildPlants();
    buildClouds();
    placeRewards(defs);
    collectAnimated();
    built = true;
    applyState(false);
    fitCamera(true);
    lerpPalette();
    if (cb.ready) cb.ready();
  }

  function resize() {
    if (!host) return;
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    if (fxaa) fxaa.material.uniforms.resolution.value.set(1 / w, 1 / h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;

  return {
    canvas,
    get state() { return state; },
    get rewards() { return rewards; },
    get season() { return SEASON; },
    build,
    isBuilt: () => built,
    mount(el, mode = 'full') {
      if (host === el) { resize(); return; }
      if (ro && host) ro.unobserve(host);
      host = el;
      el.appendChild(canvas);
      interactive = mode !== 'strip';
      cam.fly = mode === 'strip';
      if (mode === 'strip') { cam.tEl = 0.34; fitCamera(true); }
      resize();
      if (ro) ro.observe(el);
      this.setActive(true);
    },
    unmount() {
      this.setActive(false);
      if (ro && host) ro.unobserve(host);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      host = null;
    },
    setActive(on) {
      if (disposed) return;
      active = !!on;
      if (active && !rafId) { clock.getDelta(); rafId = requestAnimationFrame(tick); }
    },
    setState(st, animate = true) {
      Object.assign(state, st);
      if (built) { applyState(animate); if (!userMoved) fitCamera(false); }
    },
    fit: fitCamera,
    setNight(v) { nightWant = clamp01(v); },
    toggleNight() { nightWant = nightWant > 0.5 ? 0 : 1; return nightWant > 0.5; },
    setFly(on) { cam.fly = !!on; },
    flyToReward(i) { const r = rewards[i]; if (r && r.group.visible) flyTo(r.group); },
    quality: () => Q,
    setQuality(q) {
      if (q === Q) return;
      Q = q; lod = LOD[q] || LOD.mid;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lod.px));
      renderer.shadowMap.enabled = lod.shadow > 0;
      if (lod.shadow) sun.shadow.mapSize.set(lod.shadow, lod.shadow);
      sun.castShadow = lod.shadow > 0;
      if (built) build(rewardDefs, { season: Object.keys(SEASONS).find(k => SEASONS[k] === SEASON) });
    },
    dispose() {
      disposed = true; active = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (ro && host) ro.unobserve(host);
      clearWorld();
      composer.dispose?.();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}
