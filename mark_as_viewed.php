<?php
// mark_as_viewed.php – Markiert Einträge in der Datenbank als "angeschaut"

// CORS-Header
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Only POST allowed');
}

// JSON-Daten auslesen und validieren
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['post_ids']) || !is_array($data['post_ids']) || empty($data['post_ids'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid request: post_ids missing, not an array, or empty']);
    exit;
}

// Nur numerische IDs zulassen (Sicherheitsmaßnahme)
$post_ids = array_filter($data['post_ids'], fn($id) => is_numeric($id));
if (empty($post_ids)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid post_ids: must be numeric']);
    exit;
}

// DB-Verbindung einbinden
require_once 'db_connection.php';

try {
    // Dynamische Platzhalter erzeugen
    $placeholders = implode(',', array_fill(0, count($post_ids), '?'));
    $sql = "UPDATE posts SET viewed = 1 WHERE post_id IN ($placeholders)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($post_ids);

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'updated_count' => $stmt->rowCount()
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => [
            'message' => $e->getMessage(),
            'code' => $e->getCode(),
            'sql_state' => $e->errorInfo[0] ?? null
        ]
    ]);
}
?>
