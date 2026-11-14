<?php
// Shared storage for journal comments, kept outside the public web folder.
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === 'comments-store.php') { http_response_code(404); exit; }

function cm_dir() {
  $dir = dirname(__DIR__) . '/reactions-data';
  if (!is_dir($dir) && !@mkdir($dir, 0750, true)) { $dir = __DIR__ . '/_reactions'; @mkdir($dir, 0750, true); @file_put_contents($dir . '/.htaccess', "Require all denied\n"); }
  return $dir;
}
function cm_key($k) { return substr(preg_replace('~[^A-Za-z0-9:_\-/]~', '', (string)$k), 0, 120); }
function cm_voter() { return substr(hash('sha256', 'cm-salt-41b9|' . ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 16); }
function cm_read() {
  $f = cm_dir() . '/comments.json';
  $d = is_file($f) ? json_decode((string)file_get_contents($f), true) : null;
  return is_array($d) ? $d + ['pending' => [], 'approved' => []] : ['pending' => [], 'approved' => []];
}
function cm_update($fn) {
  $fh = fopen(cm_dir() . '/comments.json', 'c+'); if (!$fh) return false;
  flock($fh, LOCK_EX);
  $d = json_decode(stream_get_contents($fh) ?: '', true);
  $d = is_array($d) ? $d + ['pending' => [], 'approved' => []] : ['pending' => [], 'approved' => []];
  $r = $fn($d);
  if ($r !== false) { ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($d)); fflush($fh); }
  flock($fh, LOCK_UN); fclose($fh);
  return $r;
}
function cm_config() { $f = cm_dir() . '/comments-admin.json'; return is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : []; }
function cm_save_config($c) { file_put_contents(cm_dir() . '/comments-admin.json', json_encode($c)); }
