<?php
// Client accounts on the website. Sign-in uses the existing email code (auth.php); no passwords.
// GET  account.php?me      -> {verified, email, account|null}
// GET  account.php?export  -> download everything we hold about you (JSON)
// POST {action:"create", first,last,phone,title,username, consent:true, marketing:bool}
// POST {action:"update", first,last,phone,title,username, marketing}
// POST {action:"delete", confirm:"DELETE"}   -> deletes the account, its bookings and app sign-ins
require __DIR__ . '/bs-accounts.php';
header('Cache-Control: no-store');
bs_acc_housekeeping();
$email = bs_verified_email();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (isset($_GET['me'])) { $a = $email ? bs_acc_load($email) : null; bs_json(['verified' => $email !== '', 'email' => $email, 'account' => $a ? bs_acc_public($a) : null]); }
  if (isset($_GET['export'])) {
    $a = $email ? bs_acc_load($email) : null; if (!$a) bs_json(['error' => 'Not signed in'], 401);
    header('Content-Disposition: attachment; filename="blacksheep-my-data.json"'); bs_json(bs_acc_public($a));
  }
  bs_json(['error' => 'Not found'], 404);
}
if (($_SERVER['CONTENT_TYPE'] ?? '') !== '' && stripos($_SERVER['CONTENT_TYPE'], 'application/json') === false) bs_json(['error' => 'Bad request'], 400);
if ($email === '') bs_json(['error' => 'Please confirm your email first.', 'verify' => true], 401);
$in = bs_input(); $act = $in['action'] ?? '';
if (!bs_rate_ok('acc', 120, 3600)) bs_json(['error' => 'Too many requests. Please try again shortly.'], 429);
$a = bs_acc_load($email);
if ($act === 'create') {
  if ($a) bs_json(['error' => 'You already have an account.'], 409);
  if (empty($in['consent'])) bs_json(['error' => 'Please read and accept the privacy notice to create an account.'], 422);
  [$err, $f] = bs_acc_fields($in);
  if ($err) bs_json(['error' => 'Please check your ' . implode(', ', $err) . '.'], 422);
  if (!bs_username_free($f['username'])) bs_json(['error' => 'That username is taken. Please choose another.'], 409);
  bs_json(['ok' => true, 'account' => bs_acc_public(bs_acc_create($email, $f, !empty($in['marketing'])))]);
}
if (!$a) bs_json(['error' => 'No account for this email yet.', 'create' => true], 404);
if ($act === 'update') {
  [$err, $f] = bs_acc_fields($in);
  if ($err) bs_json(['error' => 'Please check your ' . implode(', ', $err) . '.'], 422);
  $id = bs_acc_id($email);
  if (strtolower($f['username']) !== strtolower($a['username'])) {
    if (!bs_username_free($f['username'], $id)) bs_json(['error' => 'That username is taken.'], 409);
    bs_username_set($a['username'], $f['username'], $id);
  }
  $a = array_merge($a, $f); $a['marketing'] = !empty($in['marketing']); bs_acc_save($a);
  if ($a['marketing']) bs_list_add($email, $f['first'] . ' ' . $f['last'], 'express');
  bs_json(['ok' => true, 'account' => bs_acc_public($a)]);
}
if ($act === 'delete') {
  if (($in['confirm'] ?? '') !== 'DELETE') bs_json(['error' => 'Type DELETE to confirm.'], 422);
  bs_acc_delete($email); bs_verify_clear();
  bs_mail(BS_OWNER_EMAIL, 'Account deleted', bs_email_shell('Account deleted', '<p>A client deleted their account. Their stored details are gone from the website.</p>'), "A client deleted their account.\n");
  bs_json(['ok' => true]);
}
bs_json(['error' => 'Unknown action'], 400);
