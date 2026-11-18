// Plays the home-page film only while it is on screen. Respects reduced motion and Save-Data:
// then it stays on its poster until the visitor presses Play. Without JS the native controls remain.
(function () {
  var v = document.querySelector('.film-frame video');
  var b = document.querySelector('.film-toggle');
  if (!v || !b) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    (navigator.connection && navigator.connection.saveData);
  var userPaused = !!calm, visible = false;
  v.removeAttribute('controls');
  b.hidden = false;
  function label() { var on = !v.paused; b.textContent = ''; b.dataset.state = on ? 'playing' : 'paused'; b.setAttribute('aria-label', on ? 'Pause the film' : 'Play the film'); }
  function sync() { if (visible && !userPaused) { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); } }
  b.addEventListener('click', function () { userPaused = !v.paused; if (!userPaused) visible = true; sync(); });
  v.addEventListener('play', label); v.addEventListener('pause', label);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; sync(); }, { threshold: 0.35 }).observe(v);
  } else { visible = true; sync(); }
  label();
})();
