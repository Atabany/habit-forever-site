// Habit grid maker: a year of squares, toggled by tap/drag/keyboard, exported as a PNG. Runs locally, stores nothing.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var nameEl = $("g-name"), colorEl = $("g-color"), rangeEl = $("g-range"), wstartEl = $("g-wstart"), themeEl = $("g-theme"),
      fromEl = $("g-from"), rateEl = $("g-rate"), rateOut = $("g-rate-out"), gridEl = $("g-grid"), wrap = $("g-wrap"),
      out = $("g-result"), pngBtn = $("g-png");
  if (!gridEl || !out) return;
  var DAY = 86400000, done = {}, cells = [], focusIdx = 0, range = null;
  var MONTHS = [], WD = [];
  for (var i = 0; i < 12; i++) MONTHS.push(new Date(2026, i, 1).toLocaleDateString(undefined, { month: "short" }));
  for (i = 0; i < 7; i++) WD.push(new Date(2026, 0, 4 + i).toLocaleDateString(undefined, { weekday: "short" })); // 4 Jan 2026 is a Sunday

  function mid(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function add(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function key(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function parse(v) { var p = (v || "").split("-"); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function diff(a, b) { return Math.round((b - a) / DAY); }
  function longDate(d) { return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var today = mid(new Date());

  // year options: this year and the two before
  (function () {
    var y = today.getFullYear(), opts = rangeEl.querySelectorAll('option[value^="y"]');
    for (var k = 0; k < opts.length; k++) { opts[k].value = "y" + (y - k); opts[k].textContent = String(y - k); }
  })();
  fromEl.max = key(today);
  fromEl.value = key(add(today, -150));

  function computeRange() {
    var v = rangeEl.value, ws = +wstartEl.value, first, last;
    if (v.charAt(0) === "y") { var y = +v.slice(1); first = new Date(y, 0, 1); last = new Date(y, 11, 31); }
    else { last = today; first = add(today, -(+v.slice(1)) * 7 + 1); }
    var gridStart = add(first, -((first.getDay() - ws + 7) % 7));
    var weeks = Math.ceil((diff(gridStart, last) + 1) / 7);
    return { first: first, last: last, gridStart: gridStart, weeks: weeks, ws: ws, active: last < today ? last : today };
  }
  function inRange(d) { return d >= range.first && d <= range.last; }
  function usable(d) { return inRange(d) && d <= today; }

  function build() {
    range = computeRange();
    var color = colorEl.value, html = '<table class="hg-table" role="grid" aria-labelledby="g-caption"><caption id="g-caption" class="sr-only">' +
      esc(nameEl.value.trim() || "Habit") + ": one square per day</caption><thead><tr><td></td>";
    var lastMonth = -1;
    for (var w = 0; w < range.weeks; w++) {
      var d0 = add(range.gridStart, w * 7), label = "";
      for (var k = 0; k < 7; k++) {
        var dk = add(d0, k);
        if (inRange(dk) && dk.getMonth() !== lastMonth && dk.getDate() <= 7) { label = MONTHS[dk.getMonth()]; lastMonth = dk.getMonth(); break; }
      }
      html += '<th scope="col" class="hg-m"><span>' + label + "</span></th>";
    }
    html += "</tr></thead><tbody>";
    cells = [];
    for (var r = 0; r < 7; r++) {
      var wd = (range.ws + r) % 7;
      html += '<tr><th scope="row" class="hg-wd">' + (r % 2 === 0 ? WD[wd] : '<span class="sr-only">' + WD[wd] + "</span>") + "</th>";
      for (w = 0; w < range.weeks; w++) {
        var d = add(range.gridStart, w * 7 + r), idx = w * 7 + r;
        if (!inRange(d)) { html += '<td class="hg-x"></td>'; continue; }
        var on = !!done[key(d)], ok = d <= today;
        html += '<td><button type="button" class="hg-c' + (on ? " on" : "") + '" data-i="' + idx + '" tabindex="-1" aria-pressed="' + on + '"' +
          (ok ? "" : ' disabled') + ' aria-label="' + longDate(d) + '"></button></td>';
      }
      html += "</tr>";
    }
    gridEl.innerHTML = html + "</tbody></table>";
    gridEl.style.setProperty("--hg-on", color);
    var btns = gridEl.querySelectorAll("button.hg-c");
    cells = [];
    for (k = 0; k < btns.length; k++) cells[+btns[k].getAttribute("data-i")] = btns[k];
    var ti = diff(range.gridStart, range.active);
    focusIdx = cells[ti] ? ti : firstUsable();
    if (cells[focusIdx]) cells[focusIdx].tabIndex = 0;
    wrap.scrollLeft = wrap.scrollWidth;
    stats();
  }
  function firstUsable() { for (var k = 0; k < cells.length; k++) if (cells[k] && !cells[k].disabled) return k; return 0; }
  function dateOf(idx) { return add(range.gridStart, idx); }

  function set(idx, on) {
    var b = cells[idx]; if (!b || b.disabled) return;
    var k = key(dateOf(idx));
    if (on) done[k] = 1; else delete done[k];
    b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on));
  }
  function counts() {
    var total = 0, n = 0, best = 0, run = 0, d;
    for (d = range.first; d <= range.active; d = add(d, 1)) {
      total++;
      if (done[key(d)]) { n++; run++; if (run > best) best = run; } else run = 0;
    }
    var cur = 0; d = range.active;
    if (!done[key(d)] && +d === +today) d = add(d, -1);
    while (d >= range.first && done[key(d)]) { cur++; d = add(d, -1); }
    return { total: total, n: n, best: best, cur: cur };
  }
  function stats() {
    var c = counts(), pct = c.total ? Math.round(c.n / c.total * 100) : 0;
    out.innerHTML = '<div class="stats">' +
      '<div class="stat"><strong>' + c.n + " of " + c.total + "</strong><span>days done</span></div>" +
      '<div class="stat"><strong>' + pct + "%</strong><span>consistency</span></div>" +
      '<div class="stat"><strong>' + c.cur + " day" + (c.cur === 1 ? "" : "s") + "</strong><span>current streak</span></div>" +
      '<div class="stat"><strong>' + c.best + " day" + (c.best === 1 ? "" : "s") + "</strong><span>best streak</span></div></div>";
  }

  // seeded random so the same settings give the same grid
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function fill() {
    var from = parse(fromEl.value), rate = rateEl.value / 100;
    if (!from) return;
    var r = rng(+from / DAY + rateEl.value * 7919);
    for (var d = range.first; d <= range.active; d = add(d, 1)) {
      var k = key(d);
      if (d < from) delete done[k]; else if (r() < rate) done[k] = 1; else delete done[k];
    }
    build();
  }

  // pointer: tap or click toggles; mouse/pen drag paints. Keyboard Space/Enter fire a native click.
  var painting = null, byPointer = false;
  function cellOf(e) { return e.target.closest ? e.target.closest("button.hg-c") : null; }
  gridEl.addEventListener("pointerdown", function (e) {
    var b = cellOf(e);
    if (!b || b.disabled || e.pointerType === "touch") return;
    e.preventDefault();
    var idx = +b.getAttribute("data-i");
    painting = !b.classList.contains("on"); byPointer = true;
    set(idx, painting); move(idx); stats();
  });
  gridEl.addEventListener("pointerover", function (e) {
    if (painting === null) return;
    var b = cellOf(e);
    if (b) { set(+b.getAttribute("data-i"), painting); stats(); }
  });
  window.addEventListener("pointerup", function () { painting = null; setTimeout(function () { byPointer = false; }, 0); });
  gridEl.addEventListener("click", function (e) {
    var b = cellOf(e);
    if (!b || b.disabled) return;
    if (byPointer) { byPointer = false; return; }
    var idx = +b.getAttribute("data-i");
    set(idx, !b.classList.contains("on")); move(idx); stats();
  });

  // keyboard: roving tabindex; arrows move by day/week, Space or Enter toggles
  function move(idx) {
    if (!cells[idx] || cells[idx].disabled) return false;
    if (cells[focusIdx]) cells[focusIdx].tabIndex = -1;
    focusIdx = idx; cells[idx].tabIndex = 0; return true;
  }
  gridEl.addEventListener("keydown", function (e) {
    var b = e.target.closest && e.target.closest("button.hg-c");
    if (!b) return;
    var idx = +b.getAttribute("data-i"), step = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[e.key], target = null;
    if (step) target = idx + step;
    else if (e.key === "Home") target = firstUsable();
    else if (e.key === "End") target = diff(range.gridStart, range.active);
    if (target === null) return;
    e.preventDefault();
    if (move(target)) cells[target].focus();
  });

  // PNG export
  function png() {
    var dark = themeEl.value === "dark", S = 2, cell = 14, gap = 3, pad = 28, left = 40, top = 92;
    var W = pad + left + range.weeks * (cell + gap) - gap + pad, H = top + 7 * (cell + gap) - gap + 64;
    W = Math.max(W, 420);
    var cv = document.createElement("canvas"); cv.width = W * S; cv.height = H * S;
    var g = cv.getContext("2d"); g.scale(S, S);
    var bg = dark ? "#171412" : "#ffffff", ink = dark ? "#f4efe9" : "#1c1917", muted = dark ? "#b3aaa1" : "#5d5650",
        empty = dark ? "#2e2925" : "#ebe4da", font = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var c = counts(), name = nameEl.value.trim() || "My habit";
    g.fillStyle = ink; g.font = "700 22px " + font; g.textBaseline = "alphabetic"; g.fillText(name, pad, 40);
    g.fillStyle = muted; g.font = "500 13px " + font;
    var fmt = { day: "numeric", month: "short", year: "numeric" };
    g.fillText(range.first.toLocaleDateString(undefined, fmt) + " – " + range.last.toLocaleDateString(undefined, fmt) + "  ·  " + c.n + " of " +
      c.total + " days  ·  best streak " + c.best, pad, 62);
    g.font = "500 11px " + font;
    var lastMonth = -1;
    for (var w = 0; w < range.weeks; w++) {
      for (var k = 0; k < 7; k++) {
        var dk = add(range.gridStart, w * 7 + k);
        if (inRange(dk) && dk.getMonth() !== lastMonth && dk.getDate() <= 7) { g.fillText(MONTHS[dk.getMonth()], pad + left + w * (cell + gap), top - 8); lastMonth = dk.getMonth(); break; }
      }
    }
    for (var r = 0; r < 7; r += 2) g.fillText(WD[(range.ws + r) % 7], pad, top + r * (cell + gap) + 11);
    for (w = 0; w < range.weeks; w++) for (r = 0; r < 7; r++) {
      var d = add(range.gridStart, w * 7 + r);
      if (!inRange(d)) continue;
      g.fillStyle = done[key(d)] ? colorEl.value : empty;
      if (d > today) g.globalAlpha = 0.4;
      var x = pad + left + w * (cell + gap), y = top + r * (cell + gap);
      g.beginPath();
      if (g.roundRect) g.roundRect(x, y, cell, cell, 3.5); else g.rect(x, y, cell, cell);
      g.fill(); g.globalAlpha = 1;
    }
    g.fillStyle = muted; g.font = "500 11px " + font; g.textAlign = "right";
    g.fillText("Made with the free habit grid maker · habitforever.app", W - pad, H - 22);
    cv.toBlob(function (blob) {
      if (!blob) return;
      var a = document.createElement("a"), url = URL.createObjectURL(blob);
      a.href = url; a.download = (name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "habit") + "-grid.png";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    }, "image/png");
  }

  colorEl.addEventListener("input", function () { gridEl.style.setProperty("--hg-on", colorEl.value); });
  var sw = document.querySelectorAll("#grid-maker .swatch");
  for (i = 0; i < sw.length; i++) sw[i].addEventListener("click", function () { colorEl.value = this.getAttribute("data-color"); gridEl.style.setProperty("--hg-on", colorEl.value); });
  nameEl.addEventListener("input", function () { var cap = $("g-caption"); if (cap) cap.textContent = (nameEl.value.trim() || "Habit") + ": one square per day"; });
  rangeEl.addEventListener("change", build); wstartEl.addEventListener("change", build);
  rateEl.addEventListener("input", function () { rateOut.textContent = rateEl.value + "%"; });
  $("g-fill").addEventListener("click", fill);
  $("g-clear").addEventListener("click", function () { done = {}; build(); });
  pngBtn.addEventListener("click", png);
  build(); fill();
})();
