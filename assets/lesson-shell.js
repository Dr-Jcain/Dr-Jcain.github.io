/* Interacciones comunes de todas las clases. El JavaScript propio de cada
   clase debe contener únicamente sus simuladores, cuestionarios y actividades. */
(() => {
  'use strict';

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
      toast?.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast?.classList.remove('show'), 1800);
    });
  });

  document.querySelectorAll('a[href="#lesson"]').forEach((link) => {
    link.addEventListener('click', () => body.classList.remove('nav-open'));
  });
})();
