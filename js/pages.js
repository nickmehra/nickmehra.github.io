(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hero: 3D parallax
  var stage=document.getElementById('stage'), scene=document.getElementById('scene');
  if(stage){
  stage.addEventListener('pointermove',function(e){var r=stage.getBoundingClientRect();
    scene.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5)*2); scene.style.setProperty('--my',((e.clientY-r.top)/r.height-.5)*2);});
  stage.addEventListener('pointerleave',function(){scene.style.setProperty('--mx',0);scene.style.setProperty('--my',0);});

  // hero: drifting bokeh
  var cv=document.getElementById('dust'), cx=cv.getContext('2d'), P=[];
  function size(){cv.width=cv.offsetWidth;cv.height=cv.offsetHeight;}
  size(); addEventListener('resize',size);
  for(var i=0;i<46;i++)P.push({x:Math.random(),y:Math.random(),r:1+Math.random()*3.2,s:.00015+Math.random()*.0005,h:Math.random()});
  function draw(){cx.clearRect(0,0,cv.width,cv.height);
    P.forEach(function(p){p.y-=p.s; if(p.y<-.05)p.y=1.05;
      cx.beginPath();cx.arc(p.x*cv.width,p.y*cv.height,p.r,0,6.3);
      cx.fillStyle=p.h<.5?'rgba(226,98,43,.55)':'rgba(233,164,44,.4)';cx.fill();});
    if(!reduce)requestAnimationFrame(draw);}
  draw();
  }

  // story: cards rotate in 3D as they pass the centre of the screen
  var chs=[].slice.call(document.querySelectorAll('.ch'));
  function tiltCh(){var mid=innerHeight/2;
    chs.forEach(function(c){var r=c.getBoundingClientRect(), d=((r.top+r.height/2)-mid)/innerHeight; d=Math.max(-1,Math.min(1,d));
      c.style.setProperty('--r',(-d*16).toFixed(2)); c.style.setProperty('--a',Math.abs(d).toFixed(3));});}
  if(!reduce){addEventListener('scroll',tiltCh,{passive:true});tiltCh();}

  // ring of portraits
  var car=document.getElementById('carousel');
  if(car){
  var figs=car.children, n=figs.length, step=360/n, ang=0, vel=reduce?0:-.12, drag=false, lx=0, hover=false;
  function radius(){return Math.round((car.offsetWidth/2)/Math.tan(Math.PI/n))+34;}
  function lay(){var R=radius(); car.style.setProperty('--R',R+'px'); for(var i=0;i<n;i++)figs[i].style.transform='rotateY('+(i*step)+'deg) translateZ('+R+'px)';}
  lay(); addEventListener('resize',lay);
  function tick(){ if(!drag&&!hover) ang+=vel; car.style.setProperty('--ang',ang+'deg'); requestAnimationFrame(tick);}
  tick();
  var rw=document.getElementById('ringwrap');
  rw.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;rw.setPointerCapture(e.pointerId);});
  rw.addEventListener('pointermove',function(e){if(!drag)return;ang+=(e.clientX-lx)*.35;lx=e.clientX;});
  rw.addEventListener('pointerup',function(){drag=false;});
  rw.addEventListener('pointerenter',function(){hover=true;}); rw.addEventListener('pointerleave',function(){hover=false;drag=false;});
  function snap(dir){var t=Math.round(ang/step)*step+dir*step, s=ang, t0=performance.now();
    (function go(now){var k=Math.min(1,(now-t0)/450);k=1-Math.pow(1-k,3);ang=s+(t-s)*k;if(k<1)requestAnimationFrame(go);})(t0);}
  document.getElementById('prev').addEventListener('click',function(){snap(1);});
  document.getElementById('next').addEventListener('click',function(){snap(-1);});
  }

  // work: tilt + lightbox
  var box=document.getElementById('box');
  if(box){
  var bimg=box.querySelector('img');
  [].forEach.call(document.querySelectorAll('.tilt'),function(t){
    t.addEventListener('pointermove',function(e){var r=t.getBoundingClientRect();t.style.setProperty('--tx',((e.clientX-r.left)/r.width-.5)*2);t.style.setProperty('--ty',((e.clientY-r.top)/r.height-.5)*2);});
    t.addEventListener('pointerleave',function(){t.style.setProperty('--tx',0);t.style.setProperty('--ty',0);});
    t.addEventListener('click',function(){bimg.src=t.dataset.full;bimg.alt=t.querySelector('img').alt;box.classList.add('on');document.getElementById('boxclose').focus();});});
  function shut(){box.classList.remove('on');}
  box.addEventListener('click',shut); addEventListener('keydown',function(e){if(e.key==='Escape')shut();});
  }
})();
