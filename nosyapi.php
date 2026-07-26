<?php
require 'cors.php';
require 'config.php';

// Kullanım: GET /piyasa-api/nosyapi.php?code=THYAO
// code verilmezse NosyAPI tüm kayıtları döner.

$code = isset($_GET['code']) ? preg_replace('/[^A-Za-z0-9]/', '', $_GET['code']) : '';

$url = 'https://www.nosyapi.com/apiv2/service/economy/bist/exchange-rate'
     . '?apiKey=' . urlencode(NOSYAPI_KEY)
     . ($code !== '' ? '&code=' . urlencode($code) : '');

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
