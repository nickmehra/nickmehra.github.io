/* Hero backdrop v4: a warm spotlight drifts with the pointer, dust floats through it, a tap pulls
   focus, and Nick casts a soft shadow on the wall opposite the light. Every moving part is a
   pre-drawn layer that only changes transform/opacity, so the GPU never repaints mid-animation. */
(function(){
  var stage=document.getElementById('stage'), reel=document.getElementById('reel');
  if(!stage||!reel)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var cv=reel.querySelector('canvas.motes'), focus=reel.querySelector('.focus');
  var ctx=cv&&cv.getContext('2d'); if(!ctx)return;
  var spot=document.createElement('span'); spot.className='spot'; spot.setAttribute('aria-hidden','true'); reel.appendChild(spot);
  var calm=matchMedia('(hover: none), (pointer: coarse), (max-width: 820px)').matches;
  var W=0,H=0,dpr=Math.min(window.devicePixelRatio||1,calm?1.5:2), motes=[], R=240;
  var tx=.5,ty=.5,x=.5,y=.5,active=false,lastMove=0,t0=performance.now(),visible=true,lastDraw=0,FPS=calm?30:40;

  function size(){
    W=reel.offsetWidth; H=reel.offsetHeight; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
    var n=Math.round(Math.min(90,Math.max(36,W*H/14000))); if(calm)n=Math.round(n*.5);
    motes=[]; for(var i=0;i<n;i++)motes.push(mote(true));
    R=Math.max(190,Math.min(420,W*.27)); reel.style.setProperty('--sd',(R*2.6).toFixed(0)+'px');
  }
  function mote(any){
    var warm=Math.random()<.78;
    return {x:warm?W*(.45+Math.random()*.55):Math.random()*W*.5,y:any?Math.random()*H:H+10,
      vx:(Math.random()-.5)*.12,vy:-(.05+Math.random()*.2),s:Math.random()*1.6+.5,a:Math.random()*.45+.15,ph:Math.random()*6.28,warm:warm};
  }
  function toLocal(cx,cy){var b=reel.getBoundingClientRect();return [(cx-b.left)/b.width,(cy-b.top)/b.height];}
  if(!calm){
    stage.addEventListener('pointermove',function(e){var p=toLocal(e.clientX,e.clientY);tx=p[0];ty=p[1];active=true;lastMove=performance.now();},{passive:true});
    stage.addEventListener('pointerleave',function(){active=false;});
  }
  stage.addEventListener('pointerdown',function(e){
    var p=toLocal(e.clientX,e.clientY);
    reel.style.setProperty('--fx',(p[0]*100)+'%'); reel.style.setProperty('--fy',(p[1]*100)+'%');
    focus.classList.remove('go'); void focus.offsetWidth; focus.classList.add('go');
    for(var i=0;i<motes.length;i++){var m=motes[i],dx=m.x-p[0]*W,dy=m.y-p[1]*H,d=Math.hypot(dx,dy)||1;
      if(d<240){var f=(240-d)/240*2.4;m.vx+=dx/d*f;m.vy+=dy/d*f;}}
  },{passive:true});
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){visible=es[0].isIntersecting;}).observe(stage);
  document.addEventListener('visibilitychange',function(){visible=!document.hidden;});
  var rs; addEventListener('resize',function(){clearTimeout(rs);rs=setTimeout(function(){size();fit();},180);});

  function frame(now){
    requestAnimationFrame(frame);
    if(!visible||now-lastDraw<1000/FPS)return;
    var dt=Math.min(3,(now-lastDraw)/16.7); lastDraw=now;
    var t=(now-t0)/1000;
    if(!active||now-lastMove>4000){tx=.5+Math.sin(t*.11)*.26; ty=.46+Math.sin(t*.15+1)*.12;}   // slow idle wander
    var e=1-Math.pow(1-.06,dt); x+=(tx-x)*e; y+=(ty-y)*e;
    spot.style.transform='translate3d('+(x*W).toFixed(1)+'px,'+(y*H).toFixed(1)+'px,0)';
    reel.style.setProperty('--bx',x.toFixed(2));
    ctx.clearRect(0,0,W,H);
    var px=x*W,py=y*H;
    for(var i=0;i<motes.length;i++){
      var m=motes[i],dx=m.x-px,dy=m.y-py,d=Math.hypot(dx,dy)||1;
      m.vx*=.985; m.vy=m.vy*.985-(.04+m.s*.03)*.015;
      m.x+=(m.vx+Math.sin(t*.5+m.ph)*.07)*dt; m.y+=m.vy*dt;
      if(m.y<-10||m.x<-20||m.x>W+20){motes[i]=mote(false);continue;}
      var lit=Math.max(0,1-d/R), al=Math.min(.85,m.a*(.4+lit*1.3));
      ctx.fillStyle=m.warm?'rgba(255,206,140,'+al.toFixed(2)+')':'rgba(170,205,255,'+(al*.8).toFixed(2)+')';
      ctx.beginPath(); ctx.arc(m.x,m.y,m.s,0,6.283); ctx.fill();
    }
    castLight();
  }

  /* ---- cast shadow ---- */
  var scene=document.getElementById('scene'), fig=scene&&scene.querySelector('.figure');
  var sh=scene&&scene.querySelector('.fx-shadow'), shade=scene&&scene.querySelector('.fx-shade');
  function isLight(){return document.documentElement.getAttribute('data-theme')==='light';}
  var shadowReady=false, sox=0, soy=0, lastAng=999, lastShadeT=0;
  function bake(){ // draw Nick's silhouette, blurred, once per size/theme
    if(!fig||!sh||!fig.complete||!fig.naturalWidth)return;
    var w=fig.offsetWidth,h=fig.offsetHeight; if(!w||!h)return;
    var pad=24, c=document.createElement('canvas'), s=Math.min(1,700/h); c.width=Math.round((w+pad*2)*s); c.height=Math.round((h+pad*2)*s);
    var g=c.getContext('2d'); g.scale(s,s);
    g.filter='blur(9px)'; g.drawImage(fig,pad,pad,w,h);
    g.filter='none'; g.globalCompositeOperation='source-in'; g.fillStyle=isLight()?'#2a1f16':'#000'; g.fillRect(0,0,w+pad*2,h+pad*2);
    g.globalCompositeOperation='destination-in'; var fade=g.createLinearGradient(0,0,0,h+pad*2); fade.addColorStop(0,'#000'); fade.addColorStop(.78,'#000'); fade.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=fade; g.fillRect(0,0,w+pad*2,h+pad*2);
    try{ sh.style.backgroundImage='url('+c.toDataURL('image/png')+')'; }catch(err){ return; }
    var cs=getComputedStyle(fig);
    sh.style.width=(w+pad*2)+'px'; sh.style.height=(h+pad*2)+'px'; sh.style.bottom='calc('+cs.bottom+' - '+pad+'px)'; sh.style.marginLeft='0';
    if(shade){shade.style.bottom=cs.bottom;shade.style.width=w+'px';shade.style.height=h+'px';}
    shadowReady=true; lastAng=999;
  }
  function fit(){ bake(); }
  function castLight(){
    if(!shadowReady)return;
    var Lx=x*W, Ly=y*H, f=fig.getBoundingClientRect(), b=reel.getBoundingClientRect();
    var Fx=(f.left+f.width/2-b.left)*(W/b.width), Fy=(f.top+f.height*.42-b.top)*(H/b.height);
    var vx=Fx-Lx, vy=Fy-Ly, d=Math.hypot(vx,vy)||1;
    var ox=vx*.3, oy=vy*.2, lim=f.height*.35, ol=Math.hypot(ox,oy); if(ol>lim){ox*=lim/ol;oy*=lim/ol;}
    sox+=(ox-sox)*.12; soy+=(oy-soy)*.12;
    var near=Math.max(0,1-d/Math.max(W,600)), light=isLight();
    sh.style.transform='translate3d(-50%,0,-100px) translate3d('+sox.toFixed(1)+'px,'+soy.toFixed(1)+'px,0) scale('+(1.04+ol/f.height*.2).toFixed(3)+')';
    sh.style.opacity=((light?.28:.55)+near*(light?.18:.25)).toFixed(2);
    // the far-side shading only re-paints when the light has really moved, and at most twice a second
    var ang=Math.round(Math.atan2(vx/d,-vy/d)*180/Math.PI/6)*6, now=performance.now();
    if(shade&&ang!==lastAng&&now-lastShadeT>500){ lastAng=ang; lastShadeT=now;
      shade.style.transform='translate3d(-50%,0,71px)';
      shade.style.background='linear-gradient('+ang+'deg,rgba(255,214,160,'+(light?.08:.12)+') 0%,rgba(0,0,0,0) 42%,rgba(0,0,0,'+(light?.18:.32)+') 100%)';
    }
  }
  if(fig&&sh){
    if(fig.complete)setTimeout(bake,80); else fig.addEventListener('load',function(){setTimeout(bake,80);});
    new MutationObserver(function(){setTimeout(bake,50);}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  }
  size(); requestAnimationFrame(frame);
})();
