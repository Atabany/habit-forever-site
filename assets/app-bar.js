// Mobile download bar: on phones it is the App Store call to action from the first screen (the header has
// no badge there), hidden while another App Store button is on screen. No JS: the bar never appears.
(function () {
  var bar = document.querySelector('[data-app-bar]');
  if (!bar || !('IntersectionObserver' in window)) return;
  var phone = window.matchMedia('(max-width: 720px)');
  var onScreen = new Set();
  function update() {
    document.body.classList.toggle('has-app-bar', phone.matches);
    bar.classList.toggle('show', phone.matches && onScreen.size === 0);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) onScreen.add(e.target); else onScreen.delete(e.target); });
    update();
  });
  document.querySelectorAll('.hero-cta, main .cta, .footer-cta').forEach(function (el) { io.observe(el); });
  window.addEventListener('scroll', update, { passive: true });
  if (phone.addEventListener) phone.addEventListener('change', update);
  bar.hidden = false;
  update();
  // close the phone menu after choosing a link or tapping elsewhere
  var menu = document.querySelector('.nav-menu');
  if (menu) document.addEventListener('click', function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
})();
