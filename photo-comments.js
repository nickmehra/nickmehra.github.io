/* Photo conversations for the BlackSheep homepage portfolio.
   - A speech-bubble button joins the like/dislike bar on every photo. Tapping it scrolls to the
     conversation section below the portfolio with that photo shown as a clear thumbnail.
   - Comments are grouped into one thread per photo; anyone can reply to a comment.
   - Only the name, the comment, the photo it's about and the time are stored. Comments appear after approval. */
(function () {
  var API = '/comments.php', POST = 'bs:portfolio';
  var anchor = document.getElementById('portfolio'); if (!anchor) return;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function when(t) { var d = new Date(t * 1000); return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function keyOf(img) { var s = img.currentSrc || img.src || img.poster || ''; try { s = new URL(s, location.href).pathname; } catch (e) {} return s; }

  var css = document.createElement('style');
  css.textContent =
    '#talk{position:relative;z-index:5;padding:72px 0 40px}' +
    '#talk .wrap{max-width:900px;margin:0 auto;padding:0 20px;display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center}' +
    '#talk .tk-form{width:100%;max-width:680px;border:1px solid var(--line);background:var(--bg);box-shadow:0 18px 50px rgba(0,0,0,.18);padding:22px 20px;display:flex;flex-direction:column;gap:12px}' +
    '#talk .tk-on{display:flex;align-items:center;gap:12px;justify-content:center;font-size:.95rem;color:var(--muted)}' +
    '#talk .tk-on img{width:92px;height:62px;object-fit:cover;border:1px solid var(--line)}' +
    '#talk .tk-on button,#talk .lk-btn{background:none;border:0;color:var(--muted);font:inherit;font-size:.92rem;cursor:pointer;text-decoration:underline;text-underline-offset:3px}' +
    '#talk input,#talk textarea{width:100%;box-sizing:border-box}' +
    '#talk textarea{min-height:92px;resize:vertical}' +
    '#talk .tk-msg{font-size:.95rem;color:var(--muted)}' +
    '#talk .tk-threads{width:100%;display:flex;flex-direction:column;gap:22px;text-align:left}' +
    '#talk .tk-th{border:1px solid var(--line);background:var(--bg);box-shadow:0 18px 50px rgba(0,0,0,.18);padding:16px;display:flex;flex-direction:column;gap:12px}' +
    '#talk .tk-head{display:flex;align-items:center;gap:14px}' +
    '#talk .tk-head img{width:120px;height:80px;object-fit:cover;border:1px solid var(--line);cursor:pointer}' +
    '#talk .tk-head b{font-family:var(--display);font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;font-weight:500}' +
    '#talk .tk-b{position:relative;max-width:88%;background:var(--field,rgba(127,127,127,.12));border:1px solid var(--line);border-radius:18px 18px 18px 4px;padding:10px 14px}' +
    '#talk .tk-b .who{font-size:.86rem;color:var(--muted);margin-bottom:2px}#talk .tk-b .who b{color:var(--fg)}' +
    '#talk .tk-b p{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '#talk .tk-rep{margin-left:28px;padding-left:14px;border-left:2px solid var(--line);display:flex;flex-direction:column;gap:10px}' +
    '#talk .tk-rep .tk-b{border-radius:18px 18px 4px 18px}' +
    '#talk .tk-empty{color:var(--muted);text-align:center}' +
    '.rx .talk svg{width:23px;height:23px}';
  document.head.appendChild(css);

  var sec = document.createElement('section'); sec.id = 'talk'; sec.setAttribute('aria-label', 'Comments on the work');
  sec.innerHTML = '<div class="wrap"><span class="eyebrow">The conversation</span><h2>Talk about <em>the work.</em></h2>' +
    '<p class="sub">Tap the speech bubble on any photo to comment on it, or reply to someone below. Comments appear once approved.</p>' +
    '<form class="tk-form" novalidate><div class="tk-on" hidden></div>' +
    '<input type="text" name="name" maxlength="60" placeholder="Your name" aria-label="Your name" autocomplete="name">' +
    '<textarea name="message" maxlength="2000" placeholder="Your comment" aria-label="Your comment"></textarea>' +
    '<div style="position:absolute;left:-9999px" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div>' +
    '<button class="btn primary lk" type="submit">Post comment</button><p class="tk-msg" role="status" hidden></p></form>' +
    '<div class="tk-threads"></div></div>';
  anchor.parentNode.insertBefore(sec, anchor.nextSibling);
  var form = sec.querySelector('form'), onBox = sec.querySelector('.tk-on'), msg = sec.querySelector('.tk-msg'), list = sec.querySelector('.tk-threads');
  var target = { photo: '', parent: '', parentName: '' };

  function setTarget(photo, parent, parentName) {
    target = { photo: photo || '', parent: parent || '', parentName: parentName || '' };
    if (!target.photo && !target.parent) { onBox.hidden = true; onBox.innerHTML = ''; return; }
    onBox.hidden = false;
    onBox.innerHTML = (target.photo ? '<img src="' + esc(target.photo) + '" alt="The photo you are commenting on">' : '') +
      '<span>' + (target.parent ? 'Replying to <b>' + esc(target.parentName) + '</b>' : 'Commenting on this photo') + '</span><button type="button">Clear</button>';
    onBox.querySelector('button').addEventListener('click', function () { setTarget('', '', ''); });
  }
  function goTo(photo) {
    setTarget(photo, '', '');
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { (form.name.value ? form.message : form.name).focus({ preventScroll: true }); }, 700);
  }

  function render(rows) {
    var byId = {}, threads = {}, order = [];
    rows.forEach(function (c) { byId[c.id] = c; c.kids = []; });
    rows.forEach(function (c) { if (c.parent && byId[c.parent]) byId[c.parent].kids.push(c); });
    rows.forEach(function (c) {
      if (c.parent && byId[c.parent]) return;
      var k = c.photo || '_';
      if (!threads[k]) { threads[k] = []; order.push(k); }
      threads[k].push(c);
    });
    order.sort(function (a, b) { var la = Math.max.apply(null, threads[a].map(function (c) { return c.time; })), lb = Math.max.apply(null, threads[b].map(function (c) { return c.time; })); return lb - la; });
    if (!order.length) { list.innerHTML = '<p class="tk-empty">No comments yet. Be the first.</p>'; return; }
    function bubble(c) {
      var h = '<div class="tk-b" data-id="' + esc(c.id) + '"><div class="who"><b>' + esc(c.name) + '</b> · ' + when(c.time) + '</div><p>' + esc(c.message) + '</p></div>' +
        '<div><button type="button" class="lk-btn" data-reply="' + esc(c.id) + '" data-name="' + esc(c.name) + '" data-photo="' + esc(c.photo || '') + '">Reply</button></div>';
      if (c.kids.length) h += '<div class="tk-rep">' + c.kids.sort(function (a, b) { return a.time - b.time; }).map(bubble).join('') + '</div>';
      return h;
    }
    list.innerHTML = order.map(function (k) {
      return '<div class="tk-th">' + (k !== '_' ? '<div class="tk-head"><img src="' + esc(k) + '" alt="Photo being discussed" loading="lazy" data-photo="' + esc(k) + '"><b>On this photo</b></div>' : '<div class="tk-head"><b>On the portfolio</b></div>') +
        threads[k].sort(function (a, b) { return a.time - b.time; }).map(bubble).join('') + '</div>';
    }).join('');
  }
  function load() { fetch(API + '?post=' + encodeURIComponent(POST), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { render(d.comments || []); }).catch(function () { list.innerHTML = ''; }); }

  list.addEventListener('click', function (e) {
    var r = e.target.closest('[data-reply]');
    if (r) { setTarget(r.getAttribute('data-photo'), r.getAttribute('data-reply'), r.getAttribute('data-name')); form.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function () { form.message.focus({ preventScroll: true }); }, 500); return; }
    var im = e.target.closest('img[data-photo]'); if (im) goTo(im.getAttribute('data-photo'));
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim(), m = form.message.value.trim();
    msg.hidden = false;
    if (!name || m.length < 2) { msg.textContent = 'Please add your name and a comment.'; return; }
    var b = new URLSearchParams(); b.set('post', POST); b.set('name', name); b.set('message', m); b.set('website', form.website.value);
    if (target.photo) b.set('photo', target.photo); if (target.parent) b.set('parent', target.parent);
    var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
    fetch(API, { method: 'POST', body: b }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (res) {
      btn.disabled = false;
      if (!res.ok) { msg.textContent = res.j.error || 'Something went wrong. Please try again.'; return; }
      msg.textContent = 'Thanks, ' + name.split(' ')[0] + '. Your comment will appear here once it\'s approved.'; form.message.value = ''; setTarget('', '', '');
    }).catch(function () { btn.disabled = false; msg.textContent = 'Could not reach the server. Please try again.'; });
  });

  // speech bubble on the like/dislike bar
  (function addButton(tries) {
    var bar = document.querySelector('.rx');
    if (!bar) { if (tries < 40) setTimeout(function () { addButton(tries + 1); }, 250); return; }
    var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'talk'; bt.setAttribute('aria-label', 'Comment on this photo');
    bt.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/></svg>';
    bt.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); var img = window.rxCurrent; var k = img ? keyOf(img) : ''; goTo(/^\/img\//.test(k) ? k : ''); });
    bar.appendChild(bt);
  })(0);
  load();
})();
