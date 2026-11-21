/* BlackSheep homepage backdrop: stealth gear.
   Three pieces of the kit, modelled in matte graphite and lit by thin rim lights: a prime lens,
   a camera drone and a 360 camera on a tripod. They sit large in the margins, well behind the page,
   and move slowly: every so often, at random, each one performs a small unhurried action (the lens
   stops down its aperture, the drone glides and tilts its camera, the 360 camera turns or sweeps a
   faint capture ring). The pointer is a soft spotlight: the kit turns gently toward it, it casts real
   shadows on the wall behind, and lingering or clicking near a piece invites it to act. Nothing flashes.
   Rendered on a transparent canvas under all content; pointer events never reach it. */
(function(){
  var cv = document.getElementById('gear');
  if (!cv || !window.THREE) { if (cv) cv.remove(); return; }
  var T = THREE;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var renderer;
  try { renderer = new T.WebGLRenderer({canvas:cv, antialias:true, alpha:true, powerPreference:'low-power'}); }
  catch(e){ cv.remove(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap;

  var scene = new T.Scene();
  var cam = new T.PerspectiveCamera(32, 1, .1, 100); cam.position.set(0, 0, 16);

  /* ---------- light: stealth means silhouettes and edges, not fill ---------- */
  var amb = new T.AmbientLight(0xffffff, .16); scene.add(amb);
  var key = new T.DirectionalLight(0xffffff, .55); key.position.set(3, 5, 6); scene.add(key);
  var rimR = new T.DirectionalLight(0xd11f26, 1.6); rimR.position.set(-7, 2, -6); scene.add(rimR);   // brand crimson from behind-left
  var rimC = new T.DirectionalLight(0x9fb7d6, 1.1); rimC.position.set(8, -3, -5); scene.add(rimC);    // cool steel from behind-right
  var top = new T.DirectionalLight(0xc49e4e, .35); top.position.set(0, 8, 2); scene.add(top);         // faint gold from above

  /* the visitor's spotlight: a soft spot that follows the pointer from in front of the kit.
     Each piece throws a real shadow onto a wall behind it, on the side away from the light,
     growing and softening the further the wall is from the object, as a point light would. */
  var spot = new T.SpotLight(0xfff1dc, 2.2, 40, .62, .85, 1.2);
  spot.position.set(0, 0, 8); spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024); spot.shadow.camera.near = 2; spot.shadow.camera.far = 30; spot.shadow.radius = 5; spot.shadow.bias = -.0006;
  scene.add(spot); scene.add(spot.target);
  var WALL_Z = -7;
  var wallDark = new T.MeshLambertMaterial({color:0x2a2622, transparent:true, opacity:.5, blending:T.AdditiveBlending, depthWrite:false});
  var wallLight = new T.ShadowMaterial({color:0x2a1f16, opacity:.22});
  var wall = new T.Mesh(new T.PlaneGeometry(90, 60), wallDark); wall.position.z = WALL_Z; wall.receiveShadow = true; scene.add(wall);

  /* ---------- materials ---------- */
  function M(c, m, r){ return new T.MeshStandardMaterial({color:c, metalness:m, roughness:r}); }
  var body = M(0x1a1c21, .55, .42), rubber = M(0x0d0e10, .1, .85), alu = M(0x2a2d33, .85, .3),
      red = M(0x9a1219, .4, .35), gold = M(0x8a7038, .9, .35);
  var glass = new T.MeshStandardMaterial({color:0x06080e, metalness:1, roughness:.08, emissive:0x101a3a, emissiveIntensity:.35, transparent:true, opacity:.72});
  var coat = new T.MeshBasicMaterial({color:0x5a3b8a, transparent:true, opacity:.22, blending:T.AdditiveBlending, depthWrite:false});

  /* ---------- 1. prime lens ---------- */
  function lathe(pts, mat, seg){ return new T.Mesh(new T.LatheGeometry(pts.map(function(p){ return new T.Vector2(p[0], p[1]); }), seg || 64), mat); }
  function makeLens(){
    var g = new T.Group(), barrel = new T.Group(); g.add(barrel);
    // profile along the optical axis (y), mount at the bottom, hood at the top
    barrel.add(lathe([[.0,-1.9],[.78,-1.9],[.8,-1.75],[.86,-1.7],[.86,-1.55],[.92,-1.5],[.92,-1.2]], alu));        // bayonet mount
    barrel.add(lathe([[.92,-1.2],[1.0,-1.15],[1.0,-.2],[.98,-.15]], body));                                      // rear barrel
    for (var i = 0; i < 18; i++){                                                                                // knurled focus ring
      var r = new T.Mesh(new T.TorusGeometry(1.04, .035, 6, 64), rubber); r.rotation.x = Math.PI/2; r.position.y = -.12 + i * .055; barrel.add(r);
    }
    barrel.add(lathe([[.98,.88],[1.02,.9],[1.02,1.25],[1.12,1.35],[1.18,1.9],[1.1,1.92]], body));                // front barrel and hood
    var ring = new T.Mesh(new T.TorusGeometry(1.03, .022, 8, 80), red); ring.rotation.x = Math.PI/2; ring.position.y = .95; barrel.add(ring);  // the red ring
    var gl = new T.Mesh(new T.SphereGeometry(1.6, 48, 16, 0, Math.PI*2, 0, .62), glass); gl.position.y = .25; barrel.add(gl); // front element
    for (var k = 0; k < 3; k++){ var c = new T.Mesh(new T.RingGeometry(.25 + k*.22, .29 + k*.22, 64), coat); c.rotation.x = -Math.PI/2; c.position.y = 1.62 - k*.12; barrel.add(c); }
    // aperture: seven blades that close when the lens "fires"
    var iris = new T.Group(); iris.position.y = 1.5; barrel.add(iris); var blades = [];
    var bladeMat = new T.MeshStandardMaterial({color:0x101114, metalness:.7, roughness:.45, side:T.DoubleSide});
    for (var b = 0; b < 7; b++){
      // each blade is anchored at the inside of the barrel wall and reaches toward the centre when it closes
      var s = new T.Shape(); s.moveTo(0, -.2); s.lineTo(-.95, -.02); s.lineTo(-.8, .32); s.lineTo(0, .3); s.lineTo(0, -.2);
      var piv = new T.Group(); piv.rotation.y = b / 7 * Math.PI * 2; iris.add(piv);
      var bl = new T.Mesh(new T.ShapeGeometry(s), bladeMat); bl.rotation.x = -Math.PI/2; bl.position.x = .9; bl.scale.x = .06; piv.add(bl); blades.push(bl);
    }
    g.userData = {kind:'lens', barrel:barrel, blades:blades, glass:gl};
    barrel.rotation.set(1.15, 0, -.5);   // three-quarter view, front element toward the viewer
    return g;
  }

  /* ---------- 2. camera drone ---------- */
  function makeDrone(){
    var g = new T.Group(), d = new T.Group(); g.add(d);
    var hull = lathe([[0,-.28],[.55,-.26],[.7,-.1],[.72,.08],[.5,.26],[0,.3]], body, 6); hull.scale.set(1, 1, 1.5); hull.rotation.y = Math.PI/6; d.add(hull);
    var lid = new T.Mesh(new T.BoxGeometry(.7, .06, 1.1), alu); lid.position.y = .3; d.add(lid);
    var props = [];
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(p, i){
      var arm = new T.Mesh(new T.BoxGeometry(1.45, .09, .14), body); arm.position.set(p[0]*.72, .05, p[1]*.72); arm.rotation.y = -p[0]*p[1]*Math.PI/4; d.add(arm);
      var mot = new T.Mesh(new T.CylinderGeometry(.14, .16, .22, 24), alu); mot.position.set(p[0]*1.25, .14, p[1]*1.25); d.add(mot);
      var led = new T.Mesh(new T.SphereGeometry(.035, 8, 8), new T.MeshBasicMaterial({color: p[1] > 0 ? 0xd11f26 : 0x2c6b4a})); led.position.set(p[0]*1.25, -.02, p[1]*1.25); d.add(led);
      var hub = new T.Group(); hub.position.set(p[0]*1.25, .28, p[1]*1.25); d.add(hub);
      for (var b = 0; b < 2; b++){ var bl = new T.Mesh(new T.BoxGeometry(1.0, .012, .09), rubber); bl.rotation.y = b * Math.PI; bl.position.x = 0; hub.add(bl); }
      var disc = new T.Mesh(new T.CircleGeometry(.52, 40), new T.MeshBasicMaterial({color:0x9fb7d6, transparent:true, opacity:.06, depthWrite:false, side:T.DoubleSide}));
      disc.rotation.x = -Math.PI/2; hub.add(disc);
      hub.userData.dir = i % 2 ? 1 : -1; props.push(hub);
      var leg = new T.Mesh(new T.CylinderGeometry(.025, .025, .45, 8), rubber); leg.position.set(p[0]*.45, -.42, p[1]*.55); d.add(leg);
    });
    // gimbal and camera under the nose
    var gim = new T.Group(); gim.position.set(0, -.42, .82); d.add(gim);
    var yoke = new T.Mesh(new T.BoxGeometry(.42, .08, .12), alu); gim.add(yoke);
    var head = new T.Mesh(new T.BoxGeometry(.34, .3, .3), body); head.position.y = -.2; gim.add(head);
    var gl = new T.Mesh(new T.CylinderGeometry(.11, .12, .08, 32), glass); gl.rotation.x = Math.PI/2; gl.position.set(0, -.2, .18); gim.add(gl);
    var gr = new T.Mesh(new T.TorusGeometry(.12, .012, 8, 32), red); gr.position.set(0, -.2, .2); gim.add(gr);
    d.rotation.set(.38, -.6, .05);
    g.userData = {kind:'drone', d:d, props:props, glass:gl, gim:gim};
    return g;
  }

  /* ---------- 3. 360 camera on a tripod ---------- */
  function makeThreeSixty(){
    var g = new T.Group();
    var legs = new T.Group(); g.add(legs);
    for (var i = 0; i < 3; i++){
      var a = i / 3 * Math.PI * 2, leg = new T.Group(); leg.rotation.y = a; legs.add(leg);
      var up = new T.Mesh(new T.CylinderGeometry(.05, .045, 1.7, 12), alu); up.position.set(.38, -.75, 0); up.rotation.z = .42; leg.add(up);
      var lo = new T.Mesh(new T.CylinderGeometry(.035, .03, 1.5, 12), body); lo.position.set(.98, -2.1, 0); lo.rotation.z = .42; leg.add(lo);
      var lock = new T.Mesh(new T.BoxGeometry(.12, .14, .12), rubber); lock.position.set(.7, -1.45, 0); lock.rotation.z = .42; leg.add(lock);
      var foot = new T.Mesh(new T.SphereGeometry(.06, 10, 8), rubber); foot.position.set(1.27, -2.78, 0); leg.add(foot);
    }
    var hubm = new T.Mesh(new T.CylinderGeometry(.16, .2, .22, 24), alu); g.add(hubm);
    var col = new T.Mesh(new T.CylinderGeometry(.04, .04, 1.6, 12), alu); col.position.y = .9; g.add(col);
    var spin = new T.Group(); spin.position.y = 1.95; g.add(spin);
    // the camera: a slim rounded slab with a fisheye on each face
    var slab = lathe([[0,-.55],[.18,-.55],[.22,-.5],[.22,.5],[.18,.55],[0,.55]], body, 40); slab.scale.set(1, 1, .55); spin.add(slab);
    var fish = [];
    [1, -1].forEach(function(s){
      var bez = new T.Mesh(new T.CylinderGeometry(.17, .19, .06, 40), rubber); bez.rotation.x = Math.PI/2; bez.position.set(0, .2, s*.13); spin.add(bez);
      var f = new T.Mesh(new T.SphereGeometry(.15, 32, 16, 0, Math.PI*2, 0, Math.PI/2), glass); f.rotation.x = s * Math.PI/2; f.position.set(0, .2, s*.15); spin.add(f); fish.push(f);
    });
    var btn = new T.Mesh(new T.CylinderGeometry(.035, .035, .02, 16), red); btn.rotation.x = Math.PI/2; btn.position.set(0, -.18, .125); spin.add(btn);
    var halo = new T.Mesh(new T.TorusGeometry(.4, .008, 6, 96), new T.MeshBasicMaterial({color:0xeae4d6, transparent:true, opacity:0, depthWrite:false}));
    halo.rotation.x = Math.PI/2; halo.position.y = 2.15; g.add(halo);
    g.userData = {kind:'360', spin:spin, glass:fish[0], fish:fish, halo:halo};
    return g;
  }

  var lens = makeLens(), drone = makeDrone(), tsix = makeThreeSixty();
  var kit = [lens, drone, tsix];
  kit.forEach(function(o){ o.traverse(function(m){ if (m.isMesh && !(m.material && (m.material.transparent || m.material.isMeshBasicMaterial))) m.castShadow = true; }); });
  kit.forEach(function(o){ scene.add(o); o.userData.flash = 0; o.userData.snapT = -9; o.userData.dwell = 0; o.userData.face = new T.Vector2(); });
  lens.scale.setScalar(.85); drone.scale.setScalar(.95); tsix.scale.setScalar(.7);

  /* ---------- placement: large, set into the margins; on phones they sit behind the content at the edges ---------- */
  var aspect = 1, vwHalf = 1, vhHalf = 1;
  function rnd(a, b){ return a + Math.random() * (b - a); }
  function place(){
    var w = innerWidth, h = innerHeight; aspect = w / h;
    renderer.setSize(w, h, false); cam.aspect = aspect; cam.updateProjectionMatrix();
    vhHalf = Math.tan(cam.fov * Math.PI / 360) * cam.position.z; vwHalf = vhHalf * aspect;
    var L;
    if (aspect >= 1.15){
      L = {lens:[-vwHalf*.72, -1.3, -.5, 1.0], drone:[vwHalf*.62, 2.75, -1.5, .95], tsix:[vwHalf*.8, -2.2, -.5, .85]};
    } else if (aspect >= .8){
      L = {lens:[-vwHalf*.64, -2.5, -.5, .9], drone:[vwHalf*.5, 3.1, -1.5, .9], tsix:[vwHalf*.7, -2.6, -.5, .75]};
    } else {        // phones: big enough to read clearly, anchored to the edges
      L = {lens:[-vwHalf*.72, -3.35, 0, .62], drone:[vwHalf*.45, 3.0, -.5, .72], tsix:[vwHalf*.82, -2.75, 0, .56]};
    }
    [['lens',lens],['drone',drone],['tsix',tsix]].forEach(function(p){
      var v = L[p[0]], u = p[1].userData; u.home = new T.Vector3(v[0], v[1], v[2]); p[1].scale.setScalar(v[3]);
      if (!u.placed){ p[1].position.copy(u.home); u.placed = true; }
      u.homeScreen = null;
    });
  }

  /* ---------- slow, randomised behaviour ---------- */
  // Each piece has a small repertoire. Every so often (at random) it performs one, slowly;
  // lingering near it or clicking near it asks it to perform one sooner. Nothing flashes.
  function ease(x){ x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); }   // smootherstep
  function bell(x){ return Math.sin(Math.PI * Math.max(0, Math.min(1, x))); }
  kit.forEach(function(o){
    var u = o.userData;
    u.act = null; u.next = performance.now() + rnd(4000, 11000);
    u.drift = new T.Vector3(); u.driftT = new T.Vector3(); u.yaw = rnd(-.4, .4); u.yawT = u.yaw;
    u.spinDir = Math.random() < .5 ? -1 : 1; u.phase = rnd(0, 6.28);
  });
  function perform(o, now){
    var u = o.userData; if (u.act) return;
    var kinds = u.kind === 'lens' ? ['iris', 'turn'] : u.kind === 'drone' ? ['glide', 'look'] : ['sweep', 'turn'];
    u.act = {k: kinds[Math.floor(Math.random() * kinds.length)], t0: now, dur: rnd(3200, 4800), amt: rnd(.55, .9)};
    if (u.act.k === 'glide') u.driftT.set(rnd(-.6, .6), rnd(-.4, .4), rnd(-.4, .3));
    if (u.act.k === 'turn' || u.act.k === 'look') u.yawT = rnd(-.9, .9);
    u.next = now + u.act.dur + rnd(7000, 15000);
  }

  /* ---------- pointer, heavily smoothed so the kit never twitches ---------- */
  var ptr = {x: .5, y: .5, has: false, last: 0}, sp = {x: .5, y: .5};
  addEventListener('pointermove', function(e){ ptr.has = true; ptr.last = performance.now(); ptr.x = e.clientX / innerWidth; ptr.y = e.clientY / innerHeight; }, {passive:true});
  var tmp = new T.Vector3();
  function homeScreen(o){
    var u = o.userData; if (u.homeScreen) return u.homeScreen;
    tmp.copy(u.home).project(cam); return (u.homeScreen = [(tmp.x + 1) / 2, (1 - tmp.y) / 2]);
  }
  addEventListener('pointerdown', function(e){
    if (e.target.closest && e.target.closest('a,button,input,select,textarea,label,summary,[role="button"],.lightbox')) return;   // links and controls keep their click
    var x = e.clientX / innerWidth, y = e.clientY / innerHeight, best = null, bd = 1e9;
    kit.forEach(function(o){ var s = homeScreen(o), d = Math.hypot((s[0] - x) * aspect, s[1] - y); if (d < bd){ bd = d; best = o; } });
    if (best && bd < .45) perform(best, performance.now());
  }, {passive:true});

  function isDark(){
    var v = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(), m = v.match(/^#([0-9a-f]{6})$/i);
    if (!m) return true; var n = parseInt(m[1], 16); return ((n >> 16) + ((n >> 8) & 255) + (n & 255)) / 3 < 128;
  }
  function theme(){
    var dk = isDark(), phone = innerWidth < 760;
    // present but quiet: always behind the content, a little stronger on phones so it reads at small sizes
    cv.style.opacity = String(dk ? (phone ? .7 : .6) : (phone ? .5 : .42));
    amb.intensity = dk ? .22 : .5; key.intensity = dk ? .7 : .9;
    wall.material = dk ? wallDark : wallLight; spot.intensity = dk ? 2.0 : 1.3;
  }
  theme(); new MutationObserver(theme).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme','class']});

  var running = true; document.addEventListener('visibilitychange', function(){ running = !document.hidden; if (running){ last = performance.now(); requestAnimationFrame(loop); } });
  var rs; addEventListener('resize', function(){ clearTimeout(rs); rs = setTimeout(function(){ place(); theme(); }, 150); });

  var t0 = performance.now(), last = t0, sy = 0;
  function damp(a, b, rate, dt){ return a + (b - a) * (1 - Math.exp(-rate * dt)); }
  function loop(now){
    if (!running) return;
    var dt = Math.min(.05, (now - last) / 1000); last = now; var t = (now - t0) / 1000;
    sy = damp(sy, scrollY / Math.max(innerHeight, 1), 3, dt);
    // pointer target: the real pointer while it moves, a slow wander when it rests (and on touch screens)
    var idle = !ptr.has || now - ptr.last > 5000;
    var tx = idle ? .5 + Math.sin(t * .07) * .32 : ptr.x, ty = idle ? .45 + Math.sin(t * .09 + 1) * .22 : ptr.y;
    sp.x = damp(sp.x, tx, 1.6, dt); sp.y = damp(sp.y, ty, 1.6, dt);
    var lx = sp.x * 2 - 1, ly = -(sp.y * 2 - 1);
    spot.position.set(lx * vwHalf, ly * vhHalf, 6);
    spot.target.position.set(lx * vwHalf * 1.3, ly * vhHalf * 1.3, WALL_Z);

    kit.forEach(function(o, i){
      var u = o.userData, h = u.home, hs = homeScreen(o);
      if (!reduce && !u.act && now > u.next) perform(o, now);
      // lingering near a piece invites it to act (slowly), never more than once per cycle
      var near = Math.max(0, 1 - Math.hypot((sp.x - hs[0]) * aspect, sp.y - hs[1]) / .32);
      if (!idle && near > .5){ u.dwell = (u.dwell || 0) + dt; if (u.dwell > 1.6){ perform(o, now); u.dwell = -6; } } else if (u.dwell > 0) u.dwell = 0; else if (u.dwell < 0) u.dwell = Math.min(0, u.dwell + dt);
      var a = u.act, p = a ? (now - a.t0) / a.dur : 0, b = a ? bell(p) : 0;
      if (a && p >= 1){ u.act = null; if (a.k === 'glide') u.driftT.set(0, 0, 0); }
      // gentle gaze toward the (smoothed) pointer, measured from the piece's resting place so it can't feed back on itself
      var gx = Math.max(-.35, Math.min(.35, (sp.x - hs[0]) * .6)), gy = Math.max(-.22, Math.min(.22, (sp.y - hs[1]) * .45));
      u.yaw = damp(u.yaw, u.yawT, .6, dt); if (!a) u.yawT = damp(u.yawT, 0, .15, dt);
      u.drift.x = damp(u.drift.x, u.driftT.x, .5, dt); u.drift.y = damp(u.drift.y, u.driftT.y, .5, dt); u.drift.z = damp(u.drift.z, u.driftT.z, .5, dt);
      o.position.x = h.x + Math.sin(t * .21 + u.phase) * .1 + u.drift.x;
      o.position.y = h.y + Math.sin(t * .27 + u.phase) * .14 + sy * .5 + u.drift.y;
      o.position.z = h.z + u.drift.z;
      if (u.kind === 'lens'){
        o.rotation.y = damp(o.rotation.y, Math.sin(t * .05 + u.phase) * .5 + gx + u.yaw, 1.2, dt);
        o.rotation.x = damp(o.rotation.x, gy, 1.2, dt);
        var c = a && a.k === 'iris' ? b * a.amt : 0;
        u.blades.forEach(function(bl){ bl.scale.x = .06 + c * .94; bl.rotation.z = c * .3; });
      } else if (u.kind === 'drone'){
        o.rotation.y = damp(o.rotation.y, Math.sin(t * .06 + u.phase) * .4 + gx * 1.1 + u.yaw, 1, dt);
        o.rotation.x = damp(o.rotation.x, gy * .35, 1, dt);
        o.rotation.z = damp(o.rotation.z, Math.max(-.18, Math.min(.18, -(u.drift.x - u.driftT.x) * .6)), 1, dt);   // banks into the glide
        u.props.forEach(function(pp){ pp.rotation.y += pp.userData.dir * dt * (reduce ? 0 : 2.4); });
        u.gim.rotation.x = damp(u.gim.rotation.x, .2 + gy * .5 + (a && a.k === 'look' ? b * .5 : 0), 1, dt);
      } else {
        u.spinSpeed = damp(u.spinSpeed || .18, (a && a.k === 'turn') ? .5 * u.spinDir : .18 * u.spinDir, .8, dt);
        u.spin.rotation.y += u.spinSpeed * dt * (reduce ? 0 : 1);
        o.rotation.y = damp(o.rotation.y, gx * .3, 1, dt); o.rotation.x = damp(o.rotation.x, gy * .12, 1, dt);
        var hr = a && a.k === 'sweep' ? ease(p) : 1; u.halo.scale.setScalar(1 + hr * 7); u.halo.material.opacity = a && a.k === 'sweep' ? bell(p) * .18 : 0;
      }
    });
    renderer.render(scene, cam);
    if (!reduce) requestAnimationFrame(loop);
  }
  place(); requestAnimationFrame(loop);
  if (reduce) addEventListener('scroll', function(){ requestAnimationFrame(loop); }, {passive:true});
})();
