/* BlackSheep homepage backdrop: "Silk and ember".
   A slow, domain-warped sheet of dark silk in the brand's ink, crimson and gold.
   The pointer is a raking light: it brings a gold sheen up across the folds wherever it moves,
   and drags the silk with it. A click or tap sends a soft pressure wave through the fabric.
   Scrolling moves the cloth, so the page and the backdrop travel together.
   One full-screen WebGL pass at reduced resolution; pauses when the tab is hidden;
   a single still frame for visitors who prefer reduced motion. */
(function(){
  var cv = document.getElementById('silk');
  if (!cv) return;
  var gl = cv.getContext('webgl', {antialias:false, alpha:false, premultipliedAlpha:false, powerPreference:'high-performance'});
  if (!gl) { cv.remove(); document.documentElement.classList.remove('has-silk'); return; }
  var deriv = gl.getExtension('OES_standard_derivatives');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = Math.min(innerWidth, innerHeight) < 700;

  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = (deriv ? '#extension GL_OES_standard_derivatives : enable\n#define DERIV 1\n' : '') + [
'precision highp float;',
'uniform vec2 uRes;uniform float uT;uniform vec2 uM;uniform vec2 uV;uniform float uDark;uniform vec3 uRip;uniform float uS;uniform float uE;',
'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
'float n2(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
' return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}',
'float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,.6,-.6,.8);for(int i=0;i<4;i++){v+=a*n2(p);p=r*p*2.02+vec2(1.7,9.2);a*=.5;}return v;}',
'void main(){',
' vec2 px=gl_FragCoord.xy;vec2 p=(px-.5*uRes)/uRes.y;vec2 m=(uM-.5*uRes)/uRes.y;',
' vec2 d=p-m;float fall=exp(-dot(d,d)*5.);',
' p-=uV*fall*.35;',                                   // the cloth is dragged by the pointer
' float rt=uRip.z;if(rt<2.5){vec2 rc=(uRip.xy-.5*uRes)/uRes.y;float rd=length(p-rc);',
'  float w=sin((rd-rt*.55)*26.)*exp(-abs(rd-rt*.55)*9.)*exp(-rt*1.4);p+=normalize(p-rc+1e-4)*w*.035;}',
' float t=uT*.035;p.y+=uS;',
' vec2 q=vec2(fbm(p*.55+vec2(0.,t)),fbm(p*.55+vec2(5.2,1.3)-t));',
' vec2 r=vec2(fbm(p*.7+1.8*q+vec2(1.7,9.2)+.9*t),fbm(p*.7+1.8*q+vec2(8.3,2.8)-.7*t));',
' float h=fbm(p*.45+1.9*r);',
' float folds=.5+.5*sin(h*7.+r.x*3.-t*1.5);',
' float sheen=0.;',
'#ifdef DERIV',
' vec3 n=normalize(vec3(-dFdx(folds)*uE,-dFdy(folds)*uE,1.));',
' vec3 L=normalize(vec3(m-p,.55));float lam=dot(n,L);',
' sheen=pow(max(dot(reflect(-L,n),vec3(0,0,1)),0.),14.);',
'#else',
' float lam=folds;sheen=pow(folds,12.)*.6;',
'#endif',
' float glow=fall;',
' vec3 col;',
' if(uDark>.5){',
'  vec3 ink=vec3(.039,.043,.051),wine=vec3(.26,.03,.045),crim=vec3(.60,.07,.10),gold=vec3(.77,.62,.31);',
'  col=mix(ink,wine,smoothstep(.3,.8,h)*.9);',
'  col=mix(col,crim,folds*smoothstep(.45,.95,h)*.55);',
'  col*=.45+.55*clamp(lam,0.,1.);',
'  col+=gold*sheen*(.12+glow*1.1);',
'  col+=crim*glow*.06;',
'  float v=smoothstep(1.25,.25,length((px/uRes-.5)*vec2(1.25,1.)));col*=.45+.55*v;',
' }else{',
'  vec3 paper=vec3(.961,.961,.949),blush=vec3(.93,.84,.82),crim=vec3(.60,.07,.10),gold=vec3(.77,.62,.31);',
'  col=mix(paper,blush,smoothstep(.35,.95,h)*.55);',
'  col*=.93+.07*clamp(lam,0.,1.);',
'  col=mix(col,crim,folds*smoothstep(.62,1.,h)*.10);',
'  col+=vec3(1.)*sheen*(.05+glow*.25);col=mix(col,gold,glow*sheen*.25);',
'  float v=smoothstep(1.4,.3,length((px/uRes-.5)*vec2(1.25,1.)));col=mix(col*.94,col,v);',
' }',
' col+=(h21(px+fract(uT)*91.)-.5)*(uDark>.5?.028:.018);', // fine film grain
' gl_FragColor=vec4(clamp(col,0.,1.),1.);',
'}'].join('\n');

  function sh(type, src){ var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  var pr;
  try { pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link'); }
  catch(e){ cv.remove(); document.documentElement.classList.remove('has-silk'); return; }
  gl.useProgram(pr);
  var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  var al = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['uRes','uT','uM','uV','uDark','uRip','uS','uE'].forEach(function(k){ U[k] = gl.getUniformLocation(pr, k); });

  var scale = small ? .5 : .7, W = 0, H = 0;
  function size(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(2, Math.round(innerWidth * dpr * scale)); H = Math.max(2, Math.round(innerHeight * dpr * scale));
    cv.width = W; cv.height = H; gl.viewport(0, 0, W, H);
  }
  function isDark(){
    // read the theme's background token (custom properties are not transitioned, so this is instant)
    var v = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    var m = v.match(/^#([0-9a-f]{6})$/i); if (!m) return true;
    var n = parseInt(m[1], 16); return ((n >> 16) + ((n >> 8) & 255) + (n & 255)) / 3 < 128;
  }
  var dark = isDark(), darkNow = dark ? 1 : 0;
  new MutationObserver(function(){ dark = isDark(); }).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme','class']});
  if (matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener && matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){ dark = isDark(); });

  // pointer: smoothed position and velocity, in canvas pixels (y up)
  var tx = .5, ty = .45, mx = .5, my = .45, vx = 0, vy = 0, last = 0, rip = [0, 0, 9], ripT0 = -10;
  addEventListener('pointermove', function(e){ tx = e.clientX / innerWidth; ty = e.clientY / innerHeight; last = performance.now(); }, {passive:true});
  addEventListener('pointerdown', function(e){
    if (e.target.closest && e.target.closest('a,button,input,select,textarea,label,.panel,.lightbox,header,footer')) return;
    tx = mx = e.clientX / innerWidth; ty = my = e.clientY / innerHeight; last = performance.now();
    rip = [mx * W, (1 - my) * H]; ripT0 = performance.now();
  }, {passive:true});
  var rs; addEventListener('resize', function(){ clearTimeout(rs); rs = setTimeout(size, 120); });
  var running = true; document.addEventListener('visibilitychange', function(){ running = !document.hidden; if (running) requestAnimationFrame(frame); });

  var t0 = performance.now(), scrollNow = 0;
  function draw(now){
    var t = (now - t0) / 1000;
    // when the visitor is still, the light drifts slowly on its own (and on touch screens)
    if (now - last > 3500){ tx = .5 + Math.sin(t * .13) * .32; ty = .42 + Math.sin(t * .19 + 1.3) * .22; }
    var nx = mx + (tx - mx) * .06, ny = my + (ty - my) * .06;
    vx += ((nx - mx) * 9 - vx) * .12; vy += ((ny - my) * 9 - vy) * .12; mx = nx; my = ny;
    darkNow += ((dark ? 1 : 0) - darkNow) * .2;
    scrollNow += (scrollY / Math.max(innerHeight, 1) * .18 - scrollNow) * .08;
    gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uT, reduce ? 40 : t);
    gl.uniform2f(U.uM, mx * W, (1 - my) * H); gl.uniform2f(U.uV, vx * (W / H), -vy);
    gl.uniform1f(U.uDark, darkNow); gl.uniform1f(U.uS, scrollNow);
    gl.uniform3f(U.uRip, rip[0], rip[1], (now - ripT0) / 1000);
    gl.uniform1f(U.uE, H * .22);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function frame(now){ if (!running) return; draw(now); if (!reduce) requestAnimationFrame(frame); }
  size(); requestAnimationFrame(frame);
  if (reduce){ addEventListener('scroll', function(){ requestAnimationFrame(draw); }, {passive:true}); new MutationObserver(function(){ dark = isDark(); darkNow = dark ? 1 : 0; requestAnimationFrame(draw); }).observe(document.documentElement, {attributes:true}); }
})();
