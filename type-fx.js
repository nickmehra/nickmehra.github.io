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
    'input.tfx:hover:not(:focus),textarea.tfx:hover:not(:focus){box-shadow:0 0 0 1px rgba(226,98,43,.35),0 10px 28px -16px rgba(226,98,43,.5)}' +
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
  document.addEventListener('focusin', function (e) { if (eligible(e.target)) { e.target.classList.add('tfx'); fill(e.target); } }, true);
  document.addEventListener('input', function (e) {
    var el = e.target; if (!eligible(el)) return;
    el.classList.add('tfx'); fill(el);
    if (reduce) return;
    el.classList.add('tfx-hit'); clearTimeout(t1.get(el));
    t1.set(el, setTimeout(function () { el.classList.remove('tfx-hit'); }, 700));
  }, true);

  /* Per-character "trace" layer: a mirror of the field's text sits exactly over it; the field's own text is
     made transparent (caret and selection stay). Newly typed characters grow from their centre, soft and warm,
     then snap into focus. A paste grows in the same way as one unit. */
  var css2 = document.createElement('style');
  css2.textContent =
    '.tfx-ov{position:fixed;pointer-events:none;overflow:hidden;z-index:15;box-sizing:border-box;margin:0;background:none!important;border-color:transparent!important}' +
    '.tfx-ov .in{display:block;will-change:transform}' +
    '.tfx-ov .tfx-c{display:inline-block;white-space:pre;margin:0;padding:0;border:0;background:none;box-shadow:none;max-width:none;animation:tfxBorn .26s cubic-bezier(.2,.8,.3,1) both,tfxSnap .12s .24s cubic-bezier(.3,1.6,.6,1) both}' +
    '.tfx-ov .tfx-u{display:inline-block;white-space:pre-wrap;margin:0;padding:0;border:0;background:none;box-shadow:none;max-width:100%;vertical-align:top;animation:tfxBorn .36s cubic-bezier(.2,.8,.3,1) both,tfxSnap .12s .34s cubic-bezier(.3,1.6,.6,1) both}' +
    '.tfx-ov .tfx-m{display:inline;white-space:pre-wrap;animation:tfxSoft .4s cubic-bezier(.2,.8,.3,1) both}' +
    '@keyframes tfxSoft{0%{filter:blur(1.5px);opacity:.45;color:#e9a42c;text-shadow:0 0 14px rgba(233,164,44,.9)}75%{filter:blur(.4px);opacity:1;color:#e2622b}100%{filter:none;text-shadow:none}}' +
    '@keyframes tfxBorn{0%{clip-path:circle(28% at 50% 55%);filter:blur(1.2px);color:#e9a42c;text-shadow:0 0 14px rgba(233,164,44,.9);transform:scale(.82)}' +
    '70%{clip-path:circle(62% at 50% 52%);filter:blur(.6px);color:#e2622b;text-shadow:0 0 8px rgba(226,98,43,.55)}' +
    '100%{clip-path:circle(80% at 50% 50%);filter:blur(.3px);transform:scale(.97)}}' +
    '@keyframes tfxSnap{0%{transform:scale(.97);filter:blur(.3px)}55%{transform:scale(1.05)}100%{transform:scale(1);filter:none;text-shadow:none;clip-path:none}}' +
    'input.tfx-live,textarea.tfx-live{-webkit-text-fill-color:transparent!important}' +
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
    st = { ov: ov, inner: inner, prev: el.value, color: textColor(el) };
    live.set(el, st); el.classList.add('tfx-live');
    render(el, st, 0, 0); sync(el, st);
    return st;
  }
  /* Text colour steps through the brand gradient across a form's fields in order (dark red -> orange -> amber).
     On light backgrounds a deeper version of the same gradient keeps it readable. */
  var DARK_BG = [[224, 64, 72], [240, 122, 58], [247, 189, 74]], LIGHT_BG = [[154, 18, 25], [176, 64, 20], [150, 92, 0]];
  function lum(c) { var m = (c || '').match(/\d+(\.\d+)?/g); if (!m || (m.length > 3 && +m[3] === 0)) return null; return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; }
  function bgLum(el) { for (var n = el; n && n.nodeType === 1; n = n.parentElement) { var l = lum(getComputedStyle(n).backgroundColor); if (l !== null) return l; } return 0; }
  function mix(a, b, t) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }); }
  function textColor(el) {
    var scope = el.form || el.closest('form, section, main') || document;
    var list = [].filter.call(scope.querySelectorAll('input, textarea'), eligible);
    var i = Math.max(0, list.indexOf(el)), n = list.length, t = n > 1 ? i / (n - 1) : 0;
    var P = bgLum(el) > 0.55 ? LIGHT_BG : DARK_BG;
    var c = t <= .5 ? mix(P[0], P[1], t * 2) : mix(P[1], P[2], (t - .5) * 2);
    var col = 'rgb(' + c.join(',') + ')';
    el.style.setProperty('color', col, 'important'); el.style.setProperty('-webkit-text-fill-color', col);
    return col;
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

  document.addEventListener('focusin', function (e) { if (eligible(e.target)) { textColor(e.target); ensure(e.target); } }, true);
  document.addEventListener('focusout', function (e) {
    var el = e.target; if (!live.has(el)) return;
    setTimeout(function () { if (document.activeElement !== el) drop(el); }, 700);
  }, true);
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
  /* Custom caret: a fine vertical bar in the brand gradient with a soft glow. It breathes slowly instead of
     blinking hard, holds solid while typing, and each keystroke gives a small visual "tap": the caret flares
     and a faint ring of light opens from it, matching the haptic tick. */
  var css4 = document.createElement('style');
  css4.textContent =
    'input.tfx-cc,textarea.tfx-cc{caret-color:transparent!important}' +
    '.tfx-caret{position:fixed;z-index:2147483000;width:2px;pointer-events:none;border-radius:2px;display:none;' +
    'background:linear-gradient(180deg,#e9a42c,#e2622b 50%,#c2202c);box-shadow:0 0 6px rgba(226,98,43,.75),0 0 14px rgba(233,164,44,.35);' +
    'animation:tfxBreathe 1.25s ease-in-out infinite;transform-origin:50% 50%}' +
    '.tfx-caret.typing{animation:none;opacity:1}' +
    '.tfx-caret.flare{animation:tfxFlare .32s cubic-bezier(.2,.8,.3,1)}' +
    '@keyframes tfxBreathe{0%,100%{opacity:1}50%{opacity:.12}}' +
    '@keyframes tfxFlare{0%{transform:scaleY(1.35);box-shadow:0 0 10px rgba(233,164,44,1),0 0 26px rgba(226,98,43,.8)}100%{transform:scaleY(1)}}' +
    '.tfx-ring{position:fixed;z-index:2147482999;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;pointer-events:none;' +
    'border:1px solid rgba(233,164,44,.8);box-shadow:0 0 10px rgba(226,98,43,.45),inset 0 0 6px rgba(233,164,44,.3);animation:tfxRing .5s cubic-bezier(.2,.75,.3,1) forwards}' +
    '@keyframes tfxRing{0%{transform:scale(.25);opacity:.9}100%{transform:scale(1.5);opacity:0}}';
  if (!reduce) document.head.appendChild(css4);
  var caret = null, typingT = 0;
  function caretEl() {
    if (!caret) { caret = document.createElement('div'); caret.className = 'tfx-caret'; caret.setAttribute('aria-hidden', 'true'); document.body.appendChild(caret); }
    return caret;
  }
  function caretPos(el, st) {
    var off; try { off = el.selectionStart; if (off == null || el.selectionEnd !== off) return null; } catch (x) { return null; }
    var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize) || 16, h = fs * 1.25;
    var walker = document.createTreeWalker(st.inner, NodeFilter.SHOW_TEXT), node, left = off, r = null;
    while ((node = walker.nextNode())) {
      if (left <= node.length) {
        var rg = document.createRange();
        if (left > 0) { rg.setStart(node, left - 1); rg.setEnd(node, left); var rr = rg.getClientRects(); var b = rr[rr.length - 1];
          if (b && node.data[left - 1] !== '\n') r = { x: b.right, y: b.top + b.height / 2 }; }
        if (!r) { rg.setStart(node, left); rg.setEnd(node, Math.min(node.length, left + 1)); var b2 = rg.getClientRects()[0];
          if (b2) r = { x: b2.left, y: b2.top + b2.height / 2 }; }
        break;
      }
      left -= node.length;
    }
    if (!r) {
      var o = el.getBoundingClientRect();
      var x = o.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft) + (parseFloat(cs.textIndent) || 0);
      var y = el.tagName === 'TEXTAREA' ? o.top + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop) + (parseFloat(cs.lineHeight) || h) / 2 : o.top + o.height / 2;
      r = { x: x, y: y };
    }
    var o2 = el.getBoundingClientRect();
    if (r.x < o2.left - 1 || r.x > o2.right + 1 || r.y < o2.top || r.y > o2.bottom) return null;
    r.h = h; return r;
  }
  function placeCaret() {
    var el = document.activeElement, st = el && live.get(el), c = caret;
    if (!st) { if (c) c.style.display = 'none'; return; }
    var p = caretPos(el, st);
    if (!p) { if (c) c.style.display = 'none'; el.classList.remove('tfx-cc'); return; }
    c = caretEl(); el.classList.add('tfx-cc');
    c.style.display = 'block'; c.style.left = (p.x - 1) + 'px'; c.style.top = (p.y - p.h / 2) + 'px'; c.style.height = p.h + 'px';
    return p;
  }
  function tap(el) {
    var st = live.get(el); if (!st) return;
    sync(el, st); var p = placeCaret(); if (!p) return;
    caret.classList.add('typing'); caret.classList.remove('flare'); void caret.offsetWidth; caret.classList.add('flare');
    clearTimeout(typingT); typingT = setTimeout(function () { caret.classList.remove('typing', 'flare'); }, 650);
    var ring = document.createElement('div'); ring.className = 'tfx-ring'; ring.setAttribute('aria-hidden', 'true');
    ring.style.left = p.x + 'px'; ring.style.top = p.y + 'px'; document.body.appendChild(ring);
    setTimeout(function () { ring.remove(); }, 560);
  }
  if (!reduce) document.addEventListener('input', function (e) { if (eligible(e.target)) tap(e.target); }, true);
  document.addEventListener('focusout', function (e) { e.target.classList && e.target.classList.remove('tfx-cc'); if (caret) caret.style.display = 'none'; }, true);
  (function loop() { live.forEach(function (st, el) { if (!document.contains(el)) drop(el); else sync(el, st); }); if (!reduce) placeCaret(); requestAnimationFrame(loop); })();
  document.addEventListener('reset', function () { setTimeout(function () { live.forEach(function (st, el) { st.prev = el.value; render(el, st, 0, 0); }); }, 0); }, true);

  /* Cinematic opening glow for the box around any form (same as the journal comment box): the frame warms
     from dark to a faint edge, a soft line of light sweeps once across the top, then the full glow blooms in. */
  var css3 = document.createElement('style');
  css3.textContent =
    '.tfx-frame{transition:border-color 1.2s ease,box-shadow 1.2s ease}' +
    '.tfx-frame:hover,.tfx-frame:focus-within{animation:tfxOpen 2.2s cubic-bezier(.22,.61,.36,1) both}' +
    '.tfx-sweep{position:absolute;left:0;right:0;top:0;height:1px;pointer-events:none;opacity:0;z-index:3;border-radius:inherit;' +
    'background:linear-gradient(90deg,transparent,rgba(255,214,150,.95),transparent) no-repeat;background-size:40% 1px;background-position:-60% 0}' +
    '.tfx-frame:hover>.tfx-sweep,.tfx-frame:focus-within>.tfx-sweep{animation:tfxSweep 1.6s .35s cubic-bezier(.45,.05,.25,1) both}' +
    '@keyframes tfxOpen{0%{box-shadow:0 0 0 0 rgba(226,98,43,0),0 0 0 0 rgba(226,98,43,0)}' +
    '30%{box-shadow:0 0 0 1px rgba(233,164,44,.22),0 0 0 0 rgba(226,98,43,0)}' +
    '100%{box-shadow:0 0 0 1px rgba(226,98,43,.55),0 0 0 5px rgba(226,98,43,.07),0 24px 50px -24px rgba(226,98,43,.6)}}' +
    '@keyframes tfxSweep{0%{opacity:0;background-position:-60% 0}25%{opacity:1}100%{opacity:0;background-position:160% 0}}' +
    '@media (prefers-reduced-motion:reduce){.tfx-frame:hover,.tfx-frame:focus-within,.tfx-frame:hover>.tfx-sweep,.tfx-frame:focus-within>.tfx-sweep{animation:none}.tfx-frame:focus-within{box-shadow:0 0 0 1px rgba(226,98,43,.55)}}';
  document.head.appendChild(css3);
  function frameFor(el) {
    if (el.closest('.cm')) return null; /* the journal comment box has its own version */
    return el.closest('.formcard') || el.closest('form') || el.parentElement;
  }
  function arm(el) {
    if (!eligible(el)) return;
    el.classList.add('tfx');
    var f = frameFor(el); if (!f || f.classList.contains('tfx-frame')) return;
    if (getComputedStyle(f).position === 'static') f.style.position = 'relative';
    f.classList.add('tfx-frame');
    var sw = document.createElement('span'); sw.className = 'tfx-sweep'; sw.setAttribute('aria-hidden', 'true'); f.insertBefore(sw, f.firstChild);
  }
  function armAll() { [].forEach.call(document.querySelectorAll('input, textarea'), arm); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', armAll); else armAll();
  document.addEventListener('focusin', function (e) { arm(e.target); }, true);
  document.addEventListener('pointerover', function (e) { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') arm(e.target); }, true);

  /* A light tap of haptic feedback on each keystroke. Android browsers use the vibration API; iPhones
     (Safari 18+) don't offer it, so a hidden system switch is toggled instead, which gives the native tick. */
  var lastBuzz = 0, sw2 = null;
  function iosTick() {
    if (!sw2) {
      var lab = document.createElement('label'); lab.setAttribute('aria-hidden', 'true');
      lab.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.setAttribute('switch', ''); cb.tabIndex = -1;
      lab.appendChild(cb); document.body.appendChild(lab); sw2 = lab;
    }
    var a = document.activeElement; sw2.click();
    if (a && document.activeElement !== a && a.focus) a.focus({ preventScroll: true });
  }
  var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  document.addEventListener('input', function (e) {
    if (!eligible(e.target)) return;
    var now = Date.now(); if (now - lastBuzz < 35) return; lastBuzz = now;
    try { if (navigator.vibrate) navigator.vibrate(7); else if (IOS) iosTick(); } catch (x) {}
  }, true);
})();
