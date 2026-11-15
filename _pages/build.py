#!/usr/bin/env python3
"""Builds /pricing/ and /account/ from the price list in bs-lib.php (single source of truth).
Run after changing prices:  python3 _pages/build.py"""
import html, json, os, re, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, '_blog'))
import build as blog  # reuse the site's page template (header, footer, theme switch)

CAT = json.loads(subprocess.check_output(['php', '-r', '$_SERVER["SCRIPT_FILENAME"]="x"; require "%s/bs-lib.php"; echo json_encode(bs_catalog());' % ROOT]))
CSS = open(os.path.join(ROOT, '_pages', 'pages.css'), encoding='utf-8').read()
E = html.escape
def money(n): return '${:,.0f}'.format(n)


def nav_fix(page, current):
    page = page.replace(' aria-current="page"', '')
    if current == 'pricing':
        page = page.replace('href="../pricing/">Pricing</a>', 'href="../pricing/" aria-current="page">Pricing</a>', 1)
    return page

def pkg_card(p, seg):
    feat = ' feat' if p.get('flag') else ''
    flag = '<span class="flag">%s</span>' % E(p['flag']) if p.get('flag') else ''
    if p.get('perunit'):
        price = '<div class="price">From $35<small> / unit</small></div>'
    else:
        was = '<span class="was">%s</span>' % money(p['was']) if p.get('was') else ''
        price = '<div class="price">%s%s</div>' % (money(p['price']), was)
        if p.get('was'):
            price += '<span class="save">SAVE %s</span>' % money(p['was'] - p['price'])
    items = ''.join('<li>%s</li>' % E(i) for i in p['items'])
    return ('<article class="pc tilt3%s" data-seg="%s">%s<h3>%s</h3>%s<ul>%s</ul>'
            '<a class="btn lk" href="#book" data-pick="%s" data-seg="%s">Choose %s</a></article>') % (
        feat, seg, flag, E(p['name']), price, items, p['id'], seg, E(p['name']))


def pricing():
    re_c, au_c = CAT['re'], CAT['auto']
    re_cards = ''.join(pkg_card(p, 're') for p in re_c['packages'])
    au_cards = ''.join(pkg_card(p, 'auto') for p in au_c['packages'])
    ev_c = CAT['ev']
    ev_cards = ''.join(pkg_card(p, 'ev') for p in ev_c['packages'])
    ev_alc = '<div><span>Extra coverage hour (up to 3 hours total)</span><b>%s</b></div>' % money(ev_c['hourPrice']) + ''.join('<div><span>%s</span><b>%s</b></div>' % (E(a['name']), money(a['price'])) for a in ev_c['addons'])
    re_alc = ''.join('<div><span>%s</span><b>%s</b></div>' % (E(a['name']), 'On request' if a.get('quote') else money(a['price'])) for a in re_c['addons'])
    au_alc = ''.join('<div><span>%s</span><b>%s</b></div>' % (E(a['name']), money(a['price'])) for a in au_c['unitAddons']) + \
             ''.join('<div><span>%s</span><b>%s</b></div>' % (E(a['name']), 'On request' if a.get('quote') else money(a['price'])) for a in au_c['addons'])
    notes = ' · '.join(E(n) for n in CAT['notes'])
    body = f'''
<section class="pg"><div class="wrap">
  <span class="eyebrow">Pricing</span>
  <h1>Clear prices. <em>No surprises.</em></h1>
  <p class="lede sub">Pick a package, add what you need, and get a numbered quote by email in seconds, with a PDF you can approve from your inbox.</p>
  <div class="seg" role="group" aria-label="Show prices for"><span class="pill" aria-hidden="true"></span>
    <button type="button" data-seg="re" aria-pressed="true">Real estate</button><button type="button" data-seg="auto" aria-pressed="false">Dealerships</button><button type="button" data-seg="ev" aria-pressed="false">Events</button></div>
  <p class="acct" id="acctStrip"><span>Quotes you request here are saved on this device under <a class="lk" href="../account/">My quotes</a>.</span></p>
</div></section>

<section class="sec" id="packages"><div class="wrap">
  <span class="eyebrow">Packages</span>
  <h2 data-seg-text="re">Listings that <em>look the part.</em></h2>
  <h2 data-seg-text="auto" hidden>Inventory that <em>sells itself.</em></h2>
  <h2 data-seg-text="ev" hidden>Your event, <em>told well.</em></h2>
  <div class="pk" data-seg-box="re">{re_cards}</div>
  <div class="pk" data-seg-box="auto" hidden>{au_cards}</div>
  <div class="pk" data-seg-box="ev" hidden>{ev_cards}</div>
  <p class="note" data-seg-text="re">Packages cover homes up to 2,999 sq ft. 3,000–3,999 sq ft adds $100, 4,000–4,999 sq ft adds $200, 5,000+ is quoted.</p>
  <p class="note" data-seg-text="auto" hidden>Per-unit visits start at 10 cars or trucks, or 5 RVs. Monthly lot programs and RV shows are quoted.</p>
  <p class="note" data-seg-text="ev" hidden>Community festivals, brand activations, corporate and private events. Coverage runs up to 3 hours per event, with unlimited edited photos. <b>Weddings are not offered.</b></p>
</div></section>

<section class="sec" id="alacarte"><div class="wrap">
  <span class="eyebrow">À la carte</span>
  <h2>Build it <em>your way.</em></h2>
  <div class="alc" data-seg-box="re">{re_alc}</div>
  <div class="alc" data-seg-box="auto" hidden>{au_alc}</div>
  <div class="alc" data-seg-box="ev" hidden>{ev_alc}</div>
  <p class="note">{notes}</p>
</div></section>

<section class="sec" id="flyers"><div class="wrap">
  <span class="eyebrow">Take it with you</span>
  <h2>Download the <em>rate cards.</em></h2>
  <p class="sub">Print-ready flyers for your office, your brokerage, your sales floor or your event team.</p>
  <div class="fly">
    <a class="fl tilt3" href="flyers/BlackSheep-Real-Estate-Flyer.pdf?v=3" download><span class="sheet"><img src="flyers/real-estate-preview.jpg?v=3" alt="BlackSheep real estate rate card" loading="lazy"></span><b>Real estate flyer</b><span class="btn lk">Download PDF</span></a>
    <a class="fl tilt3" href="flyers/BlackSheep-Dealership-Flyer.pdf?v=3" download><span class="sheet"><img src="flyers/dealership-preview.jpg?v=3" alt="BlackSheep dealership rate card" loading="lazy"></span><b>Dealership flyer</b><span class="btn lk">Download PDF</span></a>
    <a class="fl tilt3" href="flyers/BlackSheep-Event-Flyer.pdf?v=1" download><span class="sheet"><img src="flyers/event-preview.jpg?v=1" alt="BlackSheep event coverage rate card" loading="lazy"></span><b>Event flyer</b><span class="btn lk">Download PDF</span></a>
  </div>
</div></section>

<section class="sec" id="book"><div class="wrap">
  <span class="eyebrow">Book &amp; get your quote</span>
  <h2>Build your shoot. <em>See the price live.</em></h2>
  <p class="sub">Your quote is emailed to you with a PDF and a quote number good for 30 days. Approve it from the email to confirm your booking.</p>
  <div class="bk-gate" data-form="qForm" data-email="q-email"></div>
  <form class="build" id="qForm" novalidate>
    <div>
      <div class="step"><h3><i>1</i>Package</h3>
        <div class="opts" id="pkgOpts" role="radiogroup" aria-label="Package"></div></div>
      <div class="step"><h3><i>2</i>Add services</h3>
        <div id="sizeBox" class="f"><label for="q-size">Home size</label><select id="q-size"></select></div>
        <div id="unitBox" class="units" hidden>
          <div class="ctr"><span>Cars &amp; trucks</span><div><button type="button" data-u="cars" data-d="-1" aria-label="Fewer cars">−</button><input id="q-cars" inputmode="numeric" value="0" aria-label="Number of cars and trucks"><button type="button" data-u="cars" data-d="1" aria-label="More cars">+</button></div></div>
          <div class="ctr"><span>RVs &amp; trailers</span><div><button type="button" data-u="rvs" data-d="-1" aria-label="Fewer RVs">−</button><input id="q-rvs" inputmode="numeric" value="0" aria-label="Number of RVs and trailers"><button type="button" data-u="rvs" data-d="1" aria-label="More RVs">+</button></div></div>
        </div>
        <div id="hoursBox" class="f" hidden><label for="q-hours">Extra coverage hours</label><select id="q-hours"></select></div>
        <div class="opts" id="addOpts"></div></div>
      <div class="step"><h3><i>3</i>When</h3>
        <div class="pick">
          <div class="cal"><div class="cal-head"><button type="button" class="cal-nav" id="calPrev" aria-label="Previous month">&#8249;</button><b id="calTitle" aria-live="polite"></b><button type="button" class="cal-nav" id="calNext" aria-label="Next month">&#8250;</button></div>
            <div class="cal-dow" aria-hidden="true"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div class="cal-grid" id="calGrid"></div></div>
          <div class="slots" id="slots"><p class="wk">Choose a date to see open times. Weekdays only; weekend shoots by appointment at 647.888.3098.</p></div>
        </div></div>
      <div class="step"><h3><i>4</i>Your details</h3>
        <div class="fields">
          <div class="f"><label for="q-name">Name</label><input id="q-name" autocomplete="name" required></div>
          <div class="f"><label for="q-email">Email</label><input id="q-email" type="email" autocomplete="email" required></div>
          <div class="f"><label for="q-phone">Phone</label><input id="q-phone" type="tel" autocomplete="tel"></div>
          <div class="f"><label for="q-company">Company or organization (optional)</label><input id="q-company" autocomplete="organization"></div>
          <div class="f"><label for="q-type">Shoot type</label><select id="q-type"></select></div>
          <div class="f"><label for="q-addr">Address or city</label><input id="q-addr" autocomplete="street-address"></div>
        </div>
        <div class="f"><label for="q-notes">Notes (optional)</label><textarea id="q-notes" placeholder="Access, lockbox, deadlines, anything we should know"></textarea></div>
        <div class="hp" aria-hidden="true"><label for="q-web">Website</label><input id="q-web" tabindex="-1" autocomplete="off"></div>
      </div>
    </div>
    <aside class="sum" aria-live="polite"><h3>Your quote</h3><ul id="sumList"><li class="empty">Pick a package or a service.</li></ul>
      <div class="tot"><div><span>Subtotal</span><span id="sumSub">$0</span></div><div><span>HST 13%</span><span id="sumHst">$0</span></div><div class="big"><span>Total</span><span id="sumTot">$0</span></div></div>
      <p class="flags" id="sumFlags"></p><p class="err" id="qErr" role="alert" hidden></p>
      <button class="btn primary lk" type="submit" id="qGo">Email my quote</button>
      <p class="flags">Approximate quote. Final pricing is confirmed after we review the property or inventory.</p></aside>
  </form>
  <div class="done" id="qDone" hidden></div>
</div></section>
'''
    data = json.dumps(CAT).replace('</', '<\\/')
    js = '<script>window.BS_CAT=' + data + ';</script>\n<script src="calc.js?v=2"></script><script src="/booking-gate.js?v=2" defer></script><script src="pricing.js?v=6"></script>'
    page = blog.page('Pricing | BlackSheep Digital Works', 'Real estate, dealership and event photo, video and drone pricing. Build your package and get an instant numbered quote with a PDF.',
                     blog.SITE + '/pricing/', body, 1, 'img/og-image.jpg', '<style>' + CSS + '</style>')
    page = page.replace('</body>', js + '\n</body>', 1)
    page = page.replace('<meta property="og:type" content="article">', '<meta property="og:type" content="website">')
    return nav_fix(page, 'pricing')


def account():
    body = '''
<section class="pg"><div class="wrap">
  <span class="eyebrow">My quotes</span>
  <h1>Your quotes, <em>on this device.</em></h1>
  <p class="sub">No account needed. Quotes you request on this phone or computer are listed here, and every one is also in your email with its PDF and approve button. We don't keep client details on this website.</p>
  <div class="hist" id="hist"></div>
  <p class="note" id="none" hidden>No quotes on this device yet. <a class="lk" href="../pricing/#book">Build one in a minute</a>, or check your email for quotes you requested elsewhere.</p>
  <p class="note"><button type="button" class="btn lk" id="clr" hidden>Clear this list</button></p>
</div></section>
'''
    page = blog.page('My quotes | BlackSheep Digital Works', 'Your BlackSheep quotes saved on this device.', blog.SITE + '/account/', body, 1, 'img/og-image.jpg',
                     '<meta name="robots" content="noindex"><style>' + CSS + '</style>')
    page = page.replace('</body>', '<script src="../pricing/account.js?v=2"></script>\n</body>', 1)
    return nav_fix(page, 'account')


open(os.path.join(ROOT, 'pricing', 'index.html'), 'w', encoding='utf-8').write(pricing())
# Price list for the homepage booking form (same source as everything else)
open(os.path.join(ROOT, 'pricing', 'catalog.js'), 'w', encoding='utf-8').write('window.BS_CAT=' + json.dumps(CAT, ensure_ascii=False) + ';\n')
open(os.path.join(ROOT, 'account', 'index.html'), 'w', encoding='utf-8').write(account())
print('Built pricing/ and account/')


# ---------- service pages, legal pages, homepage footer ----------
import content as C
def simple(path, title, desc, body, depth, current=None):
    page = blog.page(title + ' | BlackSheep Digital Works', desc, blog.SITE + '/' + path + '/', body, depth, 'img/og-image.jpg', '<style>' + CSS + '</style>')
    page = page.replace('<meta property="og:type" content="article">', '<meta property="og:type" content="website">')
    os.makedirs(os.path.join(ROOT, path), exist_ok=True)
    open(os.path.join(ROOT, path, 'index.html'), 'w', encoding='utf-8').write(nav_fix(page, current))

svc = C.services(CAT)
for x in svc:
    simple('services/' + x['slug'], x['title'], re.sub('<[^>]+>', '', x['lede'])[:155], C.service_body(x), 2)
cards = ''.join('<a class="pc in" href="%s/" style="text-decoration:none"><span class="eyebrow">%s</span><h3>%s</h3><p class="sub">%s</p><span class="btn lk">Learn more</span></a>' % (x['slug'], x['kicker'], E(x['title']), x['lede'].split('. ')[0] + '.') for x in svc)
simple('services', 'Services', 'Real estate photography, video, drone, floor plans, event coverage and dealership inventory media.',
       '<section class="pg"><div class="wrap"><span class="eyebrow">Services</span><h1>What we <em>shoot.</em></h1><div class="pk">' + cards + '</div></div></section>', 1)
simple('partners', 'Preferred partners', 'Trusted local businesses BlackSheep Digital Works recommends to its clients.', C.partners_body(), 1)
simple('about', 'About Nick Mehra', 'Nick Mehra, Owner and Creative Director of BlackSheep Digital Works: almost two decades in law enforcement, now behind the lens.', C.about_body(), 1)
simple('resources', 'Resources', 'Free guides, printable rate cards and quick answers from BlackSheep Digital Works.', C.resources_body(), 1)
for L in C.legal_pages():
    simple(L['slug'], L['title'], L['desc'], '<section class="pg"><div class="wrap"><span class="eyebrow">' + E(L['title']) + '</span><h1>' + E(L['title']) + '</h1><div class="legal">' + L['body'] + '</div></div></section>', 1)

# homepage footer + footer styles come from the same template as every other page
hp = os.path.join(ROOT, 'index.html'); h = open(hp, encoding='utf-8').read()
h = re.sub(r'<footer>.*?</footer>', lambda m: blog.footer_html(''), h, count=1, flags=re.S)
h = re.sub(r'/\*fcss\*/.*?/\*/fcss\*/', '', h, flags=re.S)
h = re.sub(r'footer \.fcols\{display:grid;grid-template-columns:repeat\(3.*?footer \.fcol a\{font-size:1rem\}\}', '', h, flags=re.S)  # footer styles from before the redesign
h = h.replace('</style>', '/*fcss*/' + blog.FOOTER_CSS + '/*/fcss*/</style>', 1)
open(hp, 'w', encoding='utf-8').write(h)
print('Built services, legal pages and homepage footer')
