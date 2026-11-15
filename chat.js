/* Site chat assistant: answers from this site's own content (window.CHAT_KB), no outside AI service.
   Questions it can't answer confidently are sent to the owner by email together with the visitor's email or phone.
   Every conversation is emailed to the owner when it goes quiet or the visitor leaves. Nothing is stored on the server. */
(function () {
  var KB = window.CHAT_KB; if (!KB || document.getElementById('cb-root')) return;
  var T = KB.theme || {};
  var css =
    '#cb-root{--cb-bg:' + (T.bg || '#0A0B0D') + ';--cb-panel:' + (T.panel || '#121316') + ';--cb-ink:' + (T.ink || '#EFEBE3') + ';--cb-mute:' + (T.mute || '#A9ADB3') + ';--cb-acc:' + (T.accent || '#D11F26') + ';--cb-accink:' + (T.accentInk || '#fff') + ';--cb-line:' + (T.line || 'rgba(239,235,227,.14)') + ';--cb-me:' + (T.me || '#2A2C31') + ';' +
    'position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:120;font:15px/1.5 ' + (T.font || 'system-ui,-apple-system,"Segoe UI",sans-serif') + ';text-align:left;letter-spacing:0;text-transform:none}' +
    '#cb-root :where(button,input,form){all:revert;box-sizing:border-box}#cb-root *{box-sizing:border-box}' +
    '#cb-btn{font-family:inherit;font-size:15px;letter-spacing:0;text-transform:none;display:flex;align-items:center;gap:10px;height:54px;padding:0 20px 0 16px;border-radius:999px;border:1px solid var(--cb-line);background:var(--cb-bg);color:var(--cb-ink);cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.35);font:inherit;font-weight:600;transition:transform .2s ease}' +
    '#cb-btn:hover{transform:translateY(-2px)}#cb-btn:focus-visible{outline:2px solid var(--cb-acc);outline-offset:3px}' +
    '#cb-btn svg{width:22px;height:22px;fill:none;stroke:var(--cb-acc);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '#cb-btn .cb-dot{width:8px;height:8px;border-radius:50%;background:#3BB273;margin-left:2px}' +
    '#cb-win{position:absolute;right:0;bottom:66px;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 110px));display:flex;flex-direction:column;background:var(--cb-panel);color:var(--cb-ink);border:1px solid var(--cb-line);border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.45);opacity:0;transform:translateY(12px) scale(.98);transform-origin:100% 100%;pointer-events:none;transition:opacity .22s ease,transform .22s ease}' +
    '#cb-root.open #cb-win{opacity:1;transform:none;pointer-events:auto}' +
    '#cb-win{font-family:inherit}#cb-head{display:flex;align-items:center;gap:12px;padding:14px 14px 12px 16px;background:var(--cb-bg);border-bottom:1px solid var(--cb-line)}' +
    '#cb-head img{width:34px;height:34px;object-fit:contain;flex:none}#cb-head b{display:block;font-size:15px;' + (T.headFont ? 'font-family:' + T.headFont + ';letter-spacing:.04em;' : '') + '}#cb-head small{display:block;color:var(--cb-mute);font-size:12px}' +
    '#cb-x{margin-left:auto;width:36px;height:36px;border:0;border-radius:50%;background:transparent;color:var(--cb-mute);font-size:22px;cursor:pointer}#cb-x:hover{color:var(--cb-ink);background:rgba(127,127,127,.15)}' +
    '#cb-log{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:10px;overscroll-behavior:contain}' +
    '#cb-root .cb-m{max-width:86%;padding:10px 13px;border-radius:14px;white-space:pre-line;word-wrap:break-word}' +
    '#cb-root .cb-m.bot{align-self:flex-start;background:var(--cb-bg);border:1px solid var(--cb-line);border-bottom-left-radius:4px}' +
    '#cb-root .cb-m.me{align-self:flex-end;background:var(--cb-me);border-bottom-right-radius:4px}' +
    '#cb-root .cb-m a{color:var(--cb-ink);text-decoration:underline;text-decoration-color:var(--cb-acc);text-underline-offset:3px}' +
    '#cb-root .cb-chips{display:flex;flex-wrap:wrap;gap:7px;padding:0 14px 10px}' +
    '#cb-root .cb-chip{border:1px solid var(--cb-line);background:transparent;color:var(--cb-ink);border-radius:999px;padding:7px 12px;font:inherit;font-size:13px;cursor:pointer}#cb-root .cb-chip:hover{border-color:var(--cb-acc)}' +
    '#cb-form{display:flex;gap:8px;padding:10px 12px 12px;border-top:1px solid var(--cb-line);background:var(--cb-bg)}' +
    '#cb-in{flex:1;min-width:0;border:1px solid var(--cb-line);background:var(--cb-panel);color:var(--cb-ink);border-radius:12px;padding:11px 12px;font:inherit;font-size:16px;outline:none}#cb-in:focus{border-color:var(--cb-acc)}' +
    '#cb-send{flex:none;border:0;border-radius:12px;padding:0 16px;background:var(--cb-acc);color:var(--cb-accink);font:inherit;font-weight:700;cursor:pointer}' +
    '#cb-note{padding:0 14px 10px;color:var(--cb-mute);font-size:11.5px;line-height:1.4;background:var(--cb-bg)}#cb-note a{color:inherit}' +
    '#cb-root .cb-typing{display:inline-flex;gap:4px}#cb-root .cb-typing i{width:6px;height:6px;border-radius:50%;background:var(--cb-mute);animation:cbt 1s infinite}#cb-root .cb-typing i:nth-child(2){animation-delay:.15s}#cb-root .cb-typing i:nth-child(3){animation-delay:.3s}@keyframes cbt{50%{opacity:.25}}' +
    '@media (max-width:560px){#cb-btn .cb-lbl{display:none}#cb-btn{padding:0 16px}#cb-win{position:fixed;left:8px;right:8px;bottom:78px;width:auto;height:min(70vh,560px)}}' +
    '@media (prefers-reduced-motion:reduce){#cb-win,#cb-btn{transition:none}#cb-root .cb-typing i{animation:none}}';
  if (KB.themeLight) { var L = KB.themeLight; css += ':root[data-theme="light"] #cb-root{--cb-bg:' + L.bg + ';--cb-panel:' + L.panel + ';--cb-ink:' + L.ink + ';--cb-mute:' + L.mute + ';--cb-acc:' + L.accent + ';--cb-accink:' + L.accentInk + ';--cb-line:' + L.line + ';--cb-me:' + L.me + '}:root[data-theme="light"] #cb-btn,:root[data-theme="light"] #cb-win{box-shadow:0 14px 34px rgba(0,0,0,.16)}'; }
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var root = document.createElement('div'); root.id = 'cb-root';
  root.innerHTML = '<div id="cb-win" role="dialog" aria-label="' + KB.name + ' chat" aria-hidden="true">' +
    '<div id="cb-head">' + (KB.logo ? '<img src="' + KB.logo + '" alt="">' : '') + '<div><b>' + KB.name + '</b><small>' + KB.tagline + '</small></div><button id="cb-x" type="button" aria-label="Close chat">&times;</button></div>' +
    '<div id="cb-log" aria-live="polite"></div><div class="cb-chips" id="cb-chips"></div>' +
    '<form id="cb-form" autocomplete="off"><input id="cb-in" maxlength="600" placeholder="Type your question" aria-label="Your message"><button id="cb-send" type="submit">Send</button></form>' +
    '<div id="cb-note">' + KB.note + '</div></div>' +
    '<button id="cb-btn" type="button" aria-expanded="false" aria-controls="cb-win"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/></svg><span class="cb-lbl">' + (KB.button || 'Ask a question') + '</span><span class="cb-dot" aria-hidden="true"></span></button>';
  document.body.appendChild(root);
  var $ = function (id) { return document.getElementById(id); };
  var log = $('cb-log'), chips = $('cb-chips'), input = $('cb-in');

  // ---- state kept for this browser tab only (survives moving between pages) ----
  var S = { msgs: [], sent: 0, mode: '', pending: '', contact: '', sid: '' };
  try { var saved = JSON.parse(sessionStorage.getItem('cb-state') || 'null'); if (saved && saved.site === KB.site) S = saved; } catch (e) {}
  if (!S.sid) S.sid = Math.random().toString(36).slice(2, 10);
  S.site = KB.site;
  function save() { try { sessionStorage.setItem('cb-state', JSON.stringify(S)); } catch (e) {} }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(s) { // answers may contain [label](url) links
    return esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, l, u) { var ext = /^https?:/.test(u) && u.indexOf(location.host) < 0; return '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + l + '</a>'; });
  }
  function bubble(who, text) { var d = document.createElement('div'); d.className = 'cb-m ' + who; d.innerHTML = who === 'bot' ? fmt(text) : esc(text); log.appendChild(d); log.scrollTop = log.scrollHeight; }
  function add(who, text) { S.msgs.push({ w: who, t: text, at: Date.now() }); save(); bubble(who, text); idle(); }
  function setChips(list) { chips.innerHTML = ''; setTimeout(function () { log.scrollTop = log.scrollHeight; }, 0); (list || []).forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.className = 'cb-chip'; b.textContent = c; b.onclick = function () { ask(c); }; chips.appendChild(b); }); }
  function botSay(text, chipList) {
    var t = document.createElement('div'); t.className = 'cb-m bot'; t.innerHTML = '<span class="cb-typing"><i></i><i></i><i></i></span>'; log.appendChild(t); log.scrollTop = log.scrollHeight;
    setTimeout(function () { t.remove(); add('bot', text); setChips(chipList); }, Math.min(900, 300 + text.length * 4));
  }

  // ---- matching ----
  var STOP = 'a an the is are am be to of for in on at it i me my we you your our do does did can could would will should how what when where which why with and or if this that there here please any get have has much many'.split(' ');
  function stem(w) {
    w = w.replace(/'s$/, ''); if (w.length < 5) return w;
    if (/ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (/(ss|us)$/.test(w)) return w;
    if (/(ches|shes|xes|zes|sses)$/.test(w)) return w.slice(0, -2);
    if (/s$/.test(w)) return w.slice(0, -1);
    if (/ing$/.test(w) && w.length > 5) return w.slice(0, -3);
    if (/ed$/.test(w)) return w.slice(0, -2);
    return w;
  }
  function words(s) {
    s = (' ' + s.toLowerCase().replace(/[^a-z0-9$\s]/g, ' ') + ' ');
    (KB.synonyms || []).forEach(function (p) { s = s.replace(new RegExp('\\b(' + p[0] + ')\\b', 'g'), p[1]); });
    return s.split(/\s+/).filter(function (w) { return w && STOP.indexOf(w) < 0; }).map(stem);
  }
  KB.items.forEach(function (it) { it._k = it.k.map(function (g) { return g.split('|').map(function (x) { return words(x).join(' '); }); }); });
  function score(q) {
    var w = words(q), joined = ' ' + w.join(' ') + ' ', best = null, bs = 0, second = 0;
    KB.items.forEach(function (it) {
      var sc = 0;
      it._k.forEach(function (grp, gi) { for (var i = 0; i < grp.length; i++) { if (grp[i] && joined.indexOf(' ' + grp[i] + ' ') > -1) { sc += gi === 0 ? 3 : 1.5; break; } } });
      if (sc > bs) { second = bs; bs = sc; best = it; } else if (sc > second) second = sc;
    });
    return { it: best, s: bs, w: w.length };
  }
  var EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i, PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

  function ask(text) {
    text = String(text).trim(); if (!text) return;
    add('me', text); setChips([]);
    var contact = (text.match(EMAIL) || text.match(PHONE) || [])[0];
    if (S.mode === 'contact') {
      if (contact) { S.contact = contact; S.mode = ''; save(); escalate(S.pending, contact); botSay(KB.thanksContact.replace('{c}', contact), KB.starters); }
      else if (/^(no|nope|no thanks|skip|nah)\b/i.test(text)) { S.mode = ''; save(); botSay(KB.noContact, KB.starters); }
      else botSay(KB.badContact);
      return;
    }
    if (contact && text.replace(contact, '').replace(/[^a-z]/gi, '').length < 12) {
      S.contact = contact; S.mode = ''; save(); escalate(S.pending || '(Visitor left contact details for a personal reply)', contact); S.pending = ''; save();
      botSay(KB.thanksContact.replace('{c}', contact), KB.starters); return;
    }
    if (contact && S.pending && !S.contact) { S.contact = contact; save(); escalate(S.pending, contact); botSay(KB.thanksContact.replace('{c}', contact), KB.starters); return; }
    var r = score(text);
    if (r.it && r.s >= (r.it.min || 3) && !r.it.esc) { botSay(r.it.a, r.it.chips || KB.followups); return; }
    // not confident: hand it to the owner
    S.pending = text; save();
    if (S.contact) { escalate(text, S.contact); botSay(KB.escalateKnown.replace('{c}', S.contact), KB.starters); }
    else { S.mode = 'contact'; save(); botSay(KB.escalate); }
  }

  // ---- email to the owner ----
  function post(payload, beacon) {
    var body = JSON.stringify(payload);
    if (beacon && navigator.sendBeacon) { try { if (navigator.sendBeacon(KB.endpoint, new Blob([body], { type: 'text/plain' }))) return; } catch (e) {} }
    try { fetch(KB.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: body, keepalive: true }); } catch (e) {}
  }
  function escalate(q, c) { post({ type: 'escalate', site: KB.site, sid: S.sid, page: location.pathname, question: q, contact: c, log: S.msgs.slice(-40) }); }
  function transcript(beacon) {
    var mine = S.msgs.filter(function (m) { return m.w === 'me'; }).length;
    if (!mine || S.msgs.length <= S.sent) return;
    post({ type: 'transcript', site: KB.site, sid: S.sid, page: location.pathname, contact: S.contact, part: S.sent ? 'update' : 'full', log: S.msgs.slice(-60) }, beacon);
    S.sent = S.msgs.length; save();
  }
  var tIdle = 0; function idle() { clearTimeout(tIdle); tIdle = setTimeout(function () { transcript(false); }, 180000); }
  addEventListener('pagehide', function () { transcript(true); });

  // ---- open / close ----
  function open(v) {
    root.classList.toggle('open', v); $('cb-btn').setAttribute('aria-expanded', v); $('cb-win').setAttribute('aria-hidden', !v);
    if (v) {
      if (!log.childNodes.length) {
        if (S.msgs.length) { S.msgs.forEach(function (m) { bubble(m.w, m.t); }); setChips(KB.starters); }
        else botSay(KB.greeting, KB.starters);
      }
      setTimeout(function () { if (matchMedia('(min-width:561px)').matches) input.focus(); }, 250);
    }
  }
  $('cb-btn').onclick = function () { open(!root.classList.contains('open')); };
  $('cb-x').onclick = function () { open(false); transcript(false); };
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('open')) { open(false); $('cb-btn').focus(); } });
  $('cb-form').onsubmit = function (e) { e.preventDefault(); var v = input.value; input.value = ''; ask(v); };
  window.cbAsk = function (q) { open(true); setTimeout(function () { ask(q); }, 300); };
})();
