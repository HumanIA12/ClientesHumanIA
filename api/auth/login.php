<?php
/**
 * Script de procesamiento de login
 * Este script verifica las credenciales de usuario y establece la sesión
 */

// Iniciar sesión
session_start();

// Incluir archivo de conexión a la base de datos
$conexion = require_once '../../config/db.php';

// Verificar si se enviaron datos por POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Obtener datos del formulario
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    // Validar que se proporcionaron usuario y contraseña
    if (empty($username) || empty($password)) {
        $_SESSION['error_login'] = 'Por favor ingrese usuario y contraseña';
        header('Location: ../../index.html?error=1');
        exit;
    }
    
    // Preparar consulta para verificar credenciales
    $stmt = $conexion->prepare("
        SELECT u.id, u.nombre, u.apellidos, u.username, u.password, u.email, u.telefono, r.nombre as rol, u.id_rol
        FROM usuarios u
        JOIN roles r ON u.id_rol = r.id
        WHERE u.username = ?
    ");
    
    // Verificar si la consulta se preparó correctamente
    if (!$stmt) {
        $_SESSION['error_login'] = 'Error al procesar la solicitud: ' . $conexion->error;
        header('Location: ../../index.html?error=1');
        exit;
    }
    
    // Vincular parámetros y ejecutar
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $resultado = $stmt->get_result();
    
    // Verificar si existe el usuario
    if ($resultado->num_rows === 1) {
        $usuario = $resultado->fetch_assoc();
        
        // Verificar contraseña
        if (password_verify($password, $usuario['password'])) {
            // Iniciar sesión
            $_SESSION['usuario_id'] = $usuario['id'];
            $_SESSION['usuario_nombre'] = $usuario['nombre'] . ' ' . $usuario['apellidos'];
            $_SESSION['usuario_username'] = $usuario['username'];
            $_SESSION['usuario_email'] = $usuario['email'];
            $_SESSION['usuario_rol'] = $usuario['rol'];
            $_SESSION['usuario_id_rol'] = $usuario['id_rol'];
            $_SESSION['autenticado'] = true;
            
            // Guardar hora de inicio de sesión
            $_SESSION['tiempo_inicio'] = time();
            
            // Redirigir según rol
            switch ($usuario['id_rol']) {
                case 1: // Administrador
                    header('Location: ../../views/dashboard/admin.php');
                    break;
                case 2: // Cliente
                    header('Location: ../../views/dashboard/cliente.php');
                    break;
                case 3: // Transportista
                    header('Location: ../../views/dashboard/transportista.php');
                    break;
                default:
                    header('Location: ../../index.php');
            }
            exit;
        } else {
            // Contraseña incorrecta
            $_SESSION['error_login'] = 'Usuario o contraseña incorrectos';
        }
    } else {
        // Usuario no encontrado
        $_SESSION['error_login'] = 'Usuario o contraseña incorrectos';
    }
    
    // Si llegamos aquí, hubo un error de autenticación
    header('Location: ../../index.html?error=1');
    exit;
}

// Si no es una solicitud POST, redirigir al formulario de login
header('Location: ../../index.html');
exit;
