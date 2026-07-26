<?php
require 'cors.php';
require 'config.php';

// Kullanım: GET /piyasa-api/metalsdev.php?metal=platinum  (veya palladium)
// NOT: config.php'ye METALS_DEV_KEY tanımlamadıysan bu endpoint 501 döner.

if (!defined('METALS_DEV_KEY') || METALS_DEV_KEY === '') {
    http_response_code(501);
    echo json_encode(['error' => true, 'message' => 'config.php içinde METALS_DEV_KEY tanımlı değil']);
    exit;
}

$metal = isset($_GET['metal']) ? preg_replace('/[^a-z]/', '', strtolower($_GET['metal'])) : 'platinum';

$url = 'https://api.metals.dev/v1/latest?api_key=' . urlencode(METALS_DEV_KEY) . '&currency=USD&unit=toz';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => true, 'message' => 'Üst kaynağa bağlanılamadı: ' . $curlError]);
    exit;
}

http_response_code($httpCode ?: 200);
echo $response;
