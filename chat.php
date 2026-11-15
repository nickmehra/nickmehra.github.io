<?php
// Website chat: emails Nick the conversation (and any question the assistant couldn't answer). Nothing is stored on the server.
require __DIR__ . '/bs-lib.php';
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') bs_json(['ok' => false], 405);
$raw = file_get_contents('php://input', false, null, 0, 40000);
$in = json_decode($raw ?: '', true);
if (!is_array($in) || !in_array($in['type'] ?? '', ['escalate', 'transcript'], true)) bs_json(['ok' => false], 400);
if (!bs_rate_ok('chat', 200, 3600)) bs_json(['ok' => false], 429);
$type = $in['type'];
$sid = preg_replace('~[^a-z0-9]~', '', (string)($in['sid'] ?? '')) ?: 'unknown';
$page = bs_clean($in['page'] ?? '/', 120);
$contact = bs_clean($in['contact'] ?? '', 120);
$q = bs_clean($in['question'] ?? '', 600);
$lines = [];
foreach (array_slice((array)($in['log'] ?? []), -60) as $m) {
  if (!is_array($m)) continue;
  $who = ($m['w'] ?? '') === 'me' ? 'Visitor' : 'Assistant';
  $t = mb_substr(trim(strip_tags((string)($m['t'] ?? ''))), 0, 1500);
  $at = isset($m['at']) && is_numeric($m['at']) ? date('g:i a', (int)($m['at'] / 1000)) : '';
  if ($t !== '') $lines[] = [$who, $t, $at];
}
if (!$lines && $q === '') bs_json(['ok' => false], 400);
date_default_timezone_set('America/Toronto');
$e = function ($s) { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); };
$text = ''; $rows = '';
foreach ($lines as [$w, $t, $at]) {
  $text .= "[$at] $w: $t\n\n";
  $rows .= '<tr><td style="padding:8px 10px;vertical-align:top;font:600 12px Arial,sans-serif;color:' . ($w === 'Visitor' ? '#9A1219' : '#666') . ';white-space:nowrap">' . $e($w) . '<br><span style="font-weight:400;color:#999">' . $e($at) . '</span></td><td style="padding:8px 10px;font:14px/1.5 Arial,sans-serif;color:#222;white-space:pre-line">' . $e($t) . '</td></tr>';
}
$ref = 'CHAT-' . strtoupper(substr($sid, 0, 6));
if ($type === 'escalate') {
  $subject = "Chat question needs your answer ($ref)" . ($contact ? " · $contact" : '');
  $lead = '<p style="font:15px/1.6 Arial,sans-serif"><b>The assistant wasn\'t confident answering this, so the visitor was told you\'ll reply personally.</b></p>'
    . '<p style="font:15px/1.6 Arial,sans-serif;background:#F6E9E9;padding:12px 14px;border-left:3px solid #9A1219"><b>Question:</b> ' . $e($q) . '<br><b>Reply to:</b> ' . ($contact ? $e($contact) : 'no contact given') . '<br><b>Page:</b> ' . $e($page) . '</p>';
  $ttext = "The assistant wasn't confident answering this, so the visitor was told you'll reply personally.\n\nQuestion: $q\nReply to: " . ($contact ?: 'no contact given') . "\nPage: $page\n\nConversation so far:\n\n" . $text;
} else {
  $subject = 'Website chat ' . (($in['part'] ?? '') === 'update' ? 'continued' : 'transcript') . " ($ref)" . ($contact ? " · $contact" : '');
  $lead = '<p style="font:15px/1.6 Arial,sans-serif">A visitor chatted with the website assistant' . ($contact ? ' and left <b>' . $e($contact) . '</b> for a reply' : '') . '. Page: ' . $e($page) . '</p>';
  $ttext = "Website chat on $page" . ($contact ? " (contact: $contact)" : '') . ":\n\n" . $text;
}
$html = bs_email_shell($subject, $lead . '<table style="width:100%;border-collapse:collapse;margin-top:10px">' . $rows . '</table>');
$replyTo = filter_var($contact, FILTER_VALIDATE_EMAIL) ? $contact : BS_OWNER_EMAIL;
bs_mail(BS_OWNER_EMAIL, $subject, $html, $ttext, null, $replyTo);
bs_json(['ok' => true]);
