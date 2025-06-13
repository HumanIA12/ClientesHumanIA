<?php
require_once '../../config/db.php';

// Función para verificar si el usuario está autenticado
function usuarioAutenticado() {
    return isset($_SESSION['usuario_id']);
}

// Redirigir si no está autenticado (excepto en login)
$pagina_actual = basename($_SERVER['PHP_SELF']);
$paginas_publicas = ['index.html', 'login.php', 'registro.php'];

if (!usuarioAutenticado() && !in_array($pagina_actual, $paginas_publicas)) {
    header("Location: ../../index.html");
    exit();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Frutale - Sistema de Gestión</title>
    <link rel="stylesheet" href="../../assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="../../assets/css/estilos.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
    <script src="../../assets/js/funciones.js"></script>
</head>
<body class="bg-light">
    <!-- Navbar superior -->
    <?php if (usuarioAutenticado()): ?>
    <nav class="navbar navbar-light bg-white shadow-sm py-3">
        <div class="container-fluid d-flex justify-content-between">
            <!-- Espacio a la izquierda para equilibrar -->
            <div class="invisible" style="width: 220px;"></div>
            
            <!-- Logo centrado -->
            <div class="text-center">
                <a class="navbar-brand" href="../../views/dashboard/dashboard.php">
                    <img src="../../assets/img/logofrutale.png" alt="Frutale" class="img-fluid" style="max-height: 60px;">
                </a>
            </div>
            
            <!-- Información del usuario a la derecha -->
            <div class="d-flex align-items-center" style="width: 300px;">
                <div class="me-2">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-user-circle me-2 fs-4"></i>
                        <span class="text-dark fw-bold fs-5">
                            <?php echo htmlspecialchars($_SESSION['usuario_nombre'] ?? $_SESSION['usuario']); ?>
                        </span>
                    </div>
                </div>
                <a href="../../api/auth/logout.php" class="btn btn-naranja">
                    <i class="fas fa-sign-out-alt"></i>
                </a>
            </div>
        </div>
    </nav>
    <?php endif; ?>
    
    <div style="background-color: #78cc52; height: 8px; width: 100%; margin: 0 0 20px 0; padding: 0; border: none;"></div>
    
    <div class="container">
