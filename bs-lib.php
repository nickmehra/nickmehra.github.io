<?php
// BlackSheep quotes & accounts: shared library. Not callable directly.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'bs-lib.php') { http_response_code(404); exit; }

const BS_OWNER_EMAIL = 'nic.mehra@gmail.com';
const BS_OWNER_PHONE = '647.888.3098';
const BS_HST = 0.13;
const BS_VALID_DAYS = 30;

function bs_host() { $h = preg_replace('~[^a-z0-9.\-]~i', '', $_SERVER['HTTP_HOST'] ?? 'blacksheepdigitalworks.ca'); return $h ?: 'blacksheepdigitalworks.ca'; }
function bs_base() { return 'https://' . bs_host(); }

/* ---------- server storage: NO client details are ever written here ----------
   Only: the signing key, the quote-number counter, the list of approved quote NUMBERS, and short-lived
   rate-limit hashes. Client details travel inside the emails and the signed quote link, and are filed on
   Nick's computer (WEBSITE ASSETS/CLIENT RECORDS). */
function bs_dir() {
  static $dir = null; if ($dir) return $dir;
  $d = dirname(__DIR__) . '/blacksheep-private';
  if (!is_dir($d) && !@mkdir($d, 0750, true)) { $d = __DIR__ . '/_private'; }
  if (!is_dir($d)) @mkdir($d, 0750, true);
  if (strpos($d, __DIR__) === 0 && !is_file($d . '/.htaccess')) @file_put_contents($d . '/.htaccess', "Require all denied\n");
  if (!is_dir("$d/rate")) @mkdir("$d/rate", 0750, true);
  return $dir = $d;
}
function bs_jread($f) { return is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: null) : null; }
function bs_jwrite($f, $d) { $t = $f . '.tmp' . bin2hex(random_bytes(3)); file_put_contents($t, json_encode($d)); rename($t, $f); }
function bs_secret() {
  $f = bs_dir() . '/signing.key';
  if (!is_file($f)) { @file_put_contents($f, bin2hex(random_bytes(32))); @chmod($f, 0600); }
  return trim((string)file_get_contents($f));
}
function bs_b64e($s) { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function bs_b64d($s) { return base64_decode(strtr($s, '-_', '+/')); }
// Packs a quote into a tamper-proof link value (signed, not stored).
function bs_seal($q) { $p = bs_b64e(gzdeflate(json_encode($q, JSON_UNESCAPED_UNICODE), 9)); return $p . '.' . bs_b64e(substr(hash_hmac('sha256', $p, bs_secret(), true), 0, 16)); }
function bs_unseal($v) {
  $parts = explode('.', (string)$v); if (count($parts) !== 2) return null;
  $want = bs_b64e(substr(hash_hmac('sha256', $parts[0], bs_secret(), true), 0, 16));
  if (!hash_equals($want, $parts[1])) return null;
  $j = @gzinflate(bs_b64d($parts[0])); return $j ? json_decode($j, true) : null;
}
function bs_next_number() {
  $fh = fopen(bs_dir() . '/counter.json', 'c+'); flock($fh, LOCK_EX);
  $d = json_decode(stream_get_contents($fh) ?: '', true) ?: [];
  $ym = date('ym'); $n = (($d['ym'] ?? '') === $ym ? (int)$d['n'] : 0) + 1;
  ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode(['ym' => $ym, 'n' => $n])); flock($fh, LOCK_UN); fclose($fh);
  return sprintf('BSQ-%s-%04d', $ym, $n);
}
function bs_is_approved($num) { $d = bs_jread(bs_dir() . '/approved.json') ?: []; return isset($d[$num]) ? $d[$num] : 0; }
function bs_mark_approved($num) {
  $f = bs_dir() . '/approved.json'; $fh = fopen($f, 'c+'); flock($fh, LOCK_EX);
  $d = json_decode(stream_get_contents($fh) ?: '', true) ?: []; $first = !isset($d[$num]); if ($first) $d[$num] = time();
  ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($d)); flock($fh, LOCK_UN); fclose($fh); return $first;
}
function bs_ip_hash() { return substr(hash('sha256', 'bsq|' . ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . date('Ymd')), 0, 16); }
function bs_rate_ok($key, $max, $window) {
  $f = bs_dir() . '/rate/' . preg_replace('~[^a-z0-9]~', '', $key) . '.json';
  $d = bs_jread($f) ?: []; $now = time();
  $d = array_values(array_filter($d, function ($t) use ($now, $window) { return $t > $now - $window; }));
  if (count($d) >= $max) return false;
  $d[] = $now; bs_jwrite($f, $d);
  if (mt_rand(1, 50) === 1) foreach (glob(bs_dir() . '/rate/*.json') ?: [] as $g) if (filemtime($g) < $now - 86400) @unlink($g);
  return true;
}

/* ---------- price list (single source for the page, the quote and the PDF) ---------- */
function bs_catalog() {
  return [
    're' => [
      'label' => 'Real estate',
      'packages' => [
        ['id' => 're-essential', 'name' => 'Essential', 'price' => 299, 'items' => ['25 HDR photos', '2D floor plan', 'Sky replacement']],
        ['id' => 're-signature', 'name' => 'Signature', 'price' => 549, 'items' => ['35 HDR photos', 'Drone aerial photos', '2D floor plan']],
        ['id' => 're-cinematic', 'name' => 'Cinematic', 'price' => 749, 'items' => ['35 HDR photos', 'Walkthrough video + social reel', 'Drone photo + video', '2D floor plan']],
        ['id' => 're-legacy', 'name' => 'The Legacy', 'price' => 949, 'was' => 1604, 'flag' => 'All-inclusive', 'items' => ['35 HDR photos', 'Cinematic walkthrough (60–90 s)', 'Vertical social reel', 'Drone aerial photos + video', '2D + 3D floor plans', 'Priority scheduling · next-day delivery']],
      ],
      'addons' => [
        ['id' => 're-p25', 'name' => 'Photography · 25 images', 'price' => 249],
        ['id' => 're-p35', 'name' => 'Photography · 35 images', 'price' => 319],
        ['id' => 're-video', 'name' => 'Cinematic walkthrough video', 'price' => 449],
        ['id' => 're-reel', 'name' => 'Vertical social reel', 'price' => 149],
        ['id' => 're-drone', 'name' => 'Drone photos', 'price' => 199],
        ['id' => 're-dronevid', 'name' => 'Drone photos + video', 'price' => 329],
        ['id' => 're-2d', 'name' => '2D floor plan', 'price' => 129],
        ['id' => 're-3d', 'name' => '3D floor plan', 'price' => 229],
        ['id' => 're-twilight', 'name' => 'Twilight exterior session', 'price' => 0, 'quote' => true],
      ],
      'sizes' => [['id' => 's1', 'name' => 'Up to 2,999 sq ft', 'price' => 0], ['id' => 's2', 'name' => '3,000–3,999 sq ft', 'price' => 100], ['id' => 's3', 'name' => '4,000–4,999 sq ft', 'price' => 200], ['id' => 's4', 'name' => '5,000+ sq ft', 'price' => 0, 'quote' => true]],
    ],
    'auto' => [
      'label' => 'Dealerships',
      'packages' => [
        ['id' => 'au-fleet', 'name' => 'The Fleet', 'price' => 1899, 'was' => 2299, 'flag' => 'All-inclusive', 'included' => 25, 'extra' => 69, 'unitType' => 'car', 'items' => ['Up to 25 cars or trucks', '25–35 photos per unit, inside & out', 'Walkaround video for every unit', 'Drone aerial lot showcase', 'Extra units $69 each']],
        ['id' => 'au-caravan', 'name' => 'The Caravan', 'price' => 2599, 'was' => 3194, 'flag' => 'RV dealers', 'included' => 15, 'extra' => 149, 'unitType' => 'rv', 'items' => ['Up to 15 RVs or trailers', '35–45 photos per unit', 'Interior walkthrough video per unit', '2D layout plan per unit', 'Drone aerial lot showcase', 'Extra units $149 each']],
        ['id' => 'au-alacarte', 'name' => 'Per unit', 'price' => 0, 'perunit' => true, 'items' => ['Build your own from the per-unit list', 'Minimum 10 cars or 5 RVs per visit']],
      ],
      'unitAddons' => [
        ['id' => 'au-photo', 'name' => 'Vehicle photos · 25–35 per car or truck', 'price' => 35, 'unitType' => 'car'],
        ['id' => 'au-walk', 'name' => 'Walkaround video · per car or truck', 'price' => 45, 'unitType' => 'car'],
        ['id' => 'rv-photo', 'name' => 'RV photos · 35–45 per unit', 'price' => 69, 'unitType' => 'rv'],
        ['id' => 'rv-walk', 'name' => 'RV walkthrough video · per unit', 'price' => 75, 'unitType' => 'rv'],
        ['id' => 'rv-plan', 'name' => 'RV 2D layout plan · per unit', 'price' => 49, 'unitType' => 'rv'],
      ],
      'addons' => [
        ['id' => 'au-aerial', 'name' => 'Aerial lot showcase', 'price' => 299],
        ['id' => 'au-monthly', 'name' => 'Monthly lot program', 'price' => 0, 'quote' => true],
        ['id' => 'au-show', 'name' => 'RV show & event coverage', 'price' => 0, 'quote' => true],
      ],
    ],
    'notes' => ['Prices in CAD, plus 13% HST.', 'Travel within the GTA included; beyond the GTA quoted per km.', 'Delivery in 24–72 hours depending on volume, most within 24–48.'],
  ];
}
function bs_find($list, $id) { foreach ($list as $x) if ($x['id'] === $id) return $x; return null; }

// Builds the priced line items from a request. Never trusts prices sent by the browser.
function bs_price($req) {
  $cat = bs_catalog(); $seg = ($req['segment'] ?? '') === 'auto' ? 'auto' : 're'; $c = $cat[$seg];
  $lines = []; $flags = [];
  $pkg = bs_find($c['packages'], (string)($req['package'] ?? ''));
  $addons = array_values(array_unique(array_filter((array)($req['addons'] ?? []), 'is_string')));
  if ($seg === 're') {
    if ($pkg) $lines[] = ['name' => 'Package · ' . $pkg['name'], 'qty' => 1, 'unit' => $pkg['price'], 'amount' => $pkg['price'], 'detail' => implode(' · ', $pkg['items'])];
    foreach ($addons as $id) { $a = bs_find($c['addons'], $id); if (!$a) continue;
      if (!empty($a['quote'])) { $flags[] = $a['name'] . ': priced on request'; continue; }
      $lines[] = ['name' => $a['name'], 'qty' => 1, 'unit' => $a['price'], 'amount' => $a['price']]; }
    $size = bs_find($c['sizes'], (string)($req['size'] ?? 's1')) ?: $c['sizes'][0];
    if (!empty($size['quote'])) $flags[] = 'Home over 5,000 sq ft: size surcharge confirmed after review';
    elseif ($size['price'] > 0 && $lines) $lines[] = ['name' => 'Home size · ' . $size['name'], 'qty' => 1, 'unit' => $size['price'], 'amount' => $size['price']];
  } else {
    $cars = max(0, min(500, (int)($req['cars'] ?? 0))); $rvs = max(0, min(500, (int)($req['rvs'] ?? 0)));
    if ($pkg && empty($pkg['perunit'])) {
      $lines[] = ['name' => 'Package · ' . $pkg['name'], 'qty' => 1, 'unit' => $pkg['price'], 'amount' => $pkg['price'], 'detail' => implode(' · ', $pkg['items'])];
      $n = $pkg['unitType'] === 'rv' ? $rvs : $cars; $extra = max(0, $n - $pkg['included']);
      if ($extra) $lines[] = ['name' => 'Extra units beyond ' . $pkg['included'], 'qty' => $extra, 'unit' => $pkg['extra'], 'amount' => $extra * $pkg['extra']];
      $other = $pkg['unitType'] === 'rv' ? $cars : $rvs; $otherType = $pkg['unitType'] === 'rv' ? 'car' : 'rv';
    } else { $other = null; $otherType = null; }
    foreach ($addons as $id) {
      $u = bs_find($c['unitAddons'], $id);
      if ($u) {
        if ($pkg && empty($pkg['perunit']) && $u['unitType'] === $pkg['unitType']) continue; // already in the package
        $n = $u['unitType'] === 'rv' ? $rvs : $cars; if ($n < 1) continue;
        $lines[] = ['name' => $u['name'], 'qty' => $n, 'unit' => $u['price'], 'amount' => $n * $u['price']]; continue;
      }
      $a = bs_find($c['addons'], $id); if (!$a) continue;
      if (!empty($a['quote'])) { $flags[] = $a['name'] . ': priced on request'; continue; }
      if ($pkg && empty($pkg['perunit']) && $id === 'au-aerial') continue; // packages include the aerial showcase
      $lines[] = ['name' => $a['name'], 'qty' => 1, 'unit' => $a['price'], 'amount' => $a['price']];
    }
    if ((!$pkg || !empty($pkg['perunit'])) && ($cars > 0 && $cars < 10)) $flags[] = 'Per-unit visits have a 10-car minimum (or 5 RVs); final count confirmed with you';
    if ((!$pkg || !empty($pkg['perunit'])) && ($rvs > 0 && $rvs < 5)) $flags[] = 'RV visits have a 5-unit minimum; final count confirmed with you';
  }
  $sub = array_sum(array_column($lines, 'amount'));
  $hst = round($sub * BS_HST, 2);
  return ['segment' => $seg, 'lines' => $lines, 'flags' => $flags, 'subtotal' => $sub, 'hst' => $hst, 'total' => round($sub + $hst, 2)];
}
function bs_money($n) { return '$' . number_format((float)$n, 2); }

function bs_status($q) {
  if (bs_is_approved($q['number'])) return 'approved';
  return time() > ($q['valid_until'] ?? 0) ? 'expired' : 'open';
}

/* ---------- email ---------- */
function bs_mail($to, $subject, $html, $text, $attach = null, $replyTo = BS_OWNER_EMAIL) {
  $host = bs_host(); $b = 'bs' . bin2hex(random_bytes(8)); $alt = 'alt' . bin2hex(random_bytes(8));
  $h = "From: BlackSheep Digital Works <quotes@$host>\r\nReply-To: $replyTo\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"$b\"";
  $body = "--$b\r\nContent-Type: multipart/alternative; boundary=\"$alt\"\r\n\r\n"
    . "--$alt\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text))
    . "--$alt\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html)) . "--$alt--\r\n";
  if ($attach) $body .= "--$b\r\nContent-Type: application/pdf; name=\"{$attach[0]}\"\r\nContent-Disposition: attachment; filename=\"{$attach[0]}\"\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($attach[1]));
  $body .= "--$b--\r\n";
  $subj = '=?UTF-8?B?' . base64_encode($subject) . '?=';
  return @mail($to, $subj, $body, $h, '-f quotes@' . $host);
}
function bs_email_shell($title, $inner) {
  $e = 'htmlspecialchars';
  return '<!doctype html><html><body style="margin:0;background:#f4f2ee;font-family:Georgia,serif;color:#111">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee"><tr><td align="center" style="padding:28px 12px">'
    . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #ddd8ce">'
    . '<tr><td style="background:#0A0B0D;padding:22px 28px;text-align:center"><img src="' . bs_base() . '/img/logo.png" width="120" alt="BlackSheep Digital Works" style="display:inline-block;width:120px;height:auto"></td></tr>'
    . '<tr><td style="height:3px;background:#B3121B"></td></tr>'
    . '<tr><td style="padding:30px 32px 10px"><div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9A1219">BlackSheep Digital Works</div>'
    . '<h1 style="margin:8px 0 0;font-size:26px;font-weight:normal;color:#111">' . $e($title) . '</h1></td></tr>'
    . '<tr><td style="padding:10px 32px 30px;font-size:16px;line-height:1.6;color:#25292E">' . $inner . '</td></tr>'
    . '<tr><td style="padding:18px 32px;border-top:1px solid #eee;font-family:Arial,sans-serif;font-size:12px;color:#666;text-align:center">' . BS_OWNER_PHONE . ' · ' . BS_OWNER_EMAIL . ' · <a href="' . bs_base() . '" style="color:#9A1219">blacksheepdigitalworks.ca</a><br>From Conviction to Legacy</td></tr>'
    . '</table></td></tr></table></body></html>';
}
function bs_btn($href, $label, $solid = true) {
  return '<a href="' . htmlspecialchars($href) . '" style="display:inline-block;margin:6px 6px 6px 0;padding:14px 22px;font-family:Arial,sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;'
    . ($solid ? 'background:#0A0B0D;color:#ffffff;border:1px solid #0A0B0D' : 'background:#ffffff;color:#0A0B0D;border:1px solid #0A0B0D') . '">' . htmlspecialchars($label) . '</a>';
}
function bs_lines_table($q) {
  $e = 'htmlspecialchars'; $r = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;border-collapse:collapse;font-size:15px">';
  foreach ($q['price']['lines'] as $l) $r .= '<tr><td style="padding:8px 0;border-bottom:1px solid #eee">' . $e($l['name']) . ($l['qty'] > 1 ? ' × ' . (int)$l['qty'] : '') . '</td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee;white-space:nowrap">' . bs_money($l['amount']) . '</td></tr>';
  $r .= '<tr><td style="padding:8px 0;color:#555">Subtotal</td><td align="right" style="padding:8px 0;color:#555">' . bs_money($q['price']['subtotal']) . '</td></tr>';
  $r .= '<tr><td style="padding:4px 0;color:#555">HST (13%)</td><td align="right" style="padding:4px 0;color:#555">' . bs_money($q['price']['hst']) . '</td></tr>';
  $r .= '<tr><td style="padding:10px 0;font-size:18px;border-top:2px solid #111"><b>Estimated total</b></td><td align="right" style="padding:10px 0;font-size:18px;border-top:2px solid #111"><b>' . bs_money($q['price']['total']) . '</b></td></tr></table>';
  if ($q['price']['flags']) $r .= '<p style="font-size:14px;color:#555">' . implode('<br>', array_map($e, $q['price']['flags'])) . '</p>';
  return $r;
}
function bs_links($q) {
  $b = bs_base(); $v = bs_seal($q);
  return ['pdf' => "$b/quote-pdf.php?v=$v", 'approve' => "$b/quote-approve.php?v=$v", 'account' => "$b/account/", 'v' => $v];
}

/* ---------- PDF quote (self-contained, standard fonts) ---------- */
function bs_pdf_text($s) { $s = strtr($s, ['—' => '-', '–' => '-', '·' => '-', '×' => 'x', '’' => "'", '‘' => "'", '“' => '"', '”' => '"', 'é' => 'e', 'É' => 'E', 'à' => 'a', 'À' => 'A']); $s = @iconv('UTF-8', 'Windows-1252//TRANSLIT', $s) ?: $s; return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $s); }
function bs_pdf($q) {
  $W = 612; $H = 792; $ops = [];
  $txt = function ($x, $y, $size, $s, $font = 'F1', $rgb = '0.1 0.1 0.11') use (&$ops) { $ops[] = "BT /$font $size Tf $rgb rg $x $y Td (" . bs_pdf_text($s) . ") Tj ET"; };
  $rtxt = function ($xr, $y, $size, $s, $font = 'F1', $rgb = '0.1 0.1 0.11') use (&$ops) {
    $t0 = bs_pdf_text($s); $up = strlen($t0) ? preg_match_all('~[A-Z]~', $t0) / strlen($t0) : 0; $w = strlen($t0) * $size * (($font === 'F2' ? 0.58 : 0.53) + $up * 0.13); $x = $xr - $w; $ops[] = "BT /$font $size Tf $rgb rg $x $y Td (" . bs_pdf_text($s) . ") Tj ET"; };
  $rect = function ($x, $y, $w, $h, $rgb) use (&$ops) { $ops[] = "$rgb rg $x $y $w $h re f"; };
  $line = function ($x1, $y, $x2, $rgb = '0.85 0.84 0.8', $w = 0.6) use (&$ops) { $ops[] = "$rgb RG $w w $x1 $y m $x2 $y l S"; };
  // header band (logo always on dark)
  $rect(0, $H - 118, $W, 118, '0.04 0.043 0.05'); $rect(0, $H - 121, $W, 3, '0.7 0.07 0.106');
  $logo = __DIR__ . '/img/logo-quote.jpg'; $hasLogo = is_file($logo);
  if ($hasLogo) $ops[] = "q 104 0 0 97 48 " . ($H - 108) . " cm /Im1 Do Q";
  $txt(170, $H - 52, 20, 'ESTIMATE / QUOTE', 'F2', '0.93 0.92 0.89');
  $txt(170, $H - 72, 10, 'BlackSheep Digital Works  -  From Conviction to Legacy', 'F1', '0.66 0.68 0.7');
  $rtxt($W - 48, $H - 50, 13, $q['number'], 'F2', '0.93 0.92 0.89');
  $rtxt($W - 48, $H - 68, 9, 'Issued ' . date('M j, Y', $q['created']), 'F1', '0.66 0.68 0.7');
  $rtxt($W - 48, $H - 82, 9, 'Valid until ' . date('M j, Y', $q['valid_until']), 'F1', '0.85 0.4 0.4');
  $y = $H - 160;
  $txt(48, $y, 8, 'PREPARED FOR', 'F2', '0.6 0.07 0.1'); $txt(320, $y, 8, 'SHOOT DETAILS', 'F2', '0.6 0.07 0.1');
  $c = $q['client']; $s = $q['shoot'];
  $L = array_values(array_filter([$c['name'], $c['email'], $c['phone'] ?? '', $c['company'] ?? '']));
  $R = array_values(array_filter([($q['segment'] === 'auto' ? 'Dealership' : 'Real estate') . ($s['type'] ? ' - ' . $s['type'] : ''), $s['address'] ?? '', trim(($s['date'] ? date('D M j, Y', strtotime($s['date'])) : 'Date to be confirmed') . ($s['slot'] ? ' - ' . $s['slot'] : ''))]));
  for ($i = 0; $i < max(count($L), count($R)); $i++) { $yy = $y - 16 - $i * 14; if (isset($L[$i])) $txt(48, $yy, 10.5, $L[$i]); if (isset($R[$i])) $txt(320, $yy, 10.5, $R[$i]); }
  $y -= 30 + max(count($L), count($R)) * 14;
  $rect(48, $y - 6, $W - 96, 22, '0.95 0.94 0.92');
  $txt(56, $y + 1, 8.5, 'ITEM', 'F2'); $rtxt(430, $y + 1, 8.5, 'QTY', 'F2'); $rtxt($W - 56, $y + 1, 8.5, 'AMOUNT', 'F2');
  $y -= 26;
  foreach ($q['price']['lines'] as $l) {
    $txt(56, $y, 10.5, $l['name']); $rtxt(430, $y, 10.5, (string)$l['qty']); $rtxt($W - 56, $y, 10.5, bs_money($l['amount']));
    if (!empty($l['detail'])) { foreach (str_split_words($l['detail'], 92) as $dl) { $y -= 12; $txt(64, $y, 8.5, $dl, 'F1', '0.4 0.4 0.42'); } }
    $y -= 8; $line(48, $y, $W - 48); $y -= 16;
  }
  $y -= 4;
  $txt(330, $y, 10.5, 'Subtotal'); $rtxt($W - 56, $y, 10.5, bs_money($q['price']['subtotal'])); $y -= 16;
  $txt(330, $y, 10.5, 'HST 13%'); $rtxt($W - 56, $y, 10.5, bs_money($q['price']['hst'])); $y -= 10;
  $line(330, $y, $W - 48, '0.1 0.1 0.11', 1.2); $y -= 20;
  $txt(330, $y, 13, 'Estimated total', 'F2'); $rtxt($W - 56, $y, 13, bs_money($q['price']['total']) . ' CAD', 'F2'); $y -= 30;
  foreach ($q['price']['flags'] as $f) { $txt(48, $y, 9.5, '* ' . $f, 'F1', '0.45 0.1 0.1'); $y -= 14; }
  if (!empty($q['notes'])) { $y -= 6; $txt(48, $y, 8, 'YOUR NOTES', 'F2', '0.6 0.07 0.1'); foreach (str_split_words($q['notes'], 100) as $nl) { $y -= 13; $txt(48, $y, 9.5, $nl); if ($y < 170) break; } $y -= 10; }
  // terms
  $y = min($y - 10, 190);
  $line(48, $y, $W - 48); $y -= 16;
  $terms = ['This is an approximate quote based on the details you provided. Final pricing is confirmed once we review the property or inventory.', 'Prices in CAD, plus 13% HST. Travel within the GTA is included; beyond the GTA is quoted per km.', 'Delivery in 24-72 hours depending on volume; most orders are delivered within 24-48 hours.', 'Quote ' . $q['number'] . ' is valid for ' . BS_VALID_DAYS . ' days, until ' . date('F j, Y', $q['valid_until']) . '. Approve it from your email to confirm the booking.'];
  foreach ($terms as $t) foreach (str_split_words($t, 110) as $tl) { $txt(48, $y, 8.5, $tl, 'F1', '0.35 0.35 0.38'); $y -= 12; }
  $rect(0, 0, $W, 40, '0.04 0.043 0.05');
  $txt(48, 16, 9, BS_OWNER_PHONE . '  -  ' . BS_OWNER_EMAIL . '  -  blacksheepdigitalworks.ca', 'F1', '0.85 0.85 0.85');
  $rtxt($W - 48, 16, 9, 'Nick Mehra, Owner & Creative Director', 'F1', '0.85 0.85 0.85');
  $stream = implode("\n", $ops);
  $objs = [];
  $objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  $objs[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  $objs[3] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 $W $H] /Resources << /Font << /F1 4 0 R /F2 5 0 R >>" . ($hasLogo ? ' /XObject << /Im1 7 0 R >>' : '') . " >> /Contents 6 0 R >>";
  $objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  $objs[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  $objs[6] = "<< /Length " . strlen($stream) . " >>\nstream\n$stream\nendstream";
  if ($hasLogo) { $jpg = file_get_contents($logo); $sz = getimagesize($logo);
    $objs[7] = "<< /Type /XObject /Subtype /Image /Width {$sz[0]} /Height {$sz[1]} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " . strlen($jpg) . " >>\nstream\n$jpg\nendstream"; }
  $out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"; $off = [];
  foreach ($objs as $i => $o) { $off[$i] = strlen($out); $out .= "$i 0 obj\n$o\nendobj\n"; }
  $x = strlen($out); $n = max(array_keys($objs)) + 1;
  $out .= "xref\n0 $n\n0000000000 65535 f \n"; for ($i = 1; $i < $n; $i++) $out .= sprintf("%010d 00000 n \n", $off[$i] ?? 0);
  $out .= "trailer\n<< /Size $n /Root 1 0 R /Info << /Title (" . bs_pdf_text('BlackSheep quote ' . $q['number']) . ") /Author (BlackSheep Digital Works) >> >>\nstartxref\n$x\n%%EOF";
  return $out;
}
function str_split_words($s, $w) { return explode("\n", wordwrap(preg_replace('~\s+~', ' ', $s), $w, "\n", true)); }

function bs_json($d, $code = 200) { http_response_code($code); header('Content-Type: application/json'); header('Cache-Control: no-store'); echo json_encode($d); exit; }
function bs_input() { $d = json_decode((string)file_get_contents('php://input'), true); return is_array($d) ? $d : $_POST; }
function bs_clean($s, $max = 200) { return mb_substr(trim(preg_replace('~[\r\n\t]+~', ' ', (string)$s)), 0, $max); }
