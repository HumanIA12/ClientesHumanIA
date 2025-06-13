<?php
// Iniciar sesión
session_start();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acceso Denegado - Frutale</title>
    <link rel="stylesheet" href="../../assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="../../assets/css/styles.css">
    <link rel="stylesheet" href="../../assets/css/error.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
</head>
<body>
    <div class="container">
        <div class="error-container">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
                ⚠️
            </div>
            <h2>Acceso Denegado</h2>
            <p class="lead">No tienes permisos para acceder a esta página.</p>
            <p>Tu rol actual no tiene autorización para ver el contenido solicitado.</p>
            
            <div class="mt-4">
                <?php if (isset($_SESSION['autenticado']) && $_SESSION['autenticado']): ?>
                    <a href="/proyectofrutale/api/auth/logout.php" class="btn btn-secondary">Cerrar Sesión</a>
                    <a href="/proyectofrutale/index.php" class="btn btn-error-primary ml-2">Ir al Inicio</a>
                <?php else: ?>
                    <a href="/proyectofrutale/views/login.php" class="btn btn-error-primary">Iniciar Sesión</a>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
