<?php
require __DIR__ . '/bs-auth.php';
$ok = bs_unsub((string)($_GET['k'] ?? ''), (string)($_GET['s'] ?? ''));
header('Content-Type: text/html; charset=utf-8'); header('X-Robots-Tag: noindex');
echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Unsubscribe · BlackSheep Digital Works</title><link rel="stylesheet" href="/fonts/fonts.css">'
  . '<style>body{margin:0;background:#0A0B0D;color:#EFEBE3;font:400 19px/1.6 "EB Garamond",Georgia,serif;text-align:center}main{max-width:560px;margin:0 auto;padding:80px 22px}h1{font-family:Cinzel,serif;font-weight:500;letter-spacing:.04em}a{color:#EFEBE3}</style></head><body><main>'
  . ($ok ? '<h1>You\'re unsubscribed.</h1><p>You won\'t get the BlackSheep Monday update anymore. Booking emails about shoots you request will still reach you.</p>'
         : '<h1>Link not recognised.</h1><p>Email <a href="mailto:' . BS_OWNER_EMAIL . '">' . BS_OWNER_EMAIL . '</a> and we\'ll remove you right away.</p>')
  . '<p><a href="/">blacksheepdigitalworks.ca</a></p></main></body></html>';
