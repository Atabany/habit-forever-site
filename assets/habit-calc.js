// Habit formation calculator: runs locally, stores nothing.
(function () {
  var start = document.getElementById("start"), habit = document.getElementById("habit"), out = document.getElementById("result");
  if (!start || !out) return;
  var DAY = 86400000, MAX = 254;
  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function parse(v) { var p = v.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmt(d) { return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }
  function add(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function pct(n) { return Math.max(0, Math.min(100, n / MAX * 100)).toFixed(2) + "%"; }
  var today = midnight(new Date());
  start.max = iso(today);
  start.value = iso(add(today, -13));
  function render() {
    if (!start.value) return;
    var s = parse(start.value), day = Math.round((today - s) / DAY) + 1;
    if (day < 1) { out.innerHTML = '<p class="note">Pick a start date that is today or earlier.</p>'; return; }
    var name = habit.value.trim() ? "“" + esc(habit.value.trim()) + "”" : "Your habit";
    var phase = day < 18 ? "Early days. Nobody in the study reached the plateau this fast, so effort now is expected."
      : day < 66 ? "You’re inside the window where the fastest habits became automatic. Keep the same time and place."
      : day <= 154 ? "You’re past the median. Many habits feel automatic around now; harder ones are still on their way."
      : day <= MAX ? "Long-haul territory. Some habits in the study took this long, and that’s still within the measured range."
      : "You’re beyond the longest time measured in the study. If it still feels hard, try making it smaller or tying it to a fixed cue.";
    out.innerHTML =
      '<p><strong>' + name + ' is on day ' + day + '.</strong> ' + phase + '</p>' +
      '<div class="timeline" role="img" aria-label="Day ' + day + ' on a scale from day 1 to day 254">' +
      '<div class="band-range" style="left:' + pct(18) + ';right:' + (100 - parseFloat(pct(MAX))) + '%"></div>' +
      '<div class="mark" style="left:' + pct(66) + '" title="Day 66"></div>' +
      '<div class="mark today" style="left:calc(' + pct(Math.min(day, MAX)) + ' - 2px)" title="Today"></div></div>' +
      '<div class="legend"><span>Day 1</span><span>Day 66 median</span><span>Day 254</span></div>' +
      '<div class="stats">' +
      '<div class="stat"><strong>' + fmt(add(s, 17)) + '</strong><span>Day 18 · fastest in the study</span></div>' +
      '<div class="stat"><strong>' + fmt(add(s, 65)) + '</strong><span>Day 66 · median</span></div>' +
      '<div class="stat"><strong>' + fmt(add(s, 83)) + '</strong><span>Day 84 · end of daily tracking</span></div>' +
      '<div class="stat"><strong>' + fmt(add(s, 253)) + '</strong><span>Day 254 · slowest in the study</span></div>' +
      '</div>';
  }
  start.addEventListener("input", render); habit.addEventListener("input", render); render();
})();
