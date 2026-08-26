(() => {
  'use strict';
  const lessonSlug = document.body.dataset.lesson || 'lesson';
  const key = `jcain:lab-construccion:${lessonSlug}:checks`;
  const checks = [...document.querySelectorAll('[data-lab-check]')];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) { saved = {}; }

  function updateProgress() {
    const done = checks.filter((el) => el.checked).length;
    const pct = checks.length ? Math.round(done * 100 / checks.length) : 0;
    document.querySelectorAll('[data-lab-progress-value]').forEach(el => el.textContent = `${pct}%`);
    document.querySelectorAll('[data-lab-progress-bar]').forEach(el => el.style.width = `${pct}%`);
    checks.forEach((el) => el.closest('.lab-check')?.classList.toggle('is-done', el.checked));
  }

  checks.forEach((el, index) => {
    el.checked = Boolean(saved[index]);
    el.addEventListener('change', () => {
      saved[index] = el.checked;
      try { localStorage.setItem(key, JSON.stringify(saved)); } catch (_) {}
      updateProgress();
    });
  });
  updateProgress();

  document.querySelectorAll('[data-copy-code]').forEach(button => {
    button.addEventListener('click', async () => {
      const card = button.closest('.lab-code-card');
      const text = card?.querySelector('pre')?.innerText || '';
      try {
        await navigator.clipboard.writeText(text);
        const old = button.textContent;
        button.textContent = 'Copiado';
        setTimeout(() => button.textContent = old, 1200);
      } catch (_) {}
    });
  });
})();