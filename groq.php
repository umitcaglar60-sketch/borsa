<?php
require 'cors.php';
require 'config.php';

// Kullanım: POST /piyasa-api/groq.php
// Body: uygulamanın gönderdiği aynı JSON (model, messages, vb.)
// Bu dosya sadece Authorization header'ını ekleyip Groq'a iletir.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => true, 'message' => 'Sadece POST kabul edilir']);
    exit;
}

$body = file_get_contents('php://input');

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . GROQ_KEY,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => true, 'message' => 'Groq\'a bağlanılamadı: ' . $curlError]);
    exit;
}

http_response_code($httpCode ?: 200);
echo $response;
