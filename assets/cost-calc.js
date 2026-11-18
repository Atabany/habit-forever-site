// Habit cost calculator: money and time per week/month/year/10 years. Runs locally, stores nothing.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var preset = $("c-preset"), cur = $("c-cur"), price = $("c-price"), times = $("c-times"), per = $("c-per"), mins = $("c-mins"),
      cut = $("c-cut"), cutOut = $("c-cut-out"), out = $("c-result");
  if (!preset || !out) return;
  var PER_YEAR = { day: 365, week: 365 / 7, month: 12, year: 1 };
  // preset: [times, per, minutes, label]; prices are never preset, they differ too much by place
  var P = {
    coffee: [1, "day", 0, "A café coffee"], takeaway: [3, "week", 0, "Takeaway"], cigarettes: [1, "day", 0, "Cigarettes"],
    drinks: [1, "day", 0, "Energy drinks or soda"], subscription: [1, "month", 0, "The subscription"],
    scrolling: [1, "day", 60, "Scrolling"], custom: [null, null, null, "This habit"]
  };
  var REGION = { US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD", AE: "AED", SA: "SAR", QA: "QAR", KW: "KWD", EG: "EGP",
    IN: "INR", PK: "PKR", JP: "JPY", CN: "CNY", KR: "KRW", SG: "SGD", HK: "HKD", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK",
    PL: "PLN", TR: "TRY", BR: "BRL", MX: "MXN", ZA: "ZAR", NG: "NGN" };
  "AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK".split(" ").forEach(function (r) { REGION[r] = "EUR"; });
  try {
    var m = (navigator.language || "").match(/-([A-Z]{2})\b/i);
    if (m && REGION[m[1].toUpperCase()]) cur.value = REGION[m[1].toUpperCase()];
  } catch (e) { /* keep USD */ }
  function num(el) { var v = parseFloat(el.value); return isFinite(v) && v > 0 ? v : 0; }
  function money(v) {
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: cur.value }).format(v); }
    catch (e) { return cur.value + " " + v.toFixed(2); }
  }
  function n1(v) { return v.toLocaleString(undefined, { maximumFractionDigits: 1 }); }
  function n0(v) { return Math.round(v).toLocaleString(); }
  function hours(h) { return h < 10 ? n1(h) : n0(h); }
  function stat(big, small) { return '<div class="stat"><strong>' + big + "</strong><span>" + small + "</span></div>"; }
  function render() {
    var c = cut.value / 100, label = P[preset.value][3];
    cutOut.textContent = cut.value + "%";
    var n = num(times) * PER_YEAR[per.value], year = num(price) * n, hrs = num(mins) * n / 60;
    if (!(year > 0) && !(hrs > 0)) { out.innerHTML = '<p class="note">Enter a cost each time (or minutes each time) and how often.</p>'; return; }
    var html = "";
    if (year > 0) {
      html += "<p><strong>" + label + " costs you " + money(year) + " a year, " + money(year * 10) + " over 10 years.</strong>" +
        (c > 0 ? " Cutting back by " + cut.value + "% would save " + money(year * c) + " a year, or " + money(year * c * 10) + " over 10 years." : "") + "</p>" +
        '<div class="stats">' + stat(money(year / PER_YEAR.week), "a week") + stat(money(year / 12), "a month") +
        stat(money(year), "a year") + stat(money(year * 10), "in 10 years") + "</div>";
    }
    if (hrs > 0) {
      html += "<p" + (year > 0 ? ' style="margin-top:18px"' : "") + "><strong>" + (year > 0 ? "It also takes " : label + " takes ") + hours(hrs) +
        " hours a year: " + n1(hrs / 24) + " full days, or " + n1(hrs / 16) + " waking days.</strong>" +
        (c > 0 ? " Cutting back by " + cut.value + "% gives you " + hours(hrs * c) + " hours a year back." : "") + "</p>" +
        '<div class="stats">' + stat(hours(hrs / PER_YEAR.week), "hours a week") + stat(hours(hrs), "hours a year") +
        stat(n1(hrs / 24), "full days a year") + stat(n0(hrs * 10), "hours in 10 years") + "</div>";
    }
    out.innerHTML = html;
  }
  preset.addEventListener("change", function () {
    var p = P[preset.value];
    if (p[0] !== null) { times.value = p[0]; per.value = p[1]; mins.value = p[2]; }
    if (preset.value === "scrolling") price.value = 0;
    else if (!num(price)) price.value = 5;
    render();
  });
  [cur, price, times, per, mins, cut].forEach(function (el) { el.addEventListener("input", render); el.addEventListener("change", render); });
  render();
})();
