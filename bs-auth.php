<?php
// Booking gate: a quiet "I'm human" check (the browser solves a small proof-of-work puzzle, no images or
// puzzles for the visitor) and a one-time email code. Plus the Monday-update mailing list. Not callable directly.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'bs-auth.php') { http_response_code(404); exit; }
require_once __DIR__ . '/bs-lib.php';

const BS_POW_MAX = 80000;      // hardest number the browser may need to try (about a second on an older phone)
const BS_POW_TTL = 900;        // a puzzle is good for 15 minutes
const BS_CODE_TTL = 900;       // an email code is good for 15 minutes
const BS_VERIFIED_DAYS = 30;   // a verified email is remembered on that device for 30 days (signed cookie)

/* ---------- "I'm human" check (proof of work, same idea as the open-source ALTCHA) ---------- */
function bs_pow_new() {
  $salt = bin2hex(random_bytes(12)) . '.' . (time() + BS_POW_TTL);
  $n = random_int(1000, BS_POW_MAX);
  $ch = hash('sha256', $salt . $n);
  return ['algorithm' => 'SHA-256', 'salt' => $salt, 'challenge' => $ch, 'maxnumber' => BS_POW_MAX, 'signature' => hash_hmac('sha256', $ch, bs_secret() . '|pow')];
}
function bs_pow_ok($p) {
  if (!is_array($p)) return false;
  $salt = (string)($p['salt'] ?? ''); $ch = (string)($p['challenge'] ?? ''); $n = (string)($p['number'] ?? ''); $sig = (string)($p['signature'] ?? '');
  $exp = (int)substr(strrchr($salt, '.') ?: '.0', 1);
  if ($exp < time() || !ctype_digit($n)) return false;
  if (!hash_equals(hash_hmac('sha256', $ch, bs_secret() . '|pow'), $sig)) return false;
  return hash_equals($ch, hash('sha256', $salt . $n));
}

/* ---------- one-time email code ---------- */
function bs_code_file($email) { $d = bs_dir() . '/codes'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d . '/' . hash('sha256', 'c|' . $email) . '.json'; }
function bs_codes_gc() { foreach (glob(bs_dir() . '/codes/*.json') ?: [] as $f) { $c = bs_jread($f); if (!$c || ($c['exp'] ?? 0) < time()) @unlink($f); } }
function bs_code_send($email) {
  bs_codes_gc();
  $code = (string)random_int(100000, 999999);
  bs_jwrite(bs_code_file($email), ['h' => hash_hmac('sha256', $code, bs_secret() . '|code|' . $email), 'exp' => time() + BS_CODE_TTL, 'tries' => 0]);
  $inner = '<p>Your BlackSheep booking code is:</p><p style="font:600 34px/1.2 Georgia,serif;letter-spacing:.3em;margin:18px 0">' . $code . '</p>'
    . '<p>Enter it on the booking page to continue. It works once and expires in 15 minutes. If you didn\'t ask for it, you can ignore this email.</p>';
  return bs_mail($email, "Your BlackSheep booking code: $code", bs_email_shell('Your booking code', $inner), "Your BlackSheep booking code is $code. It expires in 15 minutes.\n");
}
function bs_code_check($email, $code) {
  $f = bs_code_file($email); $c = bs_jread($f);
  if (!$c || $c['exp'] < time()) { @unlink($f); return 'expired'; }
  if ($c['tries'] >= 5) { @unlink($f); return 'locked'; }
  if (!hash_equals($c['h'], hash_hmac('sha256', preg_replace('~\D~', '', (string)$code), bs_secret() . '|code|' . $email))) { $c['tries']++; bs_jwrite($f, $c); return 'wrong'; }
  @unlink($f); return 'ok';
}

/* ---------- verified-email cookie (signed, nothing stored on the server) ---------- */
function bs_verify_set($email) {
  $exp = time() + BS_VERIFIED_DAYS * 86400; $p = bs_b64e($email . '|' . $exp);
  $v = $p . '.' . bs_b64e(substr(hash_hmac('sha256', $p, bs_secret() . '|ver', true), 0, 16));
  setcookie('bs_ver', $v, ['expires' => $exp, 'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']);
}
function bs_verified_email() {
  $v = (string)($_COOKIE['bs_ver'] ?? ''); if (!strpos($v, '.')) return '';
  [$p, $s] = explode('.', $v, 2);
  if (!hash_equals(bs_b64e(substr(hash_hmac('sha256', $p, bs_secret() . '|ver', true), 0, 16)), $s)) return '';
  [$email, $exp] = array_pad(explode('|', bs_b64d($p), 2), 2, 0);
  return ((int)$exp > time() && filter_var($email, FILTER_VALIDATE_EMAIL)) ? $email : '';
}
function bs_verify_clear() { setcookie('bs_ver', '', ['expires' => 1, 'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']); }

/* ---------- Monday update mailing list (CASL) ----------
   express: ticked the opt-in box (no expiry until they unsubscribe)
   inquiry: asked for a quote or booking without ticking (implied consent, 6 months from the latest inquiry)
   client:  approved a quote (business relationship, 2 years from approval)                                   */
function bs_list_file() { return bs_dir() . '/list.json'; }
function bs_list() { return bs_jread(bs_list_file()) ?: []; }
function bs_list_add($email, $name, $basis) {
  $email = strtolower(trim($email)); if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return;
  $l = bs_list(); $k = hash('sha256', $email); $now = time();
  $e = $l[$k] ?? ['email' => $email, 'name' => '', 'basis' => [], 'unsub' => 0];
  if (!empty($e['unsub']) && $basis !== 'express') return; // never re-add someone who unsubscribed, unless they opt in again
  if ($basis === 'express') $e['unsub'] = 0;
  $e['email'] = $email; if ($name !== '') $e['name'] = mb_substr($name, 0, 80);
  $e['basis'][$basis] = $now; $l[$k] = $e; bs_jwrite(bs_list_file(), $l);
}
function bs_list_active() {
  $out = []; $now = time();
  foreach (bs_list() as $k => $e) {
    if (!empty($e['unsub'])) continue;
    $b = $e['basis'] ?? [];
    $ok = isset($b['express']) || (isset($b['client']) && $b['client'] > $now - 2 * 365 * 86400) || (isset($b['inquiry']) && $b['inquiry'] > strtotime('-6 months', $now));
    if ($ok) $out[$k] = $e;
  }
  return $out;
}
function bs_unsub_link($email) { $k = hash('sha256', strtolower($email)); return bs_base() . '/unsubscribe.php?k=' . $k . '&s=' . bs_b64e(substr(hash_hmac('sha256', $k, bs_secret() . '|unsub', true), 0, 12)); }
function bs_unsub($k, $s) {
  if (!preg_match('~^[a-f0-9]{64}$~', $k) || !hash_equals(bs_b64e(substr(hash_hmac('sha256', $k, bs_secret() . '|unsub', true), 0, 12)), (string)$s)) return false;
  $l = bs_list(); if (isset($l[$k])) { $l[$k]['unsub'] = time(); bs_jwrite(bs_list_file(), $l); } return true;
}
