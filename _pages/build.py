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
    <button type="button" data-seg="re" aria-pressed="true">Real estate</button><button type="button" data-seg="auto" aria-pressed="false">Dealerships</button></div>
  <p class="acct" id="acctStrip"><span>Quotes you request here are saved on this device under <a class="lk" href="../account/">My quotes</a>.</span></p>
</div></section>

<section class="sec" id="packages"><div class="wrap">
  <span class="eyebrow">Packages</span>
  <h2 data-seg-text="re">Listings that <em>look the part.</em></h2>
  <h2 data-seg-text="auto" hidden>Inventory that <em>sells itself.</em></h2>
  <div class="pk" data-seg-box="re">{re_cards}</div>
  <div class="pk" data-seg-box="auto" hidden>{au_cards}</div>
  <p class="note" data-seg-text="re">Packages cover homes up to 2,999 sq ft. 3,000–3,999 sq ft adds $100, 4,000–4,999 sq ft adds $200, 5,000+ is quoted.</p>
  <p class="note" data-seg-text="auto" hidden>Per-unit visits start at 10 cars or trucks, or 5 RVs. Monthly lot programs and RV shows are quoted.</p>
</div></section>

<section class="sec" id="alacarte"><div class="wrap">
  <span class="eyebrow">À la carte</span>
  <h2>Build it <em>your way.</em></h2>
  <div class="alc" data-seg-box="re">{re_alc}</div>
  <div class="alc" data-seg-box="auto" hidden>{au_alc}</div>
  <p class="note">{notes}</p>
</div></section>

<section class="sec" id="flyers"><div class="wrap">
  <span class="eyebrow">Take it with you</span>
  <h2>Download the <em>rate cards.</em></h2>
  <p class="sub">Print-ready flyers for your office, your brokerage or your sales floor.</p>
  <div class="fly">
    <a class="fl tilt3" href="flyers/BlackSheep-Real-Estate-Flyer.pdf" download><span class="sheet"><img src="flyers/real-estate-preview.jpg" alt="BlackSheep real estate rate card" loading="lazy"></span><b>Real estate flyer</b><span class="btn lk">Download PDF</span></a>
    <a class="fl tilt3" href="flyers/BlackSheep-Dealership-Flyer.pdf" download><span class="sheet"><img src="flyers/dealership-preview.jpg" alt="BlackSheep dealership rate card" loading="lazy"></span><b>Dealership flyer</b><span class="btn lk">Download PDF</span></a>
  </div>
</div></section>

<section class="sec" id="book"><div class="wrap">
  <span class="eyebrow">Book &amp; get your quote</span>
  <h2>Build your shoot. <em>See the price live.</em></h2>
  <p class="sub">Your quote is emailed to you with a PDF and a quote number good for 30 days. Approve it from the email to confirm your booking.</p>
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
          <div class="f"><label for="q-company">Brokerage or dealership (optional)</label><input id="q-company" autocomplete="organization"></div>
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
    js = '<script>window.BS_CAT=' + data + ';</script>\n<script src="pricing.js?v=2"></script>'
    page = blog.page('Pricing | BlackSheep Digital Works', 'Real estate and dealership photo, video and drone pricing. Build your package and get an instant numbered quote with a PDF.',
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
open(os.path.join(ROOT, 'account', 'index.html'), 'w', encoding='utf-8').write(account())
print('Built pricing/ and account/')
