// Mobile download bar: shown on phones once the header (with its App Store badge) has scrolled away,
// hidden again while any other App Store call to action is on screen. No JS: the bar never appears.
(function () {
  var bar = document.querySelector('[data-app-bar]');
  if (!bar || !('IntersectionObserver' in window)) return;
  var phone = window.matchMedia('(max-width: 720px)');
  var onScreen = new Set();
  function update() {
    document.body.classList.toggle('has-app-bar', phone.matches);
    bar.classList.toggle('show', phone.matches && onScreen.size === 0 && window.scrollY > 120);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) onScreen.add(e.target); else onScreen.delete(e.target); });
    update();
  });
  document.querySelectorAll('.site-header, .hero-cta, main .cta, .footer-cta').forEach(function (el) { io.observe(el); });
  window.addEventListener('scroll', update, { passive: true });
  if (phone.addEventListener) phone.addEventListener('change', update);
  bar.hidden = false;
  update();
})();
