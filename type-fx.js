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

  /* Per-character "trace" layer: a mirror of the field's text sits exactly over it; the field's own text is
     made transparent (caret and selection stay). Newly typed characters grow from their centre, soft and warm,
     then snap into focus. A paste grows in the same way as one unit. */
  var css2 = document.createElement('style');
  css2.textContent =
    '.tfx-ov{position:fixed;pointer-events:none;overflow:hidden;z-index:15;box-sizing:border-box;margin:0;background:none!important;border-color:transparent!important}' +
    '.tfx-ov .in{display:block;will-change:transform}' +
    '.tfx-ov .tfx-c{display:inline-block;white-space:pre;margin:0;padding:0;border:0;background:none;box-shadow:none;max-width:none;animation:tfxBorn .52s cubic-bezier(.16,.84,.3,1) both,tfxSnap .16s .5s cubic-bezier(.3,1.8,.6,1) both}' +
    '.tfx-ov .tfx-u{display:inline-block;white-space:pre-wrap;margin:0;padding:0;border:0;background:none;box-shadow:none;max-width:100%;vertical-align:top;animation:tfxBorn .75s cubic-bezier(.16,.84,.3,1) both,tfxSnap .18s .72s cubic-bezier(.3,1.8,.6,1) both}' +
    '.tfx-ov .tfx-m{display:inline;white-space:pre-wrap;animation:tfxSoft .8s cubic-bezier(.16,.84,.3,1) both}' +
    '@keyframes tfxSoft{0%{filter:blur(3px);opacity:.2;color:#e9a42c;text-shadow:0 0 14px rgba(233,164,44,.9)}75%{filter:blur(.4px);opacity:1;color:#e2622b}100%{filter:none;text-shadow:none}}' +
    '@keyframes tfxBorn{0%{clip-path:circle(0% at 50% 58%);filter:blur(2.4px);color:#e9a42c;text-shadow:0 0 14px rgba(233,164,44,.9);transform:scale(.82)}' +
    '70%{clip-path:circle(62% at 50% 52%);filter:blur(.6px);color:#e2622b;text-shadow:0 0 8px rgba(226,98,43,.55)}' +
    '100%{clip-path:circle(80% at 50% 50%);filter:blur(.3px);transform:scale(.97)}}' +
    '@keyframes tfxSnap{0%{transform:scale(.97);filter:blur(.3px)}55%{transform:scale(1.05)}100%{transform:scale(1);filter:none;text-shadow:none;clip-path:none}}' +
    'input.tfx-live,textarea.tfx-live{color:transparent!important;-webkit-text-fill-color:transparent!important}' +
    'input.tfx-live::placeholder,textarea.tfx-live::placeholder{color:rgba(160,162,170,.75)!important;-webkit-text-fill-color:rgba(160,162,170,.75)!important}' +
    'input.tfx-live::selection,textarea.tfx-live::selection{background:rgba(226,98,43,.35)}';
  if (!reduce) document.head.appendChild(css2);

  var PROPS = ['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','wordSpacing','lineHeight','textTransform','textIndent','textAlign',
    'paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderStyle','boxSizing','tabSize'];
  var live = new Map();
  function ensure(el) {
    if (reduce) return null;
    var st = live.get(el); if (st) return st;
    var ov = document.createElement('div'); ov.className = 'tfx-ov'; ov.setAttribute('aria-hidden', 'true');
    var inner = document.createElement('div'); inner.className = 'in'; ov.appendChild(inner);
    document.body.appendChild(ov);
    st = { ov: ov, inner: inner, prev: el.value };
    live.set(el, st); el.classList.add('tfx-live');
    render(el, st, 0, 0); sync(el, st);
    return st;
  }
  function textColor(el) {
    el.classList.remove('tfx-live'); var c = getComputedStyle(el).color; el.classList.add('tfx-live'); return c;
  }
  function sync(el, st) {
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el), ov = st.ov;
    if (!st.color) st.color = textColor(el);
    PROPS.forEach(function (k) { ov.style[k] = cs[k]; });
    ov.style.color = st.color;
    ov.style.left = r.left + 'px'; ov.style.top = r.top + 'px'; ov.style.width = r.width + 'px'; ov.style.height = r.height + 'px';
    if (el.tagName === 'TEXTAREA') {
      ov.style.whiteSpace = 'pre-wrap'; ov.style.overflowWrap = 'break-word';
      st.inner.style.width = (el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) + 'px';
      st.inner.style.transform = 'translateY(' + (-el.scrollTop) + 'px)';
    } else {
      ov.style.whiteSpace = 'pre'; ov.style.display = 'flex'; ov.style.alignItems = 'center';
      st.inner.style.transform = 'translateX(' + (-el.scrollLeft) + 'px)';
    }
  }
  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function render(el, st, from, count) {
    var v = el.value, html;
    if (count > 0 && count <= 3) {
      html = esc(v.slice(0, from)) + v.slice(from, from + count).split('').map(function (c) {
        return c === '\n' ? '\n' : '<span class="tfx-c">' + esc(c) + '</span>';
      }).join('') + esc(v.slice(from + count));
    } else if (count > 3) {
      var seg = v.slice(from, from + count), cls = /\n/.test(seg) ? 'tfx-m' : 'tfx-u';
      html = esc(v.slice(0, from)) + '<span class="' + cls + '">' + esc(seg) + '</span>' + esc(v.slice(from + count));
    } else html = esc(v);
    if (el.tagName === 'TEXTAREA' && /\n$/.test(v)) html += ' ';
    st.inner.innerHTML = html || '';
  }
  function drop(el) { var st = live.get(el); if (!st) return; st.ov.remove(); live.delete(el); el.classList.remove('tfx-live'); }

  document.addEventListener('focusin', function (e) { if (eligible(e.target)) ensure(e.target); });
  document.addEventListener('focusout', function (e) {
    var el = e.target; if (!live.has(el)) return;
    setTimeout(function () { if (document.activeElement !== el) drop(el); }, 700);
  });
  document.addEventListener('input', function (e) {
    var el = e.target; if (!eligible(el)) return;
    var st = ensure(el); if (!st) return;
    var a = st.prev, b = el.value, p = 0;
    while (p < a.length && p < b.length && a[p] === b[p]) p++;
    var sa = a.length - 1, sb = b.length - 1;
    while (sa >= p && sb >= p && a[sa] === b[sb]) { sa--; sb--; }
    render(el, st, p, sb - p + 1); st.prev = b; sync(el, st);
  }, true);
  ['scroll', 'keyup', 'select', 'click'].forEach(function (t) {
    document.addEventListener(t, function (e) { var st = live.get(e.target); if (st) sync(e.target, st); }, true);
  });
  addEventListener('scroll', function () { live.forEach(function (st, el) { sync(el, st); }); }, { passive: true });
  addEventListener('resize', function () { live.forEach(function (st, el) { sync(el, st); }); });
  (function loop() { live.forEach(function (st, el) { if (!document.contains(el)) drop(el); else sync(el, st); }); requestAnimationFrame(loop); })();
  document.addEventListener('reset', function () { setTimeout(function () { live.forEach(function (st, el) { st.prev = el.value; render(el, st, 0, 0); }); }, 0); }, true);
})();
