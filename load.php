<?php
// load.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Only POST allowed');
}

// JSON einlesen
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Pflichtfeld prüfen
if (!isset($data['photo_url'])) {
    http_response_code(400);
    exit('Missing photo_url field');
}

// DB-Verbindung laden
require_once 'db_connection.php';

try {
    $stmt = $pdo->prepare("
        INSERT INTO posts (photo_url, text, user, letterbox_id, timestamp)
        VALUES (?, ?, ?, ?, NOW())
    ");

    $stmt->execute([
        $data['photo_url'],
        $data['text'] ?? '',
        $data['user'] ?? '',
        $data['letterbox_id'] ?? ''
    ]);

    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Datenbankfehler beim Speichern.']);
    error_log($e->getMessage());
    error_log(json_encode($data));
}
?>
