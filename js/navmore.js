/* Priority navigation: links that don't fit in the header move into a "More" dropdown. */
(function () {
  var nav = document.querySelector('header nav, .nav .links');
  if (!nav) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll(':scope > a'));
  var wrap = document.createElement('div'); wrap.className = 'nm-more'; wrap.hidden = true;
  var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'nm-more-btn';
  btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = 'More <span aria-hidden="true">&#9662;</span>';
  var menu = document.createElement('div'); menu.className = 'nm-more-menu'; menu.setAttribute('role', 'menu');
  wrap.appendChild(btn); wrap.appendChild(menu); nav.appendChild(wrap);
  function close() { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', function (e) { e.stopPropagation(); var o = !wrap.classList.contains('open'); wrap.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); });
  document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); btn.focus(); } });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  function fit() {
    close();
    links.forEach(function (a) { nav.insertBefore(a, wrap); });
    wrap.hidden = true;
    if (nav.scrollWidth <= nav.clientWidth + 1) return;
    wrap.hidden = false;
    for (var i = links.length - 1; i > 0 && nav.scrollWidth > nav.clientWidth + 1; i--) menu.insertBefore(links[i], menu.firstChild);
    if (!menu.children.length) wrap.hidden = true;
    var cur = menu.querySelector('[aria-current="page"]'); btn.classList.toggle('has-current', !!cur);
  }
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 80); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('load', fit); fit();
})();
