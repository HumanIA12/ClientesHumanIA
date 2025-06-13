<?php
// Iniciar sesión
session_start();

// Incluir utilidades de autenticación
require_once '../../api/auth/auth_utils.php';

// Verificar que el usuario está autenticado
if (!estaAutenticado()) {
    header('Location: ../../index.html');
    exit;
}

// Incluir la conexión a la base de datos
$conexion = require_once '../../config/db.php';

// Obtener datos del usuario actual
$query_usuario = "SELECT id, nombre, apellidos, username, email, telefono, id_rol FROM usuarios WHERE id = ?";
$stmt = $conexion->prepare($query_usuario);
$stmt->bind_param("i", $_SESSION['usuario_id']);
$stmt->execute();
$resultado_usuario = $stmt->get_result();
$usuario = $resultado_usuario->fetch_assoc();

// Obtener datos adicionales según el rol
if ($usuario['id_rol'] == 2) { // Cliente
    $query_datos = "SELECT c.*, ci.nombre as ciudad FROM clientes c 
                   JOIN ciudades ci ON c.id_ciudad = ci.id
                   WHERE c.id_usuario = ?";
} elseif ($usuario['id_rol'] == 3) { // Transportista
    $query_datos = "SELECT t.*, et.nombre as empresa, tv.nombre as tipo_vehiculo 
                   FROM transportistas t 
                   JOIN empresas_transporte et ON t.id_empresa = et.id 
                   JOIN tipos_vehiculo tv ON t.id_tipo_vehiculo = tv.id
                   WHERE t.id_usuario = ?";
} else { // Admin u otros roles
    $query_datos = null;
}

// Ejecutar consulta de datos adicionales si existe
if ($query_datos) {
    $stmt = $conexion->prepare($query_datos);
    $stmt->bind_param("i", $_SESSION['usuario_id']);
    $stmt->execute();
    $resultado_datos = $stmt->get_result();
    $datos_adicionales = $resultado_datos->fetch_assoc();
}

// Para el formulario de clientes, obtener lista de ciudades
if ($usuario['id_rol'] == 2) {
    $query_ciudades = "SELECT id, nombre FROM ciudades ORDER BY nombre";
    $resultado_ciudades = $conexion->query($query_ciudades);
}

// Mensaje de estado
$mensaje = '';
$tipo_mensaje = '';

// Procesar formulario
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Datos básicos del usuario
    $nombre = $_POST['nombre'] ?? '';
    $apellidos = $_POST['apellidos'] ?? '';
    $email = $_POST['email'] ?? '';
    $telefono = $_POST['telefono'] ?? '';
    $password_actual = $_POST['password_actual'] ?? '';
    $password_nuevo = $_POST['password_nuevo'] ?? '';
    $password_confirmar = $_POST['password_confirmar'] ?? '';
    
    // Validación básica
    if (empty($nombre) || empty($apellidos) || empty($email) || empty($telefono)) {
        $mensaje = 'Todos los campos marcados con * son obligatorios';
        $tipo_mensaje = 'danger';
    } else {
        // Iniciar transacción
        $conexion->begin_transaction();
        
        try {
            // Actualizar datos básicos del usuario
            $sql_usuario = "UPDATE usuarios SET nombre = ?, apellidos = ?, email = ?, telefono = ? WHERE id = ?";
            $stmt = $conexion->prepare($sql_usuario);
            $stmt->bind_param("ssssi", $nombre, $apellidos, $email, $telefono, $usuario['id']);
            $stmt->execute();
            
            // Si se quiere cambiar la contraseña
            if (!empty($password_actual) && !empty($password_nuevo)) {
                // Verificar contraseña actual
                $query_pass = "SELECT password FROM usuarios WHERE id = ?";
                $stmt = $conexion->prepare($query_pass);
                $stmt->bind_param("i", $usuario['id']);
                $stmt->execute();
                $hash_actual = $stmt->get_result()->fetch_assoc()['password'];
                
                if (password_verify($password_actual, $hash_actual)) {
                    // Verificar que las nuevas contraseñas coincidan
                    if ($password_nuevo === $password_confirmar) {
                        // Actualizar contraseña
                        $hash_nuevo = password_hash($password_nuevo, PASSWORD_DEFAULT);
                        $sql_password = "UPDATE usuarios SET password = ? WHERE id = ?";
                        $stmt = $conexion->prepare($sql_password);
                        $stmt->bind_param("si", $hash_nuevo, $usuario['id']);
                        $stmt->execute();
                    } else {
                        throw new Exception('Las nuevas contraseñas no coinciden');
                    }
                } else {
                    throw new Exception('La contraseña actual es incorrecta');
                }
            }
            
            // Actualizar datos adicionales según rol
            if ($usuario['id_rol'] == 2) { // Cliente
                $direccion = $_POST['direccion'] ?? '';
                $id_ciudad = $_POST['id_ciudad'] ?? '';
                $codigo_postal = $_POST['codigo_postal'] ?? '';
                
                $sql_cliente = "UPDATE clientes SET direccion = ?, id_ciudad = ?, codigo_postal = ? WHERE id_usuario = ?";
                $stmt = $conexion->prepare($sql_cliente);
                $stmt->bind_param("sisi", $direccion, $id_ciudad, $codigo_postal, $usuario['id']);
                $stmt->execute();
            }
            
            // Confirmar transacción
            $conexion->commit();
            
            $mensaje = 'Perfil actualizado correctamente';
            $tipo_mensaje = 'success';
            
            // Actualizar datos de sesión
            $_SESSION['usuario_nombre'] = $nombre . ' ' . $apellidos;
            $_SESSION['usuario_email'] = $email;
            
            // Recargar datos
            $stmt = $conexion->prepare($query_usuario);
            $stmt->bind_param("i", $_SESSION['usuario_id']);
            $stmt->execute();
            $resultado_usuario = $stmt->get_result();
            $usuario = $resultado_usuario->fetch_assoc();
            
            if ($query_datos) {
                $stmt = $conexion->prepare($query_datos);
                $stmt->bind_param("i", $_SESSION['usuario_id']);
                $stmt->execute();
                $resultado_datos = $stmt->get_result();
                $datos_adicionales = $resultado_datos->fetch_assoc();
            }
            
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conexion->rollback();
            $mensaje = 'Error al actualizar perfil: ' . $e->getMessage();
            $tipo_mensaje = 'danger';
        }
    }
}

// Determinar la página de Dashboard según el rol
$dashboard_url = '../../views/dashboard/';
switch ($usuario['id_rol']) {
    case 1:
        $dashboard_url .= 'admin.php';
        $sidebar_class = 'admin-sidebar';
        break;
    case 2:
        $dashboard_url .= 'cliente.php';
        $sidebar_class = 'cliente-sidebar';
        break;
    case 3:
        $dashboard_url .= 'transportista.php';
        $sidebar_class = 'transportista-sidebar';
        break;
    default:
        $dashboard_url .= 'admin.php';
        $sidebar_class = 'admin-sidebar';
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Perfil - Frutale</title>
    <link rel="stylesheet" href="../../assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="../../assets/css/estilos.css">
    <link rel="stylesheet" href="../../assets/css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>
    <?php include '../includes/header.php'; ?>
    
    <div class="container-fluid mt-4">
        <div class="row">
            <!-- Sidebar -->
            <div class="col-md-3 col-lg-2 <?php echo $sidebar_class; ?> d-none d-md-block">
                <h5 class="px-3 mb-4">Panel de <?php echo ucfirst($_SESSION['usuario_rol']); ?></h5>
                <div class="nav flex-column">
                    <a class="nav-link" href="<?php echo $dashboard_url; ?>"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    
                    <?php if ($usuario['id_rol'] == 1): // Admin ?>
                        <a class="nav-link" href="../pedidos/listar.php"><i class="fas fa-shopping-cart"></i> Pedidos</a>
                        <a class="nav-link" href="../clientes/listar.php"><i class="fas fa-users"></i> Clientes</a>
                        <a class="nav-link" href="../transportistas/listar.php"><i class="fas fa-truck"></i> Transportistas</a>
                        <a class="nav-link" href="../productos/listar.php"><i class="fas fa-box"></i> Productos</a>
                        <a class="nav-link" href="../reportes/index.php"><i class="fas fa-chart-bar"></i> Reportes</a>
                        <a class="nav-link" href="../usuarios/listar.php"><i class="fas fa-user-cog"></i> Usuarios</a>
                    <?php elseif ($usuario['id_rol'] == 2): // Cliente ?>
                        <a class="nav-link" href="../pedidos/mis_pedidos.php"><i class="fas fa-shopping-cart"></i> Mis Pedidos</a>
                        <a class="nav-link" href="../pedidos/nuevo.php"><i class="fas fa-plus-circle"></i> Nuevo Pedido</a>
                        <a class="nav-link" href="../pedidos/tracking.php"><i class="fas fa-map-marker-alt"></i> Tracking</a>
                    <?php elseif ($usuario['id_rol'] == 3): // Transportista ?>
                        <a class="nav-link" href="../pedidos/asignados.php"><i class="fas fa-box"></i> Pedidos Asignados</a>
                        <a class="nav-link" href="../rutas/mis_rutas.php"><i class="fas fa-route"></i> Mis Rutas</a>
                        <a class="nav-link" href="../rutas/tracking.php"><i class="fas fa-map-marked-alt"></i> Activar Tracking</a>
                    <?php endif; ?>
                    
                    <a class="nav-link active" href="#"><i class="fas fa-user-edit"></i> Mi Perfil</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Mi Perfil</h1>
                </div>
                
                <?php if (!empty($mensaje)): ?>
                    <div class="alert alert-<?php echo $tipo_mensaje; ?> alert-dismissible fade show" role="alert">
                        <?php echo $mensaje; ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                <?php endif; ?>
                
                <div class="card mb-4">
                    <div class="card-header">
                        <ul class="nav nav-tabs card-header-tabs" id="perfilTab" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="datos-tab" data-bs-toggle="tab" data-bs-target="#datos" type="button" role="tab" aria-controls="datos" aria-selected="true">Datos Personales</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="seguridad-tab" data-bs-toggle="tab" data-bs-target="#seguridad" type="button" role="tab" aria-controls="seguridad" aria-selected="false">Seguridad</button>
                            </li>
                            <?php if ($usuario['id_rol'] == 2): // Cliente ?>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="direccion-tab" data-bs-toggle="tab" data-bs-target="#direccion" type="button" role="tab" aria-controls="direccion" aria-selected="false">Dirección</button>
                                </li>
                            <?php elseif ($usuario['id_rol'] == 3): // Transportista ?>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="vehiculo-tab" data-bs-toggle="tab" data-bs-target="#vehiculo" type="button" role="tab" aria-controls="vehiculo" aria-selected="false">Vehículo</button>
                                </li>
                            <?php endif; ?>
                        </ul>
                    </div>
                    <div class="card-body">
                        <form method="POST" action="">
                            <div class="tab-content" id="perfilTabContent">
                                <!-- Datos Personales -->
                                <div class="tab-pane fade show active" id="datos" role="tabpanel" aria-labelledby="datos-tab">
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="nombre" class="form-label">Nombre *</label>
                                            <input type="text" class="form-control" id="nombre" name="nombre" value="<?php echo htmlspecialchars($usuario['nombre']); ?>" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="apellidos" class="form-label">Apellidos *</label>
                                            <input type="text" class="form-control" id="apellidos" name="apellidos" value="<?php echo htmlspecialchars($usuario['apellidos']); ?>" required>
                                        </div>
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="email" class="form-label">Email *</label>
                                            <input type="email" class="form-control" id="email" name="email" value="<?php echo htmlspecialchars($usuario['email']); ?>" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="telefono" class="form-label">Teléfono *</label>
                                            <input type="tel" class="form-control" id="telefono" name="telefono" value="<?php echo htmlspecialchars($usuario['telefono']); ?>" required>
                                        </div>
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="username" class="form-label">Nombre de usuario</label>
                                            <input type="text" class="form-control" id="username" value="<?php echo htmlspecialchars($usuario['username']); ?>" readonly>
                                            <small class="text-muted">El nombre de usuario no se puede cambiar</small>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="rol" class="form-label">Rol</label>
                                            <input type="text" class="form-control" id="rol" value="<?php echo ucfirst($_SESSION['usuario_rol']); ?>" readonly>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Seguridad -->
                                <div class="tab-pane fade" id="seguridad" role="tabpanel" aria-labelledby="seguridad-tab">
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="password_actual" class="form-label">Contraseña actual</label>
                                            <input type="password" class="form-control" id="password_actual" name="password_actual">
                                            <small class="text-muted">Dejar en blanco si no desea cambiar la contraseña</small>
                                        </div>
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="password_nuevo" class="form-label">Nueva contraseña</label>
                                            <input type="password" class="form-control" id="password_nuevo" name="password_nuevo">
                                        </div>
                                        <div class="col-md-6">
                                            <label for="password_confirmar" class="form-label">Confirmar nueva contraseña</label>
                                            <input type="password" class="form-control" id="password_confirmar" name="password_confirmar">
                                        </div>
                                    </div>
                                    <div class="alert alert-info">
                                        <i class="fas fa-info-circle me-2"></i> Para mayor seguridad, use contraseñas de al menos 8 caracteres con letras, números y caracteres especiales.
                                    </div>
                                </div>
                                
                                <?php if ($usuario['id_rol'] == 2): // Cliente ?>
                                <!-- Dirección (Solo para clientes) -->
                                <div class="tab-pane fade" id="direccion" role="tabpanel" aria-labelledby="direccion-tab">
                                    <div class="row mb-3">
                                        <div class="col-md-12">
                                            <label for="direccion" class="form-label">Dirección *</label>
                                            <input type="text" class="form-control" id="direccion" name="direccion" value="<?php echo htmlspecialchars($datos_adicionales['direccion']); ?>" required>
                                        </div>
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="id_ciudad" class="form-label">Ciudad *</label>
                                            <select class="form-select" id="id_ciudad" name="id_ciudad" required>
                                                <?php while ($ciudad = $resultado_ciudades->fetch_assoc()): ?>
                                                    <option value="<?php echo $ciudad['id']; ?>" <?php echo $ciudad['id'] == $datos_adicionales['id_ciudad'] ? 'selected' : ''; ?>>
                                                        <?php echo htmlspecialchars($ciudad['nombre']); ?>
                                                    </option>
                                                <?php endwhile; ?>
                                            </select>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="codigo_postal" class="form-label">Código Postal</label>
                                            <input type="text" class="form-control" id="codigo_postal" name="codigo_postal" value="<?php echo htmlspecialchars($datos_adicionales['codigo_postal']); ?>">
                                        </div>
                                    </div>
                                </div>
                                <?php elseif ($usuario['id_rol'] == 3): // Transportista ?>
                                <!-- Vehículo (Solo para transportistas) -->
                                <div class="tab-pane fade" id="vehiculo" role="tabpanel" aria-labelledby="vehiculo-tab">
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="licencia" class="form-label">Licencia de conducir</label>
                                            <input type="text" class="form-control" id="licencia" value="<?php echo htmlspecialchars($datos_adicionales['licencia']); ?>" readonly>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="tipo_vehiculo" class="form-label">Tipo de vehículo</label>
                                            <input type="text" class="form-control" id="tipo_vehiculo" value="<?php echo htmlspecialchars($datos_adicionales['tipo_vehiculo']); ?>" readonly>
                                        </div>
                                    </div>
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="empresa" class="form-label">Empresa</label>
                                            <input type="text" class="form-control" id="empresa" value="<?php echo htmlspecialchars($datos_adicionales['empresa']); ?>" readonly>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="capacidad" class="form-label">Capacidad de carga (kg)</label>
                                            <input type="text" class="form-control" id="capacidad" value="<?php echo htmlspecialchars($datos_adicionales['capacidad_carga']); ?>" readonly>
                                        </div>
                                    </div>
                                    <div class="alert alert-info">
                                        <i class="fas fa-info-circle me-2"></i> Para modificar la información del vehículo o empresa, contacte al administrador del sistema.
                                    </div>
                                </div>
                                <?php endif; ?>
                            </div>
                            
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                                <a href="<?php echo $dashboard_url; ?>" class="btn btn-secondary me-md-2">Cancelar</a>
                                <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
