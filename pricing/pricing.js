(function(){
  var C = window.BS_CAT, $ = function(id){ return document.getElementById(id); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HST = 0.13, seg = 're', state = {re:{pkg:'', add:[], size:'s1'}, auto:{pkg:'', add:[], cars:0, rvs:0}, ev:{pkg:'', add:[], hours:0}};
  var SLOTS = [['Morning','8–11 am'],['Midday','11 am–2 pm'],['Afternoon','2–5 pm'],['Twilight','around sunset']];
  var TYPES = {re:['Residential listing','Condo or townhouse','Luxury estate','Commercial property','Builder or new construction'], auto:['Car & truck dealership','RV & trailer dealership','Powersports or marine','Auction or fleet'], ev:['Community festival or fair','Brand activation or launch','Corporate event','Private gathering (not weddings)','Other']};
  function money(n){ return '$' + Number(n).toLocaleString('en-CA', {minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2}); }
  function find(list, id){ for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  /* ---- segment switch (page + builder) ---- */
  var segBtns = document.querySelectorAll('.seg button'), pill = document.querySelector('.seg .pill');
  function movePill(){ var b = document.querySelector('.seg button[aria-pressed="true"]'); if (!b) return; pill.style.left = b.offsetLeft + 'px'; pill.style.width = b.offsetWidth + 'px'; }
  function setSeg(s, fromBuilder){
    seg = s;
    segBtns.forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-seg') === s ? 'true' : 'false'); });
    document.querySelectorAll('[data-seg-box]').forEach(function(x){ x.hidden = x.getAttribute('data-seg-box') !== s; });
    document.querySelectorAll('[data-seg-text]').forEach(function(x){ x.hidden = x.getAttribute('data-seg-text') !== s; });
    movePill(); reveal(); drawBuilder();
  }
  segBtns.forEach(function(b){ b.addEventListener('click', function(){ setSeg(b.getAttribute('data-seg')); }); });
  addEventListener('resize', movePill);

  /* ---- cards: rise in as they scroll into view, tilt toward the pointer ---- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){ es.forEach(function(e, i){ if (e.isIntersecting){ var t = e.target; setTimeout(function(){ t.classList.add('in'); }, (+t.getAttribute('data-i') || 0) * 90); io.unobserve(t); } }); }, {threshold:.15}) : null;
  function reveal(){ document.querySelectorAll('.pk:not([hidden]) .pc').forEach(function(c, i){ c.setAttribute('data-i', i); if (io && !reduce) io.observe(c); else c.classList.add('in'); }); }
  if (!reduce) document.querySelectorAll('.tilt3').forEach(function(c){
    var t = c.querySelector('.sheet') || c;
    c.addEventListener('pointermove', function(e){ if (e.pointerType === 'touch') return; var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      t.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg'); t.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg'); });
    c.addEventListener('pointerleave', function(){ t.style.setProperty('--ry', '0deg'); t.style.setProperty('--rx', '0deg'); });
  });
  document.querySelectorAll('[data-pick]').forEach(function(a){ a.addEventListener('click', function(){ var s = a.getAttribute('data-seg'); state[s].pkg = a.getAttribute('data-pick'); if (s !== seg) setSeg(s); else drawBuilder(); }); });

  /* ---- builder ---- */
  function opt(type, name, id, title, sub, price, checked, disabled, inc){
    var l = el('label', 'opt' + (inc ? ' inc' : ''));
    l.innerHTML = '<input type="' + type + '" name="' + name + '" value="' + esc(id) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '><span><b>' + esc(title) + '</b>' + (sub ? '<em>' + esc(sub) + '</em>' : '') + '<strong>' + esc(price) + '</strong></span>';
    return l;
  }
  function drawBuilder(){
    var c = C[seg], st = state[seg], box = $('pkgOpts'), add = $('addOpts');
    box.innerHTML = ''; add.innerHTML = '';
    if (seg === 're') box.appendChild(opt('radio', 'pkg', '', 'No package', 'À la carte only', 'Build your own', !st.pkg));
    c.packages.forEach(function(p){
      box.appendChild(opt('radio', 'pkg', p.id, p.name, p.perunit ? 'Per unit pricing' : p.items.slice(0, 2).join(' · '), p.perunit ? 'From $35 / unit' : money(p.price), st.pkg === p.id));
    });
    if (seg === 'auto' && !st.pkg) { st.pkg = 'au-fleet'; box.querySelector('input[value="au-fleet"]').checked = true; }
    $('sizeBox').hidden = seg !== 're'; $('unitBox').hidden = seg !== 'auto'; $('hoursBox').hidden = seg !== 'ev';
    var pk = find(c.packages, st.pkg);
    if (seg === 'ev') {
      var room = pk ? c.maxHours - pk.hours : 0, hs = $('q-hours'); st.hours = Math.min(st.hours, room);
      hs.innerHTML = ''; for (var hr = 0; hr <= room; hr++) hs.innerHTML += '<option value="' + hr + '">' + (hr ? hr + ' extra hour' + (hr > 1 ? 's' : '') + ' (+' + money(hr * c.hourPrice) + ')' : (pk ? 'None (' + pk.hours + ' hour' + (pk.hours > 1 ? 's' : '') + ' total)' : 'Pick a package first')) + '</option>';
      hs.value = st.hours; hs.disabled = !room;
      c.addons.forEach(function(a){ var inc = pk && pk.id === 'ev-showcase' && a.id === 'ev-drone'; add.appendChild(opt('checkbox', 'add', a.id, a.name, '', inc ? 'Included' : '+ ' + money(a.price), inc || st.add.indexOf(a.id) >= 0, inc, inc)); });
    } else if (seg === 're') {
      c.addons.forEach(function(a){ add.appendChild(opt('checkbox', 'add', a.id, a.name, '', a.quote ? 'On request' : '+ ' + money(a.price), st.add.indexOf(a.id) >= 0)); });
    } else {
      c.unitAddons.forEach(function(a){
        var inc = pk && !pk.perunit && pk.unitType === a.unitType;
        add.appendChild(opt('checkbox', 'add', a.id, a.name, '', money(a.price) + ' / unit', inc || st.add.indexOf(a.id) >= 0, inc, inc));
      });
      c.addons.forEach(function(a){
        var inc = pk && !pk.perunit && a.id === 'au-aerial';
        add.appendChild(opt('checkbox', 'add', a.id, a.name, '', a.quote ? 'On request' : '+ ' + money(a.price), inc || st.add.indexOf(a.id) >= 0, inc, inc));
      });
    }
    var ty = $('q-type'), keep = ty.value; ty.innerHTML = TYPES[seg].map(function(t){ return '<option>' + esc(t) + '</option>'; }).join('');
    if (TYPES[seg].indexOf(keep) >= 0) ty.value = keep;
    else if (seg === 'auto' && pk && pk.unitType === 'rv') ty.value = 'RV & trailer dealership';
    price();
  }
  $('pkgOpts').addEventListener('change', function(e){ state[seg].pkg = e.target.value; drawBuilder(); });
  $('addOpts').addEventListener('change', function(e){
    var a = state[seg].add, v = e.target.value, i = a.indexOf(v);
    if (e.target.checked && i < 0) a.push(v); if (!e.target.checked && i >= 0) a.splice(i, 1); price();
  });
  $('q-hours').addEventListener('change', function(){ state.ev.hours = +this.value || 0; price(); });
  var sz = $('q-size'); sz.innerHTML = C.re.sizes.map(function(s){ return '<option value="' + s.id + '">' + esc(s.name) + (s.quote ? ' (quoted)' : s.price ? ' (+' + money(s.price) + ')' : '') + '</option>'; }).join('');
  sz.addEventListener('change', function(){ state.re.size = sz.value; price(); });
  document.querySelectorAll('.ctr button').forEach(function(b){ b.addEventListener('click', function(){ var u = b.getAttribute('data-u'), inp = $('q-' + u); inp.value = Math.max(0, Math.min(500, (parseInt(inp.value, 10) || 0) + +b.getAttribute('data-d'))); state.auto[u] = +inp.value; price(); }); });
  ['cars', 'rvs'].forEach(function(u){ $('q-' + u).addEventListener('input', function(){ var v = Math.max(0, Math.min(500, parseInt(this.value, 10) || 0)); state.auto[u] = v; price(); }); });

  function calc(){ return window.bsCalc(C, seg, state[seg]); }
  var shown = 0, raf = 0;
  function tween(to){ cancelAnimationFrame(raf); var from = shown, t0 = performance.now(), dur = reduce ? 0 : 650;
    (function step(now){ var k = dur ? Math.min(1, (now - t0) / dur) : 1; k = 1 - Math.pow(1 - k, 3); shown = from + (to - from) * k; $('sumTot').textContent = money(Math.round(shown * 100) / 100); if (k < 1) raf = requestAnimationFrame(step); })(t0); }
  function price(){
    var r = calc(), ul = $('sumList');
    ul.innerHTML = r.lines.length ? r.lines.map(function(l){ return '<li><span>' + esc(l[0]) + (l[1] > 1 ? ' × ' + l[1] : '') + '</span><span>' + money(l[2]) + '</span></li>'; }).join('') : '<li class="empty">Pick a package or a service.</li>';
    $('sumSub').textContent = money(r.sub); $('sumHst').textContent = money(r.hst); tween(r.total);
    $('sumFlags').textContent = r.flags.join(' · ');
  }

  /* ---- calendar (weekdays; fully booked days greyed from the homepage booking list) ---- */
  var BOOKED = {}, MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var today = new Date(); today.setHours(0,0,0,0);
  var view = new Date(today.getFullYear(), today.getMonth(), 1), selDate = '', selSlot = '';
  function dkey(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
  function taken(k, s){ var b = BOOKED[k] || []; return b.indexOf('ALL') >= 0 || b.indexOf(s) >= 0; }
  function drawCal(){
    var y = view.getFullYear(), m = view.getMonth(), g = $('calGrid');
    $('calTitle').textContent = MONTHS[m] + ' ' + y;
    $('calPrev').disabled = y === today.getFullYear() && m === today.getMonth();
    $('calNext').disabled = (y - today.getFullYear()) * 12 + (m - today.getMonth()) >= 11;
    g.innerHTML = ''; var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    for (var i = 0; i < first; i++) g.appendChild(document.createElement('span'));
    for (var n = 1; n <= days; n++) (function(n){
      var d = new Date(y, m, n), k = dkey(d), b = el('button', 'day', n); b.type = 'button';
      var past = d <= today, wk = d.getDay() === 0 || d.getDay() === 6, full = SLOTS.every(function(s){ return taken(k, s[0]); });
      b.disabled = past || wk || full; if (wk && !past) b.classList.add('weekend'); if (full && !past && !wk) b.classList.add('booked');
      b.setAttribute('aria-label', MONTHS[m] + ' ' + n + (wk ? ', weekend' : full ? ', fully booked' : ''));
      b.setAttribute('aria-pressed', k === selDate ? 'true' : 'false');
      b.addEventListener('click', function(){ selDate = k; selSlot = ''; drawCal(); drawSlots(); });
      g.appendChild(b);
    })(n);
  }
  function drawSlots(){
    var box = $('slots'); if (!selDate) return; box.innerHTML = '';
    SLOTS.forEach(function(s){
      var label = s[0] + ' (' + s[1] + ')', b = el('button', 'slot', '<b>' + s[0] + '</b><span>' + (taken(selDate, s[0]) ? 'Booked' : s[1]) + '</span>');
      b.type = 'button'; b.disabled = taken(selDate, s[0]); b.setAttribute('aria-pressed', selSlot === label ? 'true' : 'false');
      b.addEventListener('click', function(){ selSlot = label; drawSlots(); }); box.appendChild(b);
    });
  }
  $('calPrev').addEventListener('click', function(){ view = new Date(view.getFullYear(), view.getMonth() - 1, 1); drawCal(); });
  $('calNext').addEventListener('click', function(){ view = new Date(view.getFullYear(), view.getMonth() + 1, 1); drawCal(); });
  fetch('../', {cache: 'no-store'}).then(function(r){ return r.text(); }).then(function(t){ var m = t.match(/\/\*BOOKED\*\/([\s\S]*?)\/\*END\*\//); if (m) { try { BOOKED = JSON.parse(m[1]); } catch(e){} } drawCal(); }).catch(function(){});
  drawCal();

  /* ---- quotes kept on this device only (nothing stored on the server) ---- */
  function myQuotes(){ try { return JSON.parse(localStorage.getItem('bsQuotes') || '[]'); } catch(e){ return []; } }
  function keepQuote(o){ try { var l = myQuotes().filter(function(x){ return x.number !== o.number; }); l.unshift(o); localStorage.setItem('bsQuotes', JSON.stringify(l.slice(0, 30))); } catch(e){} }
  (function(){ var n = myQuotes().length; if (n) $('acctStrip').innerHTML = '<span>You have <b>' + n + '</b> saved quote' + (n > 1 ? 's' : '') + ' on this device.</span><a class="lk" href="../account/">My quotes</a>';
    try { var me = JSON.parse(localStorage.getItem('bsMe') || 'null'); if (me) { if (!$('q-name').value) $('q-name').value = me.name || ''; if (!$('q-email').value) $('q-email').value = me.email || ''; } } catch(e){} })();

  /* ---- submit ---- */
  $('qForm').addEventListener('submit', function(e){
    e.preventDefault(); var err = $('qErr'); err.hidden = true;
    var r = calc(), name = $('q-name').value.trim(), email = $('q-email').value.trim();
    function fail(m){ err.textContent = m; err.hidden = false; }
    if (!r.lines.length && !r.flags.length) return fail('Pick a package or at least one service.');
    if (seg === 'ev' && !state.ev.pkg) return fail('Pick an event coverage package (1, 2 or 3 hours).');
    if (!name) return fail('Add your name.'); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Add a valid email so we can send your quote.');
    var st = state[seg], btn = $('qGo'); btn.disabled = true; btn.textContent = 'Preparing your quote…';
    var body = {segment: seg, package: st.pkg, addons: st.add, size: st.size, cars: st.cars, rvs: st.rvs, hours: st.hours || 0, name: name, email: email,
      phone: $('q-phone').value.trim(), company: $('q-company').value.trim(), type: $('q-type').value, address: $('q-addr').value.trim(),
      date: selDate, slot: selSlot, notes: $('q-notes').value, website: $('q-web').value};
    fetch('../quote.php', {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)})
      .then(function(r){ return r.json().then(function(j){ return {ok: r.ok, j: j}; }); })
      .then(function(res){
        btn.disabled = false; btn.textContent = 'Email my quote';
        if (!res.ok || !res.j.ok) { if (res.j.verify) document.querySelector('.bk-gate').scrollIntoView({behavior: 'smooth', block: 'center'}); return fail(res.j.error || 'Something went wrong. Please call 647.888.3098.'); }
        var j = res.j, d = $('qDone');
        keepQuote({number: j.number, total: j.price.total, validUntil: j.validUntil, validUntilTs: j.validUntilTs, pdf: j.pdf, approve: j.approve, segment: seg, date: selDate, slot: selSlot, made: Date.now()});
        try { localStorage.setItem('bsMe', JSON.stringify({name: name, email: email})); } catch(e){}
        d.innerHTML = '<span class="eyebrow">Quote ready</span><div class="qn">' + esc(j.number) + '</div>'
          + '<p class="sub">Estimated total <b>' + money(j.price.total) + '</b> incl. HST · good until ' + esc(j.validUntil) + '.</p>'
          + '<p class="sub">' + (j.emailed ? 'It\'s on its way to <b>' + esc(email) + '</b> with your PDF and a button to approve and confirm your booking. If you don\'t see it in a few minutes, check your spam folder.' : 'Download your PDF below. We\'ll also follow up by email to confirm.') + '</p>'
          + '<div class="acts"><a class="btn primary lk" href="' + esc(j.pdf) + '">Download PDF</a><a class="btn lk" href="../account/">My quotes on this device</a><button type="button" class="btn lk" id="qAgain">Build another</button></div>';
        $('qForm').hidden = true; d.hidden = false; d.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'center'});
        $('qAgain').addEventListener('click', function(){ d.hidden = true; $('qForm').hidden = false; });
      })
      .catch(function(){ btn.disabled = false; btn.textContent = 'Email my quote'; fail('Could not reach the server. Please try again or call 647.888.3098.'); });
  });

  document.addEventListener('bk-verified', function(){ drawBuilder(); });
  var h = (location.hash || '').match(/^#book-(re|auto|ev)$/); setSeg(h ? h[1] : 're'); requestAnimationFrame(movePill);
})();
