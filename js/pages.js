(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  // hero: 3D parallax
  var stage=document.getElementById('stage'), scene=document.getElementById('scene');
  if(stage){
  stage.addEventListener('pointermove',function(e){var r=stage.getBoundingClientRect();
    scene.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5)*2); scene.style.setProperty('--my',((e.clientY-r.top)/r.height-.5)*2);});
  stage.addEventListener('pointerleave',function(){scene.style.setProperty('--mx',0);scene.style.setProperty('--my',0);});

  // hero: from enforcement to creative. Transit-map lines run in disciplined 45-degree routes from the left,
  // trains travel along them into a camera iris behind the portrait, and leave on the right as warm light trails.
  // Moving the pointer toward the right opens the iris and speeds the trains up.
  var cv=document.getElementById('dust'), cx=cv.getContext('2d'), W=0,H=0,DPR=Math.min(2,window.devicePixelRatio||1);
  var routes=[], mx=0, ease=0;
  function sampleLine(pts){var out=[];for(var i=1;i<pts.length;i++){var a=pts[i-1],b=pts[i],n=Math.max(2,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/6));for(var k=0;k<n;k++){var t=k/n;out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}out.push(pts[pts.length-1]);return out;}
  function sampleCurve(p0,p1,p2,p3){var out=[];for(var i=0;i<=80;i++){var t=i/80,u=1-t;out.push([u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]]);}return out;}
  function build(){
    W=cv.offsetWidth;H=cv.offsetHeight;cv.width=W*DPR;cv.height=H*DPR;cx.setTransform(DPR,0,0,DPR,0,0);
    var X=W/2,Y=H*.56,R=Math.min(W,H)*.2; routes=[];
    var offs=[-.34,-.2,-.07,.07,.2,.34];
    offs.forEach(function(o,i){var dy=o*H, a=W*(.08+.05*(i%3)), d=Math.abs(dy*.55), y2=Y+dy*.45;
      var left=sampleLine([[-30,Y+dy],[a,Y+dy],[a+d,y2],[X-R*1.15,y2]]);
      var right=sampleCurve([X+R*1.15,y2],[X+W*.18,y2+dy*.2],[X+W*.28,Y+dy*1.5],[W+40,Y+dy*1.35+(i%2?40:-40)]);
      var stations=[left[Math.floor(left.length*.18)],left[Math.floor(left.length*.55)]];
      routes.push({left:left,right:right,stations:stations,trains:[{p:Math.random()},{p:Math.random()}],sparks:[]});});
    routes.X=X;routes.Y=Y;routes.R=R;}
  build(); addEventListener('resize',build);
  stage.addEventListener('pointermove',function(e){var r=stage.getBoundingClientRect();mx=(e.clientX-r.left)/r.width;});
  stage.addEventListener('pointerleave',function(){mx=.5;});
  var STEEL='rgba(176,186,198,', WARM=['rgba(194,32,44,','rgba(226,98,43,','rgba(233,164,44,'];
  var spin=0,t0=performance.now();
  function at(arr,f){return arr[Math.max(0,Math.min(arr.length-1,Math.floor(f*(arr.length-1))))];}
  function draw(now){
    var dt=Math.min(50,now-t0);t0=now; ease+=((mx||.5)-ease)*.05;
    cx.clearRect(0,0,W,H); var X=routes.X,Y=routes.Y,R=routes.R;
    // routes: steel on the left, warm gradient on the right
    routes.forEach(function(r,i){
      cx.lineWidth=2;cx.strokeStyle=STEEL+'.22)';cx.lineJoin='round';cx.beginPath();r.left.forEach(function(p,k){k?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]);});cx.stroke();
      r.stations.forEach(function(s){cx.fillStyle='#0b0c0e';cx.strokeStyle=STEEL+'.55)';cx.lineWidth=1.5;cx.beginPath();cx.arc(s[0],s[1],4.5,0,6.283);cx.fill();cx.stroke();});
      var g=cx.createLinearGradient(X+R,0,W,0);g.addColorStop(0,'rgba(194,32,44,.05)');g.addColorStop(.4,WARM[i%3]+'.28)');g.addColorStop(1,'rgba(233,164,44,.02)');
      cx.strokeStyle=g;cx.lineWidth=1.5;cx.beginPath();r.right.forEach(function(p,k){k?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]);});cx.stroke();
    });
    // camera iris behind the portrait
    var open=.35+ease*.5; if(!reduce)spin+=dt*.00012*(1+ease*2);
    cx.save();cx.translate(X,Y);
    cx.strokeStyle='rgba(220,222,228,.16)';cx.lineWidth=1;cx.beginPath();cx.arc(0,0,R*1.15,0,6.283);cx.stroke();
    cx.strokeStyle='rgba(220,222,228,.07)';cx.beginPath();cx.arc(0,0,R*1.32,0,6.283);cx.stroke();
    for(var b=0;b<8;b++){var a=spin+b*Math.PI/4;cx.strokeStyle='rgba(233,164,44,'+(.12+ease*.18).toFixed(3)+')';cx.beginPath();
      cx.moveTo(Math.cos(a)*R*1.12,Math.sin(a)*R*1.12);cx.lineTo(Math.cos(a+1.05)*R*open,Math.sin(a+1.05)*R*open);cx.stroke();}
    cx.restore();
    // trains: steel cars on the left, light trails on the right
    var speed=(.00006+ease*.00009)*dt;
    routes.forEach(function(r,i){
      r.trains.forEach(function(tr){ if(!reduce)tr.p+=speed; if(tr.p>1)tr.p-=1;
        if(tr.p<.5){var f=tr.p/.5,p=at(r.left,f),q=at(r.left,Math.max(0,f-.012)),ang=Math.atan2(p[1]-q[1],p[0]-q[0]);
          cx.save();cx.translate(p[0],p[1]);cx.rotate(ang);cx.fillStyle='rgba(236,238,242,.85)';
          for(var c=0;c<3;c++){cx.beginPath();cx.roundRect?cx.roundRect(-c*15-12,-3.5,12,7,2.5):cx.rect(-c*15-12,-3.5,12,7);cx.fill();}
          cx.restore();}
        else{var f2=(tr.p-.5)/.5, n=26;
          for(var k=n;k>=0;k--){var pt=at(r.right,Math.max(0,f2-k*.006));cx.fillStyle=WARM[i%3]+((1-k/n)*.7).toFixed(3)+')';cx.beginPath();cx.arc(pt[0],pt[1],2.6*(1-k/n)+.6,0,6.283);cx.fill();}
          var hd=at(r.right,f2); if(!reduce&&Math.random()<.18)r.sparks.push({x:hd[0],y:hd[1],vx:(Math.random()-.3)*.6,vy:(Math.random()-.5)*.6,l:1,s:2+Math.random()*5});
          var glow=cx.createRadialGradient(hd[0],hd[1],0,hd[0],hd[1],14);glow.addColorStop(0,'rgba(255,214,150,.9)');glow.addColorStop(1,'rgba(255,170,80,0)');cx.fillStyle=glow;cx.beginPath();cx.arc(hd[0],hd[1],14,0,6.283);cx.fill();}
      });
      r.sparks=r.sparks.filter(function(s){s.x+=s.vx;s.y+=s.vy;s.l-=.008;if(s.l<=0)return false;
        cx.strokeStyle='rgba(233,164,44,'+(s.l*.45).toFixed(3)+')';cx.lineWidth=1;cx.beginPath();cx.arc(s.x,s.y,s.s*(1.6-s.l),0,6.283);cx.stroke();return true;});
    });
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
