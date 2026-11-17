/* WordFlow — картинки к словам.
   Источники: фото Pixabay (лицензия Pixabay), эмодзи Microsoft Fluent Emoji (MIT), свои картинки пользователя.
   Картинки лежат пачками в img/pNN.bin (по ~1 МБ), оглавление — data/images.js (window.WF_IMG).
   Своя картинка хранится в IndexedDB на этом устройстве и важнее стоковой. */

window.WFIMG = (() => {
  const D = window.WF_IMG || { v: '', packs: [], items: {} };
  const packs = new Map();     // номер пачки -> Promise<ArrayBuffer>
  const urls = new Map();      // ключ слова -> objectURL
  const own = new Set();       // ключи слов со своей картинкой
  let dbp = null;

  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('no idb'));
      const r = indexedDB.open('wordflow-img', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('own');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction('own', mode);
      const out = fn(t.objectStore('own'));
      t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
      t.onerror = () => rej(t.error);
    });
  }
  const ready = tx('readonly', s => s.getAllKeys()).then(keys => { (keys || []).forEach(k => own.add(k)); }).catch(() => {});

  const enabled = () => store.settings.pics !== false;
  const stock = key => D.items[key] || null;
  const has = key => !!key && enabled() && (own.has(key) || !!stock(key));
  const kind = key => own.has(key) ? 'own' : (stock(key) || [])[3] === 'e' ? 'emoji' : 'photo';

  function loadPack(i) {
    if (!packs.has(i)) {
      const p = fetch(`img/${D.packs[i].f}?v=${D.v}`).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
      p.catch(() => packs.delete(i));
      packs.set(i, p);
      if (packs.size > 8) packs.delete(packs.keys().next().value);   // держим в памяти не больше 8 пачек
    }
    return packs.get(i);
  }

  async function url(key) {
    if (urls.has(key)) return urls.get(key);
    let blob = null;
    if (own.has(key)) blob = await tx('readonly', s => s.get(key)).catch(() => null);
    if (!blob && stock(key)) {
      const [i, off, len] = stock(key);
      const buf = await loadPack(i);
      blob = new Blob([buf.slice(off, off + len)], { type: 'image/webp' });
    }
    if (!blob) return null;
    const u = URL.createObjectURL(blob);
    urls.set(key, u);
    return u;
  }

  function forget(key) {
    const u = urls.get(key);
    if (u) URL.revokeObjectURL(u);
    urls.delete(key);
  }

  /** Сохранить свою картинку: уменьшается до 480×360 (обрезка по центру), хранится на устройстве */
  async function setOwn(key, file) {
    const bmp = await createImageBitmap(file);
    const W = 480, H = 360, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const r = Math.max(W / bmp.width, H / bmp.height);
    const w = bmp.width * r, h = bmp.height * r;
    c.getContext('2d').drawImage(bmp, (W - w) / 2, (H - h) / 2, w, h);
    const blob = await new Promise(res => c.toBlob(res, 'image/webp', 0.8)) || await new Promise(res => c.toBlob(res, 'image/jpeg', 0.82));
    await tx('readwrite', s => s.put(blob, key));
    own.add(key); forget(key);
  }
  async function delOwn(key) {
    await tx('readwrite', s => s.delete(key));
    own.delete(key); forget(key);
  }

  /** Скачать все пачки заранее, чтобы картинки работали без интернета */
  async function downloadAll(onProgress) {
    let done = 0;
    for (let i = 0; i < D.packs.length; i++) {
      await fetch(`img/${D.packs[i].f}?v=${D.v}`).then(r => r.ok && r.arrayBuffer()).catch(() => null);
      onProgress && onProgress(++done, D.packs.length);
    }
  }
  const totalMB = () => Math.round(D.packs.reduce((a, p) => a + p.s, 0) / 1048576);

  /** HTML-место под картинку; сама картинка подставится автоматически */
  function box(key, cls = '') {
    if (!has(key)) return '';
    return `<div class="wf-pic ${kind(key) === 'emoji' ? 'is-emoji' : ''} ${cls}" data-img="${esc(key)}"></div>`;
  }

  function hydrate(root) {
    const list = root.matches && root.matches('[data-img]') ? [root] : [...root.querySelectorAll('[data-img]')];
    for (const el of list) {
      if (el.dataset.imgDone) continue;
      el.dataset.imgDone = '1';
      url(el.dataset.img).then(u => {
        if (!u) { el.remove(); return; }
        const img = new Image();
        img.alt = ''; img.decoding = 'async';
        img.onload = () => el.classList.add('is-loaded');
        img.src = u;
        el.appendChild(img);
      }).catch(() => el.classList.add('is-failed'));
    }
  }
  new MutationObserver(ms => {
    for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) hydrate(n);
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Ключи слов с картинкой (для упражнения «По картинке» и подбора вариантов)
  const keys = () => [...new Set([...Object.keys(D.items), ...own])];

  return { has, kind, url, box, setOwn, delOwn, isOwn: k => own.has(k), downloadAll, totalMB, ready, keys, count: () => Object.keys(D.items).length };
})();
