<?php
require 'cors.php';
require 'config.php';

echo json_encode([
    'ok' => true,
    'message' => 'Proxy çalışıyor',
    'time' => date('Y-m-d H:i:s'),
    'keys_loaded' => [
        'rapidapi' => RAPIDAPI_KEY !== '',
        'nosyapi'  => NOSYAPI_KEY !== '',
        'groq'     => GROQ_KEY !== '',
        'metalsdev'=> defined('METALS_DEV_KEY') && METALS_DEV_KEY !== '',
    ],
]);
