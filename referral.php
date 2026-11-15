<?php
// Referral program inquiry from /referrals/. Emails Nick; nothing is stored on the server.
require __DIR__ . '/bs-lib.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') bs_json(['error' => 'Method not allowed'], 405);
$in = bs_input();
if (!empty($in['website'])) bs_json(['ok' => true]);
if (!bs_rate_ok('ref', 20, 3600)) bs_json(['error' => 'Please try again in a little while, or call ' . BS_OWNER_PHONE . '.'], 429);
$name = bs_clean($in['name'] ?? '', 80); $email = strtolower(bs_clean($in['email'] ?? '', 120));
$firm = bs_clean($in['firm'] ?? '', 120); $phone = bs_clean($in['phone'] ?? '', 40); $prof = bs_clean($in['profession'] ?? '', 60);
$msg = mb_substr(trim((string)($in['message'] ?? '')), 0, 1500);
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $prof === '') bs_json(['error' => 'Please add your name, email and profession.'], 422);
$e = 'htmlspecialchars';
$ok = bs_mail(BS_OWNER_EMAIL, "Referral partner inquiry · $name ($prof)", bs_email_shell('Referral partner inquiry',
  '<p><b>' . $e($name) . '</b>' . ($firm ? ' · ' . $e($firm) : '') . '<br>' . $e($prof) . '<br>' . $e($email) . ($phone ? ' · ' . $e($phone) : '') . '</p>' . ($msg ? '<p>' . nl2br($e($msg)) . '</p>' : '')),
  "Referral partner inquiry\n$name" . ($firm ? " · $firm" : '') . "\n$prof\n$email" . ($phone ? " · $phone" : '') . "\n\n$msg\n", null, $email);
if (!$ok) bs_json(['error' => 'We could not send that just now. Please email ' . BS_OWNER_EMAIL . '.'], 500);
bs_json(['ok' => true]);
