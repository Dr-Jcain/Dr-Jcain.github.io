(() => {
  'use strict';
  document.querySelectorAll('.quiz-card').forEach((card) => {
    const answer = card.dataset.answer;
    const feedback = card.querySelector('.quiz-feedback');
    card.querySelectorAll('button[data-choice]').forEach((btn) => {
      btn.addEventListener('click', () => {
        card.querySelectorAll('button[data-choice]').forEach((b) => b.classList.remove('is-right','is-wrong'));
        const ok = btn.dataset.choice === answer;
        btn.classList.add(ok ? 'is-right' : 'is-wrong');
        if (feedback) {
          feedback.className = 'quiz-feedback ' + (ok ? 'ok' : 'no');
          feedback.textContent = ok ? 'Correcto.' : 'Revisa el concepto y vuelve a intentarlo.';
        }
      });
    });
  });
})();
