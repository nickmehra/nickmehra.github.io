<?php
// Rebuilds a quote PDF from its signed link. Nothing is looked up or stored on the server.
require __DIR__ . '/bs-lib.php';
$q = bs_unseal($_GET['v'] ?? '');
if (!$q || empty($q['number'])) { http_response_code(404); header('Content-Type: text/plain'); echo "Quote not found. Open the link from your quote email."; exit; }
header('Content-Type: application/pdf');
header('Content-Disposition: ' . (isset($_GET['view']) ? 'inline' : 'attachment') . '; filename="BlackSheep-Quote-' . $q['number'] . '.pdf"');
header('Cache-Control: private, no-store');
echo bs_pdf($q);
