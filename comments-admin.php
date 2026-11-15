<?php
// Private approval page for journal comments. The first visit asks the owner to create a password.
require __DIR__ . '/comments-store.php';
session_set_cookie_params(['httponly' => true, 'secure' => true, 'samesite' => 'Strict']);
session_start();
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

$cfg = cm_config();
$msg = '';
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function csrf_ok() { return isset($_POST['csrf'], $_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $_POST['csrf']); }
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $act = $_POST['act'] ?? '';
  if ($act === 'setup' && empty($cfg['hash'])) {
    $p = $_POST['password'] ?? '';
    usleep(400000);
    if (!hash_equals('5a2086f4b4f06395e64db2598e7a591c214c4943c19d29d5a1b0eabbedb78261', hash('sha256', strtoupper(trim($_POST['code'] ?? ''))))) $msg = 'That setup code is not right.';
    elseif (strlen($p) < 10) $msg = 'Use at least 10 characters.';
    else { $cfg = ['hash' => password_hash($p, PASSWORD_DEFAULT), 'email' => filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL) ?: '']; cm_save_config($cfg); $_SESSION['ok'] = true; session_regenerate_id(true); }
  } elseif ($act === 'login' && !empty($cfg['hash'])) {
    usleep(400000);
    if (password_verify($_POST['password'] ?? '', $cfg['hash'])) { $_SESSION['ok'] = true; session_regenerate_id(true); } else $msg = 'Wrong password.';
  } elseif (!empty($_SESSION['ok']) && csrf_ok()) {
    $id = $_POST['id'] ?? '';
    if ($act === 'approve') cm_update(function (&$d) use ($id) { foreach ($d['pending'] as $i => $c) if ($c['id'] === $id) { unset($c['ip']); $d['approved'][] = $c; array_splice($d['pending'], $i, 1); return true; } return false; });
    if ($act === 'reject') cm_update(function (&$d) use ($id) { foreach ($d['pending'] as $i => $c) if ($c['id'] === $id) { array_splice($d['pending'], $i, 1); return true; } return false; });
    if ($act === 'remove') cm_update(function (&$d) use ($id) { foreach ($d['approved'] as $i => $c) if ($c['id'] === $id) { array_splice($d['approved'], $i, 1); return true; } return false; });
    if ($act === 'email') { $cfg['email'] = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL) ?: ''; cm_save_config($cfg); $msg = 'Notification email saved.'; }
    if ($act === 'logout') { session_destroy(); header('Location: comments-admin.php'); exit; }
  }
}
$d = cm_read();
?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Comment approvals</title>
<style>body{margin:0;background:#0a0b0d;color:#efebe3;font:16px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}main{max-width:760px;margin:0 auto;padding:40px 20px}h1{font-weight:600;font-size:26px;margin:0 0 6px}h2{font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#a9adb3;margin:36px 0 12px}.c{border:1px solid #2a2c31;border-radius:12px;padding:16px 18px;margin:0 0 12px;background:#121317}.m{white-space:pre-wrap;margin:8px 0 12px}.meta{color:#a9adb3;font-size:13px}form.inline{display:inline}button{font:600 13px system-ui;border-radius:999px;padding:8px 16px;border:1px solid #444;background:none;color:#efebe3;cursor:pointer;margin-right:6px}button.ok{background:#d11f26;border-color:#d11f26;color:#fff}input{font:inherit;padding:10px 12px;border-radius:8px;border:1px solid #333;background:#0f1013;color:#efebe3;width:100%;box-sizing:border-box;margin:6px 0 12px}.note{color:#e9a42c}</style></head><body><main>
<?php if (empty($cfg['hash'])): ?>
  <h1>Set up comment approvals</h1><p class="meta">Create the password you'll use to approve comments. Optionally add an email to be notified when a new comment arrives.</p>
  <?php if ($msg) echo '<p class="note">' . h($msg) . '</p>'; ?>
  <form method="post"><input type="hidden" name="act" value="setup"><label>Setup code<input name="code" required autocomplete="off"></label><label>Password (10+ characters)<input type="password" name="password" required minlength="10" autocomplete="new-password"></label><label>Notification email (optional)<input type="email" name="email" autocomplete="email"></label><button class="ok">Create</button></form>
<?php elseif (empty($_SESSION['ok'])): ?>
  <h1>Comment approvals</h1><?php if ($msg) echo '<p class="note">' . h($msg) . '</p>'; ?>
  <form method="post"><input type="hidden" name="act" value="login"><label>Password<input type="password" name="password" required autocomplete="current-password"></label><button class="ok">Log in</button></form>
<?php else: ?>
  <h1>Comment approvals</h1><p class="meta"><?php echo h($_SERVER['HTTP_HOST'] ?? ''); ?> · <form class="inline" method="post"><input type="hidden" name="csrf" value="<?php echo h($_SESSION['csrf']); ?>"><button name="act" value="logout">Log out</button></form></p>
  <?php if ($msg) echo '<p class="note">' . h($msg) . '</p>'; ?>
  <h2>Waiting for approval (<?php echo count($d['pending']); ?>)</h2>
  <?php if (!$d['pending']) echo '<p class="meta">Nothing waiting.</p>'; foreach (array_reverse($d['pending']) as $c): ?>
    <div class="c"><div class="meta"><b><?php echo h($c['name']); ?></b> on <?php echo h($c['post']); ?><?php echo !empty($c['parent']) ? ' · reply' : ''; ?> · <?php echo date('M j, Y g:i a', $c['time']); ?></div><?php if (!empty($c['photo'])): ?><img src="<?php echo h($c['photo']); ?>" alt="" style="width:120px;height:80px;object-fit:cover;display:block;margin:6px 0"><?php endif; ?><div class="m"><?php echo h($c['message']); ?></div>
    <form class="inline" method="post"><input type="hidden" name="csrf" value="<?php echo h($_SESSION['csrf']); ?>"><input type="hidden" name="id" value="<?php echo h($c['id']); ?>"><button class="ok" name="act" value="approve">Approve</button><button name="act" value="reject">Delete</button></form></div>
  <?php endforeach; ?>
  <h2>Published (<?php echo count($d['approved']); ?>)</h2>
  <?php foreach (array_reverse($d['approved']) as $c): ?>
    <div class="c"><div class="meta"><b><?php echo h($c['name']); ?></b> on <?php echo h($c['post']); ?> · <?php echo date('M j, Y', $c['time']); ?></div><div class="m"><?php echo h($c['message']); ?></div>
    <form class="inline" method="post"><input type="hidden" name="csrf" value="<?php echo h($_SESSION['csrf']); ?>"><input type="hidden" name="id" value="<?php echo h($c['id']); ?>"><button name="act" value="remove">Remove</button></form></div>
  <?php endforeach; ?>
  <h2>Notifications</h2>
  <form method="post"><input type="hidden" name="csrf" value="<?php echo h($_SESSION['csrf']); ?>"><input type="hidden" name="act" value="email"><input type="email" name="email" value="<?php echo h($cfg['email'] ?? ''); ?>" placeholder="Email for new-comment alerts"><button>Save</button></form>
<?php endif; ?>
</main></body></html>
