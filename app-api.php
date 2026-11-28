<?php
// API for the BlackSheep Drive app. Sign-in with the same email code as the website (no passwords).
//   GET  app-api.php?challenge                         -> "I'm human" puzzle (solved by the app)
//   POST {action:"send_code", email, pow}              -> emails a 6-digit code
//   POST {action:"login", email, code, device, [first,last,phone,title,username,consent,marketing]}
//        -> {token}; creates the account in the same step when it doesn't exist yet
//   Bearer token:
//   GET  ?me                                           -> profile + upcoming bookings (start time, address, arrival)
//   POST {action:"push", fcm}                          -> register this phone for instant alerts
//   POST {action:"signout"}                            -> forget this phone
//   Owner (Nick) only:
//   GET  ?admin                                        -> bookings for the next 14 days across clients
//   POST {action:"confirm", ref, start}                -> set the confirmed start time (unix seconds)
//   POST {action:"checkin", ref}                       -> "Nick has arrived": push + email to the client
require __DIR__ . '/bs-accounts.php';
header('Cache-Control: no-store');
bs_acc_housekeeping();

function app_booking_out($b) {
  $start = bs_booking_start($b);
  return ['ref' => $b['ref'], 'type' => $b['type'] ?? '', 'segment' => $b['segment'] ?? '', 'address' => $b['address'] ?? '',
    'date' => $b['date'] ?? '', 'slot' => $b['slot'] ?? '', 'start' => $start, 'confirmed' => !empty($b['confirmed_at']),
    'status' => $b['status'] ?? 'requested', 'arrived_at' => $b['arrived_at'] ?? 0];
}
function app_upcoming($a) {
  $out = [];
  foreach ($a['bookings'] ?? [] as $b) { $o = app_booking_out($b); if ($o['start'] > time() - 6 * 3600) $out[] = $o; }
  usort($out, function ($x, $y) { return $x['start'] <=> $y['start']; }); return $out;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (isset($_GET['challenge'])) bs_json(bs_pow_new());
  [$a, $k] = bs_dev_auth(); if (!$a) bs_json(['error' => 'Please sign in again.'], 401);
  if (isset($_GET['me'])) bs_json(['account' => bs_acc_public($a), 'upcoming' => app_upcoming($a), 'owner' => bs_is_owner($a)]
    + (bs_is_owner($a) ? ['backup_key' => bs_backup_key(), 'push_ready' => bs_fcm_token() !== null] : []));
  if (isset($_GET['admin'])) {
    if (!bs_is_owner($a)) bs_json(['error' => 'Not allowed'], 403);
    $out = [];
    foreach (bs_bidx() as $ref => $id) {
      $c = bs_acc_load_id($id); $b = $c['bookings'][$ref] ?? null; if (!$b) continue;
      $o = app_booking_out($b);
      if ($o['start'] < time() - 12 * 3600 || $o['start'] > time() + 14 * 86400) continue;
      $o['client'] = $c['first'] . ' ' . $c['last']; $o['phone'] = $c['phone']; $o['title'] = $c['title']; $out[] = $o;
    }
    usort($out, function ($x, $y) { return $x['start'] <=> $y['start']; }); bs_json(['bookings' => $out]);
  }
  bs_json(['error' => 'Not found'], 404);
}

$in = bs_input(); $act = $in['action'] ?? '';
if ($act === 'send_code' || $act === 'login') {
  $email = strtolower(bs_clean($in['email'] ?? '', 120));
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) bs_json(['error' => 'Please enter a valid email address.'], 422);
  if ($act === 'send_code') {
    if (!bs_pow_ok($in['pow'] ?? null)) bs_json(['error' => 'Please try again.'], 422);
    if (!bs_rate_ok('codes', 60, 3600)) bs_json(['error' => 'Too many codes requested right now.'], 429);
    if (is_file(bs_code_file($email)) && filemtime(bs_code_file($email)) > time() - 45) bs_json(['error' => 'A code was just sent. Please wait a minute.'], 429);
    if (!bs_code_send($email)) bs_json(['error' => 'We could not send the code.'], 500);
    bs_json(['ok' => true, 'exists' => bs_acc_load($email) !== null]);
  }
  $a = bs_acc_load($email);
  if (!$a) { // validate sign-up fields BEFORE spending the one-time code
    if (empty($in['consent'])) bs_json(['error' => 'Please accept the privacy notice to create your account.', 'create' => true], 422);
    [$err, $f] = bs_acc_fields($in);
    if ($err) bs_json(['error' => 'Please check your ' . implode(', ', $err) . '.', 'create' => true], 422);
    if (!bs_username_free($f['username'])) bs_json(['error' => 'That username is taken.', 'create' => true], 409);
  }
  $r = bs_code_check($email, $in['code'] ?? '');
  if ($r !== 'ok') bs_json(['error' => ['wrong' => 'That code doesn\'t match.', 'expired' => 'That code has expired.', 'locked' => 'Too many tries. Request a new code.'][$r]], 422);
  if (!$a) $a = bs_acc_create($email, $f, !empty($in['marketing']));
  $tok = bs_dev_issue($a, bs_clean($in['device'] ?? 'Phone', 40)); bs_acc_save($a);
  bs_json(['ok' => true, 'token' => $tok, 'owner' => bs_is_owner($a)]);
}

[$a, $k] = bs_dev_auth(); if (!$a) bs_json(['error' => 'Please sign in again.'], 401);
if ($act === 'push') { $a['devices'][$k]['fcm'] = bs_clean($in['fcm'] ?? '', 300); bs_acc_save($a); bs_json(['ok' => true]); }
if ($act === 'signout') { array_splice($a['devices'], $k, 1); bs_acc_save($a); bs_json(['ok' => true]); }
if ($act === 'confirm' || $act === 'checkin') {
  if (!bs_is_owner($a)) bs_json(['error' => 'Not allowed'], 403);
  $ref = bs_clean($in['ref'] ?? '', 40); $id = bs_bidx()[$ref] ?? null; $c = $id ? bs_acc_load_id($id) : null;
  if (!$c || empty($c['bookings'][$ref])) bs_json(['error' => 'Booking not found'], 404);
  if ($act === 'confirm') {
    $c['bookings'][$ref]['confirmed_at'] = (int)($in['start'] ?? 0); $c['bookings'][$ref]['status'] = 'confirmed';
    bs_acc_save($c); bs_json(['ok' => true]);
  }
  $c['bookings'][$ref]['arrived_at'] = time(); bs_acc_save($c);
  $addr = $c['bookings'][$ref]['address'] ?? 'your property';
  $sent = bs_push($c, 'Nick has arrived', "Nick from BlackSheep is on site at $addr.", ['type' => 'arrived', 'ref' => $ref]);
  bs_mail($c['email'], 'Nick has arrived', bs_email_shell('Nick has arrived', '<p>Hi ' . htmlspecialchars($c['first']) . ', Nick from BlackSheep has arrived at <b>' . htmlspecialchars($addr) . '</b> for your booking ' . htmlspecialchars($ref) . '.</p>'),
    "Hi {$c['first']}, Nick from BlackSheep has arrived at $addr for your booking $ref.\n");
  bs_json(['ok' => true, 'pushed' => $sent]);
}
bs_json(['error' => 'Unknown action'], 400);
