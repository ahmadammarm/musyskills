// Monochrome motion effects, inspired by React Bits and written without React:
// dot field, decrypted text, spotlight cards, scroll reveal, magnet, click spark.
// Every effect re-initializes after client-side navigation and is cleaned up
// before the next page swaps in. Reduced motion turns all motion off.

const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The current foreground color as "r,g,b", for canvas drawing. */
function readFg(): string {
  const hex = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim().replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const n = parseInt(full || '0a0a0a', 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/** Calls `fn` whenever the theme changes (toggle or system setting). */
function onThemeChange(fn: () => void, signal: AbortSignal) {
  const mo = new MutationObserver(fn);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', fn, { signal });
  signal.addEventListener('abort', () => mo.disconnect());
}

/* Dot field: a grid of small squares that breathes slowly and lights up and
   moves aside around the pointer. Pauses when off screen or in a hidden tab. */
function initDotField(signal: AbortSignal, reduced: boolean) {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-dot-field]');
  const host = canvas?.parentElement;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !host || !ctx) return;

  const GAP = 24;
  const RADIUS = 160;
  let w = 0;
  let h = 0;
  let raf = 0;
  let visible = true;
  let rgb = readFg();
  const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
  const start = performance.now();

  const draw = (now: number) => {
    const t = (now - start) / 1000;
    ctx.clearRect(0, 0, w, h);
    for (let y = GAP / 2; y < h; y += GAP) {
      for (let x = GAP / 2; x < w; x += GAP) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d = Math.hypot(dx, dy) || 1;
        const k = d < RADIUS ? 1 - d / RADIUS : 0;
        const e = k * k;
        const wave = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.9 + x * 0.011 + y * 0.017);
        const alpha = 0.1 + wave * 0.1 + e * 0.55;
        const size = 1.5 + e * 1.4;
        const px = x + (dx / d) * e * 7;
        const py = y + (dy / d) * e * 7;
        ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
        ctx.fillRect(px - size / 2, py - size / 2, size, size);
      }
    }
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const far = pointer.tx < -1000;
    if (far || pointer.x < -1000) {
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
    } else {
      pointer.x += (pointer.tx - pointer.x) * 0.14;
      pointer.y += (pointer.ty - pointer.y) * 0.14;
    }
    draw(now);
    raf = requestAnimationFrame(frame);
  };
  const resume = () => {
    if (!reduced && !raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const rect = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  onThemeChange(() => {
    rgb = readFg();
    draw(performance.now());
  }, signal);

  if (!reduced) {
    host.addEventListener(
      'pointermove',
      (e) => {
        const rect = host.getBoundingClientRect();
        pointer.tx = e.clientX - rect.left;
        pointer.ty = e.clientY - rect.top;
      },
      { signal },
    );
    host.addEventListener('pointerleave', () => ((pointer.tx = -1e4), (pointer.ty = -1e4)), { signal });
    document.addEventListener('visibilitychange', resume, { signal });
  }
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    resume();
  });
  io.observe(host);
  resume();

  signal.addEventListener('abort', () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
  });
}

/* Decrypted text: characters start scrambled and lock into place left to right.
   The element is aria-hidden; a visually hidden copy carries the real text. */
function initDecrypt(signal: AbortSignal) {
  const CHARS = 'abcdefghijklmnopqrstuvwxyz/-_';
  for (const el of document.querySelectorAll<HTMLElement>('[data-decrypt]')) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    const originals = nodes.map((n) => n.data);
    const total = originals.join('').replace(/\s/g, '').length || 1;
    const duration = Number(el.dataset.decrypt) || 900;
    const begin = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - begin) / duration);
      let index = 0;
      nodes.forEach((node, i) => {
        node.data = [...originals[i]]
          .map((c) => {
            if (!c.trim()) return c;
            return index++ / total < progress ? c : CHARS[(Math.random() * CHARS.length) | 0];
          })
          .join('');
      });
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(raf);
      nodes.forEach((n, i) => (n.data = originals[i]));
    });
  }
}

/* Spotlight: a soft light follows the pointer inside each card, and the grid
   lines between cards brighten near the pointer. */
function initSpotlight(signal: AbortSignal) {
  for (const group of document.querySelectorAll<HTMLElement>('[data-spotlight-group]')) {
    group.addEventListener(
      'pointermove',
      (e) => {
        const g = group.getBoundingClientRect();
        group.style.setProperty('--gx', `${e.clientX - g.left}px`);
        group.style.setProperty('--gy', `${e.clientY - g.top}px`);
        const card = (e.target as Element).closest<HTMLElement>('.spotlight');
        if (card) {
          const r = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${e.clientX - r.left}px`);
          card.style.setProperty('--my', `${e.clientY - r.top}px`);
        }
      },
      { signal },
    );
    group.addEventListener(
      'pointerleave',
      () => {
        group.style.removeProperty('--gx');
        group.style.removeProperty('--gy');
      },
      { signal },
    );
  }
}

/* Scroll reveal: elements with data-reveal fade up once when they enter view. */
function initReveal(signal: AbortSignal) {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)');
  if (prefersReduced()) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
  );
  items.forEach((el) => io.observe(el));
  signal.addEventListener('abort', () => io.disconnect());
}

/* Magnet: buttons lean a few pixels toward the pointer while hovered. */
function initMagnet(signal: AbortSignal) {
  if (!matchMedia('(pointer: fine)').matches) return;
  const clamp = (v: number) => Math.max(-6, Math.min(6, v));
  for (const el of document.querySelectorAll<HTMLElement>('[data-magnet]')) {
    el.addEventListener(
      'pointermove',
      (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${clamp(dx * 0.22)}px, ${clamp(dy * 0.35)}px)`;
      },
      { signal },
    );
    el.addEventListener('pointerleave', () => (el.style.transform = ''), { signal });
  }
}

/* Click spark: eight short strokes burst from the click point. Uses a blend
   mode so it shows on white pages and on the dark terminal alike. */
function spark(x: number, y: number) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'click-spark');
  svg.setAttribute('viewBox', '-24 -24 48 48');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.left = `${x - 24}px`;
  svg.style.top = `${y - 24}px`;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', String(Math.cos(a) * 7));
    line.setAttribute('y1', String(Math.sin(a) * 7));
    line.setAttribute('x2', String(Math.cos(a) * 17));
    line.setAttribute('y2', String(Math.sin(a) * 17));
    svg.appendChild(line);
  }
  document.body.appendChild(svg);
  setTimeout(() => svg.remove(), 500);
}

document.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || prefersReduced()) return;
  spark(e.clientX, e.clientY);
});

let controller: AbortController | null = null;

document.addEventListener('astro:page-load', () => {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  const reduced = prefersReduced();
  initReveal(signal);
  initSpotlight(signal);
  initDotField(signal, reduced);
  if (reduced) return;
  initDecrypt(signal);
  initMagnet(signal);
});

document.addEventListener('astro:before-swap', () => controller?.abort());
