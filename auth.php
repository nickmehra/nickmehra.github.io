<?php
// Booking gate endpoint.
// GET  auth.php?challenge  -> "I'm human" puzzle          GET auth.php?me -> {"email": "..."} if this device is verified
// POST {action:"send", email, pow}  -> emails a 6-digit code
// POST {action:"verify", email, code} -> sets the signed verified-email cookie
// POST {action:"forget"} -> clears it
require __DIR__ . '/bs-auth.php';
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (isset($_GET['challenge'])) bs_json(bs_pow_new());
  if (isset($_GET['me'])) bs_json(['email' => bs_verified_email()]);
  bs_json(['error' => 'Not found'], 404);
}
$in = bs_input(); $act = $in['action'] ?? '';
$email = strtolower(bs_clean($in['email'] ?? '', 120));
if ($act === 'forget') { bs_verify_clear(); bs_json(['ok' => true]); }
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) bs_json(['error' => 'Please enter a valid email address.'], 422);
if ($act === 'send') {
  if (!bs_pow_ok($in['pow'] ?? null)) bs_json(['error' => 'The human check expired. Please tick the box again.'], 422);
  if (!bs_rate_ok('codes', 60, 3600)) bs_json(['error' => 'Too many codes requested right now. Please call or text ' . BS_OWNER_PHONE . '.'], 429);
  if (is_file(bs_code_file($email)) && filemtime(bs_code_file($email)) > time() - 45) bs_json(['error' => 'A code was just sent. Please wait a minute before asking for another.'], 429);
  if (!bs_code_send($email)) bs_json(['error' => 'We could not send the code. Please check the address or call ' . BS_OWNER_PHONE . '.'], 500);
  bs_json(['ok' => true]);
}
if ($act === 'verify') {
  $r = bs_code_check($email, $in['code'] ?? '');
  if ($r === 'ok') { bs_verify_set($email); bs_json(['ok' => true, 'email' => $email]); }
  bs_json(['error' => ['wrong' => 'That code doesn\'t match. Check the email and try again.', 'expired' => 'That code has expired. Please request a new one.', 'locked' => 'Too many tries. Please request a new code.'][$r]], 422);
}
bs_json(['error' => 'Unknown action'], 400);
