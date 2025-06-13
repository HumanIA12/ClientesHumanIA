<?php
// Iniciar sesión
session_start();

// Incluir utilidades de autenticación
require_once '../../api/auth/auth_utils.php';

// Verificar que el usuario tiene rol de transportista
requiereRol(3);

// Incluir la conexión a la base de datos
$conexion = require_once '../../config/db.php';

// Obtener el ID del transportista actual
$id_usuario = $_SESSION['usuario_id'];
$query_transportista = "SELECT id FROM transportistas WHERE id_usuario = ?";
$stmt_transportista = $conexion->prepare($query_transportista);
$stmt_transportista->bind_param("i", $id_usuario);
$stmt_transportista->execute();
$resultado_transportista = $stmt_transportista->get_result();
$transportista = $resultado_transportista->fetch_assoc();
$id_transportista = $transportista['id'];

// Paginación
$pagina_actual = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
$registros_por_pagina = 10;
$offset = ($pagina_actual - 1) * $registros_por_pagina;

// Filtros
$filtro_fecha = isset($_GET['fecha']) ? $_GET['fecha'] : '';
$filtro_estado = isset($_GET['estado']) ? $_GET['estado'] : '';

// Construir la consulta base
$where_clauses = ["r.id_transportista = ?"];
$params = [$id_transportista];
$types = "i";

if (!empty($filtro_fecha)) {
    $where_clauses[] = "DATE(r.fecha_ruta) = ?";
    $params[] = $filtro_fecha;
    $types .= "s";
}

if (!empty($filtro_estado)) {
    $where_clauses[] = "r.estado = ?";
    $params[] = $filtro_estado;
    $types .= "s";
}

$where_sql = "WHERE " . implode(" AND ", $where_clauses);

// Consulta para obtener el total de registros con filtros
$query_count = "
    SELECT COUNT(*) as total 
    FROM rutas_entrega r
    $where_sql
";

$stmt_count = $conexion->prepare($query_count);
$stmt_count->bind_param($types, ...$params);
$stmt_count->execute();
$result_count = $stmt_count->get_result();
$total_registros = $result_count->fetch_assoc()['total'];

$total_paginas = ceil($total_registros / $registros_por_pagina);

// Consulta para obtener las rutas con paginación
$query_rutas = "
    SELECT r.id, r.fecha_ruta, r.hora_inicio, r.hora_fin, 
           r.estado, r.kilometros_totales, r.tiempo_estimado_minutos as tiempo_estimado,
           (SELECT COUNT(*) FROM pedidos_en_ruta pr WHERE pr.id_ruta = r.id) as num_pedidos
    FROM rutas_entrega r
    $where_sql
    ORDER BY r.fecha_ruta DESC, r.hora_inicio
    LIMIT ? OFFSET ?
";

$params[] = $registros_por_pagina;
$params[] = $offset;
$types .= "ii";

$stmt_rutas = $conexion->prepare($query_rutas);
$stmt_rutas->bind_param($types, ...$params);
$stmt_rutas->execute();
$resultado_rutas = $stmt_rutas->get_result();

// Estadísticas de rutas
$query_stats = "
    SELECT 
        COUNT(*) as total_rutas,
        SUM(CASE WHEN estado = 'completada' THEN 1 ELSE 0 END) as rutas_completadas,
        SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) as rutas_en_progreso,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as rutas_pendientes,
        SUM(kilometros_totales) as distancia_total,
        AVG(kilometros_totales) as distancia_promedio
    FROM rutas_entrega
    WHERE id_transportista = ?
";

$stmt_stats = $conexion->prepare($query_stats);
$stmt_stats->bind_param("i", $id_transportista);
$stmt_stats->execute();
$resultado_stats = $stmt_stats->get_result();
$stats = $resultado_stats->fetch_assoc();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mis Rutas - Frutale</title>
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
            <div class="col-md-3 col-lg-2 transportista-sidebar d-none d-md-block">
                <h5 class="px-3 mb-4">Panel de Transportista</h5>
                <div class="nav flex-column">
                    <a class="nav-link" href="../dashboard/transportista.php"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a class="nav-link" href="../pedidos/asignados.php"><i class="fas fa-box"></i> Pedidos Asignados</a>
                    <a class="nav-link active" href="#"><i class="fas fa-route"></i> Mis Rutas</a>
                    <a class="nav-link" href="tracking.php"><i class="fas fa-map-marked-alt"></i> Activar Tracking</a>
                    <a class="nav-link" href="../perfil/editar.php"><i class="fas fa-user-edit"></i> Mi Perfil</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Mis Rutas de Entrega</h1>
                </div>
                
                <!-- Resumen de Rutas -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-white" style="background-color: var(--verde-oscuro);">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="card-title">Total Rutas</h6>
                                        <h2><?php echo isset($stats['total_rutas']) ? (int)$stats['total_rutas'] : 0; ?></h2>
                                    </div>
                                    <i class="fas fa-route fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white" style="background-color: var(--verde-claro);">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="card-title">Completadas</h6>
                                        <h2><?php echo isset($stats['rutas_completadas']) ? (int)$stats['rutas_completadas'] : 0; ?></h2>
                                    </div>
                                    <i class="fas fa-check-circle fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white" style="background-color: var(--naranja-oscuro);">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="card-title">En progreso</h6>
                                        <h2><?php echo isset($stats['rutas_en_progreso']) ? (int)$stats['rutas_en_progreso'] : 0; ?></h2>
                                    </div>
                                    <i class="fas fa-truck fa-2x"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-white" style="background-color: var(--naranja-claro);">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 class="card-title">Km recorridos</h6>
                                        <h2><?php echo isset($stats['distancia_total']) ? number_format($stats['distancia_total'], 1) : '0.0'; ?></h2>
                                    </div>
                                    <i class="fas fa-road fa-2x"></i>
                                </div>
                            </div>
                        </div>
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
                                <label for="fecha" class="form-label">Fecha de asignación</label>
                                <input type="date" class="form-control" id="fecha" name="fecha" value="<?php echo htmlspecialchars($filtro_fecha); ?>">
                            </div>
                            <div class="col-md-4">
                                <label for="estado" class="form-label">Estado</label>
                                <select class="form-select" id="estado" name="estado">
                                    <option value="">Todos</option>
                                    <option value="pendiente" <?php echo $filtro_estado === 'pendiente' ? 'selected' : ''; ?>>Pendiente</option>
                                    <option value="en_progreso" <?php echo $filtro_estado === 'en_progreso' ? 'selected' : ''; ?>>En progreso</option>
                                    <option value="completada" <?php echo $filtro_estado === 'completada' ? 'selected' : ''; ?>>Completada</option>
                                </select>
                            </div>
                            <div class="col-md-4 d-flex align-items-end">
                                <button type="submit" class="btn btn-verde me-2">Filtrar</button>
                                <a href="mis_rutas.php" class="btn btn-naranja">Limpiar</a>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Tabla de Rutas -->
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Fecha</th>
                                        <th>Horario</th>
                                        <th>Pedidos</th>
                                        <th>Distancia</th>
                                        <th>Tiempo Est.</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if ($resultado_rutas->num_rows > 0): ?>
                                        <?php while ($ruta = $resultado_rutas->fetch_assoc()): ?>
                                            <tr>
                                                <td><?php echo $ruta['id']; ?></td>
                                                <td><?php echo date('d/m/Y', strtotime($ruta['fecha_ruta'])); ?></td>
                                                <td>
                                                    <?php 
                                                    echo date('H:i', strtotime($ruta['hora_inicio'])) . ' - ';
                                                    echo $ruta['hora_fin'] ? date('H:i', strtotime($ruta['hora_fin'])) : '?';
                                                    ?>
                                                </td>
                                                <td><?php echo $ruta['num_pedidos']; ?></td>
                                                <td><?php echo $ruta['kilometros_totales'] ? number_format($ruta['kilometros_totales'], 1) . ' km' : '-'; ?></td>
                                                <td><?php echo $ruta['tiempo_estimado'] ? $ruta['tiempo_estimado'] . ' min' : '-'; ?></td>
                                                <td>
                                                    <?php 
                                                    switch ($ruta['estado']) {
                                                        case 'pendiente':
                                                            echo '<span class="badge bg-secondary">Pendiente</span>';
                                                            break;
                                                        case 'en_progreso':
                                                            echo '<span class="badge bg-warning">En progreso</span>';
                                                            break;
                                                        case 'completada':
                                                            echo '<span class="badge bg-success">Completada</span>';
                                                            break;
                                                    }
                                                    ?>
                                                </td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <a href="detalle_ruta.php?id=<?php echo $ruta['id']; ?>" class="btn btn-info" title="Ver detalles">
                                                            <i class="fas fa-eye"></i>
                                                        </a>
                                                        <?php if ($ruta['estado'] === 'pendiente'): ?>
                                                            <a href="iniciar_ruta.php?id=<?php echo $ruta['id']; ?>" class="btn btn-success" title="Iniciar ruta" onclick="return confirm('¿Está seguro de iniciar esta ruta?');">
                                                                <i class="fas fa-play"></i>
                                                            </a>
                                                        <?php elseif ($ruta['estado'] === 'en_progreso'): ?>
                                                            <a href="completar_ruta.php?id=<?php echo $ruta['id']; ?>" class="btn btn-primary" title="Completar ruta" onclick="return confirm('¿Está seguro de marcar esta ruta como completada?');">
                                                                <i class="fas fa-check"></i>
                                                            </a>
                                                        <?php endif; ?>
                                                        <a href="ver_mapa.php?id=<?php echo $ruta['id']; ?>" class="btn btn-secondary" title="Ver en mapa">
                                                            <i class="fas fa-map-marked-alt"></i>
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        <?php endwhile; ?>
                                    <?php else: ?>
                                        <tr>
                                            <td colspan="8" class="text-center">No se encontraron rutas asignadas</td>
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
                                    <a class="page-link" href="?pagina=<?php echo $pagina_actual - 1; ?>&fecha=<?php echo urlencode($filtro_fecha); ?>&estado=<?php echo urlencode($filtro_estado); ?>" aria-label="Anterior">
                                        <span aria-hidden="true">&laquo;</span>
                                    </a>
                                </li>
                                
                                <?php for ($i = 1; $i <= $total_paginas; $i++): ?>
                                    <li class="page-item <?php echo $pagina_actual == $i ? 'active' : ''; ?>">
                                        <a class="page-link" href="?pagina=<?php echo $i; ?>&fecha=<?php echo urlencode($filtro_fecha); ?>&estado=<?php echo urlencode($filtro_estado); ?>">
                                            <?php echo $i; ?>
                                        </a>
                                    </li>
                                <?php endfor; ?>
                                
                                <li class="page-item <?php echo $pagina_actual >= $total_paginas ? 'disabled' : ''; ?>">
                                    <a class="page-link" href="?pagina=<?php echo $pagina_actual + 1; ?>&fecha=<?php echo urlencode($filtro_fecha); ?>&estado=<?php echo urlencode($filtro_estado); ?>" aria-label="Siguiente">
                                        <span aria-hidden="true">&raquo;</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Información Adicional -->
                <div class="card mt-4">
                    <div class="card-header">
                        <h5 class="mb-0">Rendimiento</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Eficiencia de entrega:</h6>
                                <?php
                                $eficiencia = $stats['total_rutas'] > 0 ? ($stats['rutas_completadas'] / $stats['total_rutas']) * 100 : 0;
                                ?>
                                <div class="progress mb-3">
                                    <div class="progress-bar bg-success" style="width: <?php echo $eficiencia; ?>%" role="progressbar" aria-valuenow="<?php echo $eficiencia; ?>" aria-valuemin="0" aria-valuemax="100">
                                        <?php echo round($eficiencia); ?>%
                                    </div>
                                </div>
                                <p class="text-muted small">Basado en la relación entre rutas completadas y rutas asignadas.</p>
                            </div>
                            <div class="col-md-6 text-end">
                                <a href="reporte_rutas.php" class="btn btn-outline-primary">
                                    <i class="fas fa-file-export me-2"></i> Exportar informe
                                </a>
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
