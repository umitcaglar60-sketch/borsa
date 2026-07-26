<?php
// Ortak header'lar — her endpoint dosyasının başında require edilir.
// Geliştirme aşamasında '*' (herkese açık) bırakıldı; production'a
// geçerken bunu kendi uygulamanın domain'ine daraltman önerilir.

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Tarayıcının OPTIONS "preflight" isteğini boş 200 ile geçiştir.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
