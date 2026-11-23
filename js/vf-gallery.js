/* Viewfinder gallery. Markup:
   <section class="vfg" data-base="/img/work/" aria-label="..."><script type="application/json" class="vfg-data">[{"id":"x","t":"Title","k":"Kind"}]</script></section>
   Each id needs <base><id>.jpg (3:2 tile) and <base><id>-full.jpg (full frame). */
(function(){
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function init(root){
    var dataEl = root.querySelector('.vfg-data'); if (!dataEl) return;
    var P; try { P = JSON.parse(dataEl.textContent); } catch(e){ return; }
    if (!P.length) return;
    var base = root.getAttribute('data-base') || 'img/work/';
    // shuffle once per visit so every visit opens on a different frame
    for (var s = P.length - 1; s > 0; s--){ var j = Math.floor(Math.random() * (s + 1)), t = P[s]; P[s] = P[j]; P[j] = t; }
    var tile = function(p){ return base + p.id + '.jpg'; }, full = function(p){ return base + p.id + '-full.jpg'; };

    var body = el('div', 'vfg-body');
    var screen = el('div', 'vfg-screen'); screen.tabIndex = 0;
    screen.setAttribute('role', 'img');
    var img = el('img', 'vfg-shot'); img.alt = ''; img.decoding = 'async';
    var vig = el('div', 'vfg-vig'), grid = el('div', 'vfg-grid');
    var hud = el('div', 'vfg-hud',
      '<span class="vfg-c tl"></span><span class="vfg-c tr"></span><span class="vfg-c bl"></span><span class="vfg-c br"></span>' +
      '<div class="vfg-tl"><i></i><b class="vfg-kind"></b></div><div class="vfg-tr vfg-count"></div>' +
      '<div class="vfg-af"></div><div class="vfg-scale"></div>' +
      '<div class="vfg-bt"><span class="vfg-title"></span><span class="vfg-hint">Move to focus · Hold to magnify</span></div>');
    var loupe = el('div', 'vfg-loupe');
    var curT = el('div', 'vfg-cur t'), curB = el('div', 'vfg-cur b');
    [img, vig, grid, hud, loupe, curT, curB].forEach(function(n){ screen.appendChild(n); });
    body.appendChild(screen);

    var ctl = el('div', 'vfg-ctl');
    var bPrev = el('button', 'vfg-btn', '&#8249; Prev'); bPrev.type = 'button'; bPrev.setAttribute('aria-label', 'Previous photo');
    var bShoot = el('button', 'vfg-btn vfg-shutter', 'Open full size'); bShoot.type = 'button'; bShoot.setAttribute('aria-label', 'Open this photo full size');
    var bNext = el('button', 'vfg-btn', 'Next &#8250;'); bNext.type = 'button'; bNext.setAttribute('aria-label', 'Next photo');
    var bGrid = el('button', 'vfg-btn', 'Grid'); bGrid.type = 'button'; bGrid.setAttribute('aria-pressed', 'false'); bGrid.title = 'Rule-of-thirds grid (G)';
    var bLoupe = el('button', 'vfg-btn', 'Loupe'); bLoupe.type = 'button'; bLoupe.setAttribute('aria-pressed', 'false'); bLoupe.title = 'Magnifier (L)';
    [bPrev, bShoot, bNext, bGrid, bLoupe].forEach(function(n){ ctl.appendChild(n); });
    body.appendChild(ctl);

    var strip = el('div', 'vfg-strip'), reel = el('div', 'vfg-reel');
    strip.setAttribute('role', 'tablist'); strip.setAttribute('aria-label', 'Film strip');
    var frames = P.map(function(p, i){
      var b = el('button', 'vfg-fr'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', (i + 1) + ' of ' + P.length + ': ' + p.t);
      var im = el('img'); im.src = tile(p); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
      b.appendChild(im); b.appendChild(el('span', '', pad(i + 1) + 'A'));
      b.addEventListener('click', function(){ if (!dragged) go(i); });
      reel.appendChild(b); return b;
    });
    strip.appendChild(reel); body.appendChild(strip);
    var live = el('p', 'vfg-live'); live.setAttribute('aria-live', 'polite'); body.appendChild(live);
    dataEl.remove(); root.appendChild(body);

    var full$ = el('div', 'vfg-full', '<img alt=""><p></p><div class="vfg-ctl"><button class="vfg-btn" type="button" data-a="p">&#8249; Prev</button><button class="vfg-btn" type="button" data-a="x">Close</button><button class="vfg-btn" type="button" data-a="n">Next &#8250;</button></div>');
    full$.setAttribute('role', 'dialog'); full$.setAttribute('aria-modal', 'true'); full$.setAttribute('aria-label', 'Full size photo'); full$.hidden = true;
    document.body.appendChild(full$);

    var kindEl = hud.querySelector('.vfg-kind'), countEl = hud.querySelector('.vfg-count'), titleEl = hud.querySelector('.vfg-title');
    var af = hud.querySelector('.vfg-af'), scale = hud.querySelector('.vfg-scale');
    var cur = -1, busy = false, lockT = 0;

    function afLock(x, y){
      af.style.left = x + '%'; af.style.top = y + '%';
      af.classList.remove('lock'); af.classList.remove('hunt'); void af.offsetWidth;
      if (!RM) af.classList.add('hunt');
      clearTimeout(lockT); lockT = setTimeout(function(){ af.classList.remove('hunt'); af.classList.add('lock'); }, RM ? 0 : 520);
      scale.style.backgroundPosition = (-x * 3) + 'px 100%,' + (-x * 3) + 'px 100%';
    }
    function rack(){
      if (RM) return;
      screen.classList.add('racking'); void img.offsetWidth;
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ screen.classList.remove('racking'); }); });
    }
    function show(i){
      var p = P[i];
      img.src = tile(p); img.alt = p.t;
      screen.setAttribute('aria-label', p.t);
      loupe.style.backgroundImage = 'url("' + full(p) + '")';
      var fi = new Image(); fi.onload = function(){ if (P[cur] === p || cur < 0){ fullNat = {w: fi.naturalWidth, h: fi.naturalHeight}; } }; fi.src = full(p);
      kindEl.textContent = p.k || 'Photograph';
      countEl.textContent = pad(i + 1) + ' / ' + pad(P.length);
      titleEl.textContent = p.t;
      live.textContent = 'Photo ' + (i + 1) + ' of ' + P.length + ': ' + p.t;
      frames.forEach(function(f, k){ f.setAttribute('aria-current', k === i ? 'true' : 'false'); f.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      var f = frames[i]; var target = f.offsetLeft - (strip.clientWidth - f.offsetWidth) / 2;
      strip.scrollTo({left: target, behavior: RM ? 'auto' : 'smooth'});
      rack(); afLock(50, 46);
      var n = new Image(); n.src = tile(P[(i + 1) % P.length]);
    }
    function go(i){
      i = (i + P.length) % P.length; if (i === cur || busy) return;
      if (RM || cur < 0){ cur = i; show(i); return; }
      busy = true; screen.classList.add('shut');
      var pre = new Image(); pre.src = tile(P[i]);
      var done = function(){ setTimeout(function(){ cur = i; show(i); screen.classList.remove('shut'); busy = false; }, 150); };
      if (pre.complete) done(); else { pre.onload = pre.onerror = done; }
    }
    // pointer: focus box follows, click/tap focuses there, press-and-hold or Loupe mode magnifies the full-size file
    var loupeMode = false, holdT = 0, holding = false, down = null;
    function pos(e){ var r = screen.getBoundingClientRect(); return {x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, r: r}; }
    var fullNat = {w: 3, h: 2};   // natural size of the current full-size file
    function moveLoupe(q){
      // the tile shows the full file either letterboxed (portrait files) or centre-cropped (wider files)
      var W = q.r.width, H = q.r.height, a = fullNat.w / fullNat.h, w, h, x0, y0;
      if (a < 1.5){ h = H; w = H * a; x0 = (W - w) / 2; y0 = 0; } else { w = W; h = W / a; x0 = 0; y0 = (H - h) / 2; }
      var px = q.x * W, py = q.y * H, inside = px >= x0 && px <= x0 + w && py >= y0 && py <= y0 + h;
      loupe.style.visibility = inside ? 'visible' : 'hidden';
      var L = loupe.offsetWidth || 180, z = Math.max(1.8, Math.min(4, fullNat.w / w));
      loupe.style.left = (q.x * 100) + '%'; loupe.style.top = (q.y * 100) + '%';
      loupe.style.backgroundSize = (w * z) + 'px ' + (h * z) + 'px';
      loupe.style.backgroundPosition = (L / 2 - (px - x0) * z) + 'px ' + (L / 2 - (py - y0) * z) + 'px';
    }
    screen.addEventListener('pointermove', function(e){
      var q = pos(e);
      if (e.pointerType === 'mouse') { af.style.left = (q.x * 100) + '%'; af.style.top = (q.y * 100) + '%'; af.classList.remove('lock'); }
      if (loupeMode || holding) moveLoupe(q);
    });
    screen.addEventListener('pointerdown', function(e){
      var q = pos(e); down = {x: e.clientX, y: e.clientY, t: Date.now()};
      clearTimeout(holdT);
      holdT = setTimeout(function(){ holding = true; moveLoupe(q); screen.classList.add('loupe-on'); }, 260);
    });
    function endPress(e){
      clearTimeout(holdT);
      if (holding){ holding = false; if (!loupeMode) screen.classList.remove('loupe-on'); down = null; return; }
      if (!down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y; down = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { go(cur + (dx < 0 ? 1 : -1)); return; }
      var q = pos(e); rack(); afLock(q.x * 100, q.y * 100);
    }
    screen.addEventListener('pointerup', endPress);
    screen.addEventListener('pointercancel', function(){ clearTimeout(holdT); holding = false; down = null; if (!loupeMode) screen.classList.remove('loupe-on'); });
    screen.addEventListener('pointerleave', function(){ if (!loupeMode) screen.classList.remove('loupe-on'); af.style.left = '50%'; af.style.top = '46%'; });
    screen.addEventListener('dblclick', function(){ openFull(); });
    screen.addEventListener('contextmenu', function(e){ e.preventDefault(); });

    function setLoupe(on){ loupeMode = on; bLoupe.setAttribute('aria-pressed', on ? 'true' : 'false'); screen.classList.toggle('loupe-on', on); if (on){ var r = screen.getBoundingClientRect(); moveLoupe({x: .5, y: .5, r: r}); } }
    function setGrid(on){ root.classList.toggle('grid-on', on); bGrid.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    bPrev.addEventListener('click', function(){ go(cur - 1); });
    bNext.addEventListener('click', function(){ go(cur + 1); });
    bShoot.addEventListener('click', function(){ openFull(); });
    bGrid.addEventListener('click', function(){ setGrid(!root.classList.contains('grid-on')); });
    bLoupe.addEventListener('click', function(){ setLoupe(!loupeMode); });
    root.addEventListener('keydown', function(e){
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight'){ go(cur + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft'){ go(cur - 1); e.preventDefault(); }
      else if ((e.key === 'Enter' && e.target === screen)){ openFull(); e.preventDefault(); }
      else if (e.key === 'g' || e.key === 'G') setGrid(!root.classList.contains('grid-on'));
      else if (e.key === 'l' || e.key === 'L') setLoupe(!loupeMode);
    });

    // film strip: drag to scroll, wheel scrolls sideways
    var sx = 0, sl = 0, dragging = false, dragged = false;
    strip.addEventListener('pointerdown', function(e){ if (e.pointerType !== 'mouse') return; dragging = true; dragged = false; sx = e.clientX; sl = strip.scrollLeft; strip.classList.add('drag'); });
    window.addEventListener('pointermove', function(e){ if (!dragging) return; var d = e.clientX - sx; if (Math.abs(d) > 4) dragged = true; strip.scrollLeft = sl - d; });
    window.addEventListener('pointerup', function(){ if (!dragging) return; dragging = false; strip.classList.remove('drag'); setTimeout(function(){ dragged = false; }, 0); });
    strip.addEventListener('wheel', function(e){ if (Math.abs(e.deltaY) > Math.abs(e.deltaX)){ strip.scrollLeft += e.deltaY; e.preventDefault(); } }, {passive: false});

    // full size view
    var fImg = full$.querySelector('img'), fCap = full$.querySelector('p'), lastFocus = null;
    function fillFull(){ var p = P[cur]; fImg.src = full(p); fImg.alt = p.t; fCap.textContent = p.t + ' · ' + (cur + 1) + ' of ' + P.length; }
    function openFull(){ lastFocus = document.activeElement; fillFull(); full$.hidden = false; requestAnimationFrame(function(){ full$.classList.add('open'); }); full$.querySelector('[data-a="x"]').focus(); }
    function closeFull(){ full$.classList.remove('open'); setTimeout(function(){ full$.hidden = true; }, RM ? 0 : 250); if (lastFocus) lastFocus.focus(); }
    full$.addEventListener('click', function(e){
      var a = e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'x' || e.target === full$) closeFull();
      else if (a === 'n'){ cur = (cur + 1) % P.length; show(cur); fillFull(); }
      else if (a === 'p'){ cur = (cur - 1 + P.length) % P.length; show(cur); fillFull(); }
    });
    document.addEventListener('keydown', function(e){
      if (full$.hidden) return;
      if (e.key === 'Escape') closeFull();
      else if (e.key === 'ArrowRight'){ cur = (cur + 1) % P.length; show(cur); fillFull(); }
      else if (e.key === 'ArrowLeft'){ cur = (cur - 1 + P.length) % P.length; show(cur); fillFull(); }
    });

    if (window.ResizeObserver) new ResizeObserver(function(){ if (cur >= 0){ var f = frames[cur]; strip.scrollLeft = f.offsetLeft - (strip.clientWidth - f.offsetWidth) / 2; } }).observe(strip);
    go(0);
  }
  function boot(){ var n = document.querySelectorAll('.vfg'); for (var i = 0; i < n.length; i++) init(n[i]); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
