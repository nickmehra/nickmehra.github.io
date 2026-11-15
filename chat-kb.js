/* nickmehra.ca chat answers. Only facts Nick has published on his sites. */
window.CHAT_KB = {
  site: 'nickmehra', endpoint: '/chat.php', name: 'Nick Mehra', tagline: 'Assistant · Nick reads every conversation',
  logo: '', button: 'Say hello',
  theme: { bg: '#08080A', panel: '#101013', ink: '#F4F2EE', mute: '#9D9FA7', accent: '#E2622B', accentInk: '#150A05', me: '#24252A', line: 'rgba(244,242,238,.14)', font: '"Manrope",system-ui,sans-serif', headFont: '"Bodoni Moda",Georgia,serif' },
  themeLight: { bg: '#E9E5DC', panel: '#F6F3EE', ink: '#111113', mute: '#46474E', accent: '#A3141F', accentInk: '#fff', me: '#E2DDD2', line: 'rgba(17,17,19,.16)' },
  note: 'Automated assistant, not a live person. It answers only from this website\u2019s information; anything else goes to Nick for a personal reply. Nick reads every conversation. Please don’t share sensitive personal details here. <a href="/privacy/">Privacy</a>',
  greeting: 'Hi, thanks for stopping by. I\u2019m an automated assistant, not Nick himself, and I can only answer from the information on this website: Nick\u2019s story, his work and BlackSheep Digital Works. For anything else, I\u2019ll pass your message to Nick and ask for your email or phone so he can reply personally. What brings you here?',
  starters: ['Who is Nick?', 'Book a shoot', 'See the work', 'Contact Nick'],
  followups: ['Book a shoot', 'Contact Nick', 'Read the journal'],
  escalate: 'That’s one Nick should answer himself. What’s the best email or phone number for him to reach you?',
  escalateKnown: 'I’ve passed that to Nick too. He’ll follow up at {c}.',
  thanksContact: 'Thank you. Nick has your message and will get back to you at {c}. Anything else meanwhile?',
  badContact: 'I didn’t catch a valid email or phone number. Could you type it again? (Or type "skip".)',
  noContact: 'No problem. You can reach Nick at 647.888.3098 or nic.mehra@gmail.com anytime.',
  synonyms: [
    ['how much|costs?|pricing|prices|rates?|fees?|charges?', 'price'],
    ['book|booking|hire|schedule|reserve|appointment|availability', 'book'],
    ['photography|photographs|photos|pictures|pics|portraits?|gallery|portfolio|work samples?', 'work'],
    ['phone number|phone|call|text me|email|reach|contact|get in touch|talk to|speak|message', 'contact'],
    ['law enforcement|enforcement|security|officer|uniform|badge|career|background|experience|resume', 'career'],
    ['blog|journal|writing|entries|diary', 'journal'],
    ['blacksheep|black sheep|company|business|studio', 'blacksheep']
  ],
  items: [
    { k: ['buy|purchase|print|license|licence|licensing|discount|negotiate|job|hiring|work for you|partnership|collab|interview|media|press|speaking'], esc: true, a: '' },
    { k: ['who are you|who nick|about nick|nick mehra|about you|tell me about'], a: 'Nick Mehra is the Owner and Creative Director of BlackSheep Digital Works, a media company in Ontario. He spent almost two decades in security and public service law enforcement before choosing the camera. Read [the story](/story/) or his [experience](/experience/).', chips: ['Book a shoot', 'See the work', 'Contact Nick'] },
    { k: ['career'], a: 'Almost two decades in security and public service law enforcement: private security first, then transit enforcement operations, municipal law enforcement, and enforcement in a provincial capacity. The full record is on the [experience page](/experience/).' },
    { k: ['blacksheep'], a: 'BlackSheep Digital Works is Nick’s media company: real estate photography, video, drone and floor plans, dealership inventory media and event coverage, from Pickering to Kingston and north to Peterborough. [Visit BlackSheep](https://blacksheepdigitalworks.ca/).' },
    { k: ['book|price|quote|shoot|listing|real estate|dealer|event'], a: 'Shoots are booked through BlackSheep Digital Works. You’ll find packages, prices and an instant quote at [blacksheepdigitalworks.ca/pricing](https://blacksheepdigitalworks.ca/pricing/), and the booking form on the [BlackSheep homepage](https://blacksheepdigitalworks.ca/#booking). Real estate packages start at $299 before HST.', chips: ['Contact Nick', 'See the work'] },
    { k: ['work'], a: 'See portraits on the [portraits page](/portraits/) and recent coverage on the [work page](/work/). More is on Instagram at [@BlackSheepDigitalWorks](https://www.instagram.com/blacksheepdigitalworks/).' },
    { k: ['journal'], a: 'Nick writes a short personal [journal](/journal/) here, and BlackSheep publishes a [journal on listing media](https://blacksheepdigitalworks.ca/journal/). You can comment on journal entries; comments appear once approved.' },
    { k: ['contact'], a: 'You can reach Nick at 647.888.3098 (call or text) or nic.mehra@gmail.com. Want him to contact you? Type your email or phone number here.' },
    { k: ['where|location|based|live|ontario|toronto|durham|oshawa'], a: 'Nick is based in Ontario. BlackSheep works from Pickering to Kingston and north to Peterborough, plus the GTA.' },
    { k: ['story|why|leave|left|change|decision|turn'], a: 'In 2026 Nick made the hard decision not to go back to enforcement and started BlackSheep Digital Works instead. He tells it in five chapters on [the story page](/story/).' },
    { k: ['wedding|weddings|bride|marriage'], a: 'BlackSheep doesn\u2019t offer wedding coverage. Event coverage is for festivals, brand activations, corporate and private events, up to 3 hours. [See event packages](https://blacksheepdigitalworks.ca/pricing/).' },
    { k: ['privacy|data|personal information'], a: 'This site keeps only comment names and text, and like totals. Chat messages are emailed to Nick and not stored on the site. See the [privacy page](/privacy/).' },
    { k: ['thank|thanks|great|perfect|awesome|ok|okay|cool'], min: 3, a: 'You’re welcome. Anything else?' },
    { k: ['bye|goodbye|that all|nothing else'], min: 3, a: 'Thanks for stopping by. Nick will see this conversation.' },
    { k: ['hello|hi there|good morning|good afternoon|hey there|hi|hey'], min: 3, a: 'Hi! Ask me about Nick, his work, or booking a shoot with BlackSheep.' }
  ]
};
