<?php
// Like / dislike counter for site images. Stores counts in a JSON file outside the web root.
// GET  react.php?keys=a,b,c        -> {"a":{"up":3,"down":0},...}
// POST react.php  k=<key>&v=up|down|none  -> {"up":n,"down":n,"mine":"up|down|none"}
header('Content-Type: application/json');
header('Cache-Control: no-store');

$dir = dirname(__DIR__) . '/reactions-data';
if (!is_dir($dir) && !@mkdir($dir, 0750, true)) { $dir = __DIR__ . '/_reactions'; @mkdir($dir, 0750, true); @file_put_contents($dir . '/.htaccess', "Require all denied\n"); }
$file = $dir . '/reactions.json';

function clean_key($k) { $k = preg_replace('~[?#].*$~', '', (string)$k); $k = preg_replace('~^https?://[^/]+~', '', $k); return substr(preg_replace('~[^A-Za-z0-9/_.\-]~', '', $k), 0, 160); }
function voter() { $ip = $_SERVER['REMOTE_ADDR'] ?? ''; return substr(hash('sha256', 'bs-salt-7c1e|' . $ip . '|' . ($_SERVER['HTTP_USER_AGENT'] ?? '')), 0, 16); }

$fh = fopen($file, 'c+');
if (!$fh) { http_response_code(500); echo '{"error":"storage"}'; exit; }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $k = clean_key($_POST['k'] ?? '');
  $v = $_POST['v'] ?? '';
  if ($k === '' || !in_array($v, ['up', 'down', 'none'], true)) { http_response_code(400); echo '{"error":"bad request"}'; exit; }
  flock($fh, LOCK_EX);
  $data = json_decode(stream_get_contents($fh) ?: '{}', true) ?: [];
  if (count($data) > 5000 && !isset($data[$k])) { flock($fh, LOCK_UN); http_response_code(429); echo '{"error":"full"}'; exit; }
  $e = $data[$k] ?? ['up' => [], 'down' => []];
  $me = voter();
  $e['up'] = array_values(array_diff($e['up'], [$me]));
  $e['down'] = array_values(array_diff($e['down'], [$me]));
  if ($v !== 'none') $e[$v][] = $me;
  $data[$k] = $e;
  ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($data)); fflush($fh);
  flock($fh, LOCK_UN);
  echo json_encode(['up' => count($e['up']), 'down' => count($e['down']), 'mine' => $v]);
  exit;
}

flock($fh, LOCK_SH);
$data = json_decode(stream_get_contents($fh) ?: '{}', true) ?: [];
flock($fh, LOCK_UN);
$me = voter(); $out = [];
foreach (array_slice(explode(',', (string)($_GET['keys'] ?? '')), 0, 200) as $k) {
  $k = clean_key($k); if ($k === '') continue;
  $e = $data[$k] ?? ['up' => [], 'down' => []];
  $out[$k] = ['up' => count($e['up']), 'down' => count($e['down']), 'mine' => in_array($me, $e['up'], true) ? 'up' : (in_array($me, $e['down'], true) ? 'down' : 'none')];
}
echo json_encode($out);
