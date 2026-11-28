<?php
// Client accounts (website + BlackSheep Drive app). Not callable directly.
// Stored in the private folder outside the public website, each account encrypted (libsodium secretbox).
// Collected: first/last name, email, phone, professional title, username, consent record, bookings made while
// signed in, app device ids (for reminders and arrival alerts) and arrival check-in times. Nothing else.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'bs-accounts.php') { http_response_code(404); exit; }
require_once __DIR__ . '/bs-auth.php';

const BS_ACC_TOKEN_DAYS = 365;        // app sign-in lasts a year on that device (revocable by signing out / deleting)
const BS_ACC_INACTIVE_YEARS = 2;      // accounts untouched for 2 years are deleted automatically
const BS_PRIVACY_VERSION = '2026-11-28';
const BS_SLOT_START = ['Morning' => '08:00', 'Midday' => '11:00', 'Afternoon' => '14:00', 'Twilight' => null];

function bs_acc_dir() { $d = bs_dir() . '/accounts'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
function bs_acc_key() {
  $f = bs_dir() . '/accounts.key';
  if (!is_file($f)) { @file_put_contents($f, bin2hex(random_bytes(SODIUM_CRYPTO_SECRETBOX_KEYBYTES))); @chmod($f, 0600); }
  return hex2bin(trim((string)file_get_contents($f)));
}
function bs_enc($data) { $n = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES); return base64_encode($n . sodium_crypto_secretbox(json_encode($data, JSON_UNESCAPED_UNICODE), $n, bs_acc_key())); }
function bs_dec($blob) {
  $raw = base64_decode((string)$blob, true); if ($raw === false || strlen($raw) < 40) return null;
  $p = sodium_crypto_secretbox_open(substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), bs_acc_key());
  return $p === false ? null : json_decode($p, true);
}
function bs_acc_id($email) { return hash_hmac('sha256', strtolower(trim($email)), bs_secret() . '|acc'); }
function bs_acc_file($id) { return bs_acc_dir() . '/' . preg_replace('~[^a-f0-9]~', '', $id) . '.bin'; }
function bs_acc_load($email) { return bs_acc_load_id(bs_acc_id($email)); }
function bs_acc_load_id($id) { $f = bs_acc_file($id); return is_file($f) ? bs_dec(file_get_contents($f)) : null; }
function bs_acc_save($a) {
  $a['updated'] = time();
  $f = bs_acc_file(bs_acc_id($a['email'])); $t = $f . '.tmp' . bin2hex(random_bytes(3));
  file_put_contents($t, bs_enc($a)); @chmod($t, 0600); rename($t, $f);
}

/* username index: hashed usernames only, so the list itself reveals nothing */
function bs_user_idx() { return bs_jread(bs_acc_dir() . '/usernames.json') ?: []; }
function bs_user_key($u) { return hash_hmac('sha256', strtolower($u), bs_secret() . '|user'); }
function bs_username_ok($u) { return (bool)preg_match('~^[A-Za-z0-9._-]{3,24}$~', $u); }
function bs_username_free($u, $ownerId = '') { $i = bs_user_idx(); $k = bs_user_key($u); return !isset($i[$k]) || $i[$k] === $ownerId; }
function bs_username_set($old, $new, $id) {
  $f = bs_acc_dir() . '/usernames.json'; $fh = fopen($f, 'c+'); flock($fh, LOCK_EX);
  $i = json_decode(stream_get_contents($fh) ?: '', true) ?: [];
  if ($old) unset($i[bs_user_key($old)]); if ($new) $i[bs_user_key($new)] = $id;
  ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($i)); flock($fh, LOCK_UN); fclose($fh);
}

/* validation of the profile fields we collect (and only these) */
function bs_acc_fields($in, $requireAll = true) {
  $first = bs_clean($in['first'] ?? '', 60); $last = bs_clean($in['last'] ?? '', 60);
  $title = bs_clean($in['title'] ?? '', 80); $user = bs_clean($in['username'] ?? '', 24);
  $phone = preg_replace('~[^0-9+()\-. ]~', '', bs_clean($in['phone'] ?? '', 30));
  $err = [];
  if ($first === '') $err[] = 'first name'; if ($last === '') $err[] = 'last name';
  if ($title === '') $err[] = 'professional title'; if (!bs_username_ok($user)) $err[] = 'username (3 to 24 letters, numbers, dots, dashes or underscores)';
  if (strlen(preg_replace('~\D~', '', $phone)) < 10) $err[] = 'phone number';
  return [$err, ['first' => $first, 'last' => $last, 'title' => $title, 'username' => $user, 'phone' => $phone]];
}

function bs_acc_public($a) {
  // what the account owner sees about themselves (export / profile)
  return ['first' => $a['first'], 'last' => $a['last'], 'email' => $a['email'], 'phone' => $a['phone'], 'title' => $a['title'],
    'username' => $a['username'], 'created' => $a['created'], 'consent' => $a['consent'],
    'bookings' => array_values($a['bookings'] ?? []), 'devices' => array_map(function ($d) { return ['name' => $d['name'], 'added' => $d['added'], 'push' => !empty($d['fcm'])]; }, $a['devices'] ?? [])];
}

function bs_acc_create($email, $fields, $unused = false) {
  $id = bs_acc_id($email);
  $a = $fields + ['email' => strtolower($email), 'created' => time(),
    'consent' => ['privacy' => BS_PRIVACY_VERSION, 'at' => time()], 'bookings' => [], 'devices' => []];
  bs_acc_save($a); bs_username_set('', $fields['username'], $id);
  return $a;
}

function bs_acc_delete($email) {
  $a = bs_acc_load($email); if (!$a) return false;
  bs_username_set($a['username'], '', ''); foreach ($a['bookings'] ?? [] as $b) bs_bidx_remove($b['ref']);
  @unlink(bs_acc_file(bs_acc_id($email))); return true;
}

/* booking start time: Nick's confirmed time, else the start of the chosen window (Twilight: 60 min before sunset) */
function bs_booking_start($b) {
  if (!empty($b['confirmed_at'])) return (int)$b['confirmed_at'];
  $tz = new DateTimeZone('America/Toronto'); $d = $b['date'] ?? '';
  $t = BS_SLOT_START[$b['slot'] ?? ''] ?? null;
  if ($t) return (new DateTime("$d $t", $tz))->getTimestamp();
  $sun = date_sun_info((new DateTime("$d 12:00", $tz))->getTimestamp(), 43.9, -78.86);
  return (int)$sun['sunset'] - 3600;
}

/* cross-account booking index (encrypted) so Nick's app can list today's bookings and check in */
function bs_bidx_file() { return bs_acc_dir() . '/bookings.bin'; }
function bs_bidx() { $f = bs_bidx_file(); return is_file($f) ? (bs_dec(file_get_contents($f)) ?: []) : []; }
function bs_bidx_put($ref, $accId) { $i = bs_bidx(); $i[$ref] = $accId; file_put_contents(bs_bidx_file(), bs_enc($i)); }
function bs_bidx_remove($ref) { $i = bs_bidx(); unset($i[$ref]); file_put_contents(bs_bidx_file(), bs_enc($i)); }

function bs_acc_add_booking($email, $b) {
  $a = bs_acc_load($email); if (!$a) return false;
  $a['bookings'][$b['ref']] = $b; bs_acc_save($a); bs_bidx_put($b['ref'], bs_acc_id($email)); return true;
}

/* ---------- app device tokens ---------- */
function bs_dev_issue(&$a, $name) {
  $tok = bs_b64e(random_bytes(32));
  $a['devices'] = array_values(array_filter($a['devices'] ?? [], function ($d) { return ($d['exp'] ?? 0) > time(); }));
  $a['devices'][] = ['h' => hash('sha256', $tok), 'name' => mb_substr($name, 0, 40), 'added' => time(), 'exp' => time() + BS_ACC_TOKEN_DAYS * 86400, 'fcm' => ''];
  return bs_b64e(bs_acc_id($a['email'])) . '.' . $tok;
}
function bs_dev_auth() {
  $h = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
  if (!preg_match('~^Bearer\s+([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$~', $h, $m)) return [null, -1];
  $id = bs_b64d($m[1]); $a = bs_acc_load_id($id); if (!$a) return [null, -1];
  foreach ($a['devices'] ?? [] as $k => $d) if (hash_equals($d['h'], hash('sha256', $m[2])) && $d['exp'] > time()) return [$a, $k];
  return [null, -1];
}
function bs_is_owner($a) { return $a && strtolower($a['email']) === strtolower(BS_OWNER_EMAIL); }
/* BlackSheep representatives (staff): emails kept encrypted next to the accounts. The owner manages the list in the app. */
function bs_staff_file() { return bs_acc_dir() . '/staff.bin'; }
function bs_staff() { $f = bs_staff_file(); return is_file($f) ? (bs_dec(file_get_contents($f)) ?: []) : []; }
function bs_staff_save($list) { file_put_contents(bs_staff_file(), bs_enc(array_values(array_unique($list)))); }
function bs_is_staff($a) { return $a && (bs_is_owner($a) || in_array(strtolower($a['email']), bs_staff(), true)); }

/* ---------- instant alerts via Firebase Cloud Messaging (HTTP v1). Optional: works once the
   service-account file "fcm-service-account.json" is placed in the private folder. ---------- */
function bs_fcm_token() {
  $sa = bs_jread(bs_dir() . '/fcm-service-account.json'); if (!$sa || empty($sa['private_key'])) return null;
  $cache = bs_jread(bs_dir() . '/fcm-token.json'); if ($cache && $cache['exp'] > time() + 60) return [$cache['t'], $sa['project_id']];
  $now = time(); $hdr = bs_b64e(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
  $clm = bs_b64e(json_encode(['iss' => $sa['client_email'], 'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
    'aud' => 'https://oauth2.googleapis.com/token', 'iat' => $now, 'exp' => $now + 3600]));
  openssl_sign("$hdr.$clm", $sig, $sa['private_key'], 'sha256WithRSAEncryption');
  $r = bs_http_post('https://oauth2.googleapis.com/token', http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => "$hdr.$clm." . bs_b64e($sig)]), 'application/x-www-form-urlencoded');
  $j = json_decode((string)$r, true); if (empty($j['access_token'])) return null;
  bs_jwrite(bs_dir() . '/fcm-token.json', ['t' => $j['access_token'], 'exp' => $now + (int)($j['expires_in'] ?? 3000)]);
  return [$j['access_token'], $sa['project_id']];
}
function bs_http_post($url, $body, $type, $auth = null) {
  $h = "Content-Type: $type\r\n" . ($auth ? "Authorization: Bearer $auth\r\n" : '');
  return @file_get_contents($url, false, stream_context_create(['http' => ['method' => 'POST', 'header' => $h, 'content' => $body, 'timeout' => 8, 'ignore_errors' => true]]));
}
function bs_push($a, $title, $body, $data = []) {
  $t = bs_fcm_token(); if (!$t) return 0; [$tok, $proj] = $t; $n = 0;
  foreach ($a['devices'] ?? [] as $d) {
    if (empty($d['fcm'])) continue;
    $msg = ['message' => ['token' => $d['fcm'], 'notification' => ['title' => $title, 'body' => $body],
      'data' => array_map('strval', $data), 'android' => ['priority' => 'HIGH']]];
    $r = bs_http_post("https://fcm.googleapis.com/v1/projects/$proj/messages:send", json_encode($msg), 'application/json', $tok);
    if ($r && strpos($r, '"name"') !== false) $n++;
  }
  return $n;
}

/* housekeeping: delete accounts inactive for 2 years (runs at most once a day, on normal traffic) */
function bs_acc_housekeeping() {
  $flag = bs_dir() . '/acc-housekeeping.txt'; if (is_file($flag) && filemtime($flag) > time() - 86400) return; @touch($flag);
  foreach (glob(bs_acc_dir() . '/*.bin') ?: [] as $f) {
    if (basename($f) === 'bookings.bin') continue;
    $a = bs_dec(file_get_contents($f)); if ($a && ($a['updated'] ?? 0) < time() - BS_ACC_INACTIVE_YEARS * 365 * 86400) bs_acc_delete($a['email']);
  }
  bs_backup_daily();
}

/* daily encrypted backup emailed to Nick (a scheduled task files it in Google Drive). Readable only with the
   backup key shown once in the owner's app settings. */
function bs_backup_key() {
  $f = bs_dir() . '/backup.key';
  if (!is_file($f)) { @file_put_contents($f, bin2hex(random_bytes(SODIUM_CRYPTO_SECRETBOX_KEYBYTES))); @chmod($f, 0600); }
  return trim((string)file_get_contents($f));
}
function bs_backup_daily() {
  $all = [];
  foreach (glob(bs_acc_dir() . '/*.bin') ?: [] as $f) { if (basename($f) === 'bookings.bin') continue; $a = bs_dec(file_get_contents($f)); if ($a) $all[] = $a; }
  $n = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
  $blob = base64_encode($n . sodium_crypto_secretbox(json_encode(['at' => time(), 'accounts' => $all]), $n, hex2bin(bs_backup_key())));
  $name = 'bs-accounts-backup-' . date('Y-m-d') . '.enc';
  bs_mail(BS_OWNER_EMAIL, 'BSACC-BACKUP ' . date('Y-m-d') . ' (' . count($all) . ' accounts, encrypted)',
    bs_email_shell('Encrypted account backup', '<p>Daily encrypted backup of client accounts (' . count($all) . '). It is filed automatically in Google Drive. It can only be opened with your backup key.</p>'),
    "Encrypted client-account backup attached.\n", [$name, $blob]);
}
