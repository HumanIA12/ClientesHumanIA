<?php
// Iniciar sesión
session_start();

// Incluir utilidades de autenticación
require_once 'api/auth/auth_utils.php';

// Determinar qué página mostrar basado en la URL
$ruta = $_GET['ruta'] ?? '';

// Si no está autenticado, mostrar página de inicio o redirigir a ella
if (!estaAutenticado()) {
    // Siempre mostrar index.html para usuarios no autenticados
    if ($ruta === '' || $ruta === 'index.html' || $ruta === 'login') {
        require_once 'index.html';
    } else {
        // Cualquier otra ruta para usuarios no autenticados redirige a index.html
        header('Location: index.html');
    }
    exit();
}

// Si está autenticado, redirigir según el rol si no hay ruta específica
if ($ruta === '' || $ruta === 'dashboard') {
    redirigirSegunRol();
    exit();
}

// Manejar las rutas para las vistas
switch ($ruta) {
        
    // Rutas de pedidos - verificar permisos según el rol
    case 'pedidos/registrar':
        requiereAutenticacion();
        require_once 'views/pedidos/registrar_pedido.php';
        break;
    case 'pedidos/consultar':
        requiereAutenticacion();
        require_once 'views/pedidos/consultar_pedidos.php';
        break;
    case 'pedidos/gestionar':
        requiereAlgunRol([1]); // Solo administrador
        require_once 'views/pedidos/gestionar_pedidos.php';
        break;
    case 'pedidos/mis_pedidos':
        requiereRol(2); // Solo clientes
        require_once 'views/pedidos/mis_pedidos.php';
        break;
    case 'pedidos/asignados':
        requiereRol(3); // Solo transportistas
        require_once 'views/pedidos/asignados.php';
        break;
        
    // Rutas de transportistas
    case 'transportistas/gestionar':
        requiereRol(1); // Solo administrador
        require_once 'views/transportistas/gestionar_transportistas.php';
        break;
    case 'transportistas/registrar':
        requiereRol(1); // Solo administrador
        require_once 'views/transportistas/registrar_transportista.php';
        break;
        
    // Rutas de clientes
    case 'clientes/consultar':
        requiereRol(1); // Solo administrador
        require_once 'views/clientes/consultar_clientes.php';
        break;
    case 'clientes/registrar':
        requiereRol(1); // Solo administrador
        require_once 'views/clientes/registrar_cliente.php';
        break;
        
    // Rutas de reportes
    case 'reportes/consultar':
        requiereRol(1); // Solo administrador
        require_once 'views/reportes/consultar_reportes.php';
        break;
        
    // Ruta para cerrar sesión
    case 'logout':
        header('Location: api/auth/logout.php');
        exit();
        break;
        
    // Rutas de dashboard según el rol
    case 'dashboard/admin':
        requiereRol(1); // Solo administrador
        require_once 'views/dashboard/admin.php';
        break;
    case 'dashboard/cliente':
        requiereRol(2); // Solo cliente
        require_once 'views/dashboard/cliente.php';
        break;
    case 'dashboard/transportista':
        requiereRol(3); // Solo transportista
        require_once 'views/dashboard/transportista.php';
        break;
        
    // Ruta por defecto (404)
    default:
        header("HTTP/1.0 404 Not Found");
        echo "<h1>Página no encontrada</h1>";
        echo "<p>La página que buscas no existe. <a href='index.php'>Volver al inicio</a></p>";
        echo "<p>Si crees que esto es un error, contacta al administrador.</p>";
        break;
}
?>
