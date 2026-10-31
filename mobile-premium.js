(function () {
  function setupMobileMenu() {
    const button = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mainNav');
    if (!button || !nav || button.dataset.menuReady === 'true') return;
    button.dataset.menuReady = 'true';
    const setOpen = (open) => {
      nav.classList.toggle('mobile-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      button.innerHTML = open ? '✕ <span>Cerrar</span>' : '☰ <span>Menú</span>';
    };
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(!nav.classList.contains('mobile-open'));
    });
    nav.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        const destination = document.getElementById(link.getAttribute('href').slice(1));
        setOpen(false);
        if (destination) {
          event.preventDefault();
          destination.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', link.getAttribute('href'));
        }
      });
    });
    document.addEventListener('click', function (event) {
      if (!button.contains(event.target) && !nav.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 800) setOpen(false);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupMobileMenu);
  else setupMobileMenu();
})();
