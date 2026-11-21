/* BlackSheep homepage backdrop: stealth gear.
   Three pieces of the kit, modelled in matte graphite and lit only by thin rim lights:
   a prime lens, a camera drone and a 360 camera on a tripod. They float well behind the page,
   turn slowly, follow the pointer with their gaze, and "take a picture" when the visitor clicks
   or lingers near one: the lens irises shut and open, the drone's gimbal flashes, the 360 camera
   sends a capture ring around itself, and a faint frame flies out toward the viewer.
   Rendered on a transparent canvas under all content; pointer-events never reach it. */
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
      var disc = new T.Mesh(new T.CircleGeometry(.52, 40), new T.MeshBasicMaterial({color:0x9fb7d6, transparent:true, opacity:.05, depthWrite:false, side:T.DoubleSide}));
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

  /* ---------- placement: keep the middle of the page clear for headlines and buttons ---------- */
  var aspect = 1, layout = {};
  function place(){
    var w = innerWidth, h = innerHeight; aspect = w / h;
    renderer.setSize(w, h, false); cam.aspect = aspect; cam.updateProjectionMatrix();
    var vw = Math.tan(cam.fov * Math.PI / 360) * cam.position.z * aspect;   // half the visible width at z = 0
    if (aspect >= 1){
      layout = {lens:[-vw*.74, -1.7, -1], drone:[vw*.7, 2.6, -2.5], tsix:[vw*.76, -2.4, -1.5]};
    } else {        // phones: tucked into the corners, smaller
      layout = {lens:[-vw*.78, -4.6, -3], drone:[vw*.6, 3.6, -4], tsix:[vw*.78, -4.9, -3]};
    }
    var s = aspect >= 1 ? 1 : .5;
    lens.scale.setScalar(.85*s); drone.scale.setScalar(.95*s); tsix.scale.setScalar(.7*s);
    [['lens',lens],['drone',drone],['tsix',tsix]].forEach(function(p){ var v = layout[p[0]]; p[1].userData.home = new T.Vector3(v[0], v[1], v[2]); p[1].position.copy(p[1].userData.home); });
  }

  /* ---------- the captured frame that flies out on each shot ---------- */
  var frames = [];
  function shootFrame(o){
    var geo = new T.EdgesGeometry(new T.PlaneGeometry(1.5, 1));
    var ln = new T.LineSegments(geo, new T.LineBasicMaterial({color:0xf1ece2, transparent:true, opacity:.55, depthWrite:false}));
    var p = new T.Vector3(); (o.userData.glass || o).getWorldPosition(p); ln.position.copy(p); ln.scale.setScalar(.25);
    ln.userData = {t:0, from:p.clone()}; scene.add(ln); frames.push(ln);
    var fl = new T.PointLight(0xfff3e0, 0, 6); fl.position.copy(p).add(new T.Vector3(0, 0, .8)); scene.add(fl); ln.userData.light = fl;
  }
  function snap(o, now){
    if (now - o.userData.snapT < 900) return;
    o.userData.snapT = now; o.userData.flash = 1; shootFrame(o);
  }

  /* ---------- pointer ---------- */
  var mx = 0, my = 0, hasPtr = false, ptrX = -1e4, ptrY = -1e4, lastPtr = 0, sl = {x:0, y:0};
  addEventListener('pointermove', function(e){ hasPtr = true; lastPtr = performance.now(); ptrX = e.clientX; ptrY = e.clientY; mx = e.clientX / innerWidth * 2 - 1; my = -(e.clientY / innerHeight * 2 - 1); }, {passive:true});
  document.addEventListener('pointerleave', function(){ ptrX = ptrY = -1e4; });
  var tmp = new T.Vector3();
  function screenOf(o){ o.getWorldPosition(tmp); tmp.project(cam); return [(tmp.x + 1) / 2 * innerWidth, (1 - tmp.y) / 2 * innerHeight]; }
  addEventListener('pointerdown', function(e){
    if (e.target.closest && e.target.closest('a,button,input,select,textarea,label,summary,[role="button"],.lightbox')) return;   // links and controls keep their click
    var best = null, bd = 1e9; kit.forEach(function(o){ var s = screenOf(o), d = Math.hypot(s[0] - e.clientX, s[1] - e.clientY); if (d < bd){ bd = d; best = o; } });
    if (best) snap(best, performance.now());
  }, {passive:true});

  function isDark(){
    var v = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(), m = v.match(/^#([0-9a-f]{6})$/i);
    if (!m) return true; var n = parseInt(m[1], 16); return ((n >> 16) + ((n >> 8) & 255) + (n & 255)) / 3 < 128;
  }
  function theme(){
    var dk = isDark();
    var sm = innerWidth < 760 ? .7 : 1; cv.style.opacity = String((dk ? .62 : .4) * sm);                       // in the background, never louder than the page
    amb.intensity = dk ? .16 : .5; key.intensity = dk ? .55 : .9;
    wall.material = dk ? wallDark : wallLight; spot.intensity = dk ? 2.2 : 1.4;
  }
  theme(); new MutationObserver(theme).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme','class']});

  var running = true; document.addEventListener('visibilitychange', function(){ running = !document.hidden; if (running) requestAnimationFrame(loop); });
  var rs; addEventListener('resize', function(){ clearTimeout(rs); rs = setTimeout(place, 120); });

  var t0 = performance.now(), last = t0;
  function loop(now){
    if (!running) return;
    var dt = Math.min(.05, (now - last) / 1000); last = now; var t = (now - t0) / 1000;
    var sy = scrollY / Math.max(innerHeight, 1);
    var lx, ly;
    if (hasPtr && now - lastPtr < 4000){ lx = mx; ly = my; } else { lx = Math.sin(t*.16)*.75; ly = Math.sin(t*.23 + 1)*.45; }
    sl.x += (lx - sl.x) * .07; sl.y += (ly - sl.y) * .07;
    var hw = Math.tan(cam.fov * Math.PI / 360) * cam.position.z;
    spot.position.set(sl.x * hw * aspect, sl.y * hw, 6);
    spot.target.position.set(sl.x * hw * aspect * 1.3, sl.y * hw * 1.3, WALL_Z);
    kit.forEach(function(o, i){
      var u = o.userData, h = u.home;
      // float, and drift a little with scroll so the kit feels set back in depth
      o.position.x = h.x + Math.sin(t*.3 + i*2) * .12 - mx * .25;
      o.position.y = h.y + Math.sin(t*.45 + i) * .18 + sy * .6 * (i === 1 ? 1.4 : 1) - my * .15;
      // gaze: each piece turns toward the pointer, more strongly the closer it is
      var s = screenOf(o), d = Math.hypot(s[0] - ptrX, s[1] - ptrY), near = Math.max(0, 1 - d / 420);
      u.face.x += (((hasPtr ? (ptrX - s[0]) / innerWidth : 0) * (0.6 + near * 1.2)) - u.face.x) * .05;
      u.face.y += (((hasPtr ? (ptrY - s[1]) / innerHeight : 0) * (0.4 + near * 1.0)) - u.face.y) * .05;
      // lingering near a piece takes a picture
      if (near > .55) { u.dwell += dt; if (u.dwell > .9) { snap(o, now); u.dwell = -1.2; } } else u.dwell = Math.max(0, u.dwell - dt);
      u.flash = Math.max(0, u.flash - dt * 2.2);
      var since = (now - u.snapT) / 1000;
      if (u.kind === 'lens'){
        o.rotation.y = t * .12 + u.face.x * 1.1; o.rotation.x = u.face.y * .8;
        // iris: blades swing in on the shot, then open again
        var c = since < .6 ? Math.sin(Math.min(1, since / .6) * Math.PI) : 0;
        u.blades.forEach(function(b){ b.scale.x = .06 + c * .94; b.rotation.z = c * .35; });
      } else if (u.kind === 'drone'){
        o.rotation.y = Math.sin(t * .2) * .5 + u.face.x * 1.3; o.rotation.x = u.face.y * .5; o.rotation.z = -u.face.x * .25;
        u.props.forEach(function(p){ p.rotation.y += p.userData.dir * dt * (reduce ? 0 : 38); });
        u.gim.rotation.x = .2 + u.face.y * .6;
      } else {
        u.spin.rotation.y = t * .5 + u.face.x * 1.5; o.rotation.y = Math.sin(t*.1)*.15; o.rotation.x = u.face.y * .15;
        var hr = since < 1.4 ? since / 1.4 : 1; u.halo.scale.setScalar(1 + hr * 9); u.halo.material.opacity = (1 - hr) * .5;
      }
      // the glass flashes on the shot
      var gls = u.fish || [u.glass]; gls.forEach(function(gm){ gm.material = gm.material; });
      glass.emissiveIntensity = .35 + Math.max(lens.userData.flash, drone.userData.flash, tsix.userData.flash) * 3;
    });
    for (var j = frames.length - 1; j >= 0; j--){
      var f = frames[j], fu = f.userData; fu.t += dt;
      var k = fu.t / 1.3;
      f.position.set(fu.from.x * (1 - k * .5), fu.from.y * (1 - k * .5), fu.from.z + k * 7);
      f.scale.setScalar(.25 + k * 1.4); f.material.opacity = .55 * (1 - k);
      fu.light.intensity = Math.max(0, 1 - fu.t * 6) * 4;
      if (k >= 1){ scene.remove(f); scene.remove(fu.light); f.geometry.dispose(); f.material.dispose(); frames.splice(j, 1); }
    }
    renderer.render(scene, cam);
    if (!reduce) requestAnimationFrame(loop);
  }
  place(); requestAnimationFrame(loop);
  if (reduce) addEventListener('scroll', function(){ requestAnimationFrame(loop); }, {passive:true});
})();
