<?php
// Homepage booking request. Needs a verified email (auth.php). Emails Nick the full request with a
// BSQ-RECORD line (his computer files it under WEBSITE ASSETS/Bookings) and emails the client a copy.
// Nothing about the client is stored here except the mailing-list entry (email + name + consent basis).
require __DIR__ . '/bs-auth.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') bs_json(['error' => 'Method not allowed'], 405);
$in = bs_input();
if (!empty($in['website'])) bs_json(['ok' => true]);
$email = bs_verified_email();
if ($email === '') bs_json(['error' => 'Please verify your email first (the code step at the top of the form).', 'verify' => true], 401);
if (!bs_rate_ok('all', 40, 3600)) bs_json(['error' => 'We are getting a lot of requests right now. Please call or text ' . BS_OWNER_PHONE . '.'], 429);
$name = bs_clean($in['name'] ?? '', 80); $phone = bs_clean($in['phone'] ?? '', 40);
$addr = bs_clean($in['address'] ?? '', 160); $type = bs_clean($in['type'] ?? '', 60);
$date = preg_match('~^\d{4}-\d{2}-\d{2}$~', (string)($in['date'] ?? '')) ? $in['date'] : ''; $slot = bs_clean($in['slot'] ?? '', 40);
$notes = mb_substr(trim((string)($in['notes'] ?? '')), 0, 1200);
if ($name === '' || $addr === '' || !$date || $slot === '') bs_json(['error' => 'Please fill in your name, the address, a date and a time.'], 422);
$price = bs_price($in);
if (!$price['lines'] && !$price['flags']) bs_json(['error' => 'Choose a package or at least one add-on.'], 422);
if ($price['segment'] === 'ev' && !bs_find(bs_catalog()['ev']['packages'], (string)($in['package'] ?? ''))) bs_json(['error' => 'Choose an event coverage package (1, 2 or 3 hours).'], 422);
$ref = 'BSB-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
$seg = ['re' => 'Real estate', 'auto' => 'Dealership', 'ev' => 'Event'][$price['segment']];
$when = date('l, F j, Y', strtotime($date)) . ', ' . $slot;
$b = ['ref' => $ref, 'created' => time(), 'client' => ['name' => $name, 'email' => $email, 'phone' => $phone], 'shoot' => ['segment' => $price['segment'], 'type' => $type, 'address' => $addr, 'date' => $date, 'slot' => $slot],
      'request' => ['package' => (string)($in['package'] ?? ''), 'addons' => array_values((array)($in['addons'] ?? [])), 'size' => (string)($in['size'] ?? ''), 'cars' => (int)($in['cars'] ?? 0), 'rvs' => (int)($in['rvs'] ?? 0), 'hours' => (int)($in['hours'] ?? 0)],
      'notes' => $notes, 'price' => $price, 'updates' => !empty($in['updates'])];
$e = 'htmlspecialchars'; $q = ['price' => $price];
$lines = implode("\n", array_map(function ($l) { return '- ' . $l['name'] . ($l['qty'] > 1 ? ' x ' . $l['qty'] : '') . ': ' . bs_money($l['amount']); }, $price['lines']));
$tot = "Subtotal " . bs_money($price['subtotal']) . " · HST " . bs_money($price['hst']) . " · Estimated total " . bs_money($price['total']);
$ctext = "Hi $name,\n\nThanks for your booking request ($ref). Here's what you asked for:\n\n$seg · $type\n$addr\n$when\n\n$lines\n$tot\n" . ($price['flags'] ? 'Notes: ' . implode(' · ', $price['flags']) . "\n" : '') . "\nNick will confirm the date, time and final price with you personally. Questions: " . BS_OWNER_EMAIL . ' / ' . BS_OWNER_PHONE . "\n";
bs_mail($email, "Your BlackSheep booking request $ref", bs_email_shell('Booking request received',
  '<p>Hi ' . $e(explode(' ', $name)[0]) . ', thanks for your booking request <b>' . $ref . '</b>.</p><p>' . $e("$seg · $type") . '<br>' . $e($addr) . '<br>' . $e($when) . '</p>' . bs_lines_table($q)
  . '<p>Nick will confirm the date, time and final price with you personally. If anything changes, just reply to this email.</p>'), $ctext);
$own = '<p><b>' . $e($name) . '</b> sent a booking request.</p><p>' . $e($email) . ($phone ? ' · ' . $e($phone) : '') . '<br>' . $e("$seg · $type") . '<br>' . $e($addr) . '<br>' . $e($when) . '</p>'
  . bs_lines_table($q) . ($notes ? '<p><b>Notes:</b> ' . nl2br($e($notes)) . '</p>' : '') . '<p>Monday update opt-in: ' . (!empty($in['updates']) ? 'yes' : 'no') . '</p>'
  . '<p>' . bs_btn('mailto:' . $email . '?subject=' . rawurlencode("Your BlackSheep booking $ref"), 'Reply to client') . '</p>';
bs_mail(BS_OWNER_EMAIL, "New booking request $ref · " . bs_money($price['total']) . " · $name", bs_email_shell('New booking request ' . $ref, $own),
  "New booking request $ref from $name <$email>\n$seg · $type\n$addr\n$when\n$lines\n$tot\n\nBSQ-RECORD:" . base64_encode(json_encode(['event' => 'booking', 'booking' => $b, 'sent' => ['subject' => "Your BlackSheep booking request $ref", 'text' => $ctext]], JSON_UNESCAPED_UNICODE)) . "\n", null, $email);
bs_list_add($email, $name, !empty($in['updates']) ? 'express' : 'inquiry');
bs_json(['ok' => true, 'ref' => $ref, 'total' => $price['total']]);
