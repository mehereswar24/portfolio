/* ============================================
   theme.js — Dark/Light Mode + Misc Interactions
   ============================================ */

(function () {
  // ── Theme Toggle ──
  const toggle = document.getElementById('theme-toggle');
  const root   = document.documentElement;

  const saved = localStorage.getItem('portfolio-theme') || 'light';
  root.setAttribute('data-theme', saved);
  updateToggleIcon(saved);

  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next    = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('portfolio-theme', next);
      updateToggleIcon(next);
    });
  }

  function updateToggleIcon(theme) {
    if (!toggle) return;
    toggle.innerHTML = theme === 'dark'
      ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }

  // ── CV Download (placeholder) ──
  const cvBtn = document.getElementById('cv-download');
  if (cvBtn) {
    cvBtn.addEventListener('click', () => {
      // Replace href below with your real CV PDF path
      const a = document.createElement('a');
      a.href = 'assets/cv.pdf';
      a.download = 'Alex_Kumar_CV.pdf';
      a.click();
    });
  }

  // ── Form Submit ──
  const form   = document.getElementById('contact-form');
  const submit = document.getElementById('form-submit');
  if (form && submit) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submit.textContent = 'Sending...';
      submit.disabled = true;
      setTimeout(() => {
        submit.textContent = 'Message sent';
        submit.style.background = '#5a7a5a';
        setTimeout(() => {
          submit.textContent = 'Send message';
          submit.disabled = false;
          submit.style.background = '';
          form.reset();
        }, 3000);
      }, 1200);
    });
  }

  // ── Magnetic buttons ──
  document.querySelectorAll('.btn-magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) * 0.25;
      const dy = (e.clientY - cy) * 0.25;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });

  // ── Smooth active nav link highlight ──
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.style.color = '';
          link.style.background = '';
          if (link.getAttribute('href') === `#${id}`) {
            link.style.color = 'var(--text-primary)';
            link.style.background = 'var(--border)';
          }
        });
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(s => sectionObserver.observe(s));
})();
