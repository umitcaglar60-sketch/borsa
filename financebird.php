<?php
require 'cors.php';
require 'config.php';

// Kullanım: GET /piyasa-api/financebird.php?code=THYAO

$code = isset($_GET['code']) ? preg_replace('/[^A-Za-z0-9]/', '', $_GET['code']) : '';
if ($code === '') {
    http_response_code(400);
    echo json_encode(['error' => true, 'message' => 'code parametresi zorunlu']);
    exit;
}

$host = 'financebird.p.rapidapi.com';
$ch = curl_init("https://{$host}/quote/{$code}.IS");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "x-rapidapi-host: {$host}",
    "x-rapidapi-key: " . RAPIDAPI_KEY,
]);

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
