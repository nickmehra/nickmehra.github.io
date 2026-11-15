<?php
// Checks a referral code for the live estimate on the booking and quote forms. GET ref-check.php?code=XXXX -> {"ok":true,"partner":"..."}
require __DIR__ . '/bs-lib.php';
header('Cache-Control: no-store');
if (!bs_rate_ok('refchk', 300, 3600)) bs_json(['ok' => false], 429);
$r = bs_referral((string)($_GET['code'] ?? ''));
bs_json($r ? ['ok' => true, 'partner' => $r['name'], 'pct' => BS_REF_PCT] : ['ok' => false]);
