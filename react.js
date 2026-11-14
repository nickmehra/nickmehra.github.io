/* Like / dislike buttons on site images. A small heart and thumbs-down fade in over an image on hover
   (or on tap on touch screens). Counts are shared by all visitors and stored by /react.php. */
(function () {
  var API = '/react.php';
  var SKIP = 'header,footer,nav,.logo,.logo-full,.logo-foot,.brand,.reel,[aria-hidden="true"],.no-react';
  var counts = {}, cur = null, hideT = null;

  function keyOf(img) { var s = img.currentSrc || img.src || (img.tagName === 'VIDEO' && img.querySelector('source') ? img.querySelector('source').src : '') || img.poster || ''; try { s = new URL(s, location.href).pathname; } catch (e) {} return s; }
  function ok(img) {
    if (!img || (img.tagName !== 'IMG' && img.tagName !== 'VIDEO') || !keyOf(img) || img.closest(SKIP)) return false;
    var r = img.getBoundingClientRect(); return r.width >= 140 && r.height >= 100;
  }

  var css = document.createElement('style');
  css.textContent =
    '.rx{position:fixed;z-index:90;display:flex;gap:8px;padding:7px;box-shadow:0 10px 30px rgba(0,0,0,.45);border-radius:999px;background:rgba(8,8,10,.62);' +
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.14);opacity:0;transform:translateY(8px) scale(.85);' +
    'transition:opacity .25s ease,transform .3s cubic-bezier(.2,.9,.3,1.4);pointer-events:none;font:700 15px/1 Manrope,system-ui,sans-serif;color:#f4f2ee;transform-origin:100% 100%}' +
    '.rx.on{opacity:1;transform:none;pointer-events:auto}' +
    '.rx button{display:flex;align-items:center;gap:7px;border:0;background:none;color:inherit;font:inherit;padding:9px 13px;border-radius:999px;cursor:pointer;transition:background .2s,transform .2s}' +
    '.rx button:hover{background:rgba(255,255,255,.14);transform:scale(1.1)}.rx .up:hover svg{stroke:#ff5a5f}' +
    '.rx svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}' +
    '.rx .up.mine svg{fill:#ff3b4a;stroke:#ff3b4a;animation:rxpop .35s ease}@keyframes rxpop{50%{transform:scale(1.35)}}.rx .down.mine svg{fill:#9d9fa7;stroke:#9d9fa7}' +
    '.rx .n{min-width:.6em;opacity:.85}' +
    '@media (prefers-reduced-motion:reduce){.rx{transition:none}}';
  document.head.appendChild(css);

  var bar = document.createElement('div');
  bar.className = 'rx'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Rate this');
  bar.innerHTML =
    '<button type="button" class="up" aria-label="Love it"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg><span class="n"></span></button>' +
    '<button type="button" class="down" aria-label="Not for me"><svg viewBox="0 0 24 24"><path d="M7 4h9l3 7v3h-6l1 5-2 1-5-7V4zM4 4h3v10H4z"/></svg><span class="n"></span></button>';
  document.body.appendChild(bar);
  var bUp = bar.querySelector('.up'), bDown = bar.querySelector('.down');

  function paint() {
    if (!cur) return;
    var c = counts[keyOf(cur)] || { up: 0, down: 0, mine: 'none' };
    bUp.querySelector('.n').textContent = c.up >= 10 ? c.up : '';
    bDown.querySelector('.n').textContent = c.down >= 10 ? c.down : '';
    bUp.classList.toggle('mine', c.mine === 'up'); bDown.classList.toggle('mine', c.mine === 'down');
    bUp.setAttribute('aria-pressed', c.mine === 'up'); bDown.setAttribute('aria-pressed', c.mine === 'down');
  }
  function place() {
    if (!cur) return;
    var r = cur.getBoundingClientRect();
    bar.style.left = Math.max(8, r.right - bar.offsetWidth - 10) + 'px';
    var lift = cur.tagName === 'VIDEO' ? 62 : 10;
    bar.style.top = Math.max(8, Math.min(innerHeight - bar.offsetHeight - 8, r.bottom - bar.offsetHeight - lift)) + 'px';
  }
  function load(k) {
    if (counts[k]) return paint();
    fetch(API + '?keys=' + encodeURIComponent(k), { cache: 'no-store' }).then(function (r) { return r.json(); })
      .then(function (d) { for (var x in d) counts[x] = d[x]; paint(); }).catch(function () {});
  }
  function findImg(t) {
    if (!t || !t.closest) return null;
    var img = t.closest('img,video'); if (img) return img;
    var box = t.closest('a,button,figure,.door,.tilt,.card,.cover,.lightbox');
    return box ? box.querySelector('img,video') : null;
  }
  function show(img) {
    clearTimeout(hideT); cur = img; paint(); bar.classList.add('on'); place(); load(keyOf(img));
  }
  function hideSoon(ms) { clearTimeout(hideT); hideT = setTimeout(function () { bar.classList.remove('on'); cur = null; }, ms || 350); }

  function vote(kind) {
    if (!cur) return;
    var k = keyOf(cur), c = counts[k] || { up: 0, down: 0, mine: 'none' };
    var next = c.mine === kind ? 'none' : kind;
    if (c.mine !== 'none') c[c.mine] = Math.max(0, c[c.mine] - 1);
    if (next !== 'none') c[next] += 1;
    c.mine = next; counts[k] = c; paint();
    var body = new URLSearchParams(); body.set('k', k); body.set('v', next);
    fetch(API, { method: 'POST', body: body }).then(function (r) { return r.json(); })
      .then(function (d) { if (d && typeof d.up === 'number') { counts[k] = d; paint(); } }).catch(function () {});
  }
  bUp.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); vote('up'); });
  bDown.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); vote('down'); });
  ['pointerdown', 'mousedown', 'touchstart'].forEach(function (t) { bar.addEventListener(t, function (e) { e.stopPropagation(); }, { passive: true }); });

  document.addEventListener('mouseover', function (e) {
    if (bar.contains(e.target)) { clearTimeout(hideT); return; }
    var img = findImg(e.target);
    if (img && ok(img)) show(img); else if (cur) hideSoon();
  });
  /* Touch screens: double-tap a photo to like it; double-tap again to withdraw the like. A big heart pops,
     then lingers faintly as it drifts up through the photo (filled for a like, hollow for a withdrawn like).
     A single tap keeps doing whatever the photo normally does. */
  var heartCss = document.createElement('style');
  heartCss.textContent = '.rx-heart{position:fixed;z-index:95;width:var(--hs,120px);height:var(--hs,120px);margin:calc(var(--hs,120px)/-2) 0 0 calc(var(--hs,120px)/-2);pointer-events:none;animation:rxHeart 3.2s cubic-bezier(.2,.8,.3,1) forwards}' +
    '.rx-heart svg{width:100%;height:100%;filter:drop-shadow(0 8px 22px rgba(0,0,0,.45))}' +
    '@keyframes rxHeart{0%{opacity:0;transform:scale(.2) translateY(0)}10%{opacity:1;transform:scale(1.18)}18%{transform:scale(.95)}26%{opacity:1;transform:scale(1.04)}38%{opacity:.32;transform:scale(1.02) translateY(-6%)}100%{opacity:0;transform:scale(1.1) translateY(var(--rise,-120px))}}' +
    'img{-webkit-touch-callout:default}';
  document.head.appendChild(heartCss);
  var HEART = 'M12 21s-7.5-4.6-7.5-10.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 16.4 12 21 12 21z';
  function burstHeart(x, y, img, filled) {
    var r = img.getBoundingClientRect(), size = Math.max(90, Math.min(220, Math.min(r.width, r.height) * .45));
    var h = document.createElement('div'); h.className = 'rx-heart';
    h.style.left = x + 'px'; h.style.top = y + 'px';
    h.style.setProperty('--hs', size + 'px'); h.style.setProperty('--rise', -Math.max(60, (y - r.top) * .9) + 'px');
    h.innerHTML = filled
      ? '<svg viewBox="0 0 24 24"><defs><linearGradient id="rxg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff4d5a"/><stop offset=".55" stop-color="#e2622b"/><stop offset="1" stop-color="#e9a42c"/></linearGradient></defs><path fill="url(#rxg)" d="' + HEART + '"/></svg>'
      : '<svg viewBox="0 0 24 24"><path fill="none" stroke="rgba(244,242,238,.95)" stroke-width="1.1" stroke-linejoin="round" d="' + HEART + '"/></svg>';
    document.body.appendChild(h); setTimeout(function () { h.remove(); }, 3400);
  }
  function likeImg(img, x, y) {
    var r = img.getBoundingClientRect(); x = x == null ? r.left + r.width / 2 : x; y = y == null ? r.top + r.height / 2 : y;
    cur = img; var k = keyOf(img);
    /* double-tap toggles: like, or withdraw an existing like */
    var apply = function () { var c = counts[k] || { up: 0, down: 0, mine: 'none' }; var liking = c.mine !== 'up'; burstHeart(x, y, img, liking); vote('up'); show(img); hideSoon(2500); };
    if (counts[k]) apply(); else fetch(API + '?keys=' + encodeURIComponent(k), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { for (var q in d) counts[q] = d[q]; apply(); }).catch(apply);
  }
  var lastTap = { t: 0, img: null, x: 0, y: 0 }, lastTouchEnd = 0, pending = null, passClick = false;
  /* For photos that do something on a single tap (open full size, follow a link), hold that single tap
     for a moment so a second tap can turn it into a like instead. */
  document.addEventListener('click', function (e) {
    if (passClick || Date.now() - lastTouchEnd > 500) return;
    var img = findImg(e.target); if (!img || !ok(img) || img.tagName === 'VIDEO') return;
    var act = e.target.closest('a,button,[onclick],.tilt'); if (!act) return;
    e.preventDefault(); e.stopImmediatePropagation();
    clearTimeout(pending && pending.timer);
    pending = { el: act, timer: setTimeout(function () { var el = pending && pending.el; pending = null; if (!el) return; passClick = true; try { el.click(); } finally { passClick = false; } }, 340) };
  }, true);
  document.addEventListener('touchend', function (e) {
    if (bar.contains(e.target) || e.changedTouches.length !== 1) return;
    var img = findImg(e.target); if (!img || !ok(img)) { lastTap.img = null; return; }
    var t = e.changedTouches[0], now = Date.now(); lastTouchEnd = now;
    if (lastTap.img === img && now - lastTap.t < 320 && Math.abs(t.clientX - lastTap.x) < 30 && Math.abs(t.clientY - lastTap.y) < 30) {
      e.preventDefault(); lastTap.img = null; if (pending) { clearTimeout(pending.timer); pending = null; } likeImg(img, t.clientX, t.clientY);
    } else lastTap = { t: now, img: img, x: t.clientX, y: t.clientY };
  }, { passive: false });
  /* mouse: double-click a photo likes it too */
  document.addEventListener('dblclick', function (e) { var img = findImg(e.target); if (img && ok(img)) { e.preventDefault(); likeImg(img, e.clientX, e.clientY); } });
  addEventListener('scroll', function () { if (cur) place(); }, { passive: true });
  addEventListener('resize', place);
  (function track() { if (cur && bar.classList.contains('on')) place(); requestAnimationFrame(track); })();
})();
