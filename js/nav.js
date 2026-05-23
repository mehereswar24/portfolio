
/* ============================================
   nav.js — Multi-page navigation + transitions
   Shared across all pages
   ============================================ */
(function () {

  /* ── Page transition overlay ── */
  const overlay = document.createElement('div');
  overlay.id = 'pt-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0; z-index:9500;
    background:var(--bg-primary);
    transform:translateY(100%);
    pointer-events:none;
    transition:transform 0.55s cubic-bezier(0.76,0,0.24,1);
  `;
  document.body.appendChild(overlay);

  /* On load — slide out (arriving) */
  window.addEventListener('DOMContentLoaded', () => {
    overlay.style.transform = 'translateY(0)';
    overlay.style.transition = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.style.transition = 'transform 0.55s cubic-bezier(0.76,0,0.24,1)';
      overlay.style.transform  = 'translateY(-100%)';
    }));
  });

  /* Intercept all same-origin links */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http') || a.target === '_blank') return;
    e.preventDefault();
    overlay.style.transition = 'transform 0.48s cubic-bezier(0.76,0,0.24,1)';
    overlay.style.transform  = 'translateY(0)';
    setTimeout(() => { window.location.href = href; }, 460);
  });

  /* ── Theme toggle ── */
  const root  = document.documentElement;
  const saved = localStorage.getItem('pk-theme') || 'dark';
  root.setAttribute('data-theme', saved);

  function setTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('pk-theme', next);
    updateIcon(next);
  }

  function dark() {
    return root.getAttribute('data-theme') === 'dark';
  }

  function updateIcon(t) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.innerHTML = t === 'dark'
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }

  updateIcon(saved);
  
  const btn = document.getElementById('theme-toggle');
  console.log('Theme toggle button found:', btn);
  if (btn) {
    btn.addEventListener('click', (e) => {
      console.log('Theme toggle clicked, current:', dark());
      setTheme(dark() ? 'light' : 'dark');
      console.log('Theme changed to:', dark());
    });
  } else {
    console.warn('Theme toggle button not found');
  }

  /* ── Active nav link (highlight current page) ── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(l => {
    const lPage = l.getAttribute('href').split('/').pop();
    l.classList.toggle('active', lPage === page);
  });

  /* ── Cursor ── */
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot) return;

  let cx = 0, cy = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    dot.style.left = cx + 'px';
    dot.style.top  = cy + 'px';
  }, { passive: true });

  (function animRing() {
    rx += (cx - rx) * 0.11;
    ry += (cy - ry) * 0.11;
    if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
    requestAnimationFrame(animRing);
  })();

  document.addEventListener('mouseover', e => {
    const h = e.target.closest('a,button,.project-card,.cert-card,.social-link,.tag,.skill-tab,.nav-link');
    document.body.classList.toggle('cursor-hover', !!h);
  });

  /* ── Scroll progress ── */
  const bar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    if (!bar) return;
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });

  /* ── Reveal on scroll ── */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach(el => obs.observe(el));

  /* ── Counter animation ── */
  function countUp(el, to) {
    const start = performance.now(), dur = 1200;
    (function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const e2 = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(e2 * to);
      if (p < 1) requestAnimationFrame(step); else el.textContent = to;
    })(performance.now());
  }
  const cObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('[data-count]').forEach(el => countUp(el, +el.dataset.count));
        cObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.stats-row, #about').forEach(el => cObs.observe(el));

  /* ── Skill bars ── */
  const bObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.skill-bar-inner[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; });
        bObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.skills-right, .skill-rows').forEach(el => bObs.observe(el));

  /* ── 3D tilt on cards ── */
  document.querySelectorAll('.project-card, .cert-card').forEach(card => {
    const shine = document.createElement('div');
    shine.style.cssText = 'position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity 0.3s;';
    card.appendChild(shine);
    card.style.transformStyle = 'preserve-3d';
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const xr = (e.clientX - r.left) / r.width, yr = (e.clientY - r.top) / r.height;
      card.style.transform    = `perspective(900px) rotateX(${-(yr-0.5)*10}deg) rotateY(${(xr-0.5)*14}deg) translateZ(6px)`;
      card.style.transition   = 'transform 0.1s';
      shine.style.opacity     = '1';
      shine.style.background  = `radial-gradient(circle at ${xr*100}% ${yr*100}%, rgba(255,255,255,0.09) 0%, transparent 60%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform  = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0)';
      card.style.transition = 'transform 0.6s cubic-bezier(0.34,1.2,0.64,1)';
      shine.style.opacity   = '0';
    });
  });

  /* ── Carousel drag ── */
  const outer = document.querySelector('.carousel-outer');
  const track = document.querySelector('.carousel-track');
  if (outer && track) {
    Array.from(track.children).forEach(c => { const cl = c.cloneNode(true); cl.setAttribute('aria-hidden','true'); track.appendChild(cl); });
    track.style.cssText = 'display:flex;gap:1.2rem;padding:0 2.5rem;will-change:transform;user-select:none;cursor:grab;';
    let x = 0, isDragging = false, dragStartX = 0, dragStartTx = 0, velX = 0, lastMX = 0, isHovered = false;
    function half() { return track.scrollWidth / 2; }
    function loop(val) { if (val <= -half()) val += half(); if (val > 0) val -= half(); return val; }
    function apply(v) { track.style.transform = `translateX(${v}px)`; }
    let lastT = 0;
    function raf(t) {
      const dt = lastT ? Math.min(t - lastT, 32) : 16; lastT = t;
      if (!isDragging) {
        if (!isHovered) x -= 0.55 * (dt/16);
        else if (Math.abs(velX) > 0.1) { x += velX*(dt/16); velX *= 0.92; }
        x = loop(x); apply(x);
      }
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    outer.addEventListener('mouseenter', () => { isHovered = true; });
    outer.addEventListener('mouseleave', () => { isHovered = false; if (isDragging) { isDragging = false; track.style.cursor = 'grab'; } });
    outer.addEventListener('mousedown', e => { isDragging = true; dragStartX = e.clientX; dragStartTx = x; velX = 0; lastMX = e.clientX; track.style.cursor = 'grabbing'; document.body.style.userSelect = 'none'; });
    window.addEventListener('mousemove', e => { if (!isDragging) return; x = loop(dragStartTx + (e.clientX - dragStartX)); apply(x); velX = e.clientX - lastMX; lastMX = e.clientX; });
    window.addEventListener('mouseup', () => { if (!isDragging) return; isDragging = false; track.style.cursor = 'grab'; document.body.style.userSelect = ''; });
  }

  /* ── Live clock ── */
  const clk = document.getElementById('live-clock');
  if (clk) { function tick() { const n = new Date(); clk.textContent = [n.getHours(),n.getMinutes(),n.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':'); } tick(); setInterval(tick, 1000); }

  /* ── Typewriter ── */
  const tw = document.getElementById('typewriter-role');
  if (tw) {
    const roles = ['Full Stack Developer','Problem Solver','Open Source Contributor','Systems Thinker','UI Craftsman'];
    let ri=0,ci=0,del=false;
    function tick() {
      const w = roles[ri];
      if (!del) { tw.textContent = w.slice(0,++ci); if(ci===w.length){del=true;setTimeout(tick,2000);return;} }
      else { tw.textContent = w.slice(0,--ci); if(ci===0){del=false;ri=(ri+1)%roles.length;} }
      setTimeout(tick, del?38:68);
    }
    tick();
  }

  /* ── Hero dot grid ── */
  const gc = document.getElementById('hero-grid-canvas');
  if (gc) {
    const gctx = gc.getContext('2d');
    let gW, gH, gdots = [], gmx = -999, gmy = -999;
    function gSetup() {
      gW = gc.width = gc.offsetWidth; gH = gc.height = gc.offsetHeight;
      gdots = [];
      const GAP = 42;
      for (let r = 0; r * GAP < gH + GAP; r++) for (let c = 0; c * GAP < gW + GAP; c++) gdots.push({ x: c*GAP, y: r*GAP });
    }
    gSetup(); window.addEventListener('resize', gSetup);
    gc.closest('section')?.addEventListener('mousemove', e => { const rect = gc.getBoundingClientRect(); gmx = e.clientX-rect.left; gmy = e.clientY-rect.top; });
    gc.closest('section')?.addEventListener('mouseleave', () => { gmx = -999; gmy = -999; });
    function gDraw() {
      gctx.clearRect(0, 0, gW, gH);
      const isDk = dark();
      gdots.forEach(d => {
        const dist = Math.hypot(d.x-gmx, d.y-gmy);
        const inf  = Math.max(0, 1 - dist / 95);
        const r    = 1.3 + inf * 3;
        const base = isDk ? `rgba(200,168,122,` : `rgba(120,104,80,`;
        gctx.beginPath();
        gctx.arc(d.x, d.y, r, 0, Math.PI*2);
        gctx.fillStyle = inf > 0.05 ? `${base}${0.15 + inf*0.65})` : `${base}${isDk?0.18:0.12})`;
        gctx.fill();
      });
      requestAnimationFrame(gDraw);
    }
    gDraw();
  }

  /* ── Magnetic hero chars ── */
  const hl = document.querySelector('.hero-headline');
  if (hl) {
    function wrap(el) {
      [...el.childNodes].forEach(node => {
        if (node.nodeType === 3) {
          const f = document.createDocumentFragment();
          [...node.textContent].forEach(ch => {
            if (ch===' '||ch==='\n'){f.appendChild(document.createTextNode(ch));return;}
            const w=document.createElement('span'); w.className='char-wrap';
            const c=document.createElement('span'); c.className='char'; c.textContent=ch;
            w.appendChild(c); f.appendChild(w);
          });
          el.replaceChild(f, node);
        } else if (node.tagName==='EM') wrap(node);
      });
    }
    wrap(hl);
    const chars = hl.querySelectorAll('.char');
    document.addEventListener('mousemove', e => {
      chars.forEach(c => {
        const r = c.getBoundingClientRect();
        const dx = e.clientX-(r.left+r.width/2), dy = e.clientY-(r.top+r.height/2);
        const d  = Math.hypot(dx, dy);
        c.style.transform = d < 100 ? `translate(${-dx/d*(1-d/100)*18}px,${-dy/d*(1-d/100)*18}px)` : '';
      });
    });
  }

  /* ── Navbar auto-hide (REMOVED) ── */

  /* ── Contact form ── */
  const form = document.getElementById('contact-form');
  const fsub = document.getElementById('form-submit');
  if (form && fsub) {
    form.addEventListener('submit', e => {
      e.preventDefault(); fsub.textContent='Sending…'; fsub.disabled=true;
      setTimeout(()=>{ fsub.textContent='Sent'; fsub.style.background='#4a7a4a'; setTimeout(()=>{ fsub.textContent='Send message'; fsub.disabled=false; fsub.style.background=''; form.reset(); },3000); },1200);
    });
  }

  /* ── CV download ── */
  document.getElementById('cv-download')?.addEventListener('click', () => {
    const a = document.createElement('a'); a.href='Resume.pdf'; a.download='Mehereswar_Resume.pdf'; a.click();
  });

  /* ── Marquee pause ── */
  document.querySelector('.marquee-band')?.addEventListener('mouseenter', () => {
    document.querySelector('.marquee-track')?.style.setProperty('animation-play-state','paused');
  });
  document.querySelector('.marquee-band')?.addEventListener('mouseleave', () => {
    document.querySelector('.marquee-track')?.style.setProperty('animation-play-state','running');
  });

})();
