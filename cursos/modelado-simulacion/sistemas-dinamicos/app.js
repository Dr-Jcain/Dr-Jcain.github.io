(function () {
  // La navegación, el menú lateral y el modo presentación se gestionan en /assets/lesson-shell.js.

  // Clasificación de ecuaciones autónomas.
  document.querySelectorAll('.classifier-card').forEach((card) => {
    const correct = card.dataset.correct;
    const feedback = card.querySelector('.classifier-feedback');
    card.querySelectorAll('button[data-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        card.querySelectorAll('button[data-choice]').forEach((btn) => btn.classList.remove('correct', 'wrong'));
        const isCorrect = button.dataset.choice === correct;
        button.classList.add(isCorrect ? 'correct' : 'wrong');
        if (feedback) {
          if (isCorrect) {
            feedback.textContent = correct === 'autonoma'
              ? 'Correcto: el lado derecho depende sólo de x.'
              : 'Correcto: aparece t de manera explícita.';
          } else {
            feedback.textContent = correct === 'autonoma'
              ? 'Revise el lado derecho: no aparece t explícitamente.'
              : 'Revise el lado derecho: la presencia explícita de t impide escribirla como f(x).';
          }
        }
      });
    });
  });

  // Visualización simbólica de la propiedad de composición del flujo.
  const sSlider = document.getElementById('sSlider');
  const tSlider = document.getElementById('tSlider');
  const sValue = document.getElementById('sValue');
  const tValue = document.getElementById('tValue');
  const sumText = document.getElementById('sumText');
  const nodeS = document.getElementById('nodeS');
  const nodeTS = document.getElementById('nodeTS');
  const directFlow = document.getElementById('directFlow');
  const flowEquality = document.getElementById('flowEquality');

  function fmt(value) {
    const n = Number(value);
    return Number.isInteger(n) ? n.toFixed(1) : n.toFixed(1);
  }

  function renderFlow() {
    if (!sSlider || !tSlider) return;
    const s = Number(sSlider.value);
    const t = Number(tSlider.value);
    const total = s + t;

    if (sValue) sValue.textContent = fmt(s);
    if (tValue) tValue.textContent = fmt(t);
    if (sumText) sumText.innerHTML = `\\(t+s=${fmt(total)}\\)`;
    if (nodeS) nodeS.innerHTML = `\\(\\varphi(${fmt(s)},x_0)\\)`;
    if (nodeTS) nodeTS.innerHTML = `\\(\\varphi(${fmt(t)},\\varphi(${fmt(s)},x_0))\\)`;
    if (directFlow) directFlow.innerHTML = `\\(\\varphi(${fmt(total)},x_0)\\)`;
    if (flowEquality) {
      flowEquality.innerHTML = `\\[\\varphi(${fmt(total)},x_0)=\\varphi\\!\\left(${fmt(t)},\\varphi(${fmt(s)},x_0)\\right)\\]`;
    }

    if (window.MathJax?.typesetPromise) {
      window.MathJax.typesetClear?.([sumText, nodeS, nodeTS, directFlow, flowEquality].filter(Boolean));
      window.MathJax.typesetPromise([sumText, nodeS, nodeTS, directFlow, flowEquality].filter(Boolean)).catch(() => {});
    }
  }

  [sSlider, tSlider].forEach((slider) => slider?.addEventListener('input', renderFlow));

  // Preguntas de comprobación.
  document.querySelectorAll('.quiz-card').forEach((card) => {
    const correct = card.dataset.answer;
    const feedback = card.querySelector('.quiz-feedback');
    card.querySelectorAll('button[data-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        card.querySelectorAll('button[data-choice]').forEach((btn) => btn.classList.remove('correct', 'wrong'));
        const isCorrect = button.dataset.choice === correct;
        button.classList.add(isCorrect ? 'correct' : 'wrong');
        if (feedback) feedback.textContent = isCorrect ? 'Correcto.' : 'Revise la definición correspondiente y vuelva a intentarlo.';
      });
    });
  });

  renderFlow();
})();
