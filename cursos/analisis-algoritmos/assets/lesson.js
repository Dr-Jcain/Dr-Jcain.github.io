(function () {
  const body = document.body;
  const menu = document.getElementById('menuButton');
  const focus = document.getElementById('focusButton');
  const toast = document.getElementById('toast');

  menu?.addEventListener('click', () => body.classList.toggle('nav-open'));

  focus?.addEventListener('click', () => {
    body.classList.toggle('presentation-mode');
    focus.textContent = body.classList.contains('presentation-mode')
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

  let timer;
  document.querySelectorAll('[data-planned="true"]').forEach((button) => {
    button.addEventListener('click', () => {
      toast?.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(() => toast?.classList.remove('show'), 1800);
    });
  });

  document.querySelectorAll('.quiz-card').forEach((card) => {
    const answer = card.dataset.answer;
    const feedback = card.querySelector('.quiz-feedback');

    card.querySelectorAll('[data-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        card.querySelectorAll('[data-choice]').forEach((b) => b.classList.remove('is-right', 'is-wrong'));
        const correct = button.dataset.choice === answer;
        button.classList.add(correct ? 'is-right' : 'is-wrong');
        if (feedback) {
          feedback.className = `quiz-feedback ${correct ? 'ok' : 'no'}`;
          feedback.textContent = correct ? 'Correcto.' : 'Revisa la definición correspondiente.';
        }
      });
    });
  });

  // Visualización sencilla del principio de invarianza en la clase 1.2.
  const nSlider = document.getElementById('nSlider');
  const nValue = document.getElementById('nValue');
  const t1Value = document.getElementById('t1Value');
  const t2Value = document.getElementById('t2Value');
  const ratioValue = document.getElementById('ratioValue');
  const bar1 = document.getElementById('bar1');
  const bar2 = document.getElementById('bar2');

  function updateInvariantExample() {
    if (!nSlider) return;
    const n = Number(nSlider.value);
    const t1 = 2 * n;
    const t2 = 6 * n;
    const max = Math.max(t1, t2);

    if (nValue) nValue.textContent = String(n);
    if (t1Value) t1Value.textContent = String(t1);
    if (t2Value) t2Value.textContent = String(t2);
    if (ratioValue) ratioValue.textContent = (t2 / t1).toFixed(0);
    if (bar1) bar1.style.width = `${(t1 / max) * 100}%`;
    if (bar2) bar2.style.width = `${(t2 / max) * 100}%`;
  }

  nSlider?.addEventListener('input', updateInvariantExample);
  updateInvariantExample();
})();
