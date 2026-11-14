/* BlackSheep price estimate, shared by the pricing page and the homepage booking form.
   Same rules as bs_price() in bs-lib.php; the server recalculates every emailed quote. */
window.bsCalc = function (C, seg, st) {
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  var c = C[seg], lines = [], flags = [], pk = find(c.packages, st.pkg);
  if (seg === 're') {
    if (pk) lines.push([pk.name, 1, pk.price]);
    st.add.forEach(function (id) { var a = find(c.addons, id); if (!a) return; if (a.quote) flags.push(a.name + ': priced on request'); else lines.push([a.name, 1, a.price]); });
    var s = find(c.sizes, st.size) || c.sizes[0];
    if (s.quote) flags.push('5,000+ sq ft: size surcharge confirmed after review'); else if (s.price && lines.length) lines.push(['Home size · ' + s.name, 1, s.price]);
  } else {
    var cars = st.cars || 0, rvs = st.rvs || 0;
    if (pk && !pk.perunit) { lines.push([pk.name, 1, pk.price]); var n = pk.unitType === 'rv' ? rvs : cars, ex = Math.max(0, n - pk.included); if (ex) lines.push(['Extra units beyond ' + pk.included, ex, ex * pk.extra]); }
    st.add.forEach(function (id) {
      var u = find(c.unitAddons, id);
      if (u) { if (pk && !pk.perunit && u.unitType === pk.unitType) return; var k = u.unitType === 'rv' ? rvs : cars; if (k > 0) lines.push([u.name, k, k * u.price]); return; }
      var a = find(c.addons, id); if (!a) return; if (a.quote) { flags.push(a.name + ': priced on request'); return; }
      if (pk && !pk.perunit && id === 'au-aerial') return; lines.push([a.name, 1, a.price]);
    });
    if ((!pk || pk.perunit) && cars > 0 && cars < 10) flags.push('Per-unit visits start at 10 cars or trucks');
    if ((!pk || pk.perunit) && rvs > 0 && rvs < 5) flags.push('RV visits start at 5 units');
    if (pk && !pk.perunit && !(pk.unitType === 'rv' ? rvs : cars)) flags.push('Add your unit count so we can plan the day');
  }
  var sub = lines.reduce(function (t, l) { return t + l[2]; }, 0), hst = Math.round(sub * 0.13 * 100) / 100;
  return { lines: lines, flags: flags, sub: sub, hst: hst, total: Math.round((sub + hst) * 100) / 100 };
};
