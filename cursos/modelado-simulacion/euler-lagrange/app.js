(function () {
  // La navegación, el menú lateral y el modo presentación se gestionan en /assets/lesson-shell.js.
  const stepTabs = [...document.querySelectorAll('.step-tab')];
  const stepPanels = [...document.querySelectorAll('.step-panel')];

  function showStep(step) {
    stepTabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.step === String(step)));
    stepPanels.forEach(panel => panel.classList.toggle('is-active', panel.dataset.panel === String(step)));
    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise(stepPanels.filter(p => p.classList.contains('is-active'))).catch(() => {});
    }
  }

  stepTabs.forEach(tab => tab.addEventListener('click', () => showStep(tab.dataset.step)));
  document.querySelectorAll('.next-step').forEach(button => {
    button.addEventListener('click', () => {
      showStep(button.dataset.next);
      document.querySelector('.derivation-shell')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Interactive action-stationarity laboratory.
  const canvas = document.getElementById('pathCanvas');
  const slider = document.getElementById('epsilonSlider');
  const epsilonValue = document.getElementById('epsilonValue');
  const actionValue = document.getElementById('actionValue');
  const actionFill = document.getElementById('actionFill');
  const stationaryReadout = document.getElementById('stationaryReadout');

  function drawPaths(epsilon = 0) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pad = 54;
    const plotW = w - 2 * pad;
    const plotH = h - 2 * pad;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#e9eff5';
    ctx.fillStyle = '#7d8da0';
    ctx.font = '18px Inter, sans-serif';
    for (let i = 0; i <= 5; i++) {
      const x = pad + (plotW * i / 5);
      const y = pad + (plotH * i / 5);
      ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, h - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#91a3b5';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(w - pad + 7, h - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, h - pad); ctx.lineTo(pad, pad - 7); ctx.stroke();
    ctx.fillStyle = '#708398';
    ctx.fillText('t', w - pad + 15, h - pad + 6);
    ctx.fillText('q', pad - 10, pad - 15);
    ctx.fillText('t₁', pad - 12, h - pad + 28);
    ctx.fillText('t₂', w - pad - 8, h - pad + 28);

    function toXY(t, q) {
      const x = pad + t * plotW;
      const y = h - pad - q * plotH;
      return [x, y];
    }

    function strokeFunction(fn, color, width) {
      ctx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const t = i / 240;
        const q = fn(t);
        const [x, y] = toXY(t, q);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }

    strokeFunction(t => t, '#0c2848', 4);
    strokeFunction(t => t + epsilon * Math.sin(Math.PI * t), '#e98042', 4);

    // End points
    [[0, 0], [1, 1]].forEach(([t,q]) => {
      const [x,y] = toXY(t,q);
      ctx.beginPath(); ctx.arc(x,y,6,0,Math.PI*2); ctx.fillStyle='#173f68'; ctx.fill();
      ctx.beginPath(); ctx.arc(x,y,11,0,Math.PI*2); ctx.strokeStyle='rgba(23,63,104,.18)'; ctx.lineWidth=5; ctx.stroke();
    });
  }

  function updateLab() {
    if (!slider) return;
    const epsilon = Number(slider.value);
    const action = 0.5 + (Math.PI * Math.PI / 4) * epsilon * epsilon;
    epsilonValue.textContent = epsilon.toFixed(2);
    actionValue.textContent = action.toFixed(4);
    const normalized = Math.min(100, Math.max(4, ((action - 0.5) / 0.31) * 100));
    actionFill.style.width = `${normalized}%`;
    drawPaths(epsilon);

    const close = Math.abs(epsilon) < 0.005;
    stationaryReadout.classList.toggle('is-away', !close);
    stationaryReadout.innerHTML = close
      ? '<span class="status-dot"></span><div><strong>ε = 0: acción estacionaria</strong><p>La pendiente dS/dε es cero.</p></div>'
      : `<span class="status-dot"></span><div><strong>ε = ${epsilon.toFixed(2)}: trayectoria perturbada</strong><p>S(ε) aumenta cuadráticamente en este ejemplo.</p></div>`;
  }

  slider?.addEventListener('input', updateLab);
  updateLab();

  // Quick quiz.
  document.querySelectorAll('.quiz-card').forEach(card => {
    const answer = card.dataset.answer;
    const feedback = card.querySelector('.quiz-feedback');
    card.querySelectorAll('button[data-choice]').forEach(button => {
      button.addEventListener('click', () => {
        card.querySelectorAll('button[data-choice]').forEach(btn => btn.classList.remove('correct','wrong'));
        const isCorrect = button.dataset.choice === answer;
        button.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) {
          card.querySelector(`button[data-choice="${answer}"]`)?.classList.add('correct');
        }
        feedback.textContent = isCorrect
          ? 'Correcto.'
          : 'Revisa el paso correspondiente de la deducción.';
      });
    });
  });
})();
