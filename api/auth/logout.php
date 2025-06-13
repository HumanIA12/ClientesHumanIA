<?php
/**
 * Script para cerrar sesión
 * Destruye la sesión actual y redirige al login
 */

// Iniciar sesión
session_start();

// Destruir todas las variables de sesión
$_SESSION = array();

// Si se desea destruir la cookie de sesión
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destruir la sesión
session_destroy();

// Redirigir a la página de login
header('Location: ../../index.html');
exit;
