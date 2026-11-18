// Water intake calculator: runs locally, stores nothing. Figures: National Academies (2004/2005), EFSA (2010).
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var who = $("w-who"), ref = $("w-ref"), ex = $("w-ex"), inten = $("w-int"), heat = $("w-heat"), glass = $("w-glass"), out = $("w-result");
  if (!who || !out) return;
  // total water (L/day) and the part from drinks. EFSA gives total water only: drinks estimated at 80%.
  var G = {
    nasem: { woman: [2.7, 2.2], man: [3.7, 3.0], pregnant: [3.0, 2.3], lactating: [3.8, 3.1] },
    efsa: { woman: [2.0, 1.6], man: [2.5, 2.0], pregnant: [2.3, 1.84], lactating: [2.7, 2.16] }
  };
  var OZ = 29.5735295625, HEAT_RATE = 0.3;
  function num(el, max) { var v = parseFloat(el.value); return isFinite(v) && v > 0 ? Math.min(v, max) : 0; }
  function l(v) { return v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function n0(v) { return Math.round(v).toLocaleString(); }
  function render() {
    var g = G[ref.value][who.value], base = g[1];
    var exL = num(ex, 600) / 60 * parseFloat(inten.value), heatL = num(heat, 16) * HEAT_RATE;
    var drinks = base + exL + heatL, total = g[0] + exL + heatL;
    var gml = parseFloat(glass.value), glasses = drinks * 1000 / gml;
    var gname = glass.options[glass.selectedIndex].text.replace(/ \(.*\)$/, "");
    var extra = exL + heatL > 0
      ? " That’s " + l(base) + " L from the guideline" + (exL > 0 ? " + " + l(exL) + " L for exercise" : "") + (heatL > 0 ? " + " + l(heatL) + " L for heat" : "") + "."
      : " That’s the guideline amount for a sedentary day in a mild climate.";
    out.innerHTML =
      "<p><strong>Aim for about " + l(drinks) + " litres from drinks a day: " + n0(drinks * 1000 / OZ) + " US fl oz, or about " + n0(glasses) +
      " glasses of " + gname + ".</strong>" + extra + "</p>" +
      '<div class="stats">' +
      '<div class="stat"><strong>' + l(drinks) + " L</strong><span>from drinks a day</span></div>" +
      '<div class="stat"><strong>' + n0(drinks * 1000 / OZ) + " fl oz</strong><span>US fluid ounces</span></div>" +
      '<div class="stat"><strong>' + n0(glasses) + "</strong><span>glasses of " + gname + "</span></div>" +
      '<div class="stat"><strong>' + l(total) + " L</strong><span>total water, food included</span></div>" +
      "</div>" +
      '<p class="small-note">' + (ref.value === "efsa" ? "EFSA gives total water; drinks are estimated at 80% of it. " : "") +
      "A guide for healthy adults, not medical advice. Thirst is a good signal too.</p>";
  }
  [who, ref, ex, inten, heat, glass].forEach(function (el) { el.addEventListener("input", render); el.addEventListener("change", render); });
  render();
})();
