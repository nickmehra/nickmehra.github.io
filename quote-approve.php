<?php
// Approve & confirm a quote. GET shows the quote and a confirm button (so email link scanners can't approve by accident);
// POST approves it, then emails the client and the owner.
require __DIR__ . '/bs-lib.php';
$v = (string)($_REQUEST['v'] ?? '');
$q = bs_unseal($v);
$allowed = $q && !empty($q['number']);
$num = $allowed ? $q['number'] : '';
$e = function ($s) { return htmlspecialchars((string)$s, ENT_QUOTES); };
$msg = ''; $state = $allowed ? bs_status($q) : 'missing';

if ($allowed && $_SERVER['REQUEST_METHOD'] === 'POST' && $state === 'open') {
  $first = bs_mark_approved($num); $state = 'approved';
  if ($first) {
    $q['approved_at'] = time(); $L = bs_links($q); $pdf = bs_pdf($q); $c = $q['client']; $s = $q['shoot'];
    $when = $s['date'] ? date('l, F j, Y', strtotime($s['date'])) . ($s['slot'] ? ', ' . $s['slot'] : '') : 'date to be confirmed';
    bs_mail($c['email'], "Booking confirmed · quote {$q['number']}", bs_email_shell('You are booked in',
      '<p>Thanks, ' . $e(explode(' ', $c['name'])[0]) . '. You approved quote <b>' . $e($q['number']) . '</b> for ' . $e($when) . '.</p>'
      . '<p>Nick will be in touch shortly to confirm the final details, access and timing. If the date or address changes, just reply to this email.</p>'
      . bs_lines_table($q) . '<p>' . bs_btn($L['pdf'], 'Download quote PDF') . '</p>'),
      "You approved quote {$q['number']} for $when. Nick will confirm the final details shortly.\nPDF: {$L['pdf']}\n", ["BlackSheep-Quote-{$q['number']}.pdf", $pdf]);
    bs_mail(BS_OWNER_EMAIL, "APPROVED {$q['number']} · " . bs_money($q['price']['total']) . " · {$c['name']}", bs_email_shell('Quote approved: ' . $q['number'],
      '<p><b>' . $e($c['name']) . '</b> approved their quote and confirmed the booking.</p><p>' . $e($c['email']) . ($c['phone'] ? ' · ' . $e($c['phone']) : '') . '<br>' . $e($s['address']) . '<br>' . $e($when) . '</p>'
      . bs_lines_table($q) . '<p>' . bs_btn('mailto:' . $c['email'] . '?subject=' . rawurlencode("Your booking {$q['number']}"), 'Email client') . '</p>'),
      "{$c['name']} approved {$q['number']} for $when.\n\nBSQ-RECORD:" . base64_encode(json_encode(['event' => 'approved', 'at' => time(), 'quote' => $q, 'pdf' => $L['pdf']], JSON_UNESCAPED_UNICODE)) . "\n",
      ["BlackSheep-Quote-{$q['number']}.pdf", $pdf], $c['email']);
  }
  $msg = 'approved-now';
}
if ($allowed && $state === 'approved' && empty($q['approved_at'])) $q['approved_at'] = bs_is_approved($num);
$L = $q ? bs_links($q) : null;
?><!doctype html>
<html lang="en-CA"><head><meta charset="utf-8"><meta name="color-scheme" content="light dark"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Your quote · BlackSheep Digital Works</title><link rel="icon" href="/img/ram.png">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400..700&family=EB+Garamond:wght@400..600&display=swap">
<style>
:root{--bg:#F5F5F2;--panel:#fff;--fg:#08090A;--muted:#3a3e44;--line:rgba(8,9,10,.18);--red:#9A1219;color-scheme:only light}
@media (prefers-color-scheme:dark){:root{--bg:#0A0B0D;--panel:#121418;--fg:#EFEBE3;--muted:#A9ADB3;--line:rgba(239,235,227,.16);--red:#D11F26;color-scheme:dark}}
body{margin:0;background:var(--bg);color:var(--fg);font:400 19px/1.6 "EB Garamond",Georgia,serif;text-align:center}
header{background:#0A0B0D;padding:18px;border-bottom:3px solid #B3121B}header img{height:64px}
main{max-width:680px;margin:0 auto;padding:44px 20px 70px}
.k{font:600 .7rem Cinzel,serif;letter-spacing:.3em;text-transform:uppercase;color:var(--red)}
h1{font:600 clamp(1.7rem,5vw,2.4rem)/1.15 Cinzel,serif;margin:8px 0 14px}
.card{background:var(--panel);border:1px solid var(--line);padding:26px clamp(16px,4vw,32px);margin-top:24px;text-align:left}
table{width:100%;border-collapse:collapse;font-size:1rem}td{padding:8px 0;border-bottom:1px solid var(--line)}td:last-child{text-align:right;white-space:nowrap}
tr.t td{font-weight:600;font-size:1.15rem;border-top:2px solid var(--fg);border-bottom:0}
.btn{display:inline-block;margin:8px 6px 0;padding:15px 24px;font:600 .72rem Cinzel,serif;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;border:1px solid var(--fg);color:var(--fg);background:none;cursor:pointer}
.btn.p{background:var(--fg);color:var(--bg)}.btn:hover{border-color:var(--red)}
.muted{color:var(--muted)}.note{font-size:.95rem;color:var(--muted)}
</style></head><body>
<header><a href="/"><img src="/img/logo.png" alt="BlackSheep Digital Works"></a></header>
<main>
<?php if (!$allowed): ?>
  <span class="k">Quote</span><h1>We couldn't find that quote.</h1>
  <p class="muted">The link may be incomplete. Open it again from your quote email, or call <?= BS_OWNER_PHONE ?>.</p>
<?php else: $c = $q['client']; $s = $q['shoot']; ?>
  <span class="k">Quote <?= $e($q['number']) ?></span>
  <?php if ($state === 'approved'): ?>
    <h1><?= $msg ? 'You are booked in.' : 'Already confirmed.' ?></h1>
    <p class="muted">Approved <?= date('F j, Y', $q['approved_at'] ?? time()) ?>. <?= $msg ? 'A confirmation is on its way to ' . $e($c['email']) . '. Nick will be in touch to confirm the final details.' : '' ?></p>
  <?php elseif ($state === 'expired'): ?>
    <h1>This quote has expired.</h1>
    <p class="muted">Quotes are good for <?= BS_VALID_DAYS ?> days and this one ended <?= date('F j, Y', $q['valid_until']) ?>. Get a fresh quote in a minute on the <a href="/pricing/">pricing page</a>, or call <?= BS_OWNER_PHONE ?>.</p>
  <?php else: ?>
    <h1>Approve &amp; confirm your booking</h1>
    <p class="muted">Good until <?= date('F j, Y', $q['valid_until']) ?>. Approving locks in this price and books your shoot<?= $s['date'] ? ' for ' . $e(date('l, F j', strtotime($s['date']))) . ($s['slot'] ? ', ' . $e($s['slot']) : '') : '' ?>.</p>
  <?php endif; ?>
  <div class="card">
    <p style="margin:0 0 10px"><b><?= $e($c['name']) ?></b><br><span class="muted"><?= $e($s['address']) ?></span></p>
    <table>
      <?php foreach ($q['price']['lines'] as $l): ?><tr><td><?= $e($l['name']) ?><?= $l['qty'] > 1 ? ' × ' . (int)$l['qty'] : '' ?></td><td><?= bs_money($l['amount']) ?></td></tr><?php endforeach; ?>
      <tr><td class="muted">Subtotal</td><td class="muted"><?= bs_money($q['price']['subtotal']) ?></td></tr>
      <tr><td class="muted">HST 13%</td><td class="muted"><?= bs_money($q['price']['hst']) ?></td></tr>
      <tr class="t"><td>Estimated total</td><td><?= bs_money($q['price']['total']) ?></td></tr>
    </table>
    <?php foreach ($q['price']['flags'] as $fl): ?><p class="note">* <?= $e($fl) ?></p><?php endforeach; ?>
  </div>
  <?php if ($state === 'open'): ?>
    <form method="post"><input type="hidden" name="v" value="<?= $e($v) ?>">
      <button class="btn p" type="submit">Approve &amp; confirm booking</button>
      <a class="btn" href="mailto:<?= BS_OWNER_EMAIL ?>?subject=<?= rawurlencode('Question about quote ' . $num) ?>">Ask a question</a></form>
    <p class="note">This is an approximate quote. Final pricing is confirmed once we review the property or inventory.</p>
  <?php endif; ?>
  <p><a class="btn" href="<?= $e($L['pdf']) ?>">Download PDF</a><a class="btn" href="/pricing/">Pricing</a></p>
<?php endif; ?>
</main></body></html>
