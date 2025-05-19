<?php
// unload.php

// CORS-Header
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");
header("Access-Control-Max-Age: 3600");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Only GET or POST allowed');
}

$letterbox_id = null;
$limit = 10;
$viewed = 0; // Standard: nur ungesehene

// Parameter auslesen
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $letterbox_id = $_GET['letterbox_id'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;

    if (isset($_GET['viewed'])) {
        $viewedParam = strtolower($_GET['viewed']);
        $viewed = ($viewedParam === 'all') ? null : (($viewedParam === 'false' || $viewedParam === '0') ? 0 : 1);
    }
} else {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    $letterbox_id = $data['letterbox_id'] ?? null;
    $limit = isset($data['limit']) ? (int)$data['limit'] : 10;

    if (isset($data['viewed'])) {
        $viewedParam = strtolower($data['viewed']);
        $viewed = ($viewedParam === 'all') ? null : (($viewedParam === 'false' || $viewedParam === '0') ? 0 : 1);
    }
}

// DB-Verbindung einbinden
require_once 'db_connection.php';

try {
    $selectFields = "post_id, photo_url, text, user, letterbox_id, timestamp, viewed";
    $orderBy = "ORDER BY timestamp DESC";
    $limit = min(max((int)$limit, 1), 50);

    if ($letterbox_id) {
        if ($viewed === null) {
            $stmt = $pdo->prepare("
                SELECT $selectFields 
                FROM posts 
                WHERE letterbox_id = :letterbox 
                $orderBy 
                LIMIT :limit_val
            ");
            $stmt->bindParam(':letterbox', $letterbox_id, PDO::PARAM_STR);
            $stmt->bindParam(':limit_val', $limit, PDO::PARAM_INT);
        } else {
            $stmt = $pdo->prepare("
                SELECT $selectFields 
                FROM posts 
                WHERE letterbox_id = :letterbox AND viewed = :viewed 
                $orderBy 
                LIMIT :limit_val
            ");
            $stmt->bindParam(':letterbox', $letterbox_id, PDO::PARAM_STR);
            $stmt->bindParam(':viewed', $viewed, PDO::PARAM_INT);
            $stmt->bindParam(':limit_val', $limit, PDO::PARAM_INT);
        }
    } else {
        $query = "SELECT $selectFields FROM posts";
        if ($viewed !== null) {
            $query .= " WHERE viewed = :viewed";
        }
        $query .= " $orderBy LIMIT :limit_val";

        $stmt = $pdo->prepare($query);
        if ($viewed !== null) {
            $stmt->bindParam(':viewed', $viewed, PDO::PARAM_INT);
        }
        $stmt->bindParam(':limit_val', $limit, PDO::PARAM_INT);
    }

    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'count' => count($results),
        'posts' => $results
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
