/* ============================================
   three-bg.js — Scroll-Reactive Wave Grid
   A 3D wireframe grid that physically responds to:
     · Scroll speed  → wave amplitude grows
     · Scroll position → wave phase/pattern changes
     · Mouse position → ripple origin point on grid
   No floating shapes. Pure interaction.
   ============================================ */
(function () {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 16, 24);
  camera.lookAt(0, 0, 0);

  /* ── Theme ── */
  function dark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function col() { return dark() ? 0xc8a87a : 0x907040; }
  function op() { return dark() ? 0.14 : 0.058; }

  /* ── Wave Grid ── */
  const SEGS = 70, SIZE = 64;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS);
  geo.rotateX(-Math.PI / 1.5);   // lay flat in XZ plane

  const mat = new THREE.MeshBasicMaterial({
    color: col(), wireframe: true, transparent: true, opacity: op()
  });
  const grid = new THREE.Mesh(geo, mat);
  scene.add(grid);

  /* Store original Y per vertex (all 0 after rotation) */
  const posAttr = geo.attributes.position;
  const count = posAttr.count;

  /* ── Scroll tracking ── */
  let scrollY = 0;
  let scrollVel = 0;   // instantaneous scroll speed
  let prevScrollY = 0;

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    scrollVel = scrollY - prevScrollY;
    prevScrollY = scrollY;
  }, { passive: true });

  /* ── Mouse tracking (normalised -1..1) ── */
  let mx = 0, mz = 0, smx = 0, smz = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    mz = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ── Click ripple bursts ── */
  const clickRipples = [];
  window.addEventListener('click', e => {
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const nz = (e.clientY / window.innerHeight - 0.5) * 2;
    clickRipples.push({
      wx: nx * SIZE * 0.45,
      wz: nz * SIZE * 0.45,
      born: 0,       // filled in on next frame
      strength: 2.2
    });
    if (clickRipples.length > 6) clickRipples.shift();
  }, { passive: true });

  /* ── Theme sync ── */
  new MutationObserver(() => {
    mat.color.setHex(col());
    mat.opacity = op();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ── Animate ── */
  const clock = new THREE.Clock();
  let velDecay = 0;
  let _lastT = 0;   // used to stamp clickRipple born time

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    /* Stamp born time on fresh click ripples */
    clickRipples.forEach(r => { if (!r.born) r.born = t; });

    /* Smooth mouse — snappier */
    smx += (mx - smx) * 0.05;
    smz += (mz - smz) * 0.05;

    /* Decay scroll velocity — slower decay keeps burst alive longer */
    velDecay += (Math.abs(scrollVel) - velDecay) * 0.12;
    scrollVel *= 0.80;

    /* Scroll progress 0-1 across whole page */
    const maxS = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollP = scrollY / maxS;             // 0 (top) → 1 (bottom)
    
    // Moderate scroll reactivity (balanced)
    const amp = 0.55 + Math.min(velDecay * 0.008, 0.8) + scrollP * 0.35;  
    const freq = 0.16;
    const speed = 0.50;

    /* Mouse world-space ripple origin */
    const mwx = smx * SIZE * 0.38;
    const mwz = smz * SIZE * 0.38;

    /* Update every vertex */
    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      /* Base standing wave with moderate scroll shift */
      const wave1 = Math.sin(x * freq + t * speed + scrollP * 2.0) *
        Math.cos(z * freq * 0.8 + t * speed * 0.65);

      /* Secondary diagonal ripple */
      const wave2 = Math.sin((x + z) * freq * 0.5 + t * speed * 0.7 + scrollP * 1.5) * 0.5;

      /* Mouse ripple: radial wave emanating from cursor */
      const dx = x - mwx;
      const dz = z - mwz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const mouseRipple = Math.sin(dist * 0.35 - t * 3.5) *
        Math.exp(-dist * 0.055) *
        (0.5 + velDecay * 0.04);

      /* Always-on ambient ripple — grid is never flat */
      const ambient = Math.sin(x * 0.12 + t * 0.4) * Math.cos(z * 0.10 + t * 0.3) * 0.5
        + Math.sin((x - z) * 0.08 + t * 0.28) * 0.25;

      /* Click-burst ripples: outward circular waves from click points */
      let clickWave = 0;
      clickRipples.forEach(r => {
        const age = t - r.born;
        if (age > 3.5) return;                       // expire after 3.5s
        const cdx = x - r.wx, cdz = z - r.wz;
        const cdist = Math.sqrt(cdx * cdx + cdz * cdz);
        const front = age * 9;                       // wavefront expands at speed 9
        const falloff = Math.exp(-Math.pow(cdist - front, 2) * 0.04);
        const decay   = Math.exp(-age * 1.2);
        clickWave += Math.sin(cdist * 0.4 - t * 4) * falloff * decay * r.strength;
      });

      posAttr.setY(i, (wave1 + wave2) * amp + mouseRipple + ambient + clickWave);
    }
    posAttr.needsUpdate = true;

    /* Camera tilts gently toward mouse + rises slightly with scroll */
    camera.position.y = 16 - scrollP * 5;
    camera.position.x += (smx * 2.5 - camera.position.x) * 0.04;
    camera.rotation.y += (-smx * 0.08 - camera.rotation.y) * 0.04;
    camera.lookAt(smx * 2, 0, smz * 2);

    renderer.render(scene, camera);
  }
  animate();
})();
