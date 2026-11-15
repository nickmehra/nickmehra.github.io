/* Referral code field: checks the code with the server and turns on the 15% discount in the live estimate.
   Usage: <input id="x" data-refcode> ; listens and calls window.bsRefChanged(pct, partner) */
(function () {
  document.querySelectorAll('input[data-refcode]').forEach(function (inp) {
    var note = document.createElement('small'); note.className = 'refnote'; note.style.cssText = 'display:block;margin-top:6px;font-size:.92rem';
    inp.insertAdjacentElement('afterend', note);
    var t = 0, last = '';
    function check() {
      var c = inp.value.trim().toUpperCase(); if (c === last) return; last = c;
      if (!c) { note.textContent = ''; window.bsRefChanged && window.bsRefChanged(0, ''); return; }
      fetch('/ref-check.php?code=' + encodeURIComponent(c), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.ok) { note.textContent = '✓ Referral code from ' + d.partner + ': ' + d.pct + '% off applied.'; window.bsRefChanged && window.bsRefChanged(d.pct, d.partner); }
        else { note.textContent = 'That referral code isn\'t recognised. Check it with the person who referred you.'; window.bsRefChanged && window.bsRefChanged(0, ''); }
      }).catch(function () { note.textContent = ''; });
    }
    inp.addEventListener('input', function () { clearTimeout(t); t = setTimeout(check, 600); });
    inp.addEventListener('blur', check);
  });
})();
