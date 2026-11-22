/* Journal Series section: renders approved episodes from /series/episodes.json.
   Nothing is loaded from YouTube until the visitor presses play. */
(function(){
  var root=document.getElementById('series-grid'); if(!root) return;
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function soon(){
    root.innerHTML='<article class="ep soon"><div class="ep-media"><span class="ep-tag">Episode 1</span><span class="ep-soon">Premieres soon</span></div><div class="ep-body"><h3>The first page</h3><p>Subscribe on YouTube to see it the day it goes live.</p></div></article>';
  }
  fetch('/series/episodes.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){
    var eps=(d&&d.episodes||[]).filter(function(e){return e.approved});
    if(!eps.length){soon();return}
    root.innerHTML=eps.map(function(e){
      return '<article class="ep"><button class="ep-media" type="button" data-yt="'+esc(e.youtube_id)+'" aria-label="Play '+esc(e.title)+'">'+
        '<img src="'+esc(e.thumb)+'" alt="" loading="lazy" width="1280" height="720"><span class="ep-play" aria-hidden="true"></span>'+
        (e.length?'<span class="ep-len">'+esc(e.length)+'</span>':'')+'</button>'+
        '<div class="ep-body"><span class="ep-tag">'+esc(e.label)+'</span><h3>'+esc(e.title)+'</h3><p>'+esc(e.blurb||'')+'</p></div></article>';
    }).join('');
    root.addEventListener('click',function(ev){
      var b=ev.target.closest('[data-yt]'); if(!b) return;
      var f=document.createElement('iframe');
      f.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(b.getAttribute('data-yt'))+'?autoplay=1&rel=0&modestbranding=1';
      f.title=b.getAttribute('aria-label'); f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen=true;
      f.className='ep-frame'; b.replaceWith(f);
    });
  }).catch(soon);
})();
