(function () {
  const body = document.body;
  const menuButton = document.getElementById('menuButton');
  const focusButton = document.getElementById('focusButton');
  const toast = document.getElementById('toast');

  menuButton?.addEventListener('click', () => body.classList.toggle('nav-open'));

  focusButton?.addEventListener('click', () => {
    body.classList.toggle('presentation-mode');
    focusButton.textContent = body.classList.contains('presentation-mode')
      ? 'Mostrar temario'
      : 'Modo presentación';
  });

  document.querySelectorAll('.unit-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const links = button.nextElementSibling;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      if (links) links.hidden = expanded;
    });
  });

  let toastTimer;
  document.querySelectorAll('[data-planned="true"]').forEach((button) => {
    button.addEventListener('click', () => {
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
    });
  });

  document.querySelectorAll('[data-topic="conservativos"]').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById('concepto')?.scrollIntoView({ behavior: 'smooth' });
      body.classList.remove('nav-open');
    });
  });

  // Método paso a paso.
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

  // Laboratorio del oscilador conservativo.
  const oscillatorCanvas = document.getElementById('oscillatorCanvas');
  const energyCanvas = document.getElementById('energyCanvas');
  const massSlider = document.getElementById('massSlider');
  const stiffnessSlider = document.getElementById('stiffnessSlider');
  const x0Slider = document.getElementById('x0Slider');
  const v0Slider = document.getElementById('v0Slider');
  const timeSlider = document.getElementById('timeSlider');
  const massValue = document.getElementById('massValue');
  const stiffnessValue = document.getElementById('stiffnessValue');
  const x0Value = document.getElementById('x0Value');
  const v0Value = document.getElementById('v0Value');
  const timeValue = document.getElementById('timeValue');
  const kineticValue = document.getElementById('kineticValue');
  const potentialValue = document.getElementById('potentialValue');
  const totalValue = document.getElementById('totalValue');
  const playButton = document.getElementById('playButton');
  const resetButton = document.getElementById('resetButton');

  let playing = false;
  let previousTimestamp = null;
  let animationId = null;

  function params() {
    return {
      m: Number(massSlider?.value || 1),
      k: Number(stiffnessSlider?.value || 4),
      x0: Number(x0Slider?.value || 1),
      v0: Number(v0Slider?.value || 0),
      t: Number(timeSlider?.value || 0)
    };
  }

  function stateAt(t, p) {
    const omega = Math.sqrt(p.k / p.m);
    const x = p.x0 * Math.cos(omega * t) + (p.v0 / omega) * Math.sin(omega * t);
    const v = -p.x0 * omega * Math.sin(omega * t) + p.v0 * Math.cos(omega * t);
    const T = 0.5 * p.m * v * v;
    const V = 0.5 * p.k * x * x;
    const E = 0.5 * p.m * p.v0 * p.v0 + 0.5 * p.k * p.x0 * p.x0;
    return { omega, x, v, T, V, E };
  }

  function drawSpring(ctx, x1, x2, y, coils, amp) {
    const lead = 18;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x1 + lead, y);
    const springStart = x1 + lead;
    const springEnd = x2 - lead;
    const segments = coils * 2;
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const x = springStart + u * (springEnd - springStart);
      const yy = i === 0 || i === segments ? y : y + (i % 2 === 0 ? -amp : amp);
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(x2, y);
    ctx.strokeStyle = '#55758f';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawOscillator(p, s) {
    if (!oscillatorCanvas) return;
    const ctx = oscillatorCanvas.getContext('2d');
    const w = oscillatorCanvas.width;
    const h = oscillatorCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, w, h);

    const floorY = h * 0.72;
    const wallX = 72;
    const equilibriumX = w * 0.58;
    const scale = Math.min(130, w * 0.15);
    const massX = equilibriumX + s.x * scale;
    const massW = 95;
    const massH = 68;

    // Grid and equilibrium line.
    ctx.strokeStyle = '#e8eef5';
    ctx.lineWidth = 1;
    for (let x = 80; x < w; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 28); ctx.lineTo(x, floorY + 18); ctx.stroke();
    }
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = '#9fb2c4';
    ctx.beginPath(); ctx.moveTo(equilibriumX, 42); ctx.lineTo(equilibriumX, floorY + 10); ctx.stroke();
    ctx.setLineDash([]);

    // Wall.
    ctx.fillStyle = '#183f67';
    ctx.fillRect(wallX - 18, 35, 18, floorY - 35);
    ctx.strokeStyle = '#9bb0c3';
    ctx.lineWidth = 2;
    for (let y = 42; y < floorY - 8; y += 18) {
      ctx.beginPath(); ctx.moveTo(wallX - 18, y); ctx.lineTo(wallX - 34, y + 13); ctx.stroke();
    }

    // Floor.
    ctx.strokeStyle = '#7f93a8';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(44, floorY); ctx.lineTo(w - 40, floorY); ctx.stroke();

    drawSpring(ctx, wallX, massX - massW / 2, floorY - massH / 2, 12, 13);

    // Mass.
    const grad = ctx.createLinearGradient(massX - massW/2, 0, massX + massW/2, 0);
    grad.addColorStop(0, '#2778c9');
    grad.addColorStop(1, '#31a8c9');
    ctx.fillStyle = grad;
    ctx.fillRect(massX - massW/2, floorY - massH, massW, massH);
    ctx.strokeStyle = '#175b94';
    ctx.lineWidth = 2;
    ctx.strokeRect(massX - massW/2, floorY - massH, massW, massH);

    // Wheels.
    ctx.fillStyle = '#17324d';
    [massX - 27, massX + 27].forEach(cx => {
      ctx.beginPath(); ctx.arc(cx, floorY + 7, 9, 0, Math.PI * 2); ctx.fill();
    });

    // Labels.
    ctx.fillStyle = '#4b6076';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText('x = 0', equilibriumX - 20, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`m = ${p.m.toFixed(1)} kg`, massX, floorY - massH/2 + 6);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#526b82';
    ctx.font = '15px Inter, sans-serif';
    ctx.fillText(`x(t) = ${s.x.toFixed(3)} m`, 44, h - 18);
    ctx.fillText(`ω = ${s.omega.toFixed(3)} rad/s`, w - 245, h - 18);
  }

  function drawEnergyGraph(p, currentT) {
    if (!energyCanvas) return;
    const ctx = energyCanvas.getContext('2d');
    const w = energyCanvas.width;
    const h = energyCanvas.height;
    const padL = 60, padR = 28, padT = 25, padB = 46;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const duration = 10;
    const E0 = stateAt(0, p).E;
    const yMax = Math.max(E0 * 1.12, 0.25);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fbfdff';
    ctx.fillRect(0, 0, w, h);

    // Grid.
    ctx.strokeStyle = '#e9eff5';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#7d8da0';
    ctx.font = '13px Inter, sans-serif';
    for (let i = 0; i <= 5; i++) {
      const x = padL + plotW * i / 5;
      const y = padT + plotH * i / 5;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillText((duration * i / 5).toFixed(0), x - 4, h - 18);
    }

    function xy(t, energy) {
      return [padL + (t / duration) * plotW, padT + plotH - (energy / yMax) * plotH];
    }

    function strokeEnergy(getValue, color, width) {
      ctx.beginPath();
      for (let i = 0; i <= 400; i++) {
        const t = duration * i / 400;
        const s = stateAt(t, p);
        const [x, y] = xy(t, getValue(s));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }

    strokeEnergy(s => s.T, '#2778c9', 3);
    strokeEnergy(s => s.V, '#e9b949', 3);
    strokeEnergy(s => s.E, '#15936f', 3.5);

    // Current-time cursor.
    const cursorX = padL + (currentT / duration) * plotW;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#8b9bac';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cursorX, padT); ctx.lineTo(cursorX, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);

    const current = stateAt(currentT, p);
    [
      [current.T, '#2778c9'],
      [current.V, '#e9b949'],
      [current.E, '#15936f']
    ].forEach(([val, color]) => {
      const [x, y] = xy(currentT, val);
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.strokeStyle = color + '44'; ctx.lineWidth = 4; ctx.stroke();
    });

    ctx.fillStyle = '#66798d';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText('t [s]', w - 52, h - 18);
    ctx.save();
    ctx.translate(17, padT + plotH / 2 + 35);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Energía [J]', 0, 0);
    ctx.restore();
  }

  function updateLab() {
    if (!massSlider) return;
    const p = params();
    const s = stateAt(p.t, p);

    massValue.textContent = `${p.m.toFixed(1)} kg`;
    stiffnessValue.textContent = `${p.k.toFixed(1)} N/m`;
    x0Value.textContent = `${p.x0.toFixed(2)} m`;
    v0Value.textContent = `${p.v0.toFixed(2)} m/s`;
    timeValue.textContent = `${p.t.toFixed(2)} s`;
    kineticValue.textContent = `${s.T.toFixed(3)} J`;
    potentialValue.textContent = `${s.V.toFixed(3)} J`;
    totalValue.textContent = `${s.E.toFixed(3)} J`;

    drawOscillator(p, s);
    drawEnergyGraph(p, p.t);
  }

  [massSlider, stiffnessSlider, x0Slider, v0Slider].forEach(slider => {
    slider?.addEventListener('input', () => {
      playing = false;
      if (playButton) playButton.textContent = '▶ Reproducir';
      previousTimestamp = null;
      updateLab();
    });
  });
  timeSlider?.addEventListener('input', () => {
    playing = false;
    if (playButton) playButton.textContent = '▶ Reproducir';
    previousTimestamp = null;
    updateLab();
  });

  function animate(timestamp) {
    if (!playing || !timeSlider) return;
    if (previousTimestamp == null) previousTimestamp = timestamp;
    const dt = (timestamp - previousTimestamp) / 1000;
    previousTimestamp = timestamp;
    let t = Number(timeSlider.value) + dt;
    if (t > 10) t = 0;
    timeSlider.value = String(t);
    updateLab();
    animationId = requestAnimationFrame(animate);
  }

  playButton?.addEventListener('click', () => {
    playing = !playing;
    playButton.textContent = playing ? '❚❚ Pausar' : '▶ Reproducir';
    previousTimestamp = null;
    if (playing) animationId = requestAnimationFrame(animate);
    else if (animationId) cancelAnimationFrame(animationId);
  });

  resetButton?.addEventListener('click', () => {
    playing = false;
    if (animationId) cancelAnimationFrame(animationId);
    previousTimestamp = null;
    if (playButton) playButton.textContent = '▶ Reproducir';
    if (timeSlider) timeSlider.value = '0';
    updateLab();
  });

  updateLab();

  // Cuestionario rápido.
  document.querySelectorAll('.quiz-card').forEach(card => {
    const answer = card.dataset.answer;
    const feedback = card.querySelector('.quiz-feedback');
    card.querySelectorAll('button[data-choice]').forEach(button => {
      button.addEventListener('click', () => {
        card.querySelectorAll('button[data-choice]').forEach(btn => btn.classList.remove('correct', 'wrong'));
        const isCorrect = button.dataset.choice === answer;
        button.classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) card.querySelector(`button[data-choice="${answer}"]`)?.classList.add('correct');
        feedback.textContent = isCorrect ? 'Correcto.' : 'Revisa la sección de teoría correspondiente.';
      });
    });
  });
})();
