(function () {
  // La navegación lateral y el modo presentación se gestionan en /assets/lesson-shell.js.

  // Metodología paso a paso.
  const stepTabs = [...document.querySelectorAll('.step-tab')];
  const stepPanels = [...document.querySelectorAll('.step-panel')];

  function showStep(step) {
    const key = String(step);
    stepTabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.step === key));
    stepPanels.forEach(panel => panel.classList.toggle('is-active', panel.dataset.panel === key));

    // Algunos paneles están ocultos durante la carga inicial; se vuelve a pedir
    // el typesetting cuando el alumno abre uno, igual que en Euler–Lagrange.
    if (window.MathJax?.typesetPromise) {
      const active = stepPanels.filter(panel => panel.classList.contains('is-active'));
      window.MathJax.typesetPromise(active).catch(() => {});
    }
  }

  stepTabs.forEach(tab => tab.addEventListener('click', () => showStep(tab.dataset.step)));
  document.querySelectorAll('.next-step').forEach(button => {
    button.addEventListener('click', () => {
      showStep(button.dataset.next);
      document.querySelector('.derivation-shell')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Visualización: suma de órdenes -> número de estados.
  const orderExample = document.getElementById('orderExample');
  const totalOrder = document.getElementById('totalOrder');
  const orderExplanation = document.getElementById('orderExplanation');
  const equationOrderRow = document.getElementById('equationOrderRow');
  const stateBoxes = document.getElementById('stateBoxes');

  const sub = ['₀','₁','₂','₃','₄','₅','₆','₇','₈','₉'];
  function subscriptNumber(n) {
    return String(n).split('').map(ch => sub[Number(ch)] || ch).join('');
  }

  function renderOrderVisualizer() {
    if (!orderExample || !totalOrder || !orderExplanation || !equationOrderRow || !stateBoxes) return;
    const orders = orderExample.value.split(',').map(Number);
    const total = orders.reduce((sum, value) => sum + value, 0);

    totalOrder.textContent = String(total);
    orderExplanation.textContent = `N = ${orders.join(' + ')} = ${total}: se requieren ${total} variables de estado.`;

    equationOrderRow.innerHTML = '';
    orders.forEach((order, index) => {
      const card = document.createElement('div');
      card.className = 'equation-order-card';
      card.innerHTML = `<span>Ecuación ${index + 1}</span><strong>orden ${order}</strong>`;
      equationOrderRow.appendChild(card);
    });

    stateBoxes.innerHTML = '';
    for (let i = 1; i <= total; i++) {
      const box = document.createElement('div');
      box.className = 'state-box';
      box.textContent = `z${subscriptNumber(i)}`;
      stateBoxes.appendChild(box);
    }
  }

  orderExample?.addEventListener('change', renderOrderVisualizer);
  renderOrderVisualizer();

  // Comprobación rápida.
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
          : 'Revisa la metodología: orden total, definición de estados y sustitución.';
      });
    });
  });
})();
