<?php
// PHP Unix Domain Socket reverse proxy to OpenGym Node.js backend
$sock = '/home/u173210759/gym-backend/gym-api.sock';
$envFile = '/home/u173210759/gym-backend/api/.env';
$serverJs = '/home/u173210759/gym-backend/api/server.js';
$nodeBin = '/home/u173210759/node-v22.11.0-linux-x64/bin/node';
$logFile = '/home/u173210759/gym-backend/api/server.log';

function ensureBackendRunning($sock, $nodeBin, $envFile, $serverJs, $logFile) {
    if (!file_exists($sock)) {
        $cmd = "nohup $nodeBin --env-file=$envFile $serverJs < /dev/null > $logFile 2>&1 &";
        exec($cmd);
        for ($i = 0; $i < 20; $i++) {
            usleep(100000); // 100ms
            if (file_exists($sock)) break;
        }
    }
}

ensureBackendRunning($sock, $nodeBin, $envFile, $serverJs, $logFile);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/api/config';
$url = 'http://localhost' . $uri;

$headers = [];
$incoming = function_exists('getallheaders') ? getallheaders() : [];
foreach ($incoming as $name => $value) {
    if (strtolower($name) === 'host') continue;
    $headers[] = "$name: $value";
}
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$headers[] = "X-Forwarded-For: $clientIp";
$headers[] = "X-Forwarded-Proto: https";

$ch = curl_init();
curl_setopt($ch, CURLOPT_UNIX_SOCKET_PATH, $sock);
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

if ($method !== 'GET' && $method !== 'HEAD') {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

$response = curl_exec($ch);
if ($response === false) {
    ensureBackendRunning($sock, $nodeBin, $envFile, $serverJs, $logFile);
    $response = curl_exec($ch);
}

if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Backend unavailable: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$resp_headers = substr($response, 0, $header_size);
$body = substr($response, $header_size);
curl_close($ch);

http_response_code($http_code);
$header_lines = explode("\r\n", $resp_headers);
foreach ($header_lines as $line) {
    if (empty($line)) continue;
    if (stripos($line, 'HTTP/') === 0) continue;
    if (stripos($line, 'Transfer-Encoding:') === 0) continue;
    if (stripos($line, 'Connection:') === 0) continue;
    header($line, false);
}

echo $body;
