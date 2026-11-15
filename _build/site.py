#!/usr/bin/env python3
"""nickmehra.ca: builds the resume-style pages (experience, now, privacy, terms, accessibility)
and writes the same footer into every page. Run: python3 _build/site.py  (this .py file is never served)."""
import os, re, glob
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS_V = '8'

FOOTER = '''<footer><div class="wrap">
  <div class="fgrid">
  <div class="fbrand"><a class="fmark" href="/">Nick <span>Mehra</span></a><p>Owner &amp; Creative Director, BlackSheep Digital Works. Almost two decades in security and law enforcement before the lens.</p><p class="floc">Ontario, Canada</p></div>
    <nav class="fcol" aria-label="About"><h4>About</h4><a href="/story/">Story</a><a href="/experience/">Experience</a><a href="/now/">Now</a><a href="/journal/">Journal</a></nav>
    <nav class="fcol" aria-label="Work"><h4>Work</h4><a href="/portraits/">Portraits</a><a href="/work/">Work</a><a href="https://blacksheepdigitalworks.ca" target="_blank" rel="noopener">BlackSheep ↗</a></nav>
    <nav class="fcol" aria-label="Connect"><h4>Connect</h4><a href="/contact/">Contact</a><a href="mailto:nic.mehra@gmail.com">Email</a><a href="https://www.instagram.com/blacksheepdigitalworks/" target="_blank" rel="noopener">Instagram ↗</a></nav>
  </div>
  <div class="fbar"><span class="fsig">© 2026 Nick Mehra</span><nav class="flegal" aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms of use</a><a href="/accessibility/">Accessibility</a><a href="/comments-admin.php" rel="nofollow">Admin</a></nav></div>
</div></footer>'''

PAGES = {
'experience': dict(title='Experience', desc='Almost two decades in security and law enforcement, now owner and creative director of BlackSheep Digital Works. A working record.', body='''
<section class="pagehead"><div class="wrap">
  <span class="eyebrow">Experience</span>
  <h2>A working <em>record</em></h2>
  <p class="lead">Almost two decades in security and law enforcement. Now the owner and creative director of BlackSheep Digital Works, a media company in Ontario.</p>
</div></section>
<section class="doc"><div class="wrap">
  <div class="cv">
    <div class="cv-row">
      <div class="cv-when">2026 – present</div>
      <div class="cv-what"><h3>Owner &amp; Creative Director</h3><p class="cv-org">BlackSheep Digital Works &nbsp;·&nbsp; Ontario</p>
      <ul><li>Real estate media: photography, video and drone work for property listings.</li>
      <li>Dealership photography for cars, trucks and RVs.</li>
      <li>Event coverage of one to three hours.</li>
      <li>Shooting, editing and delivery, usually within 24 to 72 hours.</li>
      <li>Serving Pickering to Kingston, north to Peterborough, and the GTA.</li></ul></div>
    </div>
    <div class="cv-row">
      <div class="cv-when">Almost two decades</div>
      <div class="cv-what"><h3>Security &amp; law enforcement</h3><p class="cv-org">Ontario</p>
      <ul><li>Private security</li><li>Transit enforcement operations</li><li>Municipal law enforcement</li><li>Enforcement in a provincial capacity</li></ul></div>
    </div>
  </div>
  <div class="cv-carry">
    <span class="eyebrow">What carried over</span>
    <ul class="pills"><li>Discipline from the uniform</li><li>Staying steady</li><li>Noticing what others walk past</li><li>Answering for my decisions</li><li>Creativity as the catalyst</li></ul>
  </div>
  <p class="note">Full employment details are available on request.</p>
  <div class="acts"><a class="btn solid" href="/contact/">Get in touch</a><a class="btn ghost" href="/story/">Read the story</a></div>
</div></section>'''),
'now': dict(title='Now', desc='What Nick Mehra is focused on right now.', body='''
<section class="pagehead"><div class="wrap">
  <span class="eyebrow">Now &nbsp;·&nbsp; November 2026</span>
  <h2>What I'm <em>focused on</em></h2>
  <p class="lead">A short page about the present, updated as things change.</p>
</div></section>
<section class="doc"><div class="wrap"><div class="prose">
  <h3>Building BlackSheep Digital Works</h3>
  <p>Real estate, dealership and event media across Durham, the GTA and east to Kingston. Every shoot is a chance to make the work sharper. <a href="https://blacksheepdigitalworks.ca" target="_blank" rel="noopener">See BlackSheep ↗</a></p>
  <h3>Writing</h3>
  <p>A personal <a href="/journal/">journal</a> here, and the <a href="https://blacksheepdigitalworks.ca/journal/" target="_blank" rel="noopener">BlackSheep Journal</a> on listing media, local market notes and the rules that shape them.</p>
  <h3>Based in</h3>
  <p>Ontario, Canada.</p>
</div></div></section>'''),
'privacy': dict(title='Privacy', desc='What nickmehra.ca collects, why, and how to have it removed.', body='''
<section class="pagehead"><div class="wrap">
  <span class="eyebrow">Privacy</span>
  <h2>Your <em>privacy</em></h2>
  <p class="lead">This is a personal website. It collects as little as it can. Last updated November 15, 2026.</p>
</div></section>
<section class="doc"><div class="wrap"><div class="prose">
  <h3>Comments</h3>
  <p>If you comment on the journal, the site keeps the name you enter, your comment, and when you posted it. Comments are held until I approve them. A copy of each new comment may be emailed to me so I can review it. No IP address or device details are stored with comments.</p>
  <h3>Reactions</h3>
  <p>Reactions are stored only as totals. The reaction you chose is remembered in your own browser so you can change it; it is not stored on the server.</p>
  <h3>Chat</h3>
  <p>The chat bubble is an automated assistant that answers from the information on this website; it is not a live person and does not use an outside AI service. Your messages, and any email or phone number you choose to give, are emailed to me so I can read the conversation and reply personally. Chat messages are not stored on the website, and the conversation stays in your browser tab only until you close it. Please don't share sensitive personal information in the chat.</p>
  <h3>Your browser</h3>
  <p>Your light or dark choice, and whether you closed the viewing tip, are saved in your own browser. There are no advertising or analytics tools and no tracking cookies. Fonts and scripts are served from this site, not from outside services.</p>
  <h3>Hosting</h3>
  <p>The site is hosted by Hostinger, which may keep standard technical logs for security and operations under its own privacy policy.</p>
  <h3>Removing your information</h3>
  <p>To have a comment changed or removed, email <a href="mailto:nic.mehra@gmail.com">nic.mehra@gmail.com</a>. Bookings and quotes for BlackSheep Digital Works are covered by the <a href="https://blacksheepdigitalworks.ca/privacy/" target="_blank" rel="noopener">BlackSheep privacy policy</a>.</p>
</div></div></section>'''),
'terms': dict(title='Terms of use', desc='Terms for using nickmehra.ca, its photos and its comments.', body='''
<section class="pagehead"><div class="wrap">
  <span class="eyebrow">Terms of use</span>
  <h2>Using this <em>site</em></h2>
  <p class="lead">Last updated November 15, 2026.</p>
</div></section>
<section class="doc"><div class="wrap"><div class="prose">
  <h3>Content and photos</h3>
  <p>The writing, portraits and photographs on this site belong to Nick Mehra unless stated otherwise. Please don't copy, edit or republish them without written permission. Sharing a link is always welcome.</p>
  <h3>Personal views</h3>
  <p>The journal reflects personal experience and opinion. It is not legal, professional or financial advice.</p>
  <h3>Comments</h3>
  <p>Keep comments respectful and on topic. Comments are moderated and may be edited or removed at any time. Don't post personal information about yourself or anyone else. By commenting, you allow your name and comment to be shown on this site.</p>
  <h3>Other sites</h3>
  <p>Links to other websites, including BlackSheep Digital Works, are provided for convenience. Those sites have their own terms. BlackSheep bookings are governed by the <a href="https://blacksheepdigitalworks.ca/terms/" target="_blank" rel="noopener">BlackSheep terms of service</a>.</p>
  <h3>No guarantees</h3>
  <p>The site is provided as is. Reasonable care is taken to keep it accurate and secure, but it may contain errors or be unavailable at times.</p>
  <h3>Governing law</h3>
  <p>These terms are governed by the laws of Ontario and the federal laws of Canada that apply there.</p>
</div></div></section>'''),
'accessibility': dict(title='Accessibility', desc='Accessibility on nickmehra.ca and how to report a barrier.', body='''
<section class="pagehead"><div class="wrap">
  <span class="eyebrow">Accessibility</span>
  <h2>Open to <em>everyone</em></h2>
  <p class="lead">The aim is a site that anyone can read and use.</p>
</div></section>
<section class="doc"><div class="wrap"><div class="prose">
  <h3>What's in place</h3>
  <p>A light and dark mode switch, text descriptions on photos, visible focus outlines for keyboard users, and reduced animation when your device asks for less motion.</p>
  <h3>Report a barrier</h3>
  <p>If something on the site is hard to use, email <a href="mailto:nic.mehra@gmail.com">nic.mehra@gmail.com</a> or call 647.888.3098. Tell me the page and what happened, and I'll work on a fix or get you the content another way.</p>
</div></div></section>'''),
}

def template():
    return open(os.path.join(R, 'story/index.html')).read()

def make(slug, p):
    t = template()
    t = re.sub(r'<title>.*?</title>', f'<title>{p["title"]} | Nick Mehra</title>', t)
    t = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{p["desc"]}">', t)
    t = re.sub(r'<link rel="canonical" href=".*?">', f'<link rel="canonical" href="https://nickmehra.ca/{slug}/">', t)
    t = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{p["title"]} | Nick Mehra">', t)
    t = re.sub(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{p["desc"]}">', t)
    t = t.replace(' aria-current="page"', '')
    t = re.sub(r'<main>.*?</main>', '<main class="docpage">' + p['body'] + '\n</main>', t, flags=re.S)
    os.makedirs(os.path.join(R, slug), exist_ok=True)
    open(os.path.join(R, slug, 'index.html'), 'w').write(t)

for slug, p in PAGES.items():
    make(slug, p)

for f in glob.glob(os.path.join(R, '**/*.html'), recursive=True):
    if '/_build/' in f or os.path.basename(f).startswith('google'): continue
    s = open(f).read()
    if '<footer' not in s: continue
    s = re.sub(r'<footer>.*?</footer>', FOOTER, s, flags=re.S)
    if '/chat.js' not in s: s = s.replace('</body>', '<script src="/chat-kb.js?v=1" defer></script><script src="/chat.js?v=1" defer></script>\n</body>', 1)
    s = re.sub(r'/css/site\.css\?v=\d+', '/css/site.css?v=' + CSS_V, s)
    s = re.sub(r'/css/pages\.css\?v=\d+', '/css/pages.css?v=16', s)
    s = re.sub(r'/css/light\.css\?v=\d+', '/css/light.css?v=4', s)
    open(f, 'w').write(s)

# sitemap
sm = os.path.join(R, 'sitemap.xml'); s = open(sm).read()
for slug in PAGES:
    u = f'https://nickmehra.ca/{slug}/'
    if u not in s:
        s = s.replace('</urlset>', f'  <url><loc>{u}</loc><lastmod>2026-11-15</lastmod></url>\n</urlset>')
open(sm, 'w').write(s)
print('built', list(PAGES))
