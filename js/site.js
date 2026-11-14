(function(){
  var root=document.documentElement, tb=document.getElementById('theme');
  function cur(){var t=root.getAttribute('data-theme'); if(t) return t; return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
  function label(){ if(tb) tb.textContent = cur()==='dark' ? 'Light' : 'Dark'; }
  var s=null; try{s=localStorage.getItem('nm-theme');}catch(e){}
  if(s) root.setAttribute('data-theme',s); else if(!root.getAttribute('data-theme')) root.setAttribute('data-theme','dark');
  label();
  if(tb) tb.addEventListener('click',function(){var n=cur()==='dark'?'light':'dark'; root.setAttribute('data-theme',n); try{localStorage.setItem('nm-theme',n);}catch(e){} label();});
})();
