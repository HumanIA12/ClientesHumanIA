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
$filtro_empresa = isset($_GET['empresa']) ? $_GET['empresa'] : '';
$filtro_disponibilidad = isset($_GET['disponibilidad']) ? $_GET['disponibilidad'] : '';

// Construir la consulta base
$where_clauses = [];
$params = [];
$types = "";

if (!empty($filtro_nombre)) {
    $where_clauses[] = "CONCAT(u.nombre, ' ', u.apellidos) LIKE ?";
    $params[] = "%$filtro_nombre%";
    $types .= "s";
}

if (!empty($filtro_empresa)) {
    $where_clauses[] = "et.id = ?";
    $params[] = $filtro_empresa;
    $types .= "i";
}

if (!empty($filtro_disponibilidad)) {
    $where_clauses[] = "t.disponibilidad = ?";
    $params[] = $filtro_disponibilidad;
    $types .= "s";
}

$where_sql = '';
if (!empty($where_clauses)) {
    $where_sql = "WHERE " . implode(" AND ", $where_clauses);
}

// Consulta para obtener el total de registros con filtros
$query_count = "
    SELECT COUNT(*) as total 
    FROM transportistas t
    JOIN usuarios u ON t.id_usuario = u.id
    JOIN empresas_transporte et ON t.id_empresa = et.id
    JOIN tipos_vehiculo tv ON t.id_tipo_vehiculo = tv.id
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

// Consulta para obtener los transportistas con paginación
$query_transportistas = "
    SELECT t.id, u.nombre, u.apellidos, u.username, u.email, u.telefono, 
           t.licencia, et.nombre as empresa, tv.nombre as tipo_vehiculo,
           t.disponibilidad, t.tiene_gps, tv.tiene_refrigeracion, u.estado
    FROM transportistas t
    JOIN usuarios u ON t.id_usuario = u.id
    JOIN empresas_transporte et ON t.id_empresa = et.id
    JOIN tipos_vehiculo tv ON t.id_tipo_vehiculo = tv.id
    $where_sql
    ORDER BY u.nombre, u.apellidos
    LIMIT ? OFFSET ?
";

$params[] = $registros_por_pagina;
$params[] = $offset;
$types .= "ii";

$stmt_transportistas = $conexion->prepare($query_transportistas);
$stmt_transportistas->bind_param($types, ...$params);
$stmt_transportistas->execute();
$resultado_transportistas = $stmt_transportistas->get_result();

// Obtener empresas para filtro
$query_empresas = "SELECT id, nombre FROM empresas_transporte ORDER BY nombre";
$resultado_empresas = $conexion->query($query_empresas);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Transportistas - Frutale</title>
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
                    <a class="nav-link active" href="#"><i class="fas fa-truck"></i> Transportistas</a>
                    <a class="nav-link" href="../productos/listar.php"><i class="fas fa-box"></i> Productos</a>
                    <a class="nav-link" href="../reportes/index.php"><i class="fas fa-chart-bar"></i> Reportes</a>
                    <a class="nav-link" href="../usuarios/listar.php"><i class="fas fa-user-cog"></i> Usuarios</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Gestión de Transportistas</h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <a href="nuevo.php" class="btn btn-sm btn-primary">
                            <i class="fas fa-plus-circle"></i> Nuevo Transportista
                        </a>
                    </div>
                </div>
                
                <!-- Filtros -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Filtros</h5>
                    </div>
                    <div class="card-body">
                        <form method="GET" action="" class="row g-3">
                            <div class="col-md-4">
                                <label for="nombre" class="form-label">Nombre o Apellidos</label>
                                <input type="text" class="form-control" id="nombre" name="nombre" value="<?php echo htmlspecialchars($filtro_nombre); ?>">
                            </div>
                            <div class="col-md-3">
                                <label for="empresa" class="form-label">Empresa</label>
                                <select class="form-select" id="empresa" name="empresa">
                                    <option value="">Todas</option>
                                    <?php while ($empresa = $resultado_empresas->fetch_assoc()): ?>
                                        <option value="<?php echo $empresa['id']; ?>" <?php echo $filtro_empresa == $empresa['id'] ? 'selected' : ''; ?>>
                                            <?php echo htmlspecialchars($empresa['nombre']); ?>
                                        </option>
                                    <?php endwhile; ?>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="disponibilidad" class="form-label">Disponibilidad</label>
                                <select class="form-select" id="disponibilidad" name="disponibilidad">
                                    <option value="">Todas</option>
                                    <option value="disponible" <?php echo $filtro_disponibilidad === 'disponible' ? 'selected' : ''; ?>>Disponible</option>
                                    <option value="en ruta" <?php echo $filtro_disponibilidad === 'en ruta' ? 'selected' : ''; ?>>En ruta</option>
                                    <option value="no disponible" <?php echo $filtro_disponibilidad === 'no disponible' ? 'selected' : ''; ?>>No disponible</option>
                                </select>
                            </div>
                            <div class="col-md-2 d-flex align-items-end">
                                <button type="submit" class="btn btn-primary me-2">Filtrar</button>
                                <a href="listar.php" class="btn btn-secondary">Limpiar</a>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Tabla de Transportistas -->
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Empresa</th>
                                        <th>Vehículo</th>
                                        <th>Licencia</th>
                                        <th>Disponibilidad</th>
                                        <th>Características</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if ($resultado_transportistas->num_rows > 0): ?>
                                        <?php while ($transportista = $resultado_transportistas->fetch_assoc()): ?>
                                            <tr>
                                                <td><?php echo $transportista['id']; ?></td>
                                                <td><?php echo htmlspecialchars($transportista['nombre'] . ' ' . $transportista['apellidos']); ?></td>
                                                <td><?php echo htmlspecialchars($transportista['empresa']); ?></td>
                                                <td><?php echo htmlspecialchars($transportista['tipo_vehiculo']); ?></td>
                                                <td><?php echo htmlspecialchars($transportista['licencia']); ?></td>
                                                <td>
                                                    <?php 
                                                    switch ($transportista['disponibilidad']) {
                                                        case 'disponible':
                                                            echo '<span class="badge bg-success">Disponible</span>';
                                                            break;
                                                        case 'en ruta':
                                                            echo '<span class="badge bg-primary">En ruta</span>';
                                                            break;
                                                        case 'no disponible':
                                                            echo '<span class="badge bg-danger">No disponible</span>';
                                                            break;
                                                    }
                                                    ?>
                                                </td>
                                                <td>
                                                    <?php if ($transportista['tiene_refrigeracion']): ?>
                                                        <span class="badge bg-info me-1" title="Refrigeración">
                                                            <i class="fas fa-snowflake"></i>
                                                        </span>
                                                    <?php endif; ?>
                                                    
                                                    <?php if ($transportista['tiene_gps']): ?>
                                                        <span class="badge bg-warning me-1" title="GPS">
                                                            <i class="fas fa-map-marker-alt"></i>
                                                        </span>
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <?php if ($transportista['estado'] === 'activo'): ?>
                                                        <span class="badge bg-success">Activo</span>
                                                    <?php else: ?>
                                                        <span class="badge bg-danger">Inactivo</span>
                                                    <?php endif; ?>
                                                </td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <a href="ver.php?id=<?php echo $transportista['id']; ?>" class="btn btn-ver" title="Ver detalles">
                                                            <i class="fas fa-eye"></i>
                                                        </a>
                                                        <a href="editar.php?id=<?php echo $transportista['id']; ?>" class="btn btn-editar" title="Editar">
                                                            <i class="fas fa-edit"></i>
                                                        </a>
                                                        <?php if ($transportista['estado'] === 'activo'): ?>
                                                            <a href="cambiar_estado.php?id=<?php echo $transportista['id']; ?>&estado=inactivo" class="btn btn-danger" title="Desactivar" onclick="return confirm('¿Está seguro de desactivar este transportista?');">
                                                                <i class="fas fa-ban"></i>
                                                            </a>
                                                        <?php else: ?>
                                                            <a href="cambiar_estado.php?id=<?php echo $transportista['id']; ?>&estado=activo" class="btn btn-success" title="Activar" onclick="return confirm('¿Está seguro de activar este transportista?');">
                                                                <i class="fas fa-check"></i>
                                                            </a>
                                                        <?php endif; ?>
                                                        <a href="ver_rutas.php?id=<?php echo $transportista['id']; ?>" class="btn btn-naranja" title="Ver rutas">
                                                            <i class="fas fa-route"></i>
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        <?php endwhile; ?>
                                    <?php else: ?>
                                        <tr>
                                            <td colspan="9" class="text-center">No se encontraron transportistas</td>
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
                                    <a class="page-link" href="?pagina=<?php echo $pagina_actual - 1; ?>&nombre=<?php echo urlencode($filtro_nombre); ?>&empresa=<?php echo urlencode($filtro_empresa); ?>&disponibilidad=<?php echo urlencode($filtro_disponibilidad); ?>" aria-label="Anterior">
                                        <span aria-hidden="true">&laquo;</span>
                                    </a>
                                </li>
                                
                                <?php for ($i = 1; $i <= $total_paginas; $i++): ?>
                                    <li class="page-item <?php echo $pagina_actual == $i ? 'active' : ''; ?>">
                                        <a class="page-link" href="?pagina=<?php echo $i; ?>&nombre=<?php echo urlencode($filtro_nombre); ?>&empresa=<?php echo urlencode($filtro_empresa); ?>&disponibilidad=<?php echo urlencode($filtro_disponibilidad); ?>">
                                            <?php echo $i; ?>
                                        </a>
                                    </li>
                                <?php endfor; ?>
                                
                                <li class="page-item <?php echo $pagina_actual >= $total_paginas ? 'disabled' : ''; ?>">
                                    <a class="page-link" href="?pagina=<?php echo $pagina_actual + 1; ?>&nombre=<?php echo urlencode($filtro_nombre); ?>&empresa=<?php echo urlencode($filtro_empresa); ?>&disponibilidad=<?php echo urlencode($filtro_disponibilidad); ?>" aria-label="Siguiente">
                                        <span aria-hidden="true">&raquo;</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                        <?php endif; ?>
                    </div>
                </div>
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
