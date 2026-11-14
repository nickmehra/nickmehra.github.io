<?php
// GET  /quote.php?catalog=1  → price list for the pricing page
// POST /quote.php            → numbers a quote, emails the client (PDF attached) and Nick (PDF + full details).
// Nothing about the client is stored on this server: the quote lives in the emails and in its signed link.
require __DIR__ . '/bs-lib.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (isset($_GET['catalog'])) bs_json(['catalog' => bs_catalog(), 'hst' => BS_HST, 'validDays' => BS_VALID_DAYS]);
  bs_json(['error' => 'Not found'], 404);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') bs_json(['error' => 'Method not allowed'], 405);

$in = bs_input();
if (!empty($in['website'])) bs_json(['ok' => true]); // honeypot: bots fill hidden fields
$name = bs_clean($in['name'] ?? '', 80); $email = strtolower(bs_clean($in['email'] ?? '', 120));
$phone = bs_clean($in['phone'] ?? '', 40); $company = bs_clean($in['company'] ?? '', 100);
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) bs_json(['error' => 'Please add your name and a valid email so we can send your quote.'], 422);
// Site-wide limit (no visitor IPs are kept): stops a flood of fake requests without tracking anyone.
if (!bs_rate_ok('all', 40, 3600)) bs_json(['error' => 'We are getting a lot of requests right now. Please call or text ' . BS_OWNER_PHONE . ' and we will quote you directly.'], 429);

$price = bs_price($in);
if (!$price['lines'] && !$price['flags']) bs_json(['error' => 'Choose a package or at least one service.'], 422);
if ($price['segment'] === 'ev' && !bs_find(bs_catalog()['ev']['packages'], (string)($in['package'] ?? ''))) bs_json(['error' => 'Choose an event coverage package (1, 2 or 3 hours).'], 422);

$date = preg_match('~^\d{4}-\d{2}-\d{2}$~', (string)($in['date'] ?? '')) ? $in['date'] : '';
$slots = ['Morning (8–11 am)', 'Midday (11 am–2 pm)', 'Afternoon (2–5 pm)', 'Twilight (around sunset)'];
$slot = in_array($in['slot'] ?? '', $slots, true) ? $in['slot'] : '';
$num = bs_next_number(); $now = time();
$q = [
  'number' => $num, 'created' => $now, 'valid_until' => $now + BS_VALID_DAYS * 86400, 'segment' => $price['segment'],
  'client' => ['name' => $name, 'email' => $email, 'phone' => $phone, 'company' => $company],
  'shoot' => ['type' => bs_clean($in['type'] ?? '', 60), 'address' => bs_clean($in['address'] ?? '', 160), 'date' => $date, 'slot' => $slot],
  'notes' => mb_substr(trim((string)($in['notes'] ?? '')), 0, 600),
  'price' => $price,
];
$pdf = bs_pdf($q); $L = bs_links($q); $e = 'htmlspecialchars';
$valid = date('F j, Y', $q['valid_until']);
$when = $date ? date('l, F j', strtotime($date)) . ($slot ? ', ' . $slot : '') : 'a date we will confirm with you';
$inner = '<p>Hi ' . $e(explode(' ', $name)[0]) . ',</p><p>Thanks for your booking request. Here is your approximate quote for ' . $e($when) . '. Your quote number is <b>' . $num . '</b> and it is good until <b>' . $valid . '</b>.</p>'
  . bs_lines_table($q)
  . '<p>To lock in your booking at this price, approve the quote below. If anything needs changing, or you have questions, reply to this email or call ' . BS_OWNER_PHONE . '.</p>'
  . '<p>' . bs_btn($L['approve'], 'Approve & confirm booking') . bs_btn('mailto:' . BS_OWNER_EMAIL . '?subject=' . rawurlencode("Question about quote $num"), 'Ask a question', false) . '</p>'
  . '<p style="font-size:14px;color:#555">Your quote is attached as a PDF. Keep this email: its links are the only copy of your quote, because we do not store your details on our website. You can also <a href="' . $e($L['pdf']) . '" style="color:#9A1219">download the PDF here</a>.</p>';
$text = "Hi $name,\n\nYour BlackSheep quote $num (valid until $valid):\n\n" . implode("\n", array_map(function ($l) { return '- ' . $l['name'] . ($l['qty'] > 1 ? ' x ' . $l['qty'] : '') . ': ' . bs_money($l['amount']); }, $price['lines']))
  . "\nSubtotal " . bs_money($price['subtotal']) . "\nHST " . bs_money($price['hst']) . "\nEstimated total " . bs_money($price['total']) . "\n\nApprove and confirm: {$L['approve']}\nDownload PDF: {$L['pdf']}\nQuestions: " . BS_OWNER_EMAIL . ' / ' . BS_OWNER_PHONE . "\n";
$sentClient = bs_mail($email, "Your BlackSheep quote $num", bs_email_shell('Your quote ' . $num, $inner), $text, ["BlackSheep-Quote-$num.pdf", $pdf]);

// Nick's copy: readable details + a data line his computer uses to file the record in WEBSITE ASSETS/Bookings
$own = '<p><b>' . $e($name) . '</b> requested a quote.</p><p>' . $e($email) . ($phone ? ' · ' . $e($phone) : '') . ($company ? '<br>' . $e($company) : '') . '<br>' . $e($q['shoot']['type']) . ' · ' . $e($q['shoot']['address']) . '<br>' . $e($when) . '</p>'
  . bs_lines_table($q) . ($q['notes'] ? '<p><b>Notes:</b> ' . nl2br($e($q['notes'])) . '</p>' : '')
  . '<p>' . bs_btn('mailto:' . $email . '?subject=' . rawurlencode("Your BlackSheep quote $num"), 'Reply to client') . bs_btn($L['pdf'], 'Open PDF', false) . '</p>';
$ownText = "New quote $num from $name <$email>\n" . strip_tags(str_replace(['<br>', '</p>', '</tr>'], "\n", bs_lines_table($q)))
  . "\n\nBSQ-RECORD:" . base64_encode(json_encode(['event' => 'quote', 'quote' => $q, 'pdf' => $L['pdf'], 'approve' => $L['approve'], 'sent' => ['subject' => "Your BlackSheep quote $num", 'text' => $text, 'delivered' => (bool)$sentClient]], JSON_UNESCAPED_UNICODE)) . "\n";
bs_mail(BS_OWNER_EMAIL, "New quote $num · " . bs_money($price['total']) . " · $name", bs_email_shell('New quote ' . $num, $own), $ownText, ["BlackSheep-Quote-$num.pdf", $pdf], $email);

bs_json(['ok' => true, 'number' => $num, 'validUntil' => $valid, 'validUntilTs' => $q['valid_until'], 'price' => $price, 'pdf' => $L['pdf'], 'approve' => $L['approve'], 'emailed' => (bool)$sentClient]);
