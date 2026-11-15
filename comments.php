<?php
// Journal comments. New comments are held as pending until approved at /comments-admin.php.
// GET  comments.php?post=<id>                     -> {"comments":[{name,message,time}]}
// POST comments.php post, name, message, website(honeypot) [, photo=<image path>, parent=<comment id>] -> {"ok":true,"pending":true}
// photo: which portfolio photo the comment is about (a site image path, not personal data); parent: the comment being replied to
header('Content-Type: application/json');
header('Cache-Control: no-store');
require __DIR__ . '/comments-store.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $post = cm_key($_POST['post'] ?? '');
  $name = trim(mb_substr(strip_tags($_POST['name'] ?? ''), 0, 60));
  $msg  = trim(mb_substr(strip_tags($_POST['message'] ?? ''), 0, 2000));
  if (($_POST['website'] ?? '') !== '') { echo '{"ok":true,"pending":true}'; exit; } // bot trap
  $photo = preg_match('~^/img/[A-Za-z0-9/_.\-]{1,140}$~', (string)($_POST['photo'] ?? '')) ? $_POST['photo'] : '';
  $parent = preg_match('~^[a-f0-9]{12}$~', (string)($_POST['parent'] ?? '')) ? $_POST['parent'] : '';
  if ($post === '' || $name === '' || mb_strlen($msg) < 2) { http_response_code(400); echo '{"error":"Please add your name and a comment."}'; exit; }
  // Only the name, the comment and when it was posted are kept. No IP address or device details.
  $ok = cm_update(function (&$d) use ($post, $name, $msg, $photo, $parent) {
    foreach ($d['pending'] as &$p) unset($p['ip']); unset($p);
    $recent = array_filter($d['pending'], function ($c) use ($name, $post) { return $c['time'] > time() - 60 && ($c['post'] === $post && strcasecmp($c['name'], $name) === 0); });
    $burst = array_filter($d['pending'], function ($c) { return $c['time'] > time() - 60; });
    if (count($recent) > 0 || count($burst) > 8 || count($d['pending']) > 500) return false;
    if ($parent !== '') { $pa = null; foreach ($d['approved'] as $c) if ($c['id'] === $parent && $c['post'] === $post) $pa = $c; if (!$pa) return false; $photo = $pa['photo'] ?? $photo; }
    $c = ['id' => bin2hex(random_bytes(6)), 'post' => $post, 'name' => $name, 'message' => $msg, 'time' => time()];
    if ($photo !== '') $c['photo'] = $photo; if ($parent !== '') $c['parent'] = $parent;
    $d['pending'][] = $c;
    return true;
  });
  if (!$ok) { http_response_code(429); echo '{"error":"Please wait a minute before posting again."}'; exit; }
  $cfg = cm_config();
  if (!empty($cfg['email'])) {
    $host = $_SERVER['HTTP_HOST'] ?? 'your site';
    @mail($cfg['email'], "New comment waiting for approval on $host",
      "$name wrote on $post" . ($photo ? " (photo $photo)" : '') . ($parent ? ' as a reply' : '') . ":\n\n$msg\n\nApprove or delete it: https://$host/comments-admin.php\n",
      "From: comments@$host\r\nContent-Type: text/plain; charset=UTF-8");
  }
  echo '{"ok":true,"pending":true}';
  exit;
}

$post = cm_key($_GET['post'] ?? '');
$d = cm_read();
$out = [];
foreach ($d['approved'] as $c) if ($c['post'] === $post) $out[] = ['id' => $c['id'], 'name' => $c['name'], 'message' => $c['message'], 'time' => $c['time'], 'photo' => $c['photo'] ?? '', 'parent' => $c['parent'] ?? ''];
echo json_encode(['comments' => $out]);
