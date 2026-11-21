(function(){
  var stage=document.getElementById('stage'), reel=document.getElementById('reel');
  if(!stage||!reel)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var lens=reel.querySelector('img.lens'), cv=reel.querySelector('canvas.motes'), focus=reel.querySelector('.focus');
  var ctx=cv&&cv.getContext('2d'); if(!ctx)return;
  var W=0,H=0,dpr=Math.min(window.devicePixelRatio||1,2), motes=[];
  var tx=.5,ty=.55, x=.5,y=.55, active=false, lastMove=0, t0=performance.now(), visible=true, r=240, rt=240;

  function size(){
    W=reel.offsetWidth; H=reel.offsetHeight; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    var n=Math.round(Math.min(140,Math.max(50,W*H/9000))); motes=[];
    for(var i=0;i<n;i++)motes.push(mote(true));
    rt=r=Math.max(190,Math.min(420,W*.27));
  }
  function mote(any){
    // most dust lives in the warm, sunlit right side; a few cooler specks drift on the platform side
    var warm=Math.random()<.78;
    return {x:warm?W*(.45+Math.random()*.55):Math.random()*W*.5, y:any?Math.random()*H:H+10,
      vx:(Math.random()-.5)*.12, vy:-(.05+Math.random()*.22), s:Math.random()*1.8+.4, a:Math.random()*.5+.15,
      ph:Math.random()*6.28, warm:warm};
  }
  function toLocal(cx,cy){
    var b=reel.getBoundingClientRect();
    return [(cx-b.left)/b.width,(cy-b.top)/b.height];
  }
  stage.addEventListener('pointermove',function(e){var p=toLocal(e.clientX,e.clientY);tx=p[0];ty=p[1];active=true;lastMove=performance.now();},{passive:true});
  stage.addEventListener('pointerleave',function(){active=false;});
  stage.addEventListener('pointerdown',function(e){
    var p=toLocal(e.clientX,e.clientY); tx=p[0];ty=p[1];active=true;lastMove=performance.now();
    reel.style.setProperty('--fx',(p[0]*100)+'%'); reel.style.setProperty('--fy',(p[1]*100)+'%');
    focus.classList.remove('go'); void focus.offsetWidth; focus.classList.add('go');
    r=r*.55; // the lens snaps tight, then breathes back open
    for(var i=0;i<motes.length;i++){var m=motes[i],dx=m.x-p[0]*W,dy=m.y-p[1]*H,d=Math.hypot(dx,dy)||1;
      if(d<260){var f=(260-d)/260*3.2;m.vx+=dx/d*f;m.vy+=dy/d*f;}}
  },{passive:true});
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;}).observe(stage);
  var rs; addEventListener('resize',function(){clearTimeout(rs);rs=setTimeout(size,150);});

  function frame(now){
    requestAnimationFrame(frame);
    if(!visible)return;
    var t=(now-t0)/1000;
    // with no pointer (phones, or the visitor is reading), the lens wanders slowly across the scene
    if(!active||now-lastMove>4000){tx=.5+Math.sin(t*.17)*.3; ty=.5+Math.sin(t*.23+1)*.16;}
    x+=(tx-x)*.07; y+=(ty-y)*.07; r+=(rt-r)*.05;
    reel.style.setProperty('--lx',(x*100).toFixed(2)+'%'); reel.style.setProperty('--ly',(y*100).toFixed(2)+'%');
    reel.style.setProperty('--lr',r.toFixed(1)+'px'); reel.style.setProperty('--bx',x.toFixed(3));
    ctx.clearRect(0,0,W,H);
    var px=x*W, py=y*H;
    for(var i=0;i<motes.length;i++){
      var m=motes[i], dx=m.x-px, dy=m.y-py, d=Math.hypot(dx,dy)||1;
      if(d<r*.8){var f=(r*.8-d)/(r*.8)*.05; m.vx+=dx/d*f; m.vy+=dy/d*f;}
      m.vx*=.985; m.vy=m.vy*.985+(-(.04+m.s*.03))*.015;
      m.x+=m.vx+Math.sin(t*.6+m.ph)*.08; m.y+=m.vy;
      if(m.y<-10||m.x<-20||m.x>W+20){motes[i]=mote(false);continue;}
      // dust glows brighter when it passes through the lens of light
      var lit=Math.max(0,1-d/r), al=m.a*(.35+lit*1.6)*(.7+.3*Math.sin(t*1.3+m.ph));
      ctx.beginPath(); ctx.arc(m.x,m.y,m.s*(1+lit*.8),0,6.283);
      ctx.fillStyle=m.warm?'rgba(255,206,140,'+Math.min(al,.95).toFixed(3)+')':'rgba(170,205,255,'+Math.min(al*.8,.8).toFixed(3)+')';
      ctx.fill();
    }
  }
  /* ---- Cast light on the figure ---- */
  var scene=document.getElementById('scene'), fig=scene&&scene.querySelector('.figure');
  var sh=scene&&scene.querySelector('.fx-shadow'), rim=scene&&scene.querySelector('.fx-rim'), shade=scene&&scene.querySelector('.fx-shade');
  var Z={sh:-100,rim:68,shade:71};
  function fit(){
    if(!fig||!sh)return; var cs=getComputedStyle(fig);
    [sh,rim,shade].forEach(function(el){el.style.bottom=cs.bottom;el.style.height=cs.height;el.style.width=cs.width;});
  }
  function isLight(){return document.documentElement.getAttribute('data-theme')==='light';}
  var sox=0,soy=0,sblur=10,sop=0;
  function castLight(){
    if(!fig||!sh||!fig.complete)return;
    var b=reel.getBoundingClientRect(), f=fig.getBoundingClientRect(), st=stage.getBoundingClientRect();
    var Lx=b.left+x*b.width, Ly=b.top+y*b.height;           // where the spotlight is
    var Fx=f.left+f.width/2, Fy=f.top+f.height*.42;          // the figure's centre of mass (chest height)
    var vx=Fx-Lx, vy=Fy-Ly, d=Math.hypot(vx,vy)||1, ux=vx/d, uy=vy/d, span=Math.max(st.width,600);
    // point light in front of the subject, wall behind: the shadow is displaced away from the light by
    // (wall depth / light depth) times the light's offset, enlarged by the same ratio, and its penumbra widens with distance
    var k=.32, ox=vx*k, oy=vy*k*.75, lim=f.height*.42, ol=Math.hypot(ox,oy); if(ol>lim){ox*=lim/ol;oy*=lim/ol;}
    var near=Math.max(0,1-d/(span*.95));                       // inverse fall-off: closer light, darker and crisper shadow
    var light=isLight();
    sox+=(ox-sox)*.25; soy+=(oy-soy)*.25;
    sblur+=((3+ (1-near)*16)-sblur)*.2;
    sop+=(((light?.30:.62)+near*(light?.25:.33))-sop)*.2;
    var sc=1.04+ol/f.height*.25;
    sh.style.transform='translate3d(-50%,0,'+Z.sh+'px) translate('+sox.toFixed(1)+'px,'+soy.toFixed(1)+'px) scale('+sc.toFixed(3)+')';
    sh.style.filter='blur('+sblur.toFixed(1)+'px)'; sh.style.opacity=sop.toFixed(3);
    // rim light: a warm edge on the side facing the light
    var rr=1.5+near*2.5;
    rim.style.transform='translate3d(-50%,0,'+Z.rim+'px) translate('+(-ux*rr).toFixed(1)+'px,'+(-uy*rr).toFixed(1)+'px)';
    rim.style.filter='blur('+(2.5+(1-near)*2).toFixed(1)+'px)'; rim.style.opacity=((light?.3:.12+near*.4)*(st.width<820?.45:1)).toFixed(3);
    // form shading: lit toward the light, falling into shadow on the far side
    var ang=Math.atan2(ux,-uy)*180/Math.PI;
    shade.style.transform='translate3d(-50%,0,'+Z.shade+'px)';
    shade.style.background='linear-gradient('+ang.toFixed(1)+'deg,rgba(255,214,160,'+(light?.10:.12+near*.14).toFixed(3)+') 0%,rgba(0,0,0,0) 42%,rgba(0,0,0,'+(light?.22:.3+near*.25).toFixed(3)+') 100%)';
    // contact shadow under the figure leans away from the light too
    stage.style.setProperty('--fig-shadow','drop-shadow('+(ux*14).toFixed(1)+'px '+(24+uy*10).toFixed(1)+'px 36px rgba(0,0,0,'+(light?.28:.6)+'))');
  }
  if(fig&&sh){stage.classList.add('fx-on');fit();addEventListener('resize',function(){setTimeout(fit,160);});if(!fig.complete)fig.addEventListener('load',fit);
    var _frame=frame; frame=function(now){_frame(now); if(visible)castLight();};}

  size(); requestAnimationFrame(frame);
})();
