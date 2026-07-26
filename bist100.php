<?php
require 'cors.php';
require 'config.php';

// Kullanım: GET /piyasa-api/bist100.php
// Tüm BIST100 listesini döner; uygulama içeride sembole göre filtreler.

$host = 'bist100-stock-data-15-minutes-late-live.p.rapidapi.com';

$ch = curl_init("https://{$host}/bist100/prices");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "x-rapidapi-host: {$host}",
    "x-rapidapi-key: " . RAPIDAPI_KEY,
    "Content-Type: application/json",
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
