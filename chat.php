<?php
// Website chat: emails Nick the conversation (and any question the assistant couldn't answer). Nothing about visitors is stored on the server.
require __DIR__ . '/comments-store.php';
header('Content-Type: application/json'); header('Cache-Control: no-store');
const NM_OWNER = 'nic.mehra@gmail.com';
function out($d, $c = 200) { http_response_code($c); echo json_encode($d); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['ok' => false], 405);
$in = json_decode(file_get_contents('php://input', false, null, 0, 40000) ?: '', true);
if (!is_array($in) || !in_array($in['type'] ?? '', ['escalate', 'transcript'], true)) out(['ok' => false], 400);
// site-wide limit: at most 200 chat emails an hour (only timestamps are kept)
$rf = cm_dir() . '/chat-rate.json'; $fh = fopen($rf, 'c+');
if ($fh) { flock($fh, LOCK_EX); $r = json_decode(stream_get_contents($fh) ?: '[]', true) ?: [];
  $r = array_values(array_filter($r, function ($t) { return $t > time() - 3600; }));
  if (count($r) >= 200) { flock($fh, LOCK_UN); out(['ok' => false], 429); }
  $r[] = time(); ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($r)); flock($fh, LOCK_UN); fclose($fh); }
$clean = function ($s, $n) { return mb_substr(trim(preg_replace('~[\r\n\t]+~', ' ', strip_tags((string)$s))), 0, $n); };
date_default_timezone_set('America/Toronto');
$sid = preg_replace('~[^a-z0-9]~', '', (string)($in['sid'] ?? '')) ?: 'unknown'; $ref = 'CHAT-' . strtoupper(substr($sid, 0, 6));
$page = $clean($in['page'] ?? '/', 120); $contact = $clean($in['contact'] ?? '', 120); $q = $clean($in['question'] ?? '', 600);
$text = '';
foreach (array_slice((array)($in['log'] ?? []), -60) as $m) {
  if (!is_array($m)) continue;
  $t = mb_substr(trim(strip_tags((string)($m['t'] ?? ''))), 0, 1500); if ($t === '') continue;
  $at = isset($m['at']) && is_numeric($m['at']) ? date('g:i a', (int)($m['at'] / 1000)) : '';
  $text .= "[$at] " . (($m['w'] ?? '') === 'me' ? 'Visitor' : 'Assistant') . ": $t\n\n";
}
if ($text === '' && $q === '') out(['ok' => false], 400);
if ($in['type'] === 'escalate') {
  $subject = "nickmehra.ca chat question needs your answer ($ref)" . ($contact ? " - $contact" : '');
  $body = "The assistant wasn't confident answering this, so the visitor was told you'll reply personally.\n\nQuestion: $q\nReply to: " . ($contact ?: 'no contact given') . "\nPage: $page\n\nConversation so far:\n\n$text";
} else {
  $subject = 'nickmehra.ca chat ' . (($in['part'] ?? '') === 'update' ? 'continued' : 'transcript') . " ($ref)" . ($contact ? " - $contact" : '');
  $body = "Website chat on $page" . ($contact ? " (contact: $contact)" : '') . ":\n\n$text";
}
$host = preg_replace('~[^a-z0-9.\-]~i', '', $_SERVER['HTTP_HOST'] ?? 'nickmehra.ca');
$reply = filter_var($contact, FILTER_VALIDATE_EMAIL) ? $contact : NM_OWNER;
$h = "From: nickmehra.ca <chat@$host>\r\nReply-To: $reply\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8";
if (getenv('BS_MAIL_TEST')) file_put_contents(getenv('BS_MAIL_TEST'), "TO: " . NM_OWNER . "\nSUBJECT: $subject\n$body\n----\n", FILE_APPEND);
else @mail(NM_OWNER, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $h, '-f chat@' . $host);
out(['ok' => true]);
