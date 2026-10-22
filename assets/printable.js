// Printable habit tracker: rebuilds the month grid locally and opens the print dialog. Stores nothing.
(function () {
  var list = document.getElementById("habits"), month = document.getElementById("month"), sheet = document.getElementById("sheet"),
      btn = document.getElementById("print");
  if (!list || !month || !sheet) return;
  var DN = ["S", "M", "T", "W", "T", "F", "S"];
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function render() {
    var v = (month.value || "").split("-"), y = +v[0], m = +v[1];
    if (!y || !m) return;
    var days = new Date(y, m, 0).getDate();
    var habits = list.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 12);
    if (!habits.length) habits = [""];
    var title = new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    var head = "", d, wd;
    for (d = 1; d <= days; d++) { wd = new Date(y, m - 1, d).getDay(); head += '<th class="' + (wd % 6 === 0 ? "weekend" : "") + '">' + d + "<br>" + DN[wd] + "</th>"; }
    var rows = habits.map(function (h) {
      var r = '<tr><td class="habit">' + esc(h) + "</td>";
      for (d = 1; d <= days; d++) { wd = new Date(y, m - 1, d).getDay(); r += '<td class="' + (wd % 6 === 0 ? "weekend" : "") + '"></td>'; }
      return r + "</tr>";
    }).join("");
    sheet.innerHTML = "<h2>" + esc(title) + " · Habit tracker</h2><table><thead><tr><th class=\"habit\">Habit</th>" + head +
      "</tr></thead><tbody>" + rows + '</tbody></table><p class="foot">Fill a square each day you do it. Made with the free printable at habitforever.app</p>';
  }
  var now = new Date();
  month.value = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  list.addEventListener("input", render); month.addEventListener("input", render);
  if (btn) btn.addEventListener("click", function () { window.print(); });
  render();
})();
