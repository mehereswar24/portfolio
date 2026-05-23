/* ============================================
   cursor.js — Custom Cursor + Scroll Progress
   ============================================ */

(function () {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const bar  = document.getElementById('progress-bar');
  if (!dot || !ring) return;

  let curX = 0, curY = 0;
  let ringX = 0, ringY = 0;
  let raf;

  document.addEventListener('mousemove', (e) => {
    curX = e.clientX;
    curY = e.clientY;
    dot.style.left  = curX + 'px';
    dot.style.top   = curY + 'px';
  });

  function animateRing() {
    ringX += (curX - ringX) * 0.12;
    ringY += (curY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    raf = requestAnimationFrame(animateRing);
  }
  animateRing();

  // Hover states
  const hoverables = 'a, button, .project-card, .social-link, .tag, .btn, .skill-row';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverables)) {
      document.body.classList.add('cursor-hover');
      document.body.classList.remove('cursor-text');
    } else if (e.target.closest('p, h1, h2, h3, h4')) {
      document.body.classList.add('cursor-text');
      document.body.classList.remove('cursor-hover');
    } else {
      document.body.classList.remove('cursor-hover', 'cursor-text');
    }
  });

  // Hide on leave
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '';
    ring.style.opacity = '';
  });

  // Scroll progress
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (bar) bar.style.width = pct + '%';
  }, { passive: true });
})();
