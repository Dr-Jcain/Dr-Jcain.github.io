document.querySelectorAll('[data-disabled="true"]').forEach(link => {
  link.addEventListener('click', event => event.preventDefault());
});
