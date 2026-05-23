/* ============================================
   about-canvas.js — Interactive Terminal / Code Editor
   Renders a live scrolling code snippet with:
     · Syntax-coloured lines that type in on load
     · Blinking cursor on the active line
     · Floating git-commit badges drifting upward
     · Mouse hover: highlights nearest line
   ============================================ */
(function aboutCanvas() {
  const canvas = document.getElementById('about-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ── Theme ── */
  function dark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }

  /* ── DPR-aware resize ──
     Canvas pixel buffer = CSS size × devicePixelRatio for sharp rendering.
     We then pre-scale the context so all draw calls use CSS pixel coords,
     which means mouse event coords (also CSS pixels) align perfectly.
  */
  let W, H;
  const DPR = window.devicePixelRatio || 1;

  function resize() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);  // scale once; preserved across frames
    BADGES.forEach((b, i) => resetBadge(b, i));
  }
  requestAnimationFrame(() => resize());
  window.addEventListener('resize', resize, { passive: true });

  /* ── Colour palette (matches editor-like scheme) ── */
  function pal() {
    const d = dark();
    return {
      bg: d ? '#13120c' : '#faf7f0',
      lineHl: d ? 'rgba(200,168,122,0.07)' : 'rgba(160,120,60,0.07)',
      num: d ? '#4a4540' : '#c0b8aa',
      kw: d ? '#c678dd' : '#7c3aed',
      fn: d ? '#61afef' : '#1d4ed8',
      str: d ? '#98c379' : '#16a34a',
      comment: d ? '#3d3d38' : '#d4cfc5',
      punct: d ? '#abb2bf' : '#57534e',
      plain: d ? '#ddd8c6' : '#292524',
      cursor: d ? '#d4a85a' : '#b45309',
      badge: d ? 'rgba(200,168,122,0.18)' : 'rgba(180,140,70,0.14)',
      badgeStr: d ? '#c8a87a' : '#92400e',
    };
  }

  /* ── Code lines (token arrays: [text, type]) ── */
  const CODE = [
    [['// ', 'comment'], ['alex-kumar/portfolio', 'comment']],
    [['import ', 'kw'], ['{ useState, useEffect }', 'plain'], [' from ', 'kw'], ['"react"', 'str']],
    [],
    [['export ', 'kw'], ['default ', 'kw'], ['function ', 'kw'], ['Portfolio', 'fn'], ['() {', 'punct']],
    [['  ', 'plain'], ['const ', 'kw'], ['[theme, setTheme]', 'plain'], [' = ', 'punct'], ['useState', 'fn'], ['(', 'punct'], ['"dark"', 'str'], [')', 'punct']],
    [['  ', 'plain'], ['const ', 'kw'], ['projects', 'plain'], [' = ', 'punct'], ['useMemo', 'fn'], ['(()', 'punct'], [' => ', 'kw'], ['[...data],', 'punct'], [' [])', 'punct']],
    [],
    [['  ', 'plain'], ['useEffect', 'fn'], ['(() => {', 'punct']],
    [['    document', 'plain'], ['.title ', 'punct'], ['= ', 'punct'], ['"ME · Portfolio"', 'str']],
    [['  }, [])', 'punct']],
    [],
    [['  ', 'plain'], ['return ', 'kw'], ['(', 'punct']],
    [['    ', 'plain'], ['<main ', 'fn'], ['className', 'plain'], ['=', 'punct'], ['"app"', 'str'], ['>', 'fn']],
    [['      ', 'plain'], ['<Hero ', 'fn'], ['theme', 'plain'], ['={theme}', 'punct'], [' />', 'fn']],
    [['      ', 'plain'], ['<Skills ', 'fn'], ['data', 'plain'], ['={projects}', 'punct'], [' />', 'fn']],
    [['      ', 'plain'], ['<Contact ', 'fn'], ['open', 'plain'], [' />', 'fn']],
    [['    ', 'plain'], ['</main>', 'fn']],
    [['  )', 'punct']],
    [['}', 'punct']],
    [],
    [['// git log --oneline', 'comment']],
    [['a3f8b21', 'str'], [' feat: add dark mode toggle', 'plain']],
    [['9c12de4', 'str'], [' fix: mobile nav overflow', 'plain']],
    [['5e77abc', 'str'], [' refactor: skills orbit canvas', 'plain']],
    [['2b41f09', 'str'], [' perf: lazy load sections', 'plain']],
  ];

  const LINE_H = 20;
  const FONT = `12px 'DM Mono', 'Courier New', monospace`;
  const PAD_L = 48;  // space for line numbers
  const PAD_T = 18;

  /* ── Typing state ── */
  let visibleLines = 0;
  let charProgress = 0; // chars revealed on the current partial line

  /* ── Badges (floating git commit chips) ── */
  const BADGES = [
    { text: '✓ 12 commits', x: 0, y: 0, vy: -0.28, life: 1 },
    { text: '⬡ React 18', x: 0, y: 0, vy: -0.22, life: 1 },
    { text: '★ 43 stars', x: 0, y: 0, vy: -0.20, life: 1 },
    { text: '⚡ Vercel', x: 0, y: 0, vy: -0.25, life: 1 },
  ];

  function resetBadge(b, i) {
    b.x = W * (0.18 + i * 0.22 + Math.random() * 0.08);
    b.y = H * (0.55 + Math.random() * 0.35);
    b.life = 0.6 + Math.random() * 0.4;
    b.vy = -(0.18 + Math.random() * 0.15);
  }
  BADGES.forEach((b, i) => resetBadge(b, i));

  /* ── Mouse hover ──
     getBoundingClientRect() returns CSS pixels.
     Because ctx is pre-scaled by DPR, drawing coords are in CSS pixels too,
     so event coords map directly — no extra scaling needed.
  */
  let hoveredLine = -1;
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const cy = e.clientY - rect.top;
    hoveredLine = Math.floor((cy - PAD_T) / LINE_H);
  });
  canvas.addEventListener('mouseleave', () => { hoveredLine = -1; });

  /* ── Clock ── */
  let tick = 0;

  /* ── Helpers ── */
  function measureTokens(tokens) {
    ctx.font = FONT;
    return tokens.reduce((s, [t]) => s + ctx.measureText(t).width, 0);
  }

  function drawTokens(tokens, x, y) {
    const p = pal();
    ctx.font = FONT;
    ctx.textBaseline = 'middle';
    tokens.forEach(([text, type]) => {
      ctx.fillStyle = p[type] || p.plain;
      ctx.fillText(text, x, y);
      x += ctx.measureText(text).width;
    });
    return x;
  }

  /* ── Main draw ── */
  function draw() {
    tick++;
    const p = pal();

    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, W, H);

    /* Advance typing */
    if (visibleLines < CODE.length) {
      const currentLine = CODE[visibleLines];
      const fullText = currentLine.map(([t]) => t).join('');
      charProgress += 3;
      if (charProgress >= fullText.length) {
        charProgress = 0;
        visibleLines++;
      }
    }

    /* Draw lines */
    const maxVisible = Math.min(visibleLines + 1, CODE.length);
    const startLine = Math.max(0, maxVisible - Math.floor((H - PAD_T * 2) / LINE_H));

    for (let i = startLine; i < maxVisible; i++) {
      const y = PAD_T + (i - startLine) * LINE_H + LINE_H / 2;
      const line = CODE[i];
      const isActive = i === visibleLines;

      /* Hover + active highlight */
      if (i === hoveredLine || isActive) {
        ctx.fillStyle = p.lineHl;
        ctx.fillRect(0, y - LINE_H / 2, W, LINE_H);
      }

      /* Line number */
      ctx.font = FONT;
      ctx.textAlign = 'right';
      ctx.fillStyle = i === hoveredLine ? p.punct : p.num;
      ctx.fillText(i + 1, PAD_L - 10, y);
      ctx.textAlign = 'left';

      if (!line || !line.length) continue;

      /* Build partial text for current typing line */
      let tokens = line;
      if (isActive) {
        let remaining = charProgress;
        const partial = [];
        for (const [text, type] of line) {
          if (remaining <= 0) break;
          partial.push([text.slice(0, remaining), type]);
          remaining -= text.length;
        }
        tokens = partial;
      }

      const x = drawTokens(tokens, PAD_L, y);

      /* Blinking cursor on active line */
      if (isActive && Math.floor(tick / 30) % 2 === 0) {
        ctx.fillStyle = p.cursor;
        ctx.fillRect(x + 1, y - 7, 2, 14);
      }
    }

    /* Floating badges */
    BADGES.forEach((b, i) => {
      b.y += b.vy;
      b.life -= 0.001;
      if (b.y < -30 || b.life <= 0) resetBadge(b, i);

      const alpha = Math.min(b.life, 1) * 0.85;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `500 10px 'DM Mono', monospace`;
      ctx.textAlign = 'left';

      const tw = ctx.measureText(b.text).width;
      const bx = b.x, by = b.y, bh = 22, bw = tw + 18;

      ctx.fillStyle = p.badge;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 4);
      ctx.fill();
      ctx.strokeStyle = p.badgeStr + '44';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.fillStyle = p.badgeStr;
      ctx.fillText(b.text, bx + 9, by + bh / 2 + 1);
      ctx.restore();
    });

    /* Scan line / CRT subtle overlay */
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = dark() ? 'rgba(0,0,0,0.018)' : 'rgba(255,255,255,0.012)';
      ctx.fillRect(0, y, W, 2);
    }

    requestAnimationFrame(draw);
  }

  /* ctx.roundRect polyfill for older browsers */
  if (!ctx.roundRect) {
    ctx.roundRect = function (x, y, w, h, r) {
      this.beginPath();
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
      this.closePath();
    };
  }

  new MutationObserver(() => { }).observe(document.documentElement, { attributes: true });
  draw();
})();
