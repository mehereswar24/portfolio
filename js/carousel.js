/* ============================================
   carousel.js — Horizontal Drag Carousel (Fixed)
   Uses CSS transform instead of scrollLeft
   because overflow:hidden blocks scrollLeft.
   ============================================ */

(function () {
  const outer = document.querySelector('.carousel-outer');
  const track = document.querySelector('.carousel-track');
  if (!outer || !track) return;

  // Duplicate cards first for seamless loop
  const origCards = Array.from(track.children);
  origCards.forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });

  let x = 0;
  let dragStartX  = 0;
  let dragStartTx = 0;
  let isDragging  = false;
  let isHovered   = false;
  let velX        = 0;
  let lastMouseX  = 0;
  let lastTime    = 0;

  const AUTO_SPEED = 0.7;

  function getHalfWidth() {
    return track.scrollWidth / 2;
  }

  function clampLoop(val) {
    const half = getHalfWidth();
    if (val <= -half) val += half;
    if (val > 0)      val -= half;
    return val;
  }

  function applyTransform(val) {
    track.style.transform = 'translateX(' + val + 'px)';
  }

  function loop(time) {
    const dt = lastTime ? Math.min(time - lastTime, 32) : 16;
    lastTime = time;

    if (!isDragging) {
      if (!isHovered) {
        x -= AUTO_SPEED * (dt / 16);
      } else if (Math.abs(velX) > 0.1) {
        x += velX * (dt / 16);
        velX *= 0.92;
      }
      x = clampLoop(x);
      applyTransform(x);
    }

    requestAnimationFrame(loop);
  }

  track.style.transition = 'none';
  track.style.willChange = 'transform';
  track.style.cursor = 'grab';

  // Mouse drag — listen on window so fast drags don't break
  outer.addEventListener('mousedown', (e) => {
    isDragging  = true;
    dragStartX  = e.clientX;
    dragStartTx = x;
    velX = 0;
    lastMouseX = e.clientX;
    track.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    x = clampLoop(dragStartTx + dx);
    applyTransform(x);
    velX = e.clientX - lastMouseX;
    lastMouseX = e.clientX;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = 'grab';
    document.body.style.userSelect = '';
  });

  outer.addEventListener('mouseenter', () => { isHovered = true; });
  outer.addEventListener('mouseleave', () => {
    isHovered = false;
    if (isDragging) {
      isDragging = false;
      track.style.cursor = 'grab';
      document.body.style.userSelect = '';
    }
  });

  // Touch
  let touchStartX = 0, touchStartTx = 0;

  outer.addEventListener('touchstart', (e) => {
    touchStartX  = e.touches[0].clientX;
    touchStartTx = x;
    velX = 0;
    isHovered = true;
  }, { passive: true });

  outer.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - touchStartX;
    x = clampLoop(touchStartTx + dx);
    applyTransform(x);
  }, { passive: true });

  outer.addEventListener('touchend', () => {
    isHovered = false;
  }, { passive: true });

  requestAnimationFrame(loop);
})();
