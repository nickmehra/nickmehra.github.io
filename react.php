<?php
// Like / dislike totals for site images. Stores ONLY the two totals per image (no IPs, no device
// fingerprints, nothing about who voted) in a JSON file outside the web root. Each visitor's own
// choice is remembered in their own browser (localStorage), which sends it back as "prev" when it changes.
// GET  react.php?keys=a,b,c                 -> {"a":{"up":3,"down":0},...}
// POST react.php  k=<key>&v=up|down|none&prev=up|down|none -> {"up":n,"down":n}
header('Content-Type: application/json');
header('Cache-Control: no-store');

$dir = dirname(__DIR__) . '/reactions-data';
if (!is_dir($dir) && !@mkdir($dir, 0750, true)) { $dir = __DIR__ . '/_reactions'; @mkdir($dir, 0750, true); @file_put_contents($dir . '/.htaccess', "Require all denied\n"); }
$file = $dir . '/reactions.json';

function clean_key($k) { $k = preg_replace('~[?#].*$~', '', (string)$k); $k = preg_replace('~^https?://[^/]+~', '', $k); return substr(preg_replace('~[^A-Za-z0-9/_.\-]~', '', $k), 0, 160); }
// Older data kept lists of anonymous voter codes; reduce any such entry to plain totals.
function totals($e) { return ['up' => is_array($e['up'] ?? 0) ? count($e['up']) : (int)($e['up'] ?? 0), 'down' => is_array($e['down'] ?? 0) ? count($e['down']) : (int)($e['down'] ?? 0)]; }

$fh = fopen($file, 'c+');
if (!$fh) { http_response_code(500); echo '{"error":"storage"}'; exit; }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $k = clean_key($_POST['k'] ?? '');
  $v = $_POST['v'] ?? ''; $prev = $_POST['prev'] ?? 'none';
  $ok = ['up', 'down', 'none'];
  if ($k === '' || !in_array($v, $ok, true) || !in_array($prev, $ok, true)) { http_response_code(400); echo '{"error":"bad request"}'; exit; }
  flock($fh, LOCK_EX);
  $data = json_decode(stream_get_contents($fh) ?: '{}', true) ?: [];
  foreach ($data as $kk => $ee) $data[$kk] = totals($ee);
  if (count($data) > 5000 && !isset($data[$k])) { flock($fh, LOCK_UN); http_response_code(429); echo '{"error":"full"}'; exit; }
  $e = $data[$k] ?? ['up' => 0, 'down' => 0];
  if ($prev !== 'none') $e[$prev] = max(0, $e[$prev] - 1);
  if ($v !== 'none') $e[$v] += 1;
  $data[$k] = $e;
  ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($data)); fflush($fh);
  flock($fh, LOCK_UN);
  echo json_encode($e);
  exit;
}

flock($fh, LOCK_SH);
$data = json_decode(stream_get_contents($fh) ?: '{}', true) ?: [];
flock($fh, LOCK_UN);
$out = [];
foreach (array_slice(explode(',', (string)($_GET['keys'] ?? '')), 0, 200) as $k) {
  $k = clean_key($k); if ($k === '') continue;
  $out[$k] = totals($data[$k] ?? []);
}
echo json_encode($out);
