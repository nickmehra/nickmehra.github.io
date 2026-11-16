/* Service cards for the grid and the homepage door. Drawn on canvas; no photos. */
/* Service cards: drawn on a canvas, so they stay sharp and need no photos. */
var CARD_ART = {
  'hero':                    {title:'BlackSheep', sub:'From Conviction to Legacy', icon:'none'},
  'real-estate-photography': {title:'Real estate photography', sub:'BlackSheep Digital Works', icon:'house'},
  'video':                   {title:'Video & social reels', sub:'BlackSheep Digital Works', icon:'video'},
  'drone':                   {title:'Drone & aerial', sub:'BlackSheep Digital Works', icon:'drone'},
  'floor-plans':             {title:'Floor plans & 3D', sub:'BlackSheep Digital Works', icon:'plan'},
  'events':                  {title:'Event coverage', sub:'BlackSheep Digital Works', icon:'stage'},
  'dealerships':             {title:'Dealership inventory', sub:'BlackSheep Digital Works', icon:'car'}
};
var CARD_ICONS = {
  house: function(x){ x.beginPath(); x.moveTo(510,380); x.lineTo(600,296); x.lineTo(690,380); x.stroke(); x.strokeRect(534,380,132,92); x.beginPath(); x.arc(600,424,16,0,Math.PI*2); x.stroke(); },
  video: function(x){ x.strokeRect(500,292,200,128); x.beginPath(); x.moveTo(576,320); x.lineTo(576,392); x.lineTo(636,356); x.closePath(); x.fill(); },
  drone: function(x){ x.strokeRect(578,334,44,30); [[500,300],[700,300],[500,392],[700,392]].forEach(function(p){ x.beginPath(); x.moveTo(p[0] < 600 ? 578 : 622, p[1] < 350 ? 334 : 364); x.lineTo(p[0], p[1]); x.stroke(); x.beginPath(); x.arc(p[0],p[1],26,0,Math.PI*2); x.stroke(); }); },
  plan:  function(x){ x.strokeRect(500,292,200,124); x.beginPath(); x.moveTo(600,292); x.lineTo(600,350); x.moveTo(500,350); x.lineTo(600,350); x.moveTo(650,350); x.lineTo(650,416); x.stroke(); },
  stage: function(x){ x.save(); x.globalAlpha = .18; x.beginPath(); x.moveTo(596,300); x.lineTo(506,420); x.lineTo(694,420); x.closePath(); x.fill(); x.restore(); var cx=600, cy=346, r=30, i, a; x.beginPath(); for(i=0;i<10;i++){ a=-Math.PI/2 + i*Math.PI/5; var rr = i%2 ? r*.45 : r; x.lineTo(cx+rr*Math.cos(a), cy+rr*Math.sin(a)); } x.closePath(); x.fill(); },
  car:   function(x){ x.beginPath(); x.moveTo(500,392); x.lineTo(512,344); x.quadraticCurveTo(522,322,548,320); x.lineTo(652,320); x.quadraticCurveTo(678,322,688,344); x.lineTo(700,392); x.closePath(); x.stroke(); x.beginPath(); x.arc(548,392,24,0,Math.PI*2); x.stroke(); x.beginPath(); x.arc(652,392,24,0,Math.PI*2); x.stroke(); },
  none:  function(x){ x.beginPath(); x.moveTo(540,360); x.lineTo(660,360); x.stroke(); }
};
function cardArt(id){
  cardArt.cache = cardArt.cache || {};
  if (cardArt.cache[id]) return cardArt.cache[id];
  var d = CARD_ART[id]; if (!d) return 'img/' + id + '.jpg';
  var c = document.createElement('canvas'); c.width = 1200; c.height = 800;
  var x = c.getContext('2d');
  var g = x.createLinearGradient(0,0,0,800); g.addColorStop(0,'#12244A'); g.addColorStop(1,'#0A1426');
  x.fillStyle = g; x.fillRect(0,0,1200,800);
  var rg = x.createRadialGradient(600,360,40,600,360,560); rg.addColorStop(0,'rgba(196,158,78,0.22)'); rg.addColorStop(1,'rgba(196,158,78,0)');
  x.fillStyle = rg; x.fillRect(0,0,1200,800);
  x.strokeStyle = 'rgba(196,158,78,0.45)'; x.lineWidth = 3; x.strokeRect(56,56,1088,688);
  x.strokeStyle = '#C49E4E'; x.fillStyle = '#C49E4E'; x.lineWidth = 12; x.lineCap = 'round'; x.lineJoin = 'round';
  (CARD_ICONS[d.icon] || CARD_ICONS.none)(x);
  x.textAlign = 'center';
  x.fillStyle = '#F6F0E2'; x.font = '600 66px "EB Garamond", Georgia, serif'; x.fillText(d.title, 600, 560);
  x.fillStyle = '#C49E4E'; x.font = '600 24px Inter, Arial, sans-serif';
  if ('letterSpacing' in x) x.letterSpacing = '6px';
  x.fillText(d.sub.toUpperCase(), 600, 622);
  return cardArt.cache[id] = c.toDataURL('image/jpeg', .92);
}

window.FF_POOL=[['hero','BlackSheep Digital Works, from conviction to legacy','The brand'],['real-estate-photography','Real estate photography','Service'],['video','Video and social reels','Service'],['drone','Drone and aerial','Service'],['floor-plans','Floor plans and 3D','Service'],['events','Event coverage','Service'],['dealerships','Dealership inventory','Service']].filter(function(q){return q[0]!=='hero'});
(function(){var p=window.FF_POOL;for(var i=p.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=p[i];p[i]=p[j];p[j]=t;}
 var g=document.querySelectorAll('[data-ff-grid]');[].forEach.call(g,function(el){var n=+el.getAttribute('data-ff-grid')||12,h='';for(var k=0;k<n&&k<p.length;k++){var q=p[k];h+='<button class="tilt wide" type="button" data-full="'+cardArt(q[0])+'"><img src="'+cardArt(q[0])+'" alt="'+q[1]+'" loading="lazy"></button>';}el.innerHTML=h;});
 var d=document.querySelectorAll('[data-ff-door]');[].forEach.call(d,function(img,k){var q=p[(p.length-1-k)];img.src=cardArt(q[0]);});
})();
