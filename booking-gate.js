/* Booking gate: before the booking form opens, a quiet "I'm human" check (the browser solves a small puzzle by
   itself, no pictures to click) and a one-time code sent to your email. Usage: <div class="bk-gate" data-form="formId"
   data-email="emailInputId"></div> placed above the form. The form stays locked until both steps are done. */
(function () {
  var API = '/auth.php';
  var css = document.createElement('style');
  css.textContent =
    '.bk-gate{border:1px solid var(--line,rgba(127,127,127,.3));padding:20px 18px;margin:0 0 18px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center}' +
    '.bk-gate h3{margin:0;font-family:var(--display,serif);font-size:1rem;letter-spacing:.14em;text-transform:uppercase}' +
    '.bk-gate p{margin:0;font-size:.95rem;color:var(--muted,#888);max-width:560px}' +
    '.bk-gate .hb{display:inline-flex;align-items:center;gap:12px;border:1px solid var(--line,rgba(127,127,127,.3));padding:12px 16px;cursor:pointer;font-size:1.02rem;user-select:none;background:var(--field,transparent)}' +
    '.bk-gate .hb i{width:22px;height:22px;border:1.5px solid currentColor;display:inline-grid;place-items:center;font-style:normal;font-size:15px}' +
    '.bk-gate .hb.busy i{border-style:dashed;animation:bkspin 1s linear infinite}.bk-gate .hb.ok i{background:#B3121B;border-color:#B3121B;color:#fff}' +
    '@keyframes bkspin{to{transform:rotate(360deg)}}' +
    '.bk-gate .row2{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;width:100%;max-width:520px}' +
    '.bk-gate .row2 input{flex:1 1 220px;min-width:0}' +
    '.bk-gate .done{font-size:1rem}.bk-gate .done b{color:var(--fg,inherit)}' +
    '.bk-gate .err{color:#c2202c;font-size:.95rem}' +
    '.bk-locked{opacity:.38;pointer-events:none;filter:grayscale(.4);transition:opacity .4s}';
  document.head.appendChild(css);

  async function sha(s) { var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  async function solve(c) { for (var n = 0; n <= c.maxnumber; n++) { if ((await sha(c.salt + n)) === c.challenge) return n; if (n % 2000 === 0) await new Promise(function (r) { setTimeout(r, 0); }); } return -1; }
  function post(d) { return fetch(API, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); }); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  document.querySelectorAll('.bk-gate').forEach(function (g) {
    var form = document.getElementById(g.getAttribute('data-form')), emailIn = document.getElementById(g.getAttribute('data-email')), pow = null;
    function lock(on) { if (!form) return; form.classList.toggle('bk-locked', on); form.setAttribute('aria-disabled', on ? 'true' : 'false'); [].forEach.call(form.querySelectorAll('input,select,textarea,button'), function (x) { x.disabled = on || x.hasAttribute('data-keep-disabled'); }); }
    function verified(email) {
      g.innerHTML = '<p class="done">Email verified: <b>' + esc(email) + '</b>. <a class="lk" href="#" data-x>Use a different email</a></p>';
      if (emailIn) { emailIn.value = email; emailIn.readOnly = true; }
      window.bsVerifiedEmail = email; lock(false);
      g.querySelector('[data-x]').addEventListener('click', function (e) { e.preventDefault(); post({ action: 'forget' }).then(function () { if (emailIn) { emailIn.readOnly = false; emailIn.value = ''; } window.bsVerifiedEmail = ''; start(); }); });
      g.dispatchEvent(new CustomEvent('bk-verified', { bubbles: true, detail: { email: email } }));
    }
    function start() {
      lock(true); pow = null;
      g.innerHTML = '<h3>Before you book</h3>' +
        '<p>To keep fake bookings out, booking requests need two quick steps: confirm you\'re human, then enter the 6-digit code we email you. Your email is used for this booking and, only if you tick the box below, our Monday update. See our <a class="lk" href="/privacy/">privacy page</a>.</p>' +
        '<label class="hb" role="checkbox" aria-checked="false" tabindex="0"><i aria-hidden="true"></i><span>I\'m human</span></label>' +
        '<div class="row2" data-step="email" hidden><input type="email" autocomplete="email" placeholder="you@example.com" aria-label="Your email"><button type="button" class="btn primary lk">Email me a code</button></div>' +
        '<div class="row2" data-step="code" hidden><input inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6-digit code" aria-label="Code from your email"><button type="button" class="btn primary lk">Verify</button></div>' +
        '<p class="err" role="alert" hidden></p>';
      var hb = g.querySelector('.hb'), stE = g.querySelector('[data-step=email]'), stC = g.querySelector('[data-step=code]'), err = g.querySelector('.err');
      function fail(m) { err.textContent = m; err.hidden = false; }
      function human() {
        if (hb.classList.contains('busy') || hb.classList.contains('ok')) return;
        hb.classList.add('busy'); hb.querySelector('span').textContent = 'Checking…'; err.hidden = true;
        fetch(API + '?challenge', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(async function (c) {
          var n = await solve(c); if (n < 0) throw 0;
          pow = { salt: c.salt, challenge: c.challenge, signature: c.signature, number: String(n) };
          hb.classList.remove('busy'); hb.classList.add('ok'); hb.setAttribute('aria-checked', 'true'); hb.querySelector('i').textContent = '✓'; hb.querySelector('span').textContent = 'Human, confirmed';
          stE.hidden = false; var ei = stE.querySelector('input'); if (emailIn && emailIn.value) ei.value = emailIn.value; ei.focus();
        }).catch(function () { hb.classList.remove('busy'); hb.querySelector('span').textContent = 'I\'m human'; fail('That didn\'t work. Please tick the box again.'); });
      }
      hb.addEventListener('click', human); hb.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); human(); } });
      var em = '';
      stE.querySelector('button').addEventListener('click', function () {
        em = stE.querySelector('input').value.trim(); err.hidden = true;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return fail('Please enter a valid email address.');
        var b = this; b.disabled = true; b.textContent = 'Sending…';
        post({ action: 'send', email: em, pow: pow }).then(function (r) {
          b.disabled = false; b.textContent = 'Email me a code';
          if (!r.ok) return fail(r.j.error || 'Could not send the code.');
          stC.hidden = false; b.textContent = 'Send again'; stC.querySelector('input').focus();
        }).catch(function () { b.disabled = false; b.textContent = 'Email me a code'; fail('Could not reach the server. Please try again.'); });
      });
      function check() {
        var code = stC.querySelector('input').value.replace(/\D/g, ''); err.hidden = true;
        if (code.length !== 6) return fail('Enter the 6-digit code from your email.');
        post({ action: 'verify', email: em, code: code }).then(function (r) { if (!r.ok) return fail(r.j.error || 'That code didn\'t work.'); verified(r.j.email); });
      }
      stC.querySelector('button').addEventListener('click', check);
      stC.querySelector('input').addEventListener('input', function () { if (this.value.replace(/\D/g, '').length === 6) check(); });
    }
    lock(true);
    fetch(API + '?me', { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { if (d && d.email) verified(d.email); else start(); }).catch(start);
  });
})();
