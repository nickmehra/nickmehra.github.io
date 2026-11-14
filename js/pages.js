(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hero: 3D parallax
  var stage=document.getElementById('stage'), scene=document.getElementById('scene');
  if(stage){
  stage.addEventListener('pointermove',function(e){var r=stage.getBoundingClientRect();
    scene.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5)*2); scene.style.setProperty('--my',((e.clientY-r.top)/r.height-.5)*2);});
  stage.addEventListener('pointerleave',function(){scene.style.setProperty('--mx',0);scene.style.setProperty('--my',0);});

  // hero: air force HUD. A radar scope sweeps behind the portrait, blips flare as the beam passes,
  // a compass ring turns with the mouse, and two small jets cross the sky trailing contrails.
  var cv=document.getElementById('dust'), cx=cv.getContext('2d'), W=0,H=0,DPR=Math.min(2,window.devicePixelRatio||1);
  function size(){W=cv.offsetWidth;H=cv.offsetHeight;cv.width=W*DPR;cv.height=H*DPR;cx.setTransform(DPR,0,0,DPR,0,0);}
  size(); addEventListener('resize',size);
  var HUD='rgba(150,205,150,', AMB='rgba(240,176,64,', mx=0,my=0;
  stage.addEventListener('pointermove',function(e){var r=stage.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5;});
  var blips=[];for(var i=0;i<9;i++)blips.push({a:Math.random()*6.283,d:.3+Math.random()*.62,l:0});
  var jets=[{t:Math.random(),y:.1,s:.00042,dir:1,trail:[]},{t:Math.random(),y:.47,s:.0003,dir:-1,trail:[]}];
  var sweep=0, t0=performance.now();
  function jet(x,y,dir){cx.save();cx.translate(x,y);cx.scale(dir,1);cx.fillStyle=HUD+'.85)';cx.beginPath();
    cx.moveTo(14,0);cx.lineTo(2,-2);cx.lineTo(-4,-11);cx.lineTo(-7,-11);cx.lineTo(-4,-2);cx.lineTo(-11,-2);cx.lineTo(-14,-6);cx.lineTo(-16,-6);cx.lineTo(-14,0);
    cx.lineTo(-16,6);cx.lineTo(-14,6);cx.lineTo(-11,2);cx.lineTo(-4,2);cx.lineTo(-7,11);cx.lineTo(-4,11);cx.lineTo(2,2);cx.closePath();cx.fill();cx.restore();}
  function draw(now){
    var dt=Math.min(50,now-t0);t0=now;cx.clearRect(0,0,W,H);
    var X=W/2+mx*18, Y=H*.6+my*12, R=Math.min(W*.46,H*.62);
    // range rings and cross hairs
    cx.lineWidth=1;
    for(var k=1;k<=4;k++){cx.strokeStyle=HUD+(k===4?.32:.14)+')';cx.beginPath();cx.arc(X,Y,R*k/4,0,6.283);cx.stroke();}
    cx.strokeStyle=HUD+'.1)';cx.beginPath();cx.moveTo(X-R,Y);cx.lineTo(X+R,Y);cx.moveTo(X,Y-R);cx.lineTo(X,Y+R);cx.stroke();
    // compass ticks, turned by the mouse
    var rot=mx*.5;cx.font='600 10px Manrope,sans-serif';cx.textAlign='center';cx.textBaseline='middle';
    for(var d=0;d<360;d+=5){var a=d*Math.PI/180+rot-Math.PI/2,big=d%30===0,r1=R+(big?4:6),r2=R+(big?16:11);
      cx.strokeStyle=HUD+(big?.5:.25)+')';cx.beginPath();cx.moveTo(X+Math.cos(a)*r1,Y+Math.sin(a)*r1);cx.lineTo(X+Math.cos(a)*r2,Y+Math.sin(a)*r2);cx.stroke();
      if(big){cx.fillStyle=HUD+'.55)';var lab=d===0?'N':d===90?'E':d===180?'S':d===270?'W':String(d/10).padStart(2,'0');cx.fillText(lab,X+Math.cos(a)*(R+28),Y+Math.sin(a)*(R+28));}}
    // sweep beam with fading wedge
    if(!reduce)sweep=(sweep+dt*.0011)%6.283;
    for(var j=0;j<28;j++){var a0=sweep-j*.018;cx.fillStyle=HUD+(.13*(1-j/28)).toFixed(3)+')';cx.beginPath();cx.moveTo(X,Y);cx.arc(X,Y,R,a0-.02,a0);cx.closePath();cx.fill();}
    cx.strokeStyle=HUD+'.55)';cx.beginPath();cx.moveTo(X,Y);cx.lineTo(X+Math.cos(sweep)*R,Y+Math.sin(sweep)*R);cx.stroke();
    // blips light up as the beam passes
    blips.forEach(function(b){var diff=((sweep-b.a)%6.283+6.283)%6.283; if(diff<.06)b.l=1; b.l*=.985;
      if(b.l>.03){var bx=X+Math.cos(b.a)*b.d*R,by=Y+Math.sin(b.a)*b.d*R;cx.fillStyle=AMB+(.9*b.l).toFixed(3)+')';cx.beginPath();cx.arc(bx,by,3,0,6.283);cx.fill();
        cx.strokeStyle=AMB+(.35*b.l).toFixed(3)+')';cx.beginPath();cx.arc(bx,by,3+10*(1-b.l),0,6.283);cx.stroke();}});
    // jets with contrails
    jets.forEach(function(j){ if(!reduce)j.t+=j.s*dt/16; if(j.t>1.15){j.t=-.15;j.trail=[];}
      var x=(j.dir>0?j.t:1-j.t)*W, y=H*j.y+Math.sin(j.t*6)*14+my*-20;
      j.trail.push([x,y]); if(j.trail.length>140)j.trail.shift();
      for(var q=1;q<j.trail.length;q++){cx.strokeStyle='rgba(235,240,245,'+(q/j.trail.length*.28).toFixed(3)+')';cx.lineWidth=2;cx.beginPath();cx.moveTo(j.trail[q-1][0],j.trail[q-1][1]);cx.lineTo(j.trail[q][0],j.trail[q][1]);cx.stroke();}
      cx.lineWidth=1; jet(x,y,j.dir);});
    // corner HUD readouts
    cx.textAlign='left';cx.fillStyle=HUD+'.5)';cx.font='600 10px Manrope,sans-serif';
    cx.fillText('HDG '+String(Math.round(((sweep*180/Math.PI)+90)%360)).padStart(3,'0'),18,H-24);
    cx.textAlign='right';cx.fillText('ALT FL'+(350+Math.round(my*-40)),W-18,H-24);
    requestAnimationFrame(draw);}
  requestAnimationFrame(draw);
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
