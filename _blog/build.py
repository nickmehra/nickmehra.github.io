#!/usr/bin/env python3
"""Builds the BlackSheep Journal from _blog/posts/*.md.

Each post is a Markdown file with a front-matter block:

    ---
    title: Post title
    date: 2026-11-13
    description: One-sentence summary for cards and search results.
    image: img/estate.jpg        (optional, path from the site root)
    image_alt: What the photo shows
    sources:
      - Source title | https://example.com/page
    ---
    Body in Markdown (## headings, paragraphs, - lists, **bold**, *italic*, [links](url)).

Run:  python3 _blog/build.py
Writes journal/index.html, journal/<slug>/index.html and updates sitemap.xml.
Posts dated in the future are skipped, so a post can be queued ahead.
"""
import datetime, html, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = os.path.join(ROOT, '_blog', 'posts')
OUT = os.path.join(ROOT, 'journal')
SITE = 'https://blacksheepdigitalworks.ca'
CSS = open(os.path.join(ROOT, '_blog', 'base.css'), encoding='utf-8').read()


def parse(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', raw, re.S)
    if not m:
        sys.exit('No front matter in ' + path)
    meta, body = {}, m.group(2)
    key = None
    for line in m.group(1).splitlines():
        if re.match(r'^\s+-\s+', line) and key:
            meta.setdefault(key, []).append(re.sub(r'^\s+-\s+', '', line).strip())
        elif ':' in line:
            key, val = line.split(':', 1)
            key, val = key.strip(), val.strip()
            meta[key] = val if val else []
    for req in ('title', 'date', 'description'):
        if not meta.get(req):
            sys.exit('Missing %s in %s' % (req, path))
    meta['slug'] = re.sub(r'^\d{4}-\d{2}-\d{2}-', '', os.path.splitext(os.path.basename(path))[0])
    meta['body'] = body
    meta['dt'] = datetime.date.fromisoformat(meta['date'])
    return meta


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\[([^\]]+)\]\((https?://[^)\s]+)\)', lambda m: '<a class="tl" href="%s" target="_blank" rel="noopener">%s</a>' % (html.escape(m.group(2)), m.group(1)), t)
    t = re.sub(r'\[([^\]]+)\]\((/[^)\s]*)\)', r'<a class="tl" href="\2">\1</a>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\w)', r'<em>\1</em>', t)
    return t


def markdown(md):
    out, para, items = [], [], []
    def flush():
        if para:
            out.append('<p>' + inline(' '.join(para)) + '</p>'); para.clear()
        if items:
            out.append('<ul>' + ''.join('<li>' + inline(i) + '</li>' for i in items) + '</ul>'); items.clear()
    for line in md.splitlines():
        s = line.strip()
        if not s:
            flush(); continue
        h = re.match(r'^(#{2,3})\s+(.*)$', s)
        if h:
            flush(); lvl = len(h.group(1)); out.append('<h%d>%s</h%d>' % (lvl, inline(h.group(2)), lvl)); continue
        if re.match(r'^[-*]\s+', s):
            if para: flush()
            items.append(re.sub(r'^[-*]\s+', '', s)); continue
        if s.startswith('>'):
            flush(); out.append('<blockquote>' + inline(s.lstrip('> ')) + '</blockquote>'); continue
        if items: flush()
        para.append(s)
    flush()
    return '\n'.join(out)


def nice(d):
    return d.strftime('%B ') + str(d.day) + d.strftime(', %Y')


SERVICES = [('real-estate-photography', 'Real estate photography'), ('video', 'Video &amp; social reels'), ('drone', 'Drone &amp; aerial'),
            ('floor-plans', 'Floor plans &amp; 3D'), ('events', 'Event coverage'), ('dealerships', 'Dealership inventory')]

def footer_html(up):
    """Site footer: brand block + three grouped link columns (Studio / Services / Book), hairline, then a quiet legal bar. Shared by every page."""
    col = lambda title, links: '<div class="fcol"><h4>' + title + '</h4>' + ''.join('<a href="%s"%s>%s</a>' % (h, x, t) for h, t, x in links) + '</div>'
    ext = ' target="_blank" rel="noopener"'
    studio = [(up + '#about', 'About', ''), (up + 'about/', 'About Nick', ''), (up + '#portfolio', 'Portfolio', ''), (up + 'journal/', 'Journal', ''),
              (up + 'partners/', 'Partners', ''), (up + 'resources/', 'Resources', ''), (up + '#contact', 'Contact', '')]
    services = [(up + 'services/' + slug + '/', name, '') for slug, name in SERVICES]
    book = [(up + '#booking', 'Book a shoot', ''), (up + 'pricing/#book', 'Get a quote', ''), (up + 'pricing/', 'Pricing', ''),
            (up + 'account/', 'My quotes', ''), (up + 'referrals/', 'Referral program', ''), ('https://www.instagram.com/BlackSheepDigitalWorks/', 'Instagram ↗', ext)]
    legal = [(up + 'privacy/', 'Privacy &amp; data', ''), (up + 'terms/', 'Terms of service', ''), (up + 'disclaimer/', 'Disclaimer', ''),
             (up + 'accessibility/', 'Accessibility', ''), (up + 'comments-admin.php', 'Admin', ' rel="nofollow"')]
    return ('<footer>\n  <div class="wrap">\n    <div class="fgrid">\n'
            '      <div class="fbrand"><a href="' + up + '#home" aria-label="BlackSheep Digital Works home"><img class="logo-foot" src="' + up + 'img/logo.png" alt="BlackSheep Digital Works"></a>'
            '<p>Real estate, dealership and event media from Pickering to Kingston, north to Peterborough.</p>'
            '<p class="fcontact"><a href="tel:+16478883098">647.888.3098</a><a href="mailto:nic.mehra@gmail.com">nic.mehra@gmail.com</a></p></div>\n'
            '      ' + col('Studio', studio) + col('Services', services) + col('Book', book) + '\n    </div>\n'
            '    <div class="fbar"><span class="fsig">© ' + str(datetime.date.today().year) + ' BlackSheep Digital Works · From Conviction to Legacy</span>'
            '<div class="flegal">' + ''.join('<a href="%s"%s>%s</a>' % (h, x, t) for h, t, x in legal) + '</div></div>\n  </div>\n</footer>')

FOOTER_CSS = ('footer{padding-block:64px 26px!important;text-align:left}'
              'footer .wrap{align-items:stretch!important;gap:0!important}'
              'footer .fgrid{display:grid;grid-template-columns:minmax(0,1.4fr) repeat(3,minmax(0,1fr));gap:40px 44px;width:100%}'
              'footer .fbrand .logo-foot{width:150px;height:auto;display:block}'
              'footer .fbrand p{margin:16px 0 0;max-width:32ch;color:#A9ADB3;font-size:1rem;line-height:1.6}'
              'footer .fcontact{display:flex;flex-direction:column;gap:2px}'
              'footer .fcontact a{color:#EFEBE3;text-decoration:none;font-size:1rem}footer .fcontact a:hover{color:#FF3B42}'
              'footer .fcol{display:flex;flex-direction:column;align-items:flex-start;gap:2px}'
              'footer .fcol h4{margin:0 0 12px;font-family:var(--display);font-size:.7rem;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:#8E9299;text-shadow:none}'
              'footer .fcol h4::after{content:"";display:block;width:18px;height:2px;margin-top:10px;background:#D11F26;border-radius:2px}'
              'footer .fcol a{display:inline-flex;align-items:center;min-height:36px;color:#EFEBE3;text-decoration:none;font-size:1.06rem;letter-spacing:.01em;'
              'background:linear-gradient(currentColor,currentColor) 0 calc(100% - 7px)/0 1px no-repeat;transition:background-size .3s ease,color .2s ease}'
              'footer .fcol a:hover,footer .fcol a:focus-visible{background-size:100% 1px;color:#FF3B42}'
              'footer .fbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px;margin-top:52px;padding-top:22px;border-top:1px solid rgba(239,235,227,.12);font-size:.88rem;color:#8E9299}'
              'footer .flegal{display:flex;flex-wrap:wrap;gap:6px 22px}'
              'footer .flegal a{color:#A9ADB3;text-decoration:none;transition:color .2s ease}footer .flegal a:hover,footer .flegal a:focus-visible{color:#EFEBE3}'
              '@media (max-width:900px){footer .fgrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:36px 28px}footer .fbrand{grid-column:1/-1}}'
              '@media (max-width:600px){footer{padding-block:48px calc(24px + env(safe-area-inset-bottom))!important}footer .fgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:32px 20px}'
              'footer .fcol a{min-height:44px}footer .fcol:last-child{grid-column:1/-1}footer .fbar{flex-direction:column-reverse;align-items:flex-start;margin-top:36px}'
              'footer .flegal a{display:inline-flex;align-items:center;min-height:40px}}')

def page(title, desc, canonical, body, depth, og_image, extra_head=''):
    up = '../' * depth
    return f'''<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="light dark">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="article"><meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}"><meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE}/{og_image}">
<link rel="icon" href="{up}img/ram.png">
<link rel="stylesheet" href="{up}fonts/fonts.css">
<script>try{{var t=localStorage.getItem('bs-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}}catch(e){{}}</script>
<style>{CSS}{FOOTER_CSS}</style>
<link rel="alternate" type="application/rss+xml" title="The BlackSheep Journal" href="{SITE}/journal/feed.xml">
<meta name="twitter:card" content="summary_large_image">
{extra_head}
</head>
<body>
<header>
  <div class="wrap bar">
    <a class="brand lk" href="{up}#home" aria-label="BlackSheep Digital Works home">
      <img src="{up}img/ram.png" alt="">
      <span class="wm"><b>BlackSheep</b><span>Digital Works</span></span>
    </a>
    <nav aria-label="Main">
      <a class="lk" href="{up}#home">Home</a>
      <a class="lk" href="{up}#about">About</a>
      <a class="lk" href="{up}#portfolio">Portfolio</a>
      <a class="lk" href="{up}journal/" aria-current="page">Journal</a>
      <a class="lk" href="{up}pricing/">Pricing</a>
      <a class="lk" href="{up}#booking">Booking</a>
      <a class="lk" href="{up}#contact">Contact</a>
    </nav>
    <button class="theme-switch" id="themeSwitch" type="button" role="switch" aria-checked="true" aria-label="Dark mode">
      <span class="track"><span class="knob" id="knob"></span></span>
      <span class="mode-label" id="modeLabel">Dark</span>
    </button>
  </div>
</header>
<main>
{body}
</main>
{footer_html(up)}
<script>
(function(){{
  var root=document.documentElement, sw=document.getElementById('themeSwitch'), lab=document.getElementById('modeLabel'), knob=document.getElementById('knob');
  var moon='<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
  var sun='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
  function isDark(){{var a=root.getAttribute('data-theme');return a?a==='dark':!!(mq&&mq.matches);}}
  function sync(){{var d=isDark();sw.setAttribute('aria-checked',d?'true':'false');lab.textContent=d?'Dark':'Light';knob.innerHTML=d?moon:sun;}}
  sw.addEventListener('click',function(){{var n=isDark()?'light':'dark';root.setAttribute('data-theme',n);try{{localStorage.setItem('bs-theme',n);}}catch(e){{}}sync();}});
  if(mq&&mq.addEventListener)mq.addEventListener('change',sync);
  sync();
}})();
</script>
<script src="/react.js?v=8" defer></script>\n<script src="/comments.js?v=5" defer></script>\n<script src="/type-fx.js?v=12" defer></script>
<div class="view-note" role="note" hidden>Best viewed in light mode on Chrome, Safari, Firefox or Edge. Using Opera? Turn off its <b>Dark web pages</b> setting, or switch this site to Dark.<button type="button" class="vn-x" aria-label="Close this note">&times;</button></div>
<script>(function(){{var n=document.querySelector('.view-note');if(!n)return;try{{if(localStorage.getItem('vn-off')||sessionStorage.getItem('vn-seen')){{n.remove();return}}}}catch(e){{}}if(!window.matchMedia||!matchMedia('(max-width:760px)').matches){{n.remove();return}}document.body.appendChild(n);n.hidden=false;try{{sessionStorage.setItem('vn-seen','1')}}catch(e){{}}var gone=false;function hide(keep){{if(gone)return;gone=true;n.classList.remove('on');if(keep){{try{{localStorage.setItem('vn-off','1')}}catch(e){{}}}}setTimeout(function(){{n.remove()}},600)}}setTimeout(function(){{n.classList.add('on')}},900);setTimeout(function(){{hide(false)}},8000);addEventListener('scroll',function(){{if(scrollY>240)hide(false)}},{{passive:true}});n.querySelector('.vn-x').addEventListener('click',function(){{hide(true)}});}})();</script>
<script src="/chat-kb.js?v=1" defer></script><script src="/chat.js?v=1" defer></script>
</body>
</html>
'''


def build():
    today = datetime.date.today()
    posts = [parse(os.path.join(POSTS, f)) for f in sorted(os.listdir(POSTS)) if f.endswith('.md')]
    posts = sorted([p for p in posts if p['dt'] <= today], key=lambda p: p['dt'], reverse=True)
    slugs = [p['slug'] for p in posts]
    if len(set(slugs)) != len(slugs):
        sys.exit('Duplicate slug')
    os.makedirs(OUT, exist_ok=True)

    for i, p in enumerate(posts):
        img = p.get('image') or 'img/estate.jpg'
        alt = p.get('image_alt') or ''
        srcs = ''
        if p.get('sources'):
            lis = []
            for s in p['sources']:
                name, _, url = s.partition('|')
                lis.append('<li><a class="tl" href="%s" target="_blank" rel="noopener">%s</a></li>' % (html.escape(url.strip()), html.escape(name.strip())))
            srcs = '<section class="sources"><h2>Sources</h2><ul>' + ''.join(lis) + '</ul></section>'
        newer = posts[i - 1] if i > 0 else None
        older = posts[i + 1] if i + 1 < len(posts) else None
        pager = '<nav class="pager" aria-label="More entries">'
        pager += ('<a class="lk" href="../%s/">&#8249; %s</a>' % (older['slug'], html.escape(older['title']))) if older else '<span></span>'
        pager += ('<a class="lk" href="../%s/">%s &#8250;</a>' % (newer['slug'], html.escape(newer['title']))) if newer else '<span></span>'
        pager += '</nav>'
        canonical = '%s/journal/%s/' % (SITE, p['slug'])
        ld = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"BlogPosting","headline":%s,"datePublished":"%s","description":%s,"image":"%s/%s","author":{"@type":"Person","name":"Nick Mehra"},"publisher":{"@type":"Organization","name":"BlackSheep Digital Works"},"mainEntityOfPage":"%s"}</script>' % (
            json_str(p['title']), p['date'], json_str(p['description']), SITE, img, canonical)
        body = f'''<article class="wrap post">
  <a class="eyebrow lk back" href="../">&#8249; The Journal</a>
  <p class="eyebrow date"><time datetime="{p['date']}">{nice(p['dt'])}</time></p>
  <h1>{html.escape(p['title'])}</h1>
  <p class="lede">{html.escape(p['description'])}</p>
  <figure class="cover"><img src="../../{img}" alt="{html.escape(alt)}"></figure>
  <div class="prose">
{markdown(p['body'])}
  </div>
  {srcs}
  <div class="cta panel">
    <p class="eyebrow">Real estate · Dealership · Event media</p>
    <h2>Make your next listing <em>stand apart.</em></h2>
    <a class="btn red lk" href="../../#booking">Book a shoot</a>
  </div>
  <section data-comments="bs:{p['slug']}"></section>
  {pager}
</article>'''
        d = os.path.join(OUT, p['slug'])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(
            page(p['title'] + ' | BlackSheep Journal', p['description'], canonical, body, 2, img, ld))

    cards = []
    for p in posts:
        img = p.get('image') or 'img/estate.jpg'
        cards.append(f'''<a class="card panel lk2" href="{p['slug']}/">
    <span class="thumb"><img src="../{img}" alt="" loading="lazy"></span>
    <span class="txt"><span class="eyebrow"><time datetime="{p['date']}">{nice(p['dt'])}</time></span>
    <span class="ct">{html.escape(p['title'])}</span>
    <span class="cd">{html.escape(p['description'])}</span>
    <span class="more">Read the entry &#8250;</span></span>
  </a>''')
    empty = '<p class="muted">The first entry is on its way.</p>' if not posts else ''
    body = f'''<section class="wrap jhead">
  <p class="eyebrow">The BlackSheep Journal</p>
  <h1>Notes from <em>behind the lens.</em></h1>
  <p class="lede">Listing media, market moves and the craft of making a property stand apart in Durham and across Ontario.</p>
</section>
<section class="wrap cards">
  {''.join(cards)}{empty}
</section>'''
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(
        page('The Journal | BlackSheep Digital Works', 'Notes on real estate, dealership and event media in Ontario from BlackSheep Digital Works.', SITE + '/journal/', body, 1, 'img/og-image.jpg'))

    # sitemap
    urls = ['  <url>\n    <loc>%s/journal/</loc>\n    <lastmod>%s</lastmod>\n  </url>' % (SITE, posts[0]['date'] if posts else today.isoformat())]
    for p in posts:
        urls.append('  <url>\n    <loc>%s/journal/%s/</loc>\n    <lastmod>%s</lastmod>\n  </url>' % (SITE, p['slug'], p['date']))
    sm_path = os.path.join(ROOT, 'sitemap.xml')
    sm = open(sm_path, encoding='utf-8').read()
    sm = re.sub(r'\s*<!-- journal -->.*?<!-- /journal -->', '', sm, flags=re.S)
    sm = sm.replace('</urlset>', '  <!-- journal -->\n' + '\n'.join(urls) + '\n  <!-- /journal -->\n</urlset>')
    open(sm_path, 'w', encoding='utf-8').write(sm)
    # RSS feed so readers and aggregators can follow the journal
    from email.utils import format_datetime
    items=[]
    for p in posts[:30]:
        dt=datetime.datetime.combine(p['dt'],datetime.time(6,0),tzinfo=datetime.timezone(datetime.timedelta(hours=-5)))
        u='%s/journal/%s/'%(SITE,p['slug'])
        items.append('<item><title>%s</title><link>%s</link><guid isPermaLink="true">%s</guid><pubDate>%s</pubDate><description>%s</description></item>'%(html.escape(p['title']),u,u,format_datetime(dt),html.escape(p['description'])))
    open(os.path.join(OUT,'feed.xml'),'w',encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>The BlackSheep Journal</title><link>%s/journal/</link><atom:link href="%s/journal/feed.xml" rel="self" type="application/rss+xml"/><description>Notes on real estate, dealership and event media in Ontario from BlackSheep Digital Works.</description><language>en-ca</language>%s</channel></rss>\n'%(SITE,SITE,''.join(items)))
    print('Built %d post(s): %s' % (len(posts), ', '.join(slugs)))


def json_str(s):
    import json
    return json.dumps(s)


if __name__ == '__main__':
    build()
