<?php
/**
 * Archivo de configuración para la API de Frutale
 * Maneja respuestas JSON, CORS y verificación de autenticación
 */

header('Content-Type: application/json');

// Permitir CORS para desarrollo local
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Iniciar sesión
session_start();

// Incluir utilidades de autenticación
require_once __DIR__ . '/auth/auth_utils.php';

// Conectar a la base de datos
require_once __DIR__ . '/../config/db.php';

// Función para generar respuestas JSON
function responderJSON($data, $codigo = 200) {
    http_response_code($codigo);
    echo json_encode($data);
    exit;
}

// Función para verificar sesión del usuario
function verificarSesion() {
    if (!estaAutenticado()) {
        responderJSON(['error' => 'No autorizado'], 401);
    }
    return $_SESSION['usuario_id'];
}

// Función para verificar rol de usuario
function verificarRol($rol_id) {
    if (!tieneRol($rol_id)) {
        responderJSON(['error' => 'No tiene permisos para esta acción'], 403);
    }
    return $_SESSION['usuario_id_rol'];
}

// Función para verificar varios roles de usuario
function verificarAlgunRol($roles_ids) {
    if (!tieneAlgunRol($roles_ids)) {
        responderJSON(['error' => 'No tiene permisos para esta acción'], 403);
    }
    return $_SESSION['usuario_id_rol'];
}

// Función para sanitizar entrada
function sanitizarEntrada($dato) {
    if (is_array($dato)) {
        foreach ($dato as $key => $value) {
            $dato[$key] = sanitizarEntrada($value);
        }
    } else {
        $dato = trim(htmlspecialchars($dato, ENT_QUOTES, 'UTF-8'));
    }
    return $dato;
}
?>
