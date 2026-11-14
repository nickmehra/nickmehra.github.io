(function(){
  'use strict';
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function money(n){ return '$' + Number(n || 0).toLocaleString('en-CA', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
  var list = []; try { list = JSON.parse(localStorage.getItem('bsQuotes') || '[]'); } catch(e){}
  var box = $('hist');
  if (!list.length){ $('none').hidden = false; return; }
  $('clr').hidden = false;
  box.innerHTML = list.map(function(q){
    var exp = q.validUntilTs && Date.now() > q.validUntilTs * 1000;
    return '<div class="qi"><div><b>' + esc(q.number) + '</b> <span class="chip' + (exp ? ' x' : '') + '">' + (exp ? 'Expired' : 'Valid until ' + esc(q.validUntil)) + '</span>'
      + '<div class="sub">' + ({auto: 'Dealership', ev: 'Event'}[q.segment] || 'Real estate') + (q.date ? ' · ' + esc(q.date) : '') + (q.slot ? ' · ' + esc(q.slot) : '') + ' · ' + money(q.total) + ' incl. HST</div></div>'
      + '<div class="acts"><a class="btn lk" href="' + esc(q.pdf) + '">PDF</a>' + (exp ? '' : '<a class="btn primary lk" href="' + esc(q.approve) + '">Review &amp; approve</a>') + '</div></div>';
  }).join('');
  $('clr').addEventListener('click', function(){ try { localStorage.removeItem('bsQuotes'); } catch(e){} box.innerHTML = ''; $('clr').hidden = true; $('none').hidden = false; });
})();
