/* ============================================
   interactions.js — All unique interactions
   - Intro overlay animation
   - Hero dot grid (mouse reactive)
   - Char-by-char magnetic name
   - Typewriter role switcher
   - Skills orbit canvas
   - Cursor trail
   - Card 3D tilt + shine
   - Live clock
   - Page transition
   - Scroll-speed grain
   ============================================ */

/* ══════════════════════════════════════
   INTRO OVERLAY ANIMATION
   Theme-aware. Pct counter + status cycle
══════════════════════════════════════ */
(function introAnim() {
  const overlay   = document.getElementById('intro-overlay');
  const pctEl     = overlay?.querySelector('.intro-pct');
  const statusEl  = overlay?.querySelector('.intro-status-text');
  if (!overlay) return;

  // Lock scroll while intro plays
  document.body.style.overflow = 'hidden';

  // Animate percentage counter 0 → 100 over 1.7s (matches CSS bar fill)
  const pctDur    = 1700;
  const pctStart  = performance.now() + 700;   // sync with bar's 0.7s delay
  const STATUS    = ['Initializing', 'Rendering', 'Ready'];
  let statusIdx   = 0;

  function tickPct(now) {
    const elapsed = Math.max(0, now - pctStart);
    const p = Math.min(1, elapsed / pctDur);
    // ease-in-out cubic
    const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    if (pctEl) pctEl.textContent = Math.round(eased * 100) + '%';
    if (p < 1) requestAnimationFrame(tickPct);
  }
  requestAnimationFrame(tickPct);

  // Cycle status text every ~750ms
  const statusTimer = setInterval(() => {
    statusIdx = (statusIdx + 1) % STATUS.length;
    if (statusEl) {
      statusEl.style.opacity = '0';
      setTimeout(() => {
        if (statusEl) { statusEl.textContent = STATUS[statusIdx]; statusEl.style.opacity = '1'; }
      }, 150);
    }
  }, 750);

  // Exit: after 2.6s slide up, then clean up
  setTimeout(() => {
    clearInterval(statusTimer);
    overlay.classList.add('exit');
    setTimeout(() => {
      document.body.style.overflow = '';
      overlay.classList.add('hidden');
    }, 900);
  }, 2600);
})();

/* ══════════════════════════════════════
   HERO DOT GRID
══════════════════════════════════════ */
(function heroGrid() {
  const canvas = document.getElementById('hero-grid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR_H = window.devicePixelRatio || 1;
  let W, H, cols, rows, dots = [];
  let mx = -999, my = -999;

  function dark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }


  function setup() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = Math.round(W * DPR_H);
    canvas.height = Math.round(H * DPR_H);
    ctx.setTransform(DPR_H, 0, 0, DPR_H, 0, 0);
    const GAP = 38;
    cols = Math.ceil(W / GAP) + 1;
    rows = Math.ceil(H / GAP) + 1;
    dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({ x: c * GAP, y: r * GAP, baseR: 1.4 });
      }
    }
  }
  setup();
  window.addEventListener('resize', setup);

  canvas.closest('section').addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
  });
  canvas.closest('section').addEventListener('mouseleave', () => { mx = -999; my = -999; });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const baseColor = dark() ? '200,180,140' : '100,88,72';
    const hlColor   = dark() ? '212,168,90'  : '180,130,70';

    dots.forEach(d => {
      const dx = d.x - mx, dy = d.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const RADIUS = 90;
      const influence = Math.max(0, 1 - dist / RADIUS);

      const r = d.baseR + influence * 3.5;
      const op = (dark() ? 0.25 : 0.18) + influence * 0.55;

      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fillStyle = influence > 0.05
        ? `rgba(${hlColor},${op})`
        : `rgba(${baseColor},${dark() ? 0.5 : 0.16})`;
      ctx.fill();

      // Draw line toward cursor for close dots
      if (influence > 0.3 && dist > 1) {
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - dx * influence * 0.15, d.y - dy * influence * 0.15);
        ctx.strokeStyle = `rgba(${hlColor},${influence * 0.25})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    });
    requestAnimationFrame(draw);
  }
  draw();

  // Theme change
  new MutationObserver(() => {}).observe(document.documentElement, { attributes: true });
})();


/* ══════════════════════════════════════
   CHAR MAGNETIC HERO NAME
══════════════════════════════════════ */
(function charMagnetic() {
  const hl = document.querySelector('.hero-headline');
  if (!hl) return;

  // Wrap each char
  function wrapChars(el) {
    el.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        [...node.textContent].forEach(ch => {
          if (ch === ' ' || ch === '\n') { frag.appendChild(document.createTextNode(ch)); return; }
          const w = document.createElement('span');
          w.className = 'char-wrap';
          const c = document.createElement('span');
          c.className = 'char';
          c.textContent = ch;
          w.appendChild(c);
          frag.appendChild(w);
        });
        el.replaceChild(frag, node);
      } else if (node.tagName === 'EM' || node.tagName === 'BR') {
        if (node.tagName === 'EM') wrapChars(node);
      }
    });
  }
  wrapChars(hl);

  const chars = hl.querySelectorAll('.char');

  document.addEventListener('mousemove', e => {
    chars.forEach(c => {
      const rect = c.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const RANGE = 110;
      if (dist < RANGE) {
        const force = (1 - dist / RANGE) * 22;
        c.style.transform = `translate(${-dx / dist * force}px, ${-dy / dist * force}px)`;
      } else {
        c.style.transform = '';
      }
    });
  });
})();


/* Typewriter removed for static premium headline */


/* ══════════════════════════════════════
   SKILLS ORBIT CANVAS
══════════════════════════════════════ */
(function skillsOrbit() {
  const canvas = document.getElementById('skills-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const CATEGORIES = {
    Frontend:  { skills: ['HTML/CSS', 'JavaScript', 'React', 'Figma'], color: '#c8a87a', angle: 0 },
    Backend:   { skills: ['Python', 'Java', 'C/C++', 'FastAPI', 'Node.js'], color: '#8a7a60', angle: Math.PI * 2 / 3 },
    AIML:      { skills: ['TensorFlow', 'PyTorch', 'scikit-learn', 'OpenCV', 'Pandas', 'NumPy'], color: '#d4a85a', angle: Math.PI * 5 / 3 },
    Database:  { skills: ['SQL', 'DBMS', 'Supabase'], color: '#a89060', angle: Math.PI * 4 / 3 },
    DevOps:    { skills: ['Git', 'GitHub', 'VS Code', 'Docker', 'AWS', 'CI/CD', 'GitHub Actions'], color: '#b89878', angle: Math.PI / 3 },
    Core:      { skills: ['DSA', 'OOP'], color: '#907060', angle: Math.PI },
  };

  const cats = Object.entries(CATEGORIES);
  let hovered = null;
  let W, H, cx, cy, t = 0;
  let mx = 0, my = 0;
  let activeCat = null;
  const tabs = document.querySelectorAll('.skill-tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t2 => t2.classList.remove('active'));
      tab.classList.add('active');
      activeCat = tab.dataset.cat || null;
    });
  });

  function dark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  const DPR_S = window.devicePixelRatio || 1;

  function resize() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = Math.round(W * DPR_S);
    canvas.height = Math.round(H * DPR_S);
    ctx.setTransform(DPR_S, 0, 0, DPR_S, 0, 0);
    cx = W / 2; cy = H / 2;
  }
  requestAnimationFrame(() => resize());
  window.addEventListener('resize', () => resize());

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    // coords are CSS pixels; ctx is pre-scaled so drawing is also in CSS pixels
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { hovered = null; mx = -9999; my = -9999; });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.008;

    const bgAlpha = dark() ? 0.04 : 0.025;
    ctx.fillStyle = dark() ? `rgba(17,16,9,${bgAlpha})` : `rgba(245,240,232,${bgAlpha})`;

    const R1 = Math.min(W, H) * 0.22; // inner orbit  (was 0.18)
    const R2 = Math.min(W, H) * 0.40; // outer orbit  (was 0.33)

    // Center node
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fillStyle = dark() ? 'rgba(200,168,122,0.12)' : 'rgba(200,168,122,0.15)';
    ctx.fill();
    ctx.strokeStyle = dark() ? 'rgba(200,168,122,0.4)' : 'rgba(180,140,80,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = dark() ? '#d4a85a' : '#8a6a30';
    ctx.font = `700 14px 'DM Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SKILLS', cx, cy);

    // Orbit rings
    [R1, R2].forEach((r, i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = dark() ? 'rgba(200,168,122,0.08)' : 'rgba(160,120,60,0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Categories
    cats.forEach(([name, cat], ci2) => {
      const angleOffset = t * (ci2 % 2 === 0 ? 1 : -0.7);
      const angle = cat.angle + angleOffset;
      const orbit = ci2 < 3 ? R1 : R2;
      const nx = cx + Math.cos(angle) * orbit;
      const ny = cy + Math.sin(angle) * orbit;

      const isActive = activeCat === null || activeCat === name;
      const distToCursor = Math.sqrt((mx - nx) ** 2 + (my - ny) ** 2);
      const isHovered = distToCursor < 42;
      if (isHovered) hovered = name;

      const alpha = isActive ? 1 : 0.25;

      // Line to center
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = `${cat.color}${Math.round(alpha * (isHovered ? 60 : 30)).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = isHovered ? 1.5 : 0.8;
      ctx.stroke();

      // Category node
      const r = isHovered ? 36 : 30;
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fillStyle = `${cat.color}${Math.round(alpha * (dark() ? 25 : 20)).toString(16).padStart(2, '0')}`;
      ctx.fill();
      ctx.strokeStyle = `${cat.color}${Math.round(alpha * (isHovered ? 220 : 140)).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = dark() ? `rgba(240,234,216,${alpha * 0.9})` : `rgba(28,25,21,${alpha * 0.85})`;
      ctx.font = `600 12px 'DM Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name.toUpperCase(), nx, ny);

      // Skills on hover
      if (isHovered && isActive) {
        cat.skills.forEach((skill, si) => {
          const sa = angle + (si - (cat.skills.length - 1) / 2) * 0.35;
          const sr = orbit + 65;
          const sx = cx + Math.cos(sa) * sr;
          const sy = cy + Math.sin(sa) * sr;

          ctx.beginPath();
          ctx.moveTo(nx, ny);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = `${cat.color}40`;
          ctx.lineWidth = 0.6;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(sx, sy, 7, 0, Math.PI * 2);
          ctx.fillStyle = dark() ? 'rgba(200,168,122,0.2)' : 'rgba(180,140,80,0.18)';
          ctx.fill();
          ctx.strokeStyle = cat.color + '99';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = dark() ? 'rgba(240,234,216,0.85)' : 'rgba(28,25,21,0.8)';
          ctx.font = `300 11px 'DM Sans', sans-serif`;
          ctx.fillText(skill, sx, sy + 18);
        });
      }
    });

    requestAnimationFrame(draw);
  }
  draw();
})();


/* ══════════════════════════════════════
   CURSOR TRAIL
══════════════════════════════════════ */
(function cursorTrail() {
  const dot   = document.getElementById('cursor-dot');
  const ring  = document.getElementById('cursor-ring');
  const bar   = document.getElementById('progress-bar');
  if (!dot) return;

  const TRAIL = 16;
  const trail = [];
  for (let i = 0; i < TRAIL; i++) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;pointer-events:none;z-index:9989;border-radius:50%;transform:translate(-50%,-50%);';
    document.body.appendChild(el);
    trail.push({ el, x: 0, y: 0 });
  }

  let cx = 0, cy = 0, rx = 0, ry = 0;
  function dark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  document.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; dot.style.left = cx + 'px'; dot.style.top = cy + 'px'; }, { passive: true });

  function animTrail() {
    let px = cx, py = cy;
    trail.forEach((t2, i) => {
      t2.x += (px - t2.x) * 0.32;
      t2.y += (py - t2.y) * 0.32;
      px = t2.x; py = t2.y;
      const f = 1 - i / TRAIL;
      const size = f * 5.5;
      const op = f * (dark() ? 0.28 : 0.14);
      const col = dark() ? '200,168,122' : '28,25,21';
      t2.el.style.cssText = `position:fixed;pointer-events:none;z-index:9989;border-radius:50%;transform:translate(-50%,-50%);width:${size}px;height:${size}px;left:${t2.x}px;top:${t2.y}px;background:rgba(${col},${op});`;
    });

    rx += (cx - rx) * 0.11;
    ry += (cy - ry) * 0.11;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';

    requestAnimationFrame(animTrail);
  }
  animTrail();

  // Hover states
  document.addEventListener('mouseover', e => {
    const hov = e.target.closest('a,button,.project-card,.cert-card,.social-link,.tag,.skill-tab');
    const txt = e.target.closest('p,h1,h2,h3');
    document.body.classList.toggle('cursor-hover', !!hov);
    document.body.classList.toggle('cursor-text', !!txt && !hov);
  });

  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
    if (bar) bar.style.width = pct + '%';
  }, { passive: true });
})();


/* ══════════════════════════════════════
   3D CARD TILT + SHINE
══════════════════════════════════════ */
(function tilt() {
  document.querySelectorAll('.project-card, .cert-card').forEach(card => {
    const shine = document.createElement('div');
    shine.style.cssText = 'position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity 0.3s;';
    card.appendChild(shine);
    card.style.transformStyle = 'preserve-3d';

    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const xr = (e.clientX - rect.left) / rect.width;
      const yr = (e.clientY - rect.top)  / rect.height;
      const rotY =  (xr - 0.5) * 14;
      const rotX = -(yr - 0.5) * 10;
      card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`;
      card.style.transition = 'transform 0.1s';
      shine.style.opacity = '1';
      shine.style.background = `radial-gradient(circle at ${xr*100}% ${yr*100}%, rgba(255,255,255,0.1) 0%, transparent 60%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0)';
      card.style.transition = 'transform 0.6s cubic-bezier(0.34,1.2,0.64,1)';
      shine.style.opacity = '0';
    });
  });
})();


/* ══════════════════════════════════════
   LIVE CLOCK
══════════════════════════════════════ */
(function clock() {
  const el = document.getElementById('live-clock');
  if (!el) return;
  function update() {
    const n = new Date();
    el.textContent = [n.getHours(), n.getMinutes(), n.getSeconds()].map(x => String(x).padStart(2,'0')).join(':');
  }
  update();
  setInterval(update, 1000);
})();


/* ══════════════════════════════════════
   PAGE TRANSITIONS
══════════════════════════════════════ */
(function pageTransitions() {
  const overlay = document.createElement('div');
  overlay.className = 'page-transition-overlay';
  document.body.appendChild(overlay);

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();

      overlay.style.transition = 'none';
      overlay.style.transform = 'translateY(100%)';
      overlay.style.background = 'var(--bg-primary)';

      requestAnimationFrame(() => {
        overlay.style.transition = 'transform 0.45s cubic-bezier(0.76,0,0.24,1)';
        overlay.style.transform = 'translateY(0)';
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'instant' });
          overlay.style.transition = 'transform 0.45s cubic-bezier(0.76,0,0.24,1)';
          overlay.style.transform = 'translateY(-100%)';
        }, 400);
      });
    });
  });
})();


/* ══════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════ */
(function reveals() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-scale');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));

  // Skill bars
  const barObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.skill-bar-inner[data-w]').forEach(b => { b.style.width = b.dataset.w + '%'; });
        barObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  const skillsEl = document.getElementById('skills');
  if (skillsEl) barObs.observe(skillsEl);

  // Counters
  function countUp(el, to, dur = 1200) {
    const start = performance.now();
    (function step(now) {
      const ease = 1 - Math.pow(1 - Math.min((now - start) / dur, 1), 4);
      el.textContent = Math.round(ease * to);
      if (ease < 1) requestAnimationFrame(step); else el.textContent = to;
    })(performance.now());
  }
  const cntObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('[data-count]').forEach(el => countUp(el, +el.dataset.count));
        cntObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  const aboutEl = document.getElementById('about');
  if (aboutEl) cntObs.observe(aboutEl);

  // Navbar hide/show
  const navbar = document.getElementById('navbar');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (navbar) {
      navbar.style.opacity = (y > lastY && y > 200) ? '0' : '1';
      navbar.style.pointerEvents = (y > lastY && y > 200) ? 'none' : '';
    }
    lastY = y <= 0 ? 0 : y;

    // Active nav link
    document.querySelectorAll('section[id]').forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 100) {
        document.querySelectorAll('.nav-link').forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + sec.id);
        });
      }
    });
  }, { passive: true });
})();


/* ══════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════ */
(function theme() {
  const btn  = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('pk-theme') || 'light';
  root.setAttribute('data-theme', saved);
  updateIcon(saved);
  if (btn) btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('pk-theme', next);
    updateIcon(next);
  });
  function updateIcon(t) {
    if (!btn) return;
    btn.innerHTML = t === 'dark'
      ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
})();


/* ══════════════════════════════════════
   CV DOWNLOAD
══════════════════════════════════════ */
(function cvDownload() {
  document.getElementById('cv-download')?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = 'Resume.pdf';
    a.download = 'Mehereswar_Resume.pdf';
    a.click();
  });
})();


/* ══════════════════════════════════════
   CONTACT FORM
══════════════════════════════════════ */
(function contactForm() {
  const form = document.getElementById('contact-form');
  const btn  = document.getElementById('form-submit');
  if (!form || !btn) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    btn.textContent = 'Sending...'; btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Sent successfully'; btn.style.background = '#4a7a4a';
      setTimeout(() => { btn.textContent = 'Send message'; btn.disabled = false; btn.style.background = ''; form.reset(); }, 3000);
    }, 1200);
  });
})();


/* ══════════════════════════════════════
   MAGNETIC BUTTONS
   Primary CTA buttons shift toward cursor
══════════════════════════════════════ */
(function magneticBtns() {
  const STRENGTH = 0.28;
  document.querySelectorAll('.btn-download, .btn-solid, .btn-theme').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * STRENGTH;
      const dy   = (e.clientY - cy) * STRENGTH;
      btn.style.transform  = `translate(${dx}px, ${dy}px)`;
      btn.style.transition = 'transform 0.1s ease';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform  = 'translate(0,0)';
      btn.style.transition = 'transform 0.5s cubic-bezier(0.34,1.4,0.64,1)';
    });
  });
})();


/* ══════════════════════════════════════
   CLICK SPARK PARTICLES
   Gold sparks burst from every click
══════════════════════════════════════ */
(function clickSparks() {
  function dark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  window.addEventListener('click', e => {
    if (e.clientX <= 0 || e.clientY <= 0) return;
    const count = 9 + Math.floor(Math.random() * 5);
    const color = dark() ? '#d4a85a' : '#c8922a';
    const sparks = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 2.5 + Math.random() * 3.5;
      const size  = 3 + Math.random() * 3;
      const el    = document.createElement('div');
      el.style.cssText = [
        `position:fixed`,
        `left:${e.clientX}px`,
        `top:${e.clientY}px`,
        `width:${size}px`,
        `height:${size}px`,
        `border-radius:50%`,
        `background:${color}`,
        `pointer-events:none`,
        `z-index:99999`,
        `transform:translate(-50%,-50%)`,
        `will-change:transform,opacity`
      ].join(';');
      document.body.appendChild(el);
      sparks.push({ el, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, x: 0, y: 0, life: 1 });
    }

    const gravity = 0.18;
    let frame;
    function tick() {
      let alive = false;
      sparks.forEach(s => {
        if (s.life <= 0) return;
        s.vy += gravity;
        s.x  += s.vx;
        s.y  += s.vy;
        s.life -= 0.038;
        s.el.style.transform = `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px))`;
        s.el.style.opacity   = Math.max(0, s.life);
        if (s.life > 0) alive = true;
      });
      if (alive) { frame = requestAnimationFrame(tick); }
      else { cancelAnimationFrame(frame); sparks.forEach(s => s.el.remove()); }
    }
    requestAnimationFrame(tick);
  });
})();


/* ══════════════════════════════════════
   FLOATING SECTION DOT NAV (right side)
   Live indicator of reading position
══════════════════════════════════════ */
(function sectionDotsNav() {
  const SECS   = ['about','skills','projects','certifications','contact'];
  const LABELS = ['About','Skills','Work','Certs','Contact'];

  /* Inject styles */
  const style = document.createElement('style');
  style.textContent = `
    .sdnav {
      position: fixed;
      right: 1.6rem;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 5000;
    }
    .sdnav-dot {
      position: relative;
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--border-strong);
      cursor: none;
      transition: background 0.25s, transform 0.25s;
    }
    .sdnav-dot.active {
      background: var(--accent-warm);
      transform: scale(1.6);
    }
    .sdnav-dot::after {
      content: attr(data-label);
      position: absolute;
      right: 1.4rem;
      top: 50%;
      transform: translateY(-50%);
      font-family: var(--font-mono);
      font-size: 0.6rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--text-muted);
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    }
    .sdnav-dot:hover::after { opacity: 1; }
    @media (max-width: 900px) { .sdnav { display: none; } }
  `;
  document.head.appendChild(style);

  const nav = document.createElement('nav');
  nav.className = 'sdnav';
  nav.setAttribute('aria-label', 'Section navigation');

  const dots = SECS.map((id, i) => {
    const d = document.createElement('a');
    d.className   = 'sdnav-dot';
    d.href        = '#' + id;
    d.setAttribute('data-label', LABELS[i]);
    d.setAttribute('aria-label', LABELS[i]);
    d.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    });
    nav.appendChild(d);
    return d;
  });
  document.body.appendChild(nav);

  function update() {
    SECS.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      dots[i].classList.toggle('active', r.top <= 140 && r.bottom >= 140);
    });
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* ══════════════════════════════════════
   PARALLAX GHOST NUMBERS
   .number-large moves at 0.3× scroll
   speed creating depth behind headings
══════════════════════════════════════ */
(function parallaxNumbers() {
  const nums = [...document.querySelectorAll('.number-large')];
  if (!nums.length) return;

  function tick() {
    const sy = window.scrollY;
    nums.forEach(num => {
      const sec = num.closest('section');
      if (!sec) return;
      const top = sec.getBoundingClientRect().top + sy;
      const rel = sy - top;
      num.style.transform = `translateY(${rel * 0.22}px)`;
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();


/* ══════════════════════════════════════
   CURSOR COMET TRAIL
   Fading dot trail follows cursor,
   theme-aware gold color
══════════════════════════════════════ */
(function cometTrail() {
  const cvs = document.createElement('canvas');
  cvs.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9993';
  document.body.appendChild(cvs);
  const ctx = cvs.getContext('2d');

  let W = cvs.width  = window.innerWidth;
  let H = cvs.height = window.innerHeight;
  window.addEventListener('resize', () => {
    W = cvs.width  = window.innerWidth;
    H = cvs.height = window.innerHeight;
  }, { passive: true });

  const MAX   = 28;
  const trail = [];
  let cx = -999, cy = -999;

  window.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    trail.push({ x: cx, y: cy });
    if (trail.length > MAX) trail.shift();
  }, { passive: true });

  function dark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 1; i < trail.length; i++) {
      const t  = i / trail.length;
      const p0 = trail[i - 1];
      const p1 = trail[i];
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = dark()
        ? `rgba(212,168,90,${t * 0.28})`
        : `rgba(160,110,40,${t * 0.18})`;
      ctx.lineWidth = t * 2.5;
      ctx.lineCap   = 'round';
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();
