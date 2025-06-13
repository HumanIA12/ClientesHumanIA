<?php
// Iniciar sesión
session_start();

// Incluir utilidades de autenticación
require_once '../../api/auth/auth_utils.php';

// Verificar que el usuario tiene rol de administrador
requiereRol(1);

// Incluir la conexión a la base de datos
$conexion = require_once '../../config/db.php';

// Paginación
$pagina_actual = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
$registros_por_pagina = 10;
$offset = ($pagina_actual - 1) * $registros_por_pagina;

// Filtros
$filtro_nombre = isset($_GET['nombre']) ? $_GET['nombre'] : '';
$filtro_rol = isset($_GET['rol']) ? $_GET['rol'] : '';
$filtro_estado = isset($_GET['estado']) ? $_GET['estado'] : '';

// Construir la consulta base
$where_clauses = [];
$params = [];
$types = "";

if (!empty($filtro_nombre)) {
    $where_clauses[] = "(u.nombre LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ?)";
    $params[] = "%$filtro_nombre%";
    $params[] = "%$filtro_nombre%";
    $params[] = "%$filtro_nombre%";
    $types .= "sss";
}

if (!empty($filtro_rol)) {
    $where_clauses[] = "r.nombre = ?";
    $params[] = $filtro_rol;
    $types .= "s";
}

if (!empty($filtro_estado)) {
    $where_clauses[] = "u.estado = ?";
    $params[] = $filtro_estado;
    $types .= "s";
}

$where_sql = '';
if (!empty($where_clauses)) {
    $where_sql = "WHERE " . implode(" AND ", $where_clauses);
}

// Consulta para obtener el total de registros con filtros
$query_count = "
    SELECT COUNT(*) as total 
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id
    $where_sql
";

$stmt_count = $conexion->prepare($query_count);
if (!empty($params)) {
    $stmt_count->bind_param($types, ...$params);
}
$stmt_count->execute();
$result_count = $stmt_count->get_result();
$total_registros = $result_count->fetch_assoc()['total'];

$total_paginas = ceil($total_registros / $registros_por_pagina);

// Consulta para obtener los usuarios con paginación
$query_usuarios = "
    SELECT u.id, u.nombre, u.apellidos, u.username, u.email, u.telefono, 
           u.fecha_registro, r.nombre as rol, u.estado
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id
    $where_sql
    ORDER BY u.fecha_registro DESC
    LIMIT ? OFFSET ?
";

$params[] = $registros_por_pagina;
$params[] = $offset;
$types .= "ii";

$stmt_usuarios = $conexion->prepare($query_usuarios);
$stmt_usuarios->bind_param($types, ...$params);
$stmt_usuarios->execute();
$resultado_usuarios = $stmt_usuarios->get_result();

// Mensaje para acciones como eliminar, actualizar, etc.
$mensaje = '';
$tipo_mensaje = '';

if (isset($_SESSION['mensaje']) && isset($_SESSION['tipo_mensaje'])) {
    $mensaje = $_SESSION['mensaje'];
    $tipo_mensaje = $_SESSION['tipo_mensaje'];
    
    // Limpiar las variables de sesión
    unset($_SESSION['mensaje']);
    unset($_SESSION['tipo_mensaje']);
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Usuarios - Frutale</title>
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
            <div class="col-md-3 col-lg-2 admin-sidebar d-none d-md-block">
                <h5 class="px-3 mb-4">Panel de Administración</h5>
                <div class="nav flex-column">
                    <a class="nav-link" href="../dashboard/admin.php"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a class="nav-link" href="../pedidos/listar.php"><i class="fas fa-shopping-cart"></i> Pedidos</a>
                    <a class="nav-link" href="../clientes/listar.php"><i class="fas fa-users"></i> Clientes</a>
                    <a class="nav-link" href="../transportistas/listar.php"><i class="fas fa-truck"></i> Transportistas</a>
                    <a class="nav-link" href="../productos/listar.php"><i class="fas fa-box"></i> Productos</a>
                    <a class="nav-link" href="../reportes/index.php"><i class="fas fa-chart-bar"></i> Reportes</a>
                    <a class="nav-link active" href="#"><i class="fas fa-user-cog"></i> Usuarios</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Gestión de Usuarios</h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <a href="nuevo.php" class="btn btn-sm btn-primary">
                            <i class="fas fa-user-plus"></i> Nuevo Usuario
                        </a>
                    </div>
                </div>
                
                <?php if (!empty($mensaje)): ?>
                    <div class="alert alert-<?php echo $tipo_mensaje; ?> alert-dismissible fade show" role="alert">
                        <?php echo $mensaje; ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                <?php endif; ?>
                
                <!-- Filtros -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Filtros</h5>
                    </div>
                    <div class="card-body">
                        <form method="GET" action="" class="row g-3">
                            <div class="col-md-4">
                                <label for="nombre" class="form-label">Buscar por nombre, apellidos o email</label>
                                <input type="text" class="form-control" id="nombre" name="nombre" value="<?php echo htmlspecialchars($filtro_nombre); ?>">
                            </div>
                            <div class="col-md-3">
                                <label for="rol" class="form-label">Rol</label>
                                <select class="form-select" id="rol" name="rol">
                                    <option value="">Todos</option>
                                    <option value="admin" <?php echo $filtro_rol === 'admin' ? 'selected' : ''; ?>>Administrador</option>
                                    <option value="cliente" <?php echo $filtro_rol === 'cliente' ? 'selected' : ''; ?>>Cliente</option>
                                    <option value="transportista" <?php echo $filtro_rol === 'transportista' ? 'selected' : ''; ?>>Transportista</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="estado" class="form-label">Estado</label>
                                <select class="form-select" id="estado" name="estado">
                                    <option value="">Todos</option>
                                    <option value="activo" <?php echo $filtro_estado === 'activo' ? 'selected' : ''; ?>>Activo</option>
                                    <option value="inactivo" <?php echo $filtro_estado === 'inactivo' ? 'selected' : ''; ?>>Inactivo</option>
                                </select>
                            </div>
                            <div class="col-md-2 d-flex align-items-end">
                                <button type="submit" class="btn btn-verde me-2">Filtrar</button>
                                <a href="listar.php" class="btn btn-naranja">Limpiar</a>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Tabla de Usuarios -->
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Fecha de registro</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if ($resultado_usuarios->num_rows > 0): ?>
                                        <?php while ($usuario = $resultado_usuarios->fetch_assoc()): ?>
                                            <tr>
                                                <td><?php echo $usuario['id']; ?></td>
                                                <td><?php echo htmlspecialchars($usuario['nombre'] . ' ' . $usuario['apellidos']); ?></td>
                                                <td><?php echo htmlspecialchars($usuario['username']); ?></td>
                                                <td><?php echo htmlspecialchars($usuario['email']); ?></td>
                                                <td>
                                                    <?php 
                                                    switch ($usuario['rol']) {
                                                        case 'admin':
                                                            echo '<span class="badge bg-danger">Administrador</span>';
                                                            break;
                                                        case 'cliente':
                                                            echo '<span class="badge bg-success">Cliente</span>';
                                                            break;
                                                        case 'transportista':
                                                            echo '<span class="badge bg-primary">Transportista</span>';
                                                            break;
                                                        default:
                                                            echo '<span class="badge bg-secondary">Otro</span>';
                                                    }
                                                    ?>
                                                </td>
                                                <td>
                                                    <?php if ($usuario['estado'] === 'activo'): ?>
                                                        <span class="badge bg-success">Activo</span>
                                                    <?php else: ?>
                                                        <span class="badge bg-danger">Inactivo</span>
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <?php 
                                                    // Mostrar la fecha de registro desde la base de datos
                                                    if (isset($usuario['fecha_registro'])) {
                                                        echo date('d/m/Y', strtotime($usuario['fecha_registro']));
                                                    } else {
                                                        echo '<span class="text-muted">No disponible</span>';
                                                    }
                                                    ?>
                                                </td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <a href="ver.php?id=<?php echo $usuario['id']; ?>" class="btn btn-ver" title="Ver detalles">
                                                            <i class="fas fa-eye"></i>
                                                        </a>
                                                        <a href="editar.php?id=<?php echo $usuario['id']; ?>" class="btn btn-editar" title="Editar">
                                                            <i class="fas fa-edit"></i>
                                                        </a>
                                                        <?php if ($usuario['estado'] === 'activo'): ?>
                                                            <a href="cambiar_estado.php?id=<?php echo $usuario['id']; ?>&estado=inactivo" class="btn btn-danger" title="Desactivar" onclick="return confirm('¿Está seguro de desactivar este usuario?');">
                                                                <i class="fas fa-ban"></i>
                                                            </a>
                                                        <?php else: ?>
                                                            <a href="cambiar_estado.php?id=<?php echo $usuario['id']; ?>&estado=activo" class="btn btn-success" title="Activar" onclick="return confirm('¿Está seguro de activar este usuario?');">
                                                                <i class="fas fa-check"></i>
                                                            </a>
                                                        <?php endif; ?>
                                                        <a href="resetear_password.php?id=<?php echo $usuario['id']; ?>" class="btn btn-naranja" title="Resetear contraseña" onclick="return confirm('¿Está seguro de resetear la contraseña de este usuario?');">
                                                            <i class="fas fa-key"></i>
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        <?php endwhile; ?>
                                    <?php else: ?>
                                        <tr>
                                            <td colspan="9" class="text-center">No se encontraron usuarios</td>
                                        </tr>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Paginación -->
                        <?php if ($total_paginas > 0): ?>
                        <nav aria-label="Page navigation" class="mt-4">
                            <ul class="pagination justify-content-center">
                                <li class="page-item <?php echo $pagina_actual <= 1 ? 'disabled' : ''; ?>">
                                    <a class="page-link" href="?pagina=<?php echo $pagina_actual - 1; ?>&nombre=<?php echo urlencode($filtro_nombre); ?>&rol=<?php echo urlencode($filtro_rol); ?>&estado=<?php echo urlencode($filtro_estado); ?>" aria-label="Anterior">
                                        <span aria-hidden="true">&laquo;</span>
                                    </a>
                                </li>
                                
                                <?php for ($i = 1; $i <= $total_paginas; $i++): ?>
                                    <li class="page-item <?php echo $pagina_actual == $i ? 'active' : ''; ?>">
                                        <a class="page-link" href="?pagina=<?php echo $i; ?>&nombre=<?php echo urlencode($filtro_nombre); ?>&rol=<?php echo urlencode($filtro_rol); ?>&estado=<?php echo urlencode($filtro_estado); ?>">
                                            <?php echo $i; ?>
                                        </a>
                                    </li>
                                <?php endfor; ?>
                                
                                <li class="page-item <?php echo $pagina_actual >= $total_paginas ? 'disabled' : ''; ?>">
                                    <a class="page-link" href="?pagina=<?php echo $pagina_actual + 1; ?>&nombre=<?php echo urlencode($filtro_nombre); ?>&rol=<?php echo urlencode($filtro_rol); ?>&estado=<?php echo urlencode($filtro_estado); ?>" aria-label="Siguiente">
                                        <span aria-hidden="true">&raquo;</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Resumen de Usuarios -->
                <div class="card mt-4">
                    <div class="card-header">
                        <h5 class="mb-0">Resumen de Usuarios</h5>
                    </div>
                    <div class="card-body">
                        <?php
                        // Consulta para obtener el resumen de usuarios
                        $query_resumen = "
                            SELECT 
                                COUNT(*) as total_usuarios,
                                SUM(CASE WHEN r.nombre = 'admin' THEN 1 ELSE 0 END) as total_admin,
                                SUM(CASE WHEN r.nombre = 'cliente' THEN 1 ELSE 0 END) as total_clientes,
                                SUM(CASE WHEN r.nombre = 'transportista' THEN 1 ELSE 0 END) as total_transportistas,
                                SUM(CASE WHEN u.estado = 'activo' THEN 1 ELSE 0 END) as total_activos,
                                SUM(CASE WHEN u.estado = 'inactivo' THEN 1 ELSE 0 END) as total_inactivos,
                                COUNT(*) as activos_recientes
                            FROM usuarios u
                            JOIN roles r ON u.id_rol = r.id
                        ";
                        $resultado_resumen = $conexion->query($query_resumen);
                        $resumen = $resultado_resumen->fetch_assoc();
                        ?>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Distribución por rol:</h6>
                                <div class="progress mb-3">
                                    <div class="progress-bar bg-danger" style="width: <?php echo $resumen['total_admin'] / $resumen['total_usuarios'] * 100; ?>%" title="Administradores"></div>
                                    <div class="progress-bar bg-success" style="width: <?php echo $resumen['total_clientes'] / $resumen['total_usuarios'] * 100; ?>%" title="Clientes"></div>
                                    <div class="progress-bar bg-primary" style="width: <?php echo $resumen['total_transportistas'] / $resumen['total_usuarios'] * 100; ?>%" title="Transportistas"></div>
                                </div>
                                <small>
                                    <span class="badge bg-danger">Administradores: <?php echo $resumen['total_admin']; ?></span>
                                    <span class="badge bg-success">Clientes: <?php echo $resumen['total_clientes']; ?></span>
                                    <span class="badge bg-primary">Transportistas: <?php echo $resumen['total_transportistas']; ?></span>
                                </small>
                            </div>
                            
                            <div class="col-md-6">
                                <h6>Estado de usuarios:</h6>
                                <div class="progress mb-3">
                                    <div class="progress-bar bg-success" style="width: <?php echo $resumen['total_activos'] / $resumen['total_usuarios'] * 100; ?>%" title="Activos"></div>
                                    <div class="progress-bar bg-danger" style="width: <?php echo $resumen['total_inactivos'] / $resumen['total_usuarios'] * 100; ?>%" title="Inactivos"></div>
                                </div>
                                <small>
                                    <span class="badge bg-success">Activos: <?php echo $resumen['total_activos']; ?></span>
                                    <span class="badge bg-danger">Inactivos: <?php echo $resumen['total_inactivos']; ?></span>
                                    <span class="badge bg-info">Activos últimos 30 días: <?php echo $resumen['activos_recientes']; ?></span>
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
