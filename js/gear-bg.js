/* BlackSheep homepage backdrop: Nick's real kit.
   Photographic cut-outs of his actual gear (Sony a7 IV with a 70-200 GM telephoto and ND filter,
   DJI Mini 5 Pro, Insta360 X on a stick and mini tripod) float large in the margins, well behind the
   page, with depth-of-field, a soft shadow and a slow breathing drift. The drone's arm LEDs blink
   faintly, aviation style, and brighten when the pointer comes near.

   Every time the backdrop is revealed (each page you open, each section you scroll into) it plays a
   different scene, chosen so the same one never repeats twice in a row:
     rackfocus  - the kit starts out of focus and pulls sharp, one piece at a time
     flyin      - the drone flies in from off-screen and settles into a hover
     parallax   - pieces slide apart from the centre at different depths
     orbit      - the drone circles slowly around the camera
     shutter    - a soft frame flash behind the camera and a gentle lift, like taking a shot
     spin360    - the 360 camera turns on its stick while a faint capture ring passes
     rise       - everything rises up from below and settles
     spotlight  - a warm light sweeps across the kit from one side
   The pointer leans the kit toward it (parallax) and tapping near a piece makes it react.
   Nothing flashes hard; motion is slow and smooth. Pointer events never reach the canvas layer. */
(function(){
  var cv = document.getElementById('gear');
  if (!cv) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
  var ctx = cv.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
  var W = 0, H = 0;

  /* ---------- the kit ---------- */
  function load(src){ var i = new Image(); i.decoding = 'async'; i.src = src; return i; }
  var V = '?v=1';
  // images are photographs of the real kit, cut out on transparent backgrounds
  var kit = {
    cam:   {img:load('img/gear/camera.webp' + V), w:968, h:601, z:.55},
    drone: {img:load('img/gear/drone.webp' + V), w:1213, h:580, z:.8,
            leds:[{x:.735, y:.761, c:[70,255,140]}, {x:.098, y:.396, c:[255,40,40]}]},
    x360:  {img:load('img/gear/x360.webp' + V), w:0, h:0, z:.35}
  };
  kit.x360.img.onload = function(){ kit.x360.w = kit.x360.img.naturalWidth; kit.x360.h = kit.x360.img.naturalHeight; };
  kit.x360.img.onerror = function(){ kit.x360.dead = true; };

  /* layout: big pieces in the margins, sized per screen so they read on phones without covering text */
  var L = {};
  function layout(){
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    var narrow = W < 760;
    // desktop: the whole camera with its telephoto and ND filter sits in the left margin, lens toward the page
    L.cam   = narrow ? {x:.30, y:.86, s:.62} : {x:.135, y:.70, s:.25};
    L.drone = narrow ? {x:.84, y:.135, s:.36} : {x:.82, y:.17, s:.27};
    L.x360  = narrow ? {x:.92, y:.80, s:.24} : {x:.92, y:.68, s:.12};
  }
  addEventListener('resize', function(){ clearTimeout(layout.t); layout.t = setTimeout(layout, 120); });
  layout();

  /* ---------- theme ---------- */
  function isDark(){
    var a = document.documentElement.getAttribute('data-theme');
    return a ? a === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /* ---------- scenes ---------- */
  var SCENES = ['rackfocus', 'flyin', 'parallax', 'orbit', 'shutter', 'spin360', 'rise', 'spotlight'];
  var scene = null, sceneT0 = 0, lastScene = '';
  try { lastScene = sessionStorage.getItem('bs-gear-last') || ''; } catch(e){}
  function pickScene(){
    var pool = SCENES.filter(function(s){ return s !== lastScene && !(s === 'spin360' && kit.x360.dead); });
    var s = pool[Math.floor(Math.random() * pool.length)];
    lastScene = s; try { sessionStorage.setItem('bs-gear-last', s); } catch(e){}
    return s;
  }
  function play(){ scene = pickScene(); sceneT0 = performance.now(); cv.setAttribute('data-scene', scene); }

  // a new scene for every page opened and every major section scrolled into view
  addEventListener('pagechange', function(){ setTimeout(play, 60); });
  if ('IntersectionObserver' in window){
    var seen = new WeakSet(), io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) { seen.delete(e.target); return; }
        if (seen.has(e.target)) return; seen.add(e.target);
        if (performance.now() - sceneT0 > 2600) play();
      });
    }, {threshold:.35});
    document.querySelectorAll('[data-cam]').forEach(function(s){ io.observe(s); });
  }

  /* ---------- pointer ---------- */
  var ptr = {x:.5, y:.5, tx:.5, ty:.5, has:false, last:0};
  addEventListener('pointermove', function(e){ ptr.tx = e.clientX / W; ptr.ty = e.clientY / H; ptr.has = true; ptr.last = performance.now(); }, {passive:true});
  var pokes = [];
  addEventListener('pointerdown', function(e){ pokes.push({x:e.clientX, y:e.clientY, t:performance.now()}); }, {passive:true});

  /* ---------- helpers ---------- */
  function clamp(x, a, b){ return x < a ? a : x > b ? b : x; }
  function ease(x){ x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); }
  function outBack(x){ x = clamp(x, 0, 1); var c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function bell(x){ return Math.sin(Math.PI * clamp(x, 0, 1)); }

  /* per-piece state for the scene at time t (seconds since the scene started) */
  function sceneState(name, key, t, i){
    var st = {dx:0, dy:0, sc:1, rot:0, blur:0, a:1, glow:0};
    var d = i * .35;                                // stagger between pieces
    switch (name){
      case 'rackfocus': st.blur = (1 - ease((t - d) / 1.6)) * 14; st.a = .4 + .6 * ease((t - d) / .8); break;
      case 'flyin':
        if (key === 'drone'){ var p = ease(t / 2.4); st.dx = (1 - p) * W * .6; st.dy = -(1 - p) * H * .25 + Math.sin(t * 3) * 6 * (1 - p); st.rot = (1 - p) * -.18; }
        else { st.a = ease((t - .6) / 1); }
        break;
      case 'parallax':
        var p2 = ease((t - d * .5) / 1.8), z = kit[key].z;
        st.dx = (1 - p2) * (L[key].x < .5 ? 1 : -1) * W * .18 * z; st.a = .2 + .8 * p2; st.sc = .94 + .06 * p2; break;
      case 'orbit':
        if (key === 'drone'){ var k = clamp(t / 5, 0, 1), ang = k * Math.PI * 2 * .75; var amp = (1 - ease(k)) ;
          st.dx = Math.cos(ang + Math.PI) * W * .22 * amp - W * .22 * amp * Math.cos(Math.PI); st.dy = Math.sin(ang) * H * .12 * amp; st.sc = 1 - .25 * Math.sin(ang) * amp; }
        break;
      case 'shutter':
        if (key === 'cam'){ st.glow = bell((t - .5) / .7) * .9; st.dy = -bell((t - .3) / 1.2) * 14; st.sc = 1 + bell((t - .3) / 1.2) * .02; }
        else st.a = .5 + .5 * ease(t / 1);
        break;
      case 'spin360':
        if (key === 'x360'){ st.rot = Math.sin(clamp(t / 3, 0, 1) * Math.PI * 2) * .06; st.sc = 1 + bell(t / 3) * .05; st.glow = bell((t - .4) / 2) * .6; }
        break;
      case 'rise':
        var p3 = outBack((t - d) / 1.6); st.dy = (1 - p3) * H * .3; st.a = ease((t - d) / .9); break;
      case 'spotlight': st.glow = 0; break;
    }
    return st;
  }

  /* ---------- drawing ---------- */
  var t0 = performance.now(), last = t0, running = true;
  document.addEventListener('visibilitychange', function(){ running = !document.hidden; if (running){ last = performance.now(); requestAnimationFrame(frame); } });

  function drawPiece(key, i, now, dark){
    var k = kit[key], l = L[key];
    if (!k.img.complete || !k.img.naturalWidth || k.dead) return null;
    var iw = k.w || k.img.naturalWidth, ih = k.h || k.img.naturalHeight;
    var bw = W * l.s, bh = bw * ih / iw;
    var t = (now - t0) / 1000, ts = (now - sceneT0) / 1000;
    var st = scene ? sceneState(scene, key, ts, i) : {dx:0, dy:0, sc:1, rot:0, blur:0, a:1, glow:0};
    // breathing drift, different per piece; the drone hovers
    var bx = Math.sin(t * .23 + i * 2) * 8, by = Math.sin(t * .31 + i) * 6;
    if (key === 'drone'){ by += Math.sin(t * 1.7) * 4; bx += Math.sin(t * .9) * 3; }
    // pointer parallax: deeper pieces move less
    var px = (ptr.x - .5) * 40 * k.z, py = (ptr.y - .5) * 24 * k.z;
    var cx = W * l.x + bx + px + st.dx, cy = H * l.y + by + py + st.dy;
    // poke reaction: a small hop away from a nearby tap
    pokes.forEach(function(p){
      var age = (now - p.t) / 1000; if (age > 1.2) return;
      var dx = cx - p.x, dy = cy - p.y, dd = Math.hypot(dx, dy);
      if (dd < Math.max(bw, bh) * .8){ var f = bell(age / 1.2) * 18; cx += dx / dd * f; cy += dy / dd * f; st.glow = Math.max(st.glow, bell(age / 1.2) * .5); }
    });
    var sc = st.sc, w = bw * sc, h = bh * sc;
    var alpha = clamp(st.a, 0, 1) * (dark ? .9 : .82);
    // ambient depth of field: deeper pieces are softer
    var blur = st.blur + (1 - k.z) * (coarse ? 0 : 1.6);

    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(st.rot + Math.sin(t * .2 + i) * .012);
    // contact shadow under the piece
    ctx.save(); ctx.globalAlpha = alpha * (dark ? .55 : .25);
    var g = ctx.createRadialGradient(0, h * .46, 0, 0, h * .46, w * .45);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.scale(1, .18); ctx.fillRect(-w * .5, h * .46 / .18 - w * .45, w, w * .9); ctx.restore();
    // frame flash / spotlight glow behind
    if (st.glow > .01){
      ctx.save(); ctx.globalAlpha = st.glow * (dark ? .55 : .4);
      var gg = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) * .7);
      gg.addColorStop(0, dark ? 'rgba(255,236,210,.9)' : 'rgba(255,220,180,.9)'); gg.addColorStop(1, 'rgba(255,236,210,0)');
      ctx.fillStyle = gg; ctx.fillRect(-w, -h, w * 2, h * 2); ctx.restore();
    }
    ctx.globalAlpha = alpha;
    // on black, dark gear gets a faint cool rim so its silhouette reads
    var f = [];
    if (blur > .3) f.push('blur(' + blur.toFixed(1) + 'px)');
    if (dark) f.push('drop-shadow(0 0 ' + (w * .012).toFixed(1) + 'px rgba(190,205,225,.35))');
    if (f.length) ctx.filter = f.join(' ');
    ctx.drawImage(k.img, -w / 2, -h / 2, w, h);
    ctx.filter = 'none';
    ctx.restore();
    return {cx:cx, cy:cy, w:w, h:h, rot:st.rot, alpha:alpha};
  }

  function drawLeds(box, now, dark){
    if (!box) return;
    var t = (now - t0) / 1000, near = 0;
    if (ptr.has){ var d = Math.hypot(ptr.x * W - box.cx, ptr.y * H - box.cy); near = clamp(1 - d / (Math.max(box.w, box.h) * 1.2), 0, 1); }
    kit.drone.leds.forEach(function(L2, j){
      // aviation-style: a short double blink every ~1.6 s, the two lights out of phase; brighter when the pointer is near
      var ph = (t + j * .8) % 1.6, on = (ph < .09 || (ph > .22 && ph < .31)) ? 1 : 0;
      var steady = .25 + near * .35;
      var a = Math.max(steady, on) * box.alpha;
      var x = box.cx + (L2.x - .5) * box.w, y = box.cy + (L2.y - .5) * box.h, r = box.w * (.035 + on * .03 + near * .02);
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      var c = L2.c.join(',');
      g.addColorStop(0, 'rgba(' + c + ',' + (a * (dark ? .95 : .8)).toFixed(3) + ')');
      g.addColorStop(.25, 'rgba(' + c + ',' + (a * .45).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + c + ',0)');
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    });
  }

  function drawSpotlight(now, dark){
    if (scene !== 'spotlight') return;
    var ts = (now - sceneT0) / 1000; if (ts > 3.2) return;
    var x = W * (-.2 + 1.4 * ease(ts / 3.2)), a = bell(ts / 3.2) * (dark ? .22 : .14);
    var g = ctx.createRadialGradient(x, H * .5, 0, x, H * .5, Math.max(W, H) * .45);
    g.addColorStop(0, 'rgba(255,226,186,' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,226,186,0)');
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
  }

  function drawRing(box, now){
    if (scene !== 'spin360' || !box) return;
    var ts = (now - sceneT0) / 1000; if (ts > 3) return;
    var p = ease(ts / 3), a = bell(ts / 3) * .5;
    ctx.save(); ctx.strokeStyle = 'rgba(234,228,214,' + a.toFixed(3) + ')'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(box.cx, box.cy - box.h * .3, box.w * (.3 + p * 1.6), box.w * (.08 + p * .4), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }

  var lastDraw = 0;
  function frame(now){
    if (!running) return;
    requestAnimationFrame(frame);
    if (coarse && now - lastDraw < 33) return;   // phones: 30 fps is plenty for slow motion
    lastDraw = now;
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!ptr.has || now - ptr.last > 5000){ ptr.tx = .5 + Math.sin(now / 7000) * .15; ptr.ty = .5 + Math.sin(now / 9000) * .1; }
    var r = 1 - Math.exp(-2.2 * dt); ptr.x += (ptr.tx - ptr.x) * r; ptr.y += (ptr.ty - ptr.y) * r;
    pokes = pokes.filter(function(p){ return now - p.t < 1300; });
    var dark = isDark();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawSpotlight(now, dark);
    var bx = drawPiece('x360', 0, now, dark);
    drawRing(bx, now);
    drawPiece('cam', 1, now, dark);
    var bd = drawPiece('drone', 2, now, dark);
    drawLeds(bd, now, dark);
  }

  if (reduce){
    // still image, no motion: draw once per resize/theme change
    scene = null;
    var still = function(){ var n = performance.now(); ptr.x = ptr.y = .5; frame.call(null, n); running = false; };
    [kit.cam.img, kit.drone.img, kit.x360.img].forEach(function(i){ i.addEventListener('load', function(){ running = true; still(); }); });
    addEventListener('resize', function(){ running = true; setTimeout(still, 150); });
    return;
  }
  play();
  requestAnimationFrame(frame);
})();
