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
    rt=r=Math.max(150,Math.min(320,W*.2));
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
  size(); requestAnimationFrame(frame);
})();
