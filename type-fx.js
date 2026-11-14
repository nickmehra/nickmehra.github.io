/* Restrained typing effect for every text field: typed text in the site's italic serif, a hairline
   red -> orange -> amber underline that draws across as the field fills, and a soft warm glow that
   eases in while typing and fades slowly after. Respects reduced-motion. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAL = ['194,32,44', '226,98,43', '233,164,44'];
  var root = getComputedStyle(document.documentElement);
  var disp = (root.getPropertyValue('--display') || '').trim(), body = (root.getPropertyValue('--body') || '').trim();
  var FONT = /Bodoni/i.test(disp) ? disp : (/Garamond/i.test(body) ? body : (disp || body || 'Georgia, serif'));

  var css = document.createElement('style');
  css.textContent =
    'input.tfx,textarea.tfx{font-family:' + FONT + '!important;font-style:italic;font-size:1.06em;letter-spacing:.01em;caret-color:#e2622b;' +
    'background-image:linear-gradient(90deg,#c2202c,#e2622b 55%,#e9a42c)!important;background-repeat:no-repeat!important;background-position:0 100%!important;' +
    'background-size:var(--tfx-fill,0%) 1px!important;transition:background-size .9s cubic-bezier(.22,.61,.36,1),box-shadow 1.2s ease,border-color 1.2s ease}' +
    'input.tfx::placeholder,textarea.tfx::placeholder{font-style:normal}' +
    'input.tfx:focus,textarea.tfx:focus{box-shadow:0 0 0 3px rgba(226,98,43,.14)}' +
    '.tfx.tfx-hit{border-color:rgba(226,160,90,.55)!important;box-shadow:0 0 0 1px rgba(226,160,90,.18),0 14px 34px -18px rgba(226,140,70,.55)!important;' +
    'transition:background-size .9s cubic-bezier(.22,.61,.36,1),box-shadow .25s ease,border-color .25s ease}' +
    '@media (prefers-reduced-motion:reduce){.tfx,.tfx.tfx-hit,.tfx{transition:none!important}}';
  document.head.appendChild(css);

  function eligible(el) {
    if (!el || el.closest && el.closest('.hp')) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName !== 'INPUT') return false;
    return ['text', 'email', 'tel', 'search', 'url', 'number'].indexOf((el.type || 'text').toLowerCase()) > -1;
  }
  function fill(el) {
    var max = el.maxLength > 0 ? el.maxLength : (el.tagName === 'TEXTAREA' ? 600 : 40);
    var f = Math.min(100, Math.round(el.value.length / max * 100));
    el.style.setProperty('--tfx-fill', (el.value.length ? Math.max(8, f) : 0) + '%');
  }
  var n = 0, t1 = new WeakMap(), t2 = new WeakMap();
  document.addEventListener('focusin', function (e) { if (eligible(e.target)) { e.target.classList.add('tfx'); fill(e.target); } });
  document.addEventListener('input', function (e) {
    var el = e.target; if (!eligible(el)) return;
    el.classList.add('tfx'); fill(el);
    if (reduce) return;
    el.classList.add('tfx-hit'); clearTimeout(t1.get(el));
    t1.set(el, setTimeout(function () { el.classList.remove('tfx-hit'); }, 700));
  });
})();
