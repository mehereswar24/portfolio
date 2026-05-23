/* ============================================
   scroll.js — Scroll Animations (3D + Reveal)
   ============================================ */
(function () {

  /* ─────────────────────────────────────────
     1. ELEMENT REVEAL — 3D perspective fade-in
  ───────────────────────────────────────── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-scale')
    .forEach(el => revealObs.observe(el));

  /* ─────────────────────────────────────────
     2. STAGGER GROUPS — children cascade in
  ───────────────────────────────────────── */
  const staggerObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      [...entry.target.children].forEach((child, i) => {
        child.style.transitionDelay = `${i * 0.09}s`;
        child.classList.add('visible');
      });
      staggerObs.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  document.querySelectorAll('.stagger-group').forEach(el => staggerObs.observe(el));

  /* ─────────────────────────────────────────
     3. SCROLL-DRIVEN 3D SECTION TRANSFORMS
     Uses rAF + scroll position to apply live
     perspective rotateX as sections enter/leave.
  ───────────────────────────────────────── */
  const sections = [...document.querySelectorAll('section[id]')];

  // Give every section a perspective wrapper so rotateX doesn't
  // flatten adjacent sections' stacking context.
  sections.forEach(sec => {
    sec.style.transformStyle   = 'preserve-3d';
    sec.style.willChange       = 'transform, opacity';
    sec.style.transformOrigin  = 'center top';
  });

  let ticking = false;

  function apply3D() {
    const vh = window.innerHeight;

    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      // normalised distance: 0 = section top at viewport centre
      // positive = above centre, negative = below centre
      const relTop    = rect.top / vh;           // 0 = at top edge, 1 = just below fold
      const relBottom = rect.bottom / vh;

      // Only transform while partially in view
      if (relBottom < -0.05 || relTop > 1.05) return;

      // Entry angle: section comes in from below → rotateX tilt
      // -1 = fully below viewport  →  0 = centred  →  no upward tilt
      const entry = Math.max(-1, Math.min(0, relTop - 0.15));  // range [-1, 0]
      const rotX  = entry * 5;           // max 5° tilt
      const transZ = entry * -30;         // max -30px depth

      sec.style.transform = `perspective(1300px) rotateX(${rotX.toFixed(2)}deg) translateZ(${transZ.toFixed(1)}px)`;
      // No opacity change — sections stay fully visible at all times
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(apply3D); ticking = true; }
  }, { passive: true });
  apply3D();

  /* ─────────────────────────────────────────
     4. PARALLAX on section H2 headings
  ───────────────────────────────────────── */
  const h2s = [...document.querySelectorAll('section[id] h2')];

  function updateParallax() {
    h2s.forEach(el => {
      const rect  = el.closest('section').getBoundingClientRect();
      const ratio = (window.innerHeight / 2 - rect.top - rect.height / 2) / window.innerHeight;
      el.style.transform = `translateY(${(ratio * 18).toFixed(1)}px)`;
    });
  }
  window.addEventListener('scroll', updateParallax, { passive: true });
  updateParallax();

  /* ─────────────────────────────────────────
     5. COUNTER ANIMATION
  ───────────────────────────────────────── */
  function countUp(el, to, dur = 1400) {
    const start = performance.now();
    (function step(now) {
      const ease = 1 - Math.pow(1 - Math.min((now - start) / dur, 1), 4);
      el.textContent = Math.round(ease * to);
      if (ease < 1) requestAnimationFrame(step); else el.textContent = to;
    })(performance.now());
  }
  const cntObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('[data-count]').forEach(el => countUp(el, +el.dataset.count));
      cntObs.unobserve(e.target);
    });
  }, { threshold: 0.3 });
  const aboutEl = document.getElementById('about');
  if (aboutEl) cntObs.observe(aboutEl);

  /* ─────────────────────────────────────────
     6. NAVBAR HIDE / SHOW + ACTIVE LINK
  ───────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (navbar) {
      // Keep navbar visible and fixed to top
      navbar.style.opacity       = '1';
      navbar.style.pointerEvents = '';
    }
    lastY = Math.max(y, 0);

    sections.forEach(sec => {
      const r = sec.getBoundingClientRect();
      if (r.top <= 120 && r.bottom >= 120)
        document.querySelectorAll('.nav-link').forEach(l =>
          l.classList.toggle('active', l.getAttribute('href') === '#' + sec.id));
    });
  }, { passive: true });

  /* ─────────────────────────────────────────
     7. SCROLL PROGRESS BAR
  ───────────────────────────────────────── */
  const bar = document.getElementById('progress-bar');
  if (bar) {
    window.addEventListener('scroll', () => {
      bar.style.width = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100) + '%';
    }, { passive: true });
  }

})();
