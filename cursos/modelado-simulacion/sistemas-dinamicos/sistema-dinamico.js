(function () {
  // La navegación, el menú lateral y el modo presentación se gestionan en /assets/lesson-shell.js.

  // Renderizado matemático. La página usa exactamente el mismo cargador de
  // MathJax que las demás clases. Si por alguna razón el CDN no hubiera
  // terminado de cargar, se realiza un único intento de respaldo.
  async function typesetMath() {
    try {
      if (window.MathJax?.startup?.promise) {
        await window.MathJax.startup.promise;
      }
      if (window.MathJax?.typesetPromise) {
        await window.MathJax.typesetPromise();
        return;
      }

      // Fallback: la configuración window.MathJax ya fue declarada en <head>.
      const existing = document.querySelector('script[data-mathjax-fallback]');
      if (existing) return;
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
      script.defer = true;
      script.dataset.mathjaxFallback = 'true';
      script.onload = async () => {
        try {
          if (window.MathJax?.startup?.promise) await window.MathJax.startup.promise;
          if (window.MathJax?.typesetPromise) await window.MathJax.typesetPromise();
        } catch (_) {}
      };
      document.head.appendChild(script);
    } catch (_) {}
  }

  window.addEventListener('load', typesetMath);

  // Comprobación conceptual.
  document.querySelectorAll('.quiz-card').forEach((card) => {
    const correct = card.dataset.answer;
    const feedback = card.querySelector('.quiz-feedback');
    card.querySelectorAll('button[data-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        card.querySelectorAll('button[data-choice]').forEach((btn) => btn.classList.remove('correct', 'wrong'));
        const ok = button.dataset.choice === correct;
        button.classList.add(ok ? 'correct' : 'wrong');
        if (feedback) feedback.textContent = ok ? 'Correcto.' : 'Revise el concepto y vuelva a intentarlo.';
      });
    });
  });

  const canvas = document.getElementById('phaseCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const select = document.getElementById('systemSelect');
  const title = document.getElementById('phaseTitle');
  const equation = document.getElementById('phaseEquation');
  const initialStateEl = document.getElementById('initialState');
  const currentStateEl = document.getElementById('currentState');
  const timeSlider = document.getElementById('timeSlider');
  const timeValue = document.getElementById('timeValue');
  const playButton = document.getElementById('playButton');
  const resetButton = document.getElementById('resetButton');

  const systems = {
    focus: {
      title: 'Foco estable',
      equation: '\\(\\dot x_1=x_2,\\quad \\dot x_2=-x_1-0.4x_2\\)',
      f: (x, y) => [y, -x - 0.4 * y],
      seeds: [[2.7, 0], [2, 1.8], [0.7, 2.5], [-1.7, 2.1], [-2.7, 0.4], [-2, -1.8], [0.4, -2.5]],
      defaultState: [2, 0.8]
    },
    center: {
      title: 'Centro',
      equation: '\\(\\dot x_1=x_2,\\quad \\dot x_2=-x_1\\)',
      f: (x, y) => [y, -x],
      seeds: [[2.7, 0], [2.2, 0], [1.6, 0], [1, 0], [0.6, 0]],
      defaultState: [2, 0.8]
    },
    saddle: {
      title: 'Punto silla',
      equation: '\\(\\dot x_1=x_1,\\quad \\dot x_2=-x_2\\)',
      f: (x, y) => [x, -y],
      seeds: [[-2.6, -2], [-2.6, 2], [-1.4, -2.5], [-1.4, 2.5], [1.4, -2.5], [1.4, 2.5], [2.6, -2], [2.6, 2]],
      defaultState: [1.6, 1.5]
    }
  };

  const view = { xmin: -3.5, xmax: 3.5, ymin: -3.2, ymax: 3.2 };
  let systemKey = select?.value || 'focus';
  let initialState = systems[systemKey].defaultState.slice();
  let isPlaying = false;
  let animationFrame = null;
  let lastTime = null;

  function mapX(x) { return (x - view.xmin) / (view.xmax - view.xmin) * canvas.width; }
  function mapY(y) { return canvas.height - (y - view.ymin) / (view.ymax - view.ymin) * canvas.height; }
  function invX(px) { return view.xmin + px / canvas.width * (view.xmax - view.xmin); }
  function invY(py) { return view.ymin + (canvas.height - py) / canvas.height * (view.ymax - view.ymin); }

  function rk4Step(state, h, f) {
    const [x, y] = state;
    const k1 = f(x, y);
    const k2 = f(x + h * k1[0] / 2, y + h * k1[1] / 2);
    const k3 = f(x + h * k2[0] / 2, y + h * k2[1] / 2);
    const k4 = f(x + h * k3[0], y + h * k3[1]);
    return [
      x + h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6,
      y + h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6
    ];
  }

  function integrate(seed, total, h, f) {
    const points = [seed.slice()];
    let state = seed.slice();
    const steps = Math.max(0, Math.floor(Math.abs(total / h)));
    const step = Math.sign(total || 1) * Math.abs(h);
    for (let i = 0; i < steps; i++) {
      state = rk4Step(state, step, f);
      if (!Number.isFinite(state[0]) || !Number.isFinite(state[1]) || Math.abs(state[0]) > 20 || Math.abs(state[1]) > 20) break;
      points.push(state);
    }
    return points;
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#e6edf4';
    for (let x = Math.ceil(view.xmin); x <= Math.floor(view.xmax); x++) {
      const px = mapX(x);
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height); ctx.stroke();
    }
    for (let y = Math.ceil(view.ymin); y <= Math.floor(view.ymax); y++) {
      const py = mapY(y);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(canvas.width, py); ctx.stroke();
    }

    ctx.strokeStyle = '#8aa0b5';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(mapX(0), 0); ctx.lineTo(mapX(0), canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, mapY(0)); ctx.lineTo(canvas.width, mapY(0)); ctx.stroke();

    ctx.fillStyle = '#73879a';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('x₁', canvas.width - 32, mapY(0) - 10);
    ctx.fillText('x₂', mapX(0) + 10, 22);
  }

  function drawArrow(x, y, vx, vy) {
    const mag = Math.hypot(vx, vy);
    if (mag < 1e-8) return;
    const ux = vx / mag, uy = vy / mag;
    const len = 18;
    const x0 = mapX(x), y0 = mapY(y);
    const x1 = x0 + ux * len, y1 = y0 - uy * len;
    ctx.strokeStyle = '#91a8bc';
    ctx.fillStyle = '#91a8bc';
    ctx.lineWidth = 1.25;
    ctx.beginPath(); ctx.moveTo(x0 - ux * len * .35, y0 + uy * len * .35); ctx.lineTo(x1, y1); ctx.stroke();
    const a = Math.atan2(y1 - y0, x1 - x0);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - 6 * Math.cos(a - Math.PI / 6), y1 - 6 * Math.sin(a - Math.PI / 6));
    ctx.lineTo(x1 - 6 * Math.cos(a + Math.PI / 6), y1 - 6 * Math.sin(a + Math.PI / 6));
    ctx.closePath(); ctx.fill();
  }

  function drawVectorField(f) {
    const dx = 0.55, dy = 0.55;
    for (let x = -3.2; x <= 3.2; x += dx) {
      for (let y = -2.9; y <= 2.9; y += dy) {
        const [vx, vy] = f(x, y);
        drawArrow(x, y, vx, vy);
      }
    }
  }

  function drawPath(points, color, width, alpha) {
    if (points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach((p, i) => {
      const px = mapX(p[0]), py = mapY(p[1]);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.restore();
  }

  function fullTrajectory(seed, f) {
    const back = integrate(seed, -10, 0.025, f).reverse();
    const forward = integrate(seed, 12, 0.025, f);
    return back.slice(0, -1).concat(forward);
  }

  function stateAtTime(seed, t, f) {
    if (t <= 0) return seed.slice();
    const pts = integrate(seed, t, 0.01, f);
    return pts[pts.length - 1] || seed.slice();
  }

  function render() {
    const sys = systems[systemKey];
    drawGrid();
    drawVectorField(sys.f);

    sys.seeds.forEach((seed) => drawPath(fullTrajectory(seed, sys.f), '#6f9bc3', 2.2, 0.55));
    drawPath(fullTrajectory(initialState, sys.f), '#2477c9', 4.5, 0.95);

    const t = Number(timeSlider?.value || 0);
    const current = stateAtTime(initialState, t, sys.f);

    ctx.fillStyle = '#f0b74a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(mapX(initialState[0]), mapY(initialState[1]), 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#0f355a';
    ctx.beginPath(); ctx.arc(mapX(current[0]), mapY(current[1]), 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    if (initialStateEl) initialStateEl.textContent = `x₀ = (${initialState[0].toFixed(2)}, ${initialState[1].toFixed(2)})`;
    if (currentStateEl) currentStateEl.textContent = `x(t) = (${current[0].toFixed(2)}, ${current[1].toFixed(2)})`;
    if (timeValue) timeValue.textContent = `${t.toFixed(2)} s`;
  }

  function updateSystemText() {
    const sys = systems[systemKey];
    if (title) title.textContent = sys.title;
    if (equation) equation.innerHTML = sys.equation;
    initialState = sys.defaultState.slice();
    if (timeSlider) timeSlider.value = '0';
    if (window.MathJax?.typesetPromise && equation) {
      window.MathJax.typesetClear?.([equation]);
      window.MathJax.typesetPromise([equation]).catch(() => {});
    }
    render();
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return [(event.clientX - rect.left) * sx, (event.clientY - rect.top) * sy];
  }

  canvas.addEventListener('click', (event) => {
    const [px, py] = canvasPoint(event);
    initialState = [invX(px), invY(py)];
    if (timeSlider) timeSlider.value = '0';
    render();
  });

  select?.addEventListener('change', () => {
    systemKey = select.value;
    isPlaying = false;
    if (playButton) playButton.textContent = '▶ Reproducir';
    updateSystemText();
  });

  timeSlider?.addEventListener('input', render);

  resetButton?.addEventListener('click', () => {
    initialState = systems[systemKey].defaultState.slice();
    if (timeSlider) timeSlider.value = '0';
    isPlaying = false;
    if (playButton) playButton.textContent = '▶ Reproducir';
    render();
  });

  function animate(timestamp) {
    if (!isPlaying) return;
    if (lastTime == null) lastTime = timestamp;
    const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
    lastTime = timestamp;
    if (timeSlider) {
      let t = Number(timeSlider.value) + dt;
      if (t >= Number(timeSlider.max)) t = 0;
      timeSlider.value = String(t);
    }
    render();
    animationFrame = requestAnimationFrame(animate);
  }

  playButton?.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playButton.textContent = isPlaying ? '❚❚ Pausar' : '▶ Reproducir';
    lastTime = null;
    if (isPlaying) animationFrame = requestAnimationFrame(animate);
    else if (animationFrame) cancelAnimationFrame(animationFrame);
  });

  updateSystemText();
})();
