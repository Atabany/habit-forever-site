// Reading goal calculator: books <-> pages a day <-> minutes a day. Runs locally, stores nothing.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var books = $("r-books"), pages = $("r-pages"), mins = $("r-mins"), start = $("r-start"), end = $("r-end"), dpw = $("r-dpw"),
      ppb = $("r-ppb"), wpp = $("r-wpp"), wpm = $("r-wpm"), out = $("r-result");
  if (!books || !out) return;
  var DAY = 86400000, last = "books";
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function parse(v) { var p = (v || "").split("-"); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  function fmt(d) { return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
  function val(el, def) { var v = parseFloat(el.value); return isFinite(v) && v > 0 ? v : def; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function f1(v) { return r1(v).toLocaleString(undefined, { maximumFractionDigits: 1 }); }
  var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.value = iso(today);
  end.value = iso(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate() - 1));
  function render() {
    var s = parse(start.value), e = parse(end.value);
    if (!s || !e || e < s) { out.innerHTML = '<p class="note">Pick a finish date on or after the start date.</p>'; return; }
    var days = Math.round((e - s) / DAY) + 1, rdays = days * (+dpw.value) / 7;
    var P = val(ppb, 300), W = val(wpp, 275), S = val(wpm, 238);
    var b, p, m;
    if (last === "books") { b = val(books, 0); p = b * P / rdays; m = p * W / S; }
    else if (last === "pages") { p = val(pages, 0); b = p * rdays / P; m = p * W / S; }
    else { m = val(mins, 0); p = m * S / W; b = p * rdays / P; }
    if (last !== "books") books.value = r1(b);
    if (last !== "pages") pages.value = r1(p);
    if (last !== "mins") mins.value = r1(m);
    if (!(b > 0)) { out.innerHTML = '<p class="note">Enter a number of books, pages or minutes above zero.</p>'; return; }
    var every = days / b;
    out.innerHTML =
      "<p><strong>Read about " + f1(p) + " pages a day, roughly " + f1(m) + " minutes, to finish " + f1(b) + " book" + (r1(b) === 1 ? "" : "s") +
      " between " + fmt(s) + " and " + fmt(e) + ".</strong> That’s " + days.toLocaleString() + " days" +
      (+dpw.value < 7 ? ", reading " + dpw.value + " day" + (dpw.value === "1" ? "" : "s") + " a week" : "") + ", " + P + "-page books, " + W + " words a page and " + S + " words a minute.</p>" +
      '<div class="stats">' +
      '<div class="stat"><strong>' + f1(p) + "</strong><span>pages a reading day</span></div>" +
      '<div class="stat"><strong>' + f1(m) + " min</strong><span>a reading day</span></div>" +
      '<div class="stat"><strong>' + f1(p * (+dpw.value)) + "</strong><span>pages a week</span></div>" +
      '<div class="stat"><strong>' + (every >= 1 ? "every " + f1(every) + " days" : f1(1 / every) + " a day") + "</strong><span>" + (every >= 1 ? "you finish a book" : "books finished") + "</span></div>" +
      "</div>";
  }
  books.addEventListener("input", function () { last = "books"; render(); });
  pages.addEventListener("input", function () { last = "pages"; render(); });
  mins.addEventListener("input", function () { last = "mins"; render(); });
  [start, end, dpw, ppb, wpp, wpm].forEach(function (el) { el.addEventListener("input", render); el.addEventListener("change", render); });
  render();
})();
