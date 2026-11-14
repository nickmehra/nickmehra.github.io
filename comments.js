/* Journal comments: renders approved comments and a form under each journal entry.
   Containers: any [data-comments="<post id>"], plus every article.entry with an id on the personal journal. */
(function () {
  var API = '/comments.php';
  var css = document.createElement('style');
  css.textContent =
    '.cm{width:100%;max-width:680px;margin:34px auto 10px;text-align:left;border-top:1px solid rgba(127,127,127,.28);padding-top:24px}' +
    '.cm h3{font-size:.8rem;letter-spacing:.24em;text-transform:uppercase;margin:0 0 14px;opacity:.75;font-weight:600}' +
    '.cm .cmi{margin:0 0 16px}.cm .cmi b{font-weight:600}.cm .cmi time{opacity:.6;font-size:.85em;margin-left:8px}.cm .cmi p{margin:4px 0 0;white-space:pre-wrap;line-height:1.6}' +
    '.cm form{display:grid;gap:10px;margin-top:18px}.cm input,.cm textarea{font:inherit;font-size:.95rem;color:inherit;background:rgba(127,127,127,.08);border:1px solid rgba(127,127,127,.3);border-radius:10px;padding:11px 13px}' +
    '.cm textarea{min-height:110px;resize:vertical}.cm input:focus,.cm textarea:focus{outline:2px solid #e2622b;outline-offset:1px}' +
    '.cm .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}' +
    '.cm button{justify-self:start;font:600 .78rem/1 inherit;letter-spacing:.18em;text-transform:uppercase;padding:13px 22px;border-radius:999px;border:0;background:#c2202c;color:#fff;cursor:pointer}' +
    '.cm button:disabled{opacity:.6;cursor:default}.cm .st{font-size:.9rem;opacity:.85;margin:0;min-height:1.4em}.cm .empty{opacity:.6;margin:0 0 6px}' +
    '.cm form{position:relative;padding:18px;border-radius:16px;border:1px solid rgba(127,127,127,.22);background:rgba(127,127,127,.04);transition:border-color .35s,box-shadow .35s,transform .35s}' +
    '.cm form:focus-within{border-color:rgba(226,98,43,.6);box-shadow:0 18px 40px -22px rgba(226,98,43,.55),0 0 0 4px rgba(226,98,43,.08);transform:translateY(-2px)}' +
    '.cm input,.cm textarea{transition:border-color .25s,background .25s}.cm input:hover,.cm textarea:hover{border-color:rgba(127,127,127,.55)}' +
    '.cm textarea{overflow:hidden;transition:height .15s ease,border-color .25s,background .25s}' +
    '.cm .row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}' +
    '.cm .cnt{font-size:.78rem;opacity:.55;font-variant-numeric:tabular-nums;transition:color .2s,opacity .2s}.cm .cnt.warn{color:#e9a42c;opacity:1}' +
    '.cm button{background:linear-gradient(100deg,#c2202c,#e2622b 55%,#e9a42c);background-size:180% 100%;background-position:0 0;transition:transform .25s cubic-bezier(.2,.9,.25,1.3),box-shadow .25s,background-position .5s}' +
    '.cm button:hover:not(:disabled){transform:translateY(-2px) scale(1.03);box-shadow:0 12px 24px -10px rgba(226,98,43,.7);background-position:100% 0}' +
    '.cm button:active:not(:disabled){transform:translateY(0) scale(.98)}' +
    '.cm .done{display:inline-flex;align-items:center;gap:8px}.cm .done svg{width:18px;height:18px;stroke:#e9a42c;fill:none;stroke-width:2.4;stroke-dasharray:30;stroke-dashoffset:30;animation:cmck .6s .1s ease forwards}' +
    '@keyframes cmck{to{stroke-dashoffset:0}}' +
    '.cm .cmi{opacity:0;transform:translateY(8px);animation:cmin .5s ease forwards;padding:12px 14px;border-radius:12px;transition:background .25s}.cm .cmi:hover{background:rgba(127,127,127,.06)}' +
    '@keyframes cmin{to{opacity:1;transform:none}}' +
    '.cm .av{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;margin-right:10px;font-size:.8rem;font-weight:700;color:#150a05;background:linear-gradient(135deg,#e2622b,#e9a42c);vertical-align:middle}' +
    '@media (prefers-reduced-motion:reduce){.cm *,.cm form{animation:none!important;transition:none!important;transform:none!important;opacity:1!important}}';
  document.head.appendChild(css);

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function when(t) { try { return new Date(t * 1000).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }

  function mount(box, post) {
    box.classList.add('cm');
    box.innerHTML = '<h3>Comments</h3><div class="list"><p class="empty">Loading…</p></div>' +
      '<form novalidate><input name="name" maxlength="60" placeholder="Your name" required aria-label="Your name">' +
      '<textarea name="message" maxlength="2000" placeholder="Leave a comment" required aria-label="Comment"></textarea>' +
      '<div class="hp" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div>' +
      '<div class="row"><button type="submit">Post comment</button><span class="cnt">0 / 2000</span></div><p class="st" role="status" aria-live="polite"></p></form>';
    var list = box.querySelector('.list'), form = box.querySelector('form'), st = box.querySelector('.st'), btn = box.querySelector('button');
    fetch(API + '?post=' + encodeURIComponent(post), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var c = (d && d.comments) || [];
      list.innerHTML = c.length ? c.map(function (x, i) { return '<div class="cmi" style="animation-delay:' + (i * 90) + 'ms"><span class="av">' + esc((x.name || '?').trim().charAt(0).toUpperCase()) + '</span><b>' + esc(x.name) + '</b><time>' + when(x.time) + '</time><p>' + esc(x.message) + '</p></div>'; }).join('')
        : '<p class="empty">No comments yet. Be the first.</p>';
    }).catch(function () { list.innerHTML = ''; });
    var ta = box.querySelector('textarea'), cnt = box.querySelector('.cnt');
    function grow() { ta.style.height = 'auto'; ta.style.height = Math.max(110, ta.scrollHeight + 2) + 'px'; var n = ta.value.length; cnt.textContent = n + ' / 2000'; cnt.classList.toggle('warn', n > 1800); }
    ta.addEventListener('input', grow);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form); fd.set('post', post);
      if (!String(fd.get('name')).trim() || String(fd.get('message')).trim().length < 2) { st.textContent = 'Please add your name and a comment.'; return; }
      btn.disabled = true; st.textContent = 'Sending…';
      fetch(API, { method: 'POST', body: new URLSearchParams(fd) }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok) { form.reset(); grow(); st.innerHTML = '<span class="done"><svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5"/></svg>Thanks! Your comment will appear once it has been approved.</span>'; }
          else { st.textContent = (res.j && res.j.error) || 'Something went wrong. Please try again.'; }
        }).catch(function () { st.textContent = 'Something went wrong. Please try again.'; })
        .then(function () { btn.disabled = false; });
    });
  }

  [].forEach.call(document.querySelectorAll('[data-comments]'), function (el) { mount(el, el.getAttribute('data-comments')); });
  [].forEach.call(document.querySelectorAll('article.entry[id]'), function (a) {
    if (a.querySelector('[data-comments]')) return;
    var box = document.createElement('section'); a.appendChild(box); mount(box, 'nm:' + a.id);
  });

  // small Admin link at the very bottom of journal pages, for the site owner's approval page
  var foot = document.querySelector('footer') || document.body;
  var adm = document.createElement('a');
  adm.href = '/comments-admin.php'; adm.textContent = 'Admin'; adm.rel = 'nofollow';
  adm.style.cssText = 'display:block;width:max-content;margin:18px auto 0;font:600 10px/1 Manrope,system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase;opacity:.45;color:inherit;text-decoration:none;padding:6px 10px;border:1px solid rgba(127,127,127,.35);border-radius:999px;transition:opacity .2s';
  adm.onmouseenter = function () { adm.style.opacity = '1'; }; adm.onmouseleave = function () { adm.style.opacity = '.45'; };
  (foot.querySelector('.wrap') || foot).appendChild(adm);
})();
