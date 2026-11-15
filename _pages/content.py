"""Service pages and legal pages for blacksheepdigitalworks.ca (built by _pages/build.py).
Facts only: nothing here claims licences, insurance, awards or results that have not been confirmed."""

import os
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPDATED = 'November 14, 2026'
EMAIL = 'nic.mehra@gmail.com'
PHONE = '647.888.3098'
AREA = 'Pickering to Kingston and north to Peterborough, plus the GTA'

def money(n): return '${:,.0f}'.format(n)

def services(cat):
    re_, au, ev = cat['re'], cat['auto'], cat['ev']
    rp = {p['id']: p for p in re_['packages']}
    ra = {a['id']: a for a in re_['addons']}
    return [
        dict(slug='real-estate-photography', title='Real estate photography', seg='re',
             kicker='HDR · MLS-READY', h1='Listings that <em>look the part.</em>',
             lede='Bracketed HDR interiors with true-to-life colour and straight verticals, and exteriors that show the home at its best. Every package includes unlimited photos, as many as the property needs.',
             gets=['Unlimited HDR photos in every package, edited and MLS-ready', 'Straight verticals, balanced windows and natural colour', 'Sky replacement on Essential', 'Twilight exteriors on request', 'Delivery in 24–72 hours depending on volume, most within 24–48'],
             prices=[(p['name'], money(p['price']), ' · '.join(p['items'][:3])) for p in re_['packages']],
             price_note='Packages cover homes up to 2,999 sq ft; 3,000–3,999 sq ft adds $100 and 4,000–4,999 sq ft adds $200; 5,000+ is quoted. Photo-only: 25 photos %s, 35 photos %s.' % (money(ra['re-p25']['price']), money(ra['re-p35']['price']))),
        dict(slug='video', title='Video & social reels', seg='re',
             kicker='4K · STABILIZED', h1='Walkthroughs that <em>move buyers.</em>',
             lede='Cinematic walkthroughs and short vertical cuts built for Instagram and Reels, for listings, dealerships and events.',
             gets=['Cinematic walkthrough video (60–90 s in The Legacy package)', 'Vertical social reels sized for Instagram, Facebook and TikTok', 'Stabilized 4K capture'],
             prices=[('Cinematic walkthrough video', money(ra['re-video']['price']), 'Add-on, or included in Cinematic and The Legacy'), ('Vertical social reel', money(ra['re-reel']['price']), 'Add-on, or included in Cinematic and The Legacy'), (rp['re-cinematic']['name'] + ' package', money(rp['re-cinematic']['price']), 'Unlimited photos, walkthrough video + reel, drone, plan')],
             price_note='Dealership walkaround videos are priced per unit; event films are part of the event packages.'),
        dict(slug='drone', title='Drone & aerial', seg='re',
             kicker='AERIAL', h1='The view buyers <em>can\'t get from the curb.</em>',
             lede='Lot lines, neighbourhood context and the approach to the front door, captured from above, for homes, dealership lots and events.',
             gets=['Aerial photos and video of the property, lot or site', 'Neighbourhood and amenity context', 'Every flight is checked first against airspace, weather and the people and property around it; if a site cannot be flown safely or legally, we tell you before the shoot'],
             prices=[('Drone photos', money(ra['re-drone']['price']), 'Real estate add-on'), ('Drone photos + video', money(ra['re-dronevid']['price']), 'Real estate add-on'), ('Aerial lot showcase', money(next(a for a in au['addons'] if a['id'] == 'au-aerial')['price']), 'Dealerships; included in The Fleet and The Caravan'), ('Event drone coverage', money(next(a for a in ev['addons'] if a['id'] == 'ev-drone')['price']), 'Events; included in Showcase')],
             price_note='Want to know what the rules require before a drone goes up over your listing? Read <a class="lk" href="../../journal/drone-listing-rules-ontario/">our drone rules guide</a>.'),
        dict(slug='floor-plans', title='Floor plans & 3D', seg='re',
             kicker='2D PLANS · 3D', h1='Show the layout <em>before the showing.</em>',
             lede='Measured floor plans so buyers understand the layout and flow of a home before they book a visit.',
             gets=['2D floor plans with room layout', '3D floor plans for a clearer sense of space', '2D plan included in every real estate package; 2D + 3D in The Legacy'],
             prices=[('2D floor plan', money(ra['re-2d']['price']), 'Add-on'), ('3D floor plan', money(ra['re-3d']['price']), 'Add-on, included in The Legacy')],
             price_note='RV layout plans for dealerships are %s per unit.' % money(next(a for a in au['unitAddons'] if a['id'] == 'rv-plan')['price'])),
        dict(slug='events', title='Event coverage', seg='ev',
             kicker='PHOTO · FILM · REELS', h1='Your event, <em>told well.</em>',
             lede='Community festivals, brand activations, corporate and private events, covered from the wide scene to the candid moment. Coverage runs up to 3 hours per event, with unlimited edited photos. Weddings are not offered.',
             gets=['Unlimited edited photos in every package', 'Highlight reels and recap films', 'Vertical social reels', 'Drone coverage where permitted', 'Up to 3 hours of coverage per event'],
             prices=[(p['name'], money(p['price']), ' · '.join(p['items'][:3])) for p in ev['packages']],
             price_note='Add-ons: extra hour %s (up to 3 hours total), drone %s, extra reel %s, 48-hour rush %s. Weddings are not offered.' % tuple(money(x) for x in [ev['hourPrice']] + [a['price'] for a in ev['addons']])),
        dict(slug='dealerships', title='Dealership inventory', seg='auto',
             kicker='CARS · TRUCKS · RVS', h1='Inventory that <em>sells itself.</em>',
             lede='Consistent lot and inventory photography that keeps every listing uniform, with walkaround video for every unit, shot on-site.',
             gets=['Unlimited photos per unit in The Fleet and The Caravan, inside and out', 'Walkaround or walkthrough video for every unit', 'Aerial lot showcase', 'RV 2D layout plans', 'Monthly lot programs for new arrivals'],
             prices=[(p['name'], 'From $35 / unit' if p.get('perunit') else money(p['price']), ' · '.join(p['items'][:2])) for p in au['packages']],
             price_note='Per-unit visits start at 10 cars or trucks, or 5 RVs. Monthly lot programs and RV shows are quoted.'),
    ]

def service_body(s):
    gets = ''.join('<li>%s</li>' % g for g in s['gets'])
    rows = ''.join('<div><span><b>%s</b><em>%s</em></span><b>%s</b></div>' % (n, d, p) for n, p, d in s['prices'])
    return f'''
<section class="pg"><div class="wrap">
  <span class="eyebrow">{s['kicker']}</span>
  <h1>{s['h1']}</h1>
  <p class="lede sub">{s['lede']}</p>
  <div class="acts"><a class="btn primary lk" href="../../pricing/#book-{s['seg']}">Get an instant quote</a><a class="btn lk" href="../../#booking">Request a booking</a></div>
</div></section>
<section class="sec"><div class="wrap">
  <span class="eyebrow">What you get</span>
  <ul class="gets">{gets}</ul>
</div></section>
<section class="sec"><div class="wrap">
  <span class="eyebrow">Pricing</span>
  <h2>Clear prices. <em>No surprises.</em></h2>
  <div class="alc svc-prices">{rows}</div>
  <p class="note">{s['price_note']} Prices in CAD, plus 13% HST.</p>
</div></section>
<section class="sec"><div class="wrap">
  <span class="eyebrow">How it works</span>
  <ol class="steps"><li><b>Pick your package</b><span>Build it on the pricing page for a numbered quote by email, or send a booking request.</span></li>
  <li><b>We confirm</b><span>Nick confirms the date, time and access details with you personally.</span></li>
  <li><b>We shoot</b><span>On-site, on schedule, weekdays; weekend shoots by appointment.</span></li>
  <li><b>You receive</b><span>Edited files delivered online, typically within 24–72 hours depending on volume.</span></li></ol>
  <p class="note">Serving {AREA}. Travel within the GTA is included; beyond the GTA is quoted per km.</p>
</div></section>
'''

def legal_pages():
    P = []
    P.append(dict(slug='privacy', title='Privacy & data protection', desc='How BlackSheep Digital Works handles your information: what is collected, where it lives, and how to have it deleted.', body=f'''
<p class="upd">Last updated {UPDATED}</p>
<p>BlackSheep Digital Works is a small photography and video business in Ontario run by Nick Mehra. We collect as little information as we can, and we keep it off this website wherever possible. This page explains, in plain language, exactly what happens to your information. It is written to follow Canada's private-sector privacy law (PIPEDA).</p>

<h2>The short version</h2>
<ul>
<li>This website does not store your contact details, quotes or booking details.</li>
<li>What our web host does store: the <b>name and comment</b> you choose to post, totals of likes and dislikes, the numbers of quotes that have been approved.</li>
<li>No advertising, no tracking pixels, no analytics, no cookies for tracking. Fonts and other files are served from our own site, so your browser doesn't contact Google or other third parties when you visit.</li>
<li>You can ask us to see, correct or delete your information at any time: <a class="lk" href="mailto:{EMAIL}">{EMAIL}</a>.</li>
</ul>

<h2>What we collect, and where it goes</h2>
<h3>Quote requests (pricing page)</h3>
<p>When you build a quote, the details you type (name, email, phone, company, address, date, notes and the services you pick) are used once to calculate your price and create your PDF. They are emailed to you and to us, and <b>are not saved on the website</b>. Your quote links (PDF and approve button) carry the quote inside the link itself, sealed with a digital signature so it cannot be altered. When you approve a quote, the website records only the quote number and the time, so it cannot be approved twice.</p>
<h3>Booking requests (homepage)</h3>
<p>Your booking request is emailed to you and to us, and the details are not saved on the website.</p>
<h3>Email verification and the "I'm human" check</h3>
<p>Before you can request a booking or a quote, you confirm you're human (your browser solves a small puzzle by itself; no tracking and no third-party service) and enter a 6-digit code we email you. The code is stored only in scrambled form and is deleted as soon as it's used or after 15 minutes. Once verified, your browser keeps a signed cookie for 30 days so you don't have to repeat the code. It contains only your email address and an expiry date.</p>
<h3>Messages (homepage contact form)</h3>
<p>The contact form opens your own email app with your message written out. Nothing is sent until you press send, and nothing is stored on the website.</p>
<h3>Comments</h3>
<p>If you comment, we store the name you enter, your comment, when you posted it, and (for comments on our photos) which photo and which comment you replied to, so we can show it in the right thread after we approve it. We do not store your email, IP address or device details with comments. Please don't put private information in a comment, because approved comments are public.</p>
<h3>Likes and dislikes</h3>
<p>We store only the running totals for each photo. Your own choice is remembered in your browser so you can change it; nothing identifies you on our side.</p>
<h3>Things kept in your browser only</h3>
<p>Your light/dark choice, whether you closed a notice, your likes, and the "My quotes" list are saved in your own browser (local storage). They never reach us. Clearing your browser data removes them.</p>
<h3>Our web host's records</h3>
<p>Like every website, our host (Hostinger) automatically keeps short-term technical logs of requests, such as IP address, browser type and the page requested, for security and to keep the site running. These are handled under Hostinger's own privacy policy. We do not use them to identify or track visitors.</p>

<h2>Where your client records are kept</h2>
<p>When you request a quote, approve a booking or work with us, your details and the documents we send you are kept in our business email (Google Gmail) and in private business records on our office computer, with an encrypted-in-transit backup in our private Google Drive. They are not on the website. Access is limited to Nick Mehra.</p>

<h2>Why we use it</h2>
<p>Only to prepare quotes, schedule and deliver your shoot, invoice you, answer your questions, and keep the business records the law requires. We never sell, rent or trade your information, and we don't use it for advertising.</p>

<h2>How long we keep it</h2>
<p>Comments stay until you ask us to remove them or we take them down. Client records are kept as long as needed to serve you, and business and tax records for as long as Canadian tax law requires (generally six years). After that they are deleted.</p>

<h2>Security</h2>
<p>The site runs only over encrypted HTTPS with strict browser security rules, stores no passwords or payment details from visitors, keeps its own files and signing keys outside the public web folder, and keeps personal information off the server entirely. No system can be guaranteed 100% secure. Because so little personal information is stored on the website, a break-in at our web host would expose, at most, names and comments, and anonymous like totals. No email addresses, phone numbers, addresses, booking details or payment information are stored there. If a breach of our safeguards ever creates a real risk of significant harm to you, we will notify you and report it to the Office of the Privacy Commissioner of Canada as the law requires.</p>

<h2>Your choices: see, correct or delete your information</h2>
<p>Email <a class="lk" href="mailto:{EMAIL}">{EMAIL}</a> or call or text {PHONE} and tell us what you'd like. We will respond within 30 days. When you ask us to delete your information, we remove your comments, quotes, emails and our local and backup copies, except anything we must keep by law (for example, invoices for tax purposes), which we will tell you about.</p>

<h2>Photos of people and property</h2>
<p>Photos we take for clients belong to that work, and are shown in our portfolio only where we have the right to show them. If you appear in a photo on this site and want it removed, email us and we will take it down.</p>

<h2>Questions or complaints</h2>
<p>Contact Nick Mehra at <a class="lk" href="mailto:{EMAIL}">{EMAIL}</a>. If you are not satisfied with our answer, you can contact the <a class="lk" href="https://www.priv.gc.ca/" target="_blank" rel="noopener">Office of the Privacy Commissioner of Canada</a>.</p>
'''))
    P.append(dict(slug='terms', title='Terms of service', desc='The terms for using blacksheepdigitalworks.ca and booking BlackSheep Digital Works.', body=f'''
<p class="upd">Last updated {UPDATED}</p>
<p>These terms apply when you use blacksheepdigitalworks.ca ("the site") or book BlackSheep Digital Works ("BlackSheep", "we", "us"), a business operated by Nick Mehra in Ontario, Canada. By using the site or booking with us, you agree to them. If anything here conflicts with a written agreement we sign with you, the written agreement wins.</p>

<h2>1. Quotes and prices</h2>
<ul>
<li>Prices are in Canadian dollars, plus 13% HST.</li>
<li>Quotes from the site are approximate estimates based on what you entered. Each quote is valid for 30 days from the date issued. Final pricing is confirmed once we review the property, inventory or event.</li>
<li>Prices shown on the site may change at any time; a quote you received keeps its prices until it expires.</li>
<li>Travel within the GTA is included; travel beyond the GTA is quoted per km.</li>
</ul>

<h2>2. Bookings</h2>
<ul>
<li>A booking is confirmed when you approve your quote (or your request) and we confirm the date and time with you.</li>
<li>Event coverage runs up to 3 hours per event. We do not offer wedding coverage.</li>
<li>Drone flights depend on weather, airspace and site conditions. If it is not safe or legal to fly, we will reschedule the aerial portion or remove it from your invoice.</li>
<li>Weather or safety may require rescheduling an exterior shoot. We will work with you to find the next available time.</li>
<li>Rescheduling, cancellation and payment terms are confirmed with you in writing when we confirm your booking.</li>
</ul>

<h2>3. Your responsibilities</h2>
<ul>
<li>Make sure we have permission to access and photograph the property, vehicles or event, including from the owner, seller, tenants or organizer, and that people who appear in the media have agreed where required.</li>
<li>Have the space ready at the booked time.</li>
<li>Use the media in a way that complies with the rules that apply to you (for example, real estate advertising rules).</li>
</ul>

<h2>4. Use of the photos and video</h2>
<p>Unless we agree otherwise in writing, BlackSheep keeps the copyright in the photos and video we create, and you receive a licence to use them to market the specific property, inventory or event they were made for. We may show the work in our portfolio and on social media unless you ask us not to.</p>

<h2>5. Using this site</h2>
<ul>
<li>Don't misuse the site: no attempts to break in, overload it, scrape it, or post unlawful, abusive or misleading content.</li>
<li>Comments are reviewed before they appear. We may edit or remove any comment. You are responsible for what you post.</li>
<li>Content on the site, including photos, video, text and our logo, belongs to BlackSheep or its licensors and may not be copied without permission.</li>
</ul>

<h2>6. Limitation of liability</h2>
<p>The site and its content are provided "as is". To the fullest extent allowed by the laws of Ontario and Canada:</p>
<ul>
<li>We are not liable for indirect, incidental, special or consequential losses, including lost profits, lost sales or a delayed sale, arising from the site or our services.</li>
<li>We are not responsible for losses caused by events outside our reasonable control, including outages, cyber attacks or security failures at third-party providers we rely on (such as our web host or email provider), as long as we have taken reasonable steps to protect your information.</li>
<li>Our total liability for any claim related to a booking is limited to the amount you paid us for that booking.</li>
</ul>
<p>Nothing in these terms limits any right you have that cannot be limited by law.</p>

<h2>7. Changes</h2>
<p>We may update these terms. The date at the top shows when they last changed. Bookings already confirmed keep the terms that applied when they were confirmed.</p>

<h2>8. Governing law</h2>
<p>These terms are governed by the laws of the Province of Ontario and the federal laws of Canada that apply there. Any dispute will be handled in the courts of Ontario.</p>

<h2>Contact</h2>
<p><a class="lk" href="mailto:{EMAIL}">{EMAIL}</a> · {PHONE}</p>
'''))
    P.append(dict(slug='disclaimer', title='Disclaimer', desc='General information disclaimer for blacksheepdigitalworks.ca.', body=f'''
<p class="upd">Last updated {UPDATED}</p>
<h2>General information only</h2>
<p>Articles in our Journal and other content on this site are general information about real estate media, drones, advertising rules and related topics. They are not legal, financial, real estate or regulatory advice. Rules change; always check the current requirements with the responsible authority or a qualified professional before relying on them.</p>
<h2>Prices and quotes</h2>
<p>Prices and quotes on this site are estimates and may change. Your final price is confirmed when we confirm your booking. See our <a class="lk" href="../terms/">terms of service</a>.</p>
<h2>Portfolio</h2>
<p>Portfolio images show examples of our work. Results depend on the property, the conditions and the weather on the day.</p>
<h2>Outside links</h2>
<p>Links to other websites are provided for convenience. We don't control those sites and aren't responsible for their content or their privacy practices.</p>
<h2>Services we don't offer</h2>
<p>We do not offer wedding coverage.</p>
<h2>Contact</h2>
<p><a class="lk" href="mailto:{EMAIL}">{EMAIL}</a> · {PHONE}</p>
'''))
    P.append(dict(slug='accessibility', title='Accessibility', desc='Our commitment to making blacksheepdigitalworks.ca usable for everyone.', body=f'''
<p class="upd">Last updated {UPDATED}</p>
<p>We want everyone to be able to use this site and work with us, including people with disabilities, in the spirit of the Accessibility for Ontarians with Disabilities Act (AODA).</p>
<h2>What we do</h2>
<ul>
<li>Photos that carry meaning have text descriptions for screen readers.</li>
<li>Motion and 3D effects are reduced when your device is set to reduce motion.</li>
<li>A light and a dark mode are available from the switch at the top of every page.</li>
<li>Forms have labels, and every booking or quote can also be done by phone.</li>
<li>We keep testing the site with keyboards and screen readers and fix what we find.</li>
</ul>
<h2>Something not working?</h2>
<p>If any part of the site is hard to use, or you'd like information in another format, contact us and we'll help directly: <a class="lk" href="mailto:{EMAIL}">{EMAIL}</a> or call or text {PHONE}. You can also book or get a quote by phone instead of using the online forms.</p>
<h2>Feedback</h2>
<p>We welcome feedback on accessibility and will reply within a few business days.</p>
'''))
    return P


# Praetorian listing is held back until Nick says to make it live: set PARTNERS_LIVE = True.
PARTNERS_LIVE = False

PARTNERS = [
    dict(name='Praetorian Security', url='https://praetoriansecurityinc.ca/', logo='img/partners/praetorian-logo.png', pinned=True, area='Toronto',
         kicker='TOP PARTNER · SECURITY ASSESSMENT & ADVISORY',
         lede='Security and safety advisory firm in Toronto for executives, private families, estates, organizations and institutions, identifying security gaps at home, at work and on the road, and closing them.',
         offers=[('Executive residential security assessment', 'A careful review of the home that pinpoints security gaps and delivers a clear plan to close them.'),
                 ('Executive and family security advisory', 'Independent advice from senior practitioners for executives, families and their advisors facing complex security concerns.'),
                 ('Estate and family protection planning', 'One practical protection plan for the family and the estate that still fits everyday life.'),
                 ('Workplace violence prevention', 'A program that helps organizations recognize, assess and manage the risk of workplace violence before harm occurs.'),
                 ('Emergency preparedness and crisis planning', 'Clear plans and practice so organizations and families know how to respond when an emergency happens.'),
                 ('Travel security planning', 'Advice for executives, families and organizations on managing risks at home and abroad.'),
                 ('Physical security and CPTED reviews', 'A review of how a building or site\'s design affects safety, with recommendations that respect its purpose and appearance.'),
                 ('Incident response planning', 'Planning and advice that help organizations and leaders respond to serious incidents and recover with clarity.')],
         why=['Independent: no commercial ties to equipment makers, guarding companies or technology vendors, so advice follows the client\'s risks.',
              'Engagements shaped around each client\'s situation and handled with care and discretion.',
              'Starts with a confidential first conversation; no sensitive details needed up front.',
              'A clear five-step process: understand the risks, set priorities, plan the response, then review and support.',
              'A natural fit for BlackSheep clients: a listing shoot shows a home to the world, and Praetorian helps owners understand what that exposure means for their security.']),
]

def partners_body():
    cards = ''
    if not PARTNERS_LIVE:
        cards = '''<article class="partner pinned">
  <span class="eyebrow">Coming soon</span>
  <h2>A new partner is on the way.</h2>
  <p class="sub">A trusted local partner will be announced here shortly. Check back soon.</p>
</article>'''
    for p in (PARTNERS if PARTNERS_LIVE else []):
        offers = ''.join('<li><b>%s</b><span>%s</span></li>' % (a, b) for a, b in p['offers'])
        why = ''.join('<li>%s</li>' % w for w in p['why'])
        cards += f'''<article class="partner{' pinned' if p.get('pinned') else ''}">
  {'<span class="pin">Pinned · Top partner</span>' if p.get('pinned') else ''}
  <span class="eyebrow">{p['kicker']}</span>
  {('<a class="plogo" href="' + p['url'] + '" target="_blank" rel="noopener" aria-label="' + p['name'] + ' website"><img src="../' + p['logo'] + '" alt="' + p['name'] + ' logo"></a>') if p.get('logo') and os.path.exists(os.path.join(ROOT_DIR, p['logo'])) else ''}
  <h2><a class="lk" href="{p['url']}" target="_blank" rel="noopener">{p['name']}</a></h2>
  <p class="sub">{p['lede']}</p>
  <div class="pcols"><div><h3>Services</h3><ul class="offers">{offers}</ul></div>
  <div><h3>Why Praetorian</h3><ul class="gets">{why}</ul><p class="note">Based in {p['area']}.</p></div></div>
  <div class="acts"><a class="btn primary lk" href="{p['url']}" target="_blank" rel="noopener">Visit {p['name']} ↗</a></div>
</article>'''
    return f'''
<section class="pg"><div class="wrap">
  <span class="eyebrow">Preferred partners</span>
  <h1>Trusted <em>partners.</em></h1>
  <p class="lede sub">Trusted businesses recommended to BlackSheep clients. Each partner provides its own services directly.</p>
</div></section>
<section class="sec"><div class="wrap">{cards}</div></section>
<section class="sec"><div class="wrap">
  <span class="eyebrow">Become a partner</span>
  <h2>Partner with <em>BlackSheep.</em></h2>
  <p class="sub">Brokerages, dealerships, stagers, event organizers and other trusted local businesses that BlackSheep clients would be glad to know.</p>
  <div class="acts"><a class="btn lk" href="../#contact">Get in touch</a></div>
</div></section>
'''

def resources_body():
    return '''
<section class="pg"><div class="wrap">
  <span class="eyebrow">Resources</span>
  <h1>Useful, <em>free.</em></h1>
  <p class="lede sub">Guides, rate cards and answers for realtors, dealerships and event organizers.</p>
</div></section>
<section class="sec"><div class="wrap">
  <div class="pk">
    <a class="pc in" href="../journal/" style="text-decoration:none"><span class="eyebrow">Journal</span><h3>Guides &amp; market notes</h3><p class="sub">Listing media practice, drone rules, advertising rules and local market notes, with sources.</p><span class="btn lk">Read the journal</span></a>
    <a class="pc in" href="../pricing/#flyers" style="text-decoration:none"><span class="eyebrow">Rate cards</span><h3>Printable flyers</h3><p class="sub">Real estate, dealership and event rate cards as PDFs for your office or team.</p><span class="btn lk">Download flyers</span></a>
    <a class="pc in" href="../partners/" style="text-decoration:none"><span class="eyebrow">Partners</span><h3>Preferred partners</h3><p class="sub">Trusted local businesses we recommend to our clients.</p><span class="btn lk">See partners</span></a>
  </div>
</div></section>
<section class="sec"><div class="wrap">
  <span class="eyebrow">Quick answers</span>
  <h2>Before you <em>book.</em></h2>
  <div class="legal">
  <h3>How fast do I get my photos?</h3><p>Typically within 24–72 hours depending on volume, most within 24–48.</p>
  <h3>Where do you work?</h3><p>Pickering to Kingston and north to Peterborough, plus the GTA. Travel within the GTA is included; beyond it is quoted per km.</p>
  <h3>How many photos do I get?</h3><p>Every package includes unlimited photos, as many as the property, unit or event needs.</p>
  <h3>Can you fly a drone at my property?</h3><p>Often, but it depends on airspace, weather and the site. If a site can't be flown safely or legally, we tell you before the shoot. See our <a class="lk" href="../journal/drone-listing-rules-ontario/">drone rules guide</a>.</p>
  <h3>Do you shoot weddings?</h3><p>No. Event coverage is for festivals, brand activations, corporate and private events, up to 3 hours.</p>
  <h3>How do I get a quote?</h3><p>Build one on the <a class="lk" href="../pricing/#book">pricing page</a> for a numbered PDF quote by email, valid 30 days, or call or text 647.888.3098.</p>
  </div>
</div></section>
'''
