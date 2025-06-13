<?php
/**
 * Verifica si el usuario está autenticado
 * @return bool Verdadero si está autenticado, falso en caso contrario
 */
function estaAutenticado() {
    return isset($_SESSION['autenticado']) && $_SESSION['autenticado'] === true;
}

/**
 * Verifica si el usuario tiene el rol especificado
 * @param int $rol_id ID del rol requerido
 * @return bool Verdadero si tiene el rol, falso en caso contrario
 */
function tieneRol($rol_id) {
    return estaAutenticado() && isset($_SESSION['usuario_id_rol']) && $_SESSION['usuario_id_rol'] == $rol_id;
}

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 * @param array $roles_id Array con los IDs de los roles permitidos
 * @return bool Verdadero si tiene alguno de los roles, falso en caso contrario
 */
function tieneAlgunRol($roles_id) {
    if (!estaAutenticado() || !isset($_SESSION['usuario_id_rol'])) {
        return false;
    }
    
    return in_array($_SESSION['usuario_id_rol'], $roles_id);
}

/**
 * Redirige al usuario a la página de login si no está autenticado
 */
function requiereAutenticacion() {
    if (!estaAutenticado()) {
        header('Location: /proyectofrutale/views/login.php');
        exit;
    }
}

/**
 * Redirige al usuario a una página de error si no tiene el rol especificado
 * @param int $rol_id ID del rol requerido
 */
function requiereRol($rol_id) {
    requiereAutenticacion();
    
    if (!tieneRol($rol_id)) {
        header('Location: /proyectofrutale/views/error/acceso_denegado.php');
        exit;
    }
}

/**
 * Redirige al usuario a una página de error si no tiene alguno de los roles especificados
 * @param array $roles_id Array con los IDs de los roles permitidos
 */
function requiereAlgunRol($roles_id) {
    requiereAutenticacion();
    
    if (!tieneAlgunRol($roles_id)) {
        header('Location: /proyectofrutale/views/error/acceso_denegado.php');
        exit;
    }
}

/**
 * Redirige al usuario a su dashboard correspondiente según su rol
 */
function redirigirSegunRol() {
    if (!estaAutenticado()) {
        header('Location: /proyectofrutale/views/login.php');
        exit;
    }
    
    switch ($_SESSION['usuario_id_rol']) {
        case 1: // Administrador
            header('Location: /proyectofrutale/views/dashboard/admin.php');
            break;
        case 2: // Cliente
            header('Location: /proyectofrutale/views/dashboard/cliente.php');
            break;
        case 3: // Transportista
            header('Location: /proyectofrutale/views/dashboard/transportista.php');
            break;
        default:
            header('Location: /proyectofrutale/index.php');
    }
    exit;
}
