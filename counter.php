<?php
// Site visit counter. Stores ONE running total for the whole site. No IP address, cookie, device or page is recorded.
// POST counter.php -> increments the total and returns {"total":N}; GET returns the total without counting.
header("Content-Type: application/json");
header("Cache-Control: no-store");
$dir = dirname(__DIR__) . "/site-private";
if (!is_dir($dir) && !@mkdir($dir, 0750, true)) { $dir = __DIR__ . "/_counter"; @mkdir($dir, 0750, true); }
if (!is_file($dir . "/.htaccess")) @file_put_contents($dir . "/.htaccess", "Require all denied\n");
$fh = @fopen($dir . "/visits.txt", "c+");
if (!$fh) { echo json_encode(["total" => null]); exit; }
flock($fh, LOCK_EX);
$n = (int)trim((string)stream_get_contents($fh));
if ($_SERVER["REQUEST_METHOD"] === "POST") { $n++; ftruncate($fh, 0); rewind($fh); fwrite($fh, (string)$n); fflush($fh); }
flock($fh, LOCK_UN); fclose($fh);
echo json_encode(["total" => $n]);
