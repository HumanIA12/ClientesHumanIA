<?php
// Iniciar sesión
session_start();

// Incluir utilidades de autenticación
require_once '../../api/auth/auth_utils.php';

// Verificar que el usuario tiene rol de transportista
requiereRol(3);

// Incluir la conexión a la base de datos
$conexion = require_once '../../config/db.php';

// Obtener el ID del transportista
$query_transportista = "SELECT id FROM transportistas WHERE id_usuario = ?";
$stmt = $conexion->prepare($query_transportista);
$stmt->bind_param("i", $_SESSION['usuario_id']);
$stmt->execute();
$result = $stmt->get_result();
$transportista = $result->fetch_assoc();
$id_transportista = $transportista['id'];

// Paginación
$pagina_actual = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
$registros_por_pagina = 5;
$offset = ($pagina_actual - 1) * $registros_por_pagina;

// Filtros
$filtro_estado = isset($_GET['estado']) ? $_GET['estado'] : '';
$filtro_fecha = isset($_GET['fecha']) ? $_GET['fecha'] : '';
$filtro_cliente = isset($_GET['cliente']) ? $_GET['cliente'] : '';

// Construir la consulta base
$where_clauses = ["p.id_transportista = ?"];
$params = [$id_transportista];
$types = "i";

if (!empty($filtro_estado)) {
    $where_clauses[] = "p.estado = ?";
    $params[] = $filtro_estado;
    $types .= "s";
}

if (!empty($filtro_fecha)) {
    $where_clauses[] = "DATE(p.fecha_entrega) = ?";
    $params[] = $filtro_fecha;
    $types .= "s";
}

if (!empty($filtro_cliente)) {
    $where_clauses[] = "CONCAT(u.nombre, ' ', u.apellidos) LIKE ?";
    $params[] = "%$filtro_cliente%";
    $types .= "s";
}

$where_sql = "WHERE " . implode(" AND ", $where_clauses);

// Consulta para obtener el total de registros con filtros
$query_count = "
    SELECT COUNT(*) as total 
    FROM pedidos p
    JOIN clientes c ON p.id_cliente = c.id
    JOIN usuarios u ON c.id_usuario = u.id
    $where_sql
";

$stmt_count = $conexion->prepare($query_count);
$stmt_count->bind_param($types, ...$params);
$stmt_count->execute();
$result_count = $stmt_count->get_result();
$total_registros = $result_count->fetch_assoc()['total'];

$total_paginas = ceil($total_registros / $registros_por_pagina);

// Consulta para obtener los pedidos con paginación
$query_pedidos = "
    SELECT p.id, p.fecha_pedido, p.fecha_entrega, p.total, p.estado, 
           p.direccion_entrega, ci.nombre as ciudad, 
           p.refrigeracion_requerida, p.temperatura_requerida,
           p.tiene_tracking, p.link_tracking,
           CONCAT(u.nombre, ' ', u.apellidos) as cliente
    FROM pedidos p
    JOIN clientes c ON p.id_cliente = c.id
    JOIN usuarios u ON c.id_usuario = u.id
    JOIN ciudades ci ON p.id_ciudad_entrega = ci.id
    $where_sql
    ORDER BY 
        CASE 
            WHEN p.estado = 'en_camino' THEN 1
            WHEN p.estado = 'preparando' THEN 2
            WHEN p.estado = 'confirmado' THEN 3
            WHEN p.estado = 'entregado' THEN 4
            ELSE 5
        END,
        p.fecha_entrega ASC
    LIMIT ? OFFSET ?
";

$params[] = $registros_por_pagina;
$params[] = $offset;
$types .= "ii";

$stmt_pedidos = $conexion->prepare($query_pedidos);
$stmt_pedidos->bind_param($types, ...$params);
$stmt_pedidos->execute();
$resultado_pedidos = $stmt_pedidos->get_result();

// Verificar si el transportista tiene vehículo con refrigeración
$query_refrigeracion = "
    SELECT tv.tiene_refrigeracion 
    FROM transportistas t 
    JOIN tipos_vehiculo tv ON t.id_tipo_vehiculo = tv.id 
    WHERE t.id = ?
";
$stmt_refrigeracion = $conexion->prepare($query_refrigeracion);
$stmt_refrigeracion->bind_param("i", $id_transportista);
$stmt_refrigeracion->execute();
$result_refrigeracion = $stmt_refrigeracion->get_result();
$tiene_refrigeracion = $result_refrigeracion->fetch_assoc()['tiene_refrigeracion'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedidos Asignados - Frutale</title>
    <link rel="stylesheet" href="../../assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="../../assets/css/estilos.css">
    <link rel="stylesheet" href="../../assets/css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        .temperatura-warning {
            color: #dc3545;
            font-weight: bold;
        }
        .tracking-container .tracking-dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin: 0 auto;
        }
        .tracking-container .tracking-active {
            background-color: #28a745;
        }
        .tracking-container .tracking-inactive {
            background-color: #adb5bd;
        }
    </style>
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
                    <a class="nav-link active" href="#"><i class="fas fa-box"></i> Pedidos Asignados</a>
                    <a class="nav-link" href="../rutas/mis_rutas.php"><i class="fas fa-route"></i> Mis Rutas</a>
                    <a class="nav-link" href="../rutas/tracking.php"><i class="fas fa-map-marked-alt"></i> Activar Tracking</a>
                    <a class="nav-link" href="../perfil/editar.php"><i class="fas fa-user-edit"></i> Mi Perfil</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Pedidos Asignados</h1>
                </div>
                
                <!-- Filtros -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Filtros</h5>
                    </div>
                    <div class="card-body">
                        <form method="GET" action="" class="row g-3">
                            <div class="col-md-3">
                                <label for="estado" class="form-label">Estado</label>
                                <select class="form-select" id="estado" name="estado">
                                    <option value="">Todos</option>
                                    <option value="confirmado" <?php echo $filtro_estado === 'confirmado' ? 'selected' : ''; ?>>Confirmado</option>
                                    <option value="preparando" <?php echo $filtro_estado === 'preparando' ? 'selected' : ''; ?>>Preparando</option>
                                    <option value="en_camino" <?php echo $filtro_estado === 'en_camino' ? 'selected' : ''; ?>>En camino</option>
                                    <option value="entregado" <?php echo $filtro_estado === 'entregado' ? 'selected' : ''; ?>>Entregado</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="fecha" class="form-label">Fecha de entrega</label>
                                <input type="date" class="form-control" id="fecha" name="fecha" value="<?php echo htmlspecialchars($filtro_fecha); ?>">
                            </div>
                            <div class="col-md-3">
                                <label for="cliente" class="form-label">Cliente</label>
                                <input type="text" class="form-control" id="cliente" name="cliente" value="<?php echo htmlspecialchars($filtro_cliente); ?>">
                            </div>
                            <div class="col-md-3 d-flex align-items-end">
                                <button type="submit" class="btn btn-primary me-2">Filtrar</button>
                                <a href="asignados.php" class="btn btn-secondary">Limpiar</a>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Lista de Pedidos -->
                <?php if ($resultado_pedidos->num_rows > 0): ?>
                    <div class="row">
                        <?php while ($pedido = $resultado_pedidos->fetch_assoc()): ?>
                            <div class="col-lg-12 mb-4">
                                <div class="card <?php echo $pedido['estado'] === 'en_camino' ? 'border-primary' : ''; ?>">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h5 class="mb-0">Pedido #<?php echo $pedido['id']; ?></h5>
                                        <?php
                                        $clase_estado = '';
                                        switch ($pedido['estado']) {
                                            case 'confirmado': $clase_estado = 'badge bg-info'; break;
                                            case 'preparando': $clase_estado = 'badge bg-primary'; break;
                                            case 'en_camino': $clase_estado = 'badge bg-info'; break;
                                            case 'entregado': $clase_estado = 'badge bg-success'; break;
                                        }
                                        echo '<span class="' . $clase_estado . '">' . ucfirst(str_replace('_', ' ', $pedido['estado'])) . '</span>';
                                        ?>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-8">
                                                <p><strong>Cliente:</strong> <?php echo htmlspecialchars($pedido['cliente']); ?></p>
                                                <p><strong>Dirección de entrega:</strong> <?php echo htmlspecialchars($pedido['direccion_entrega']); ?>, <?php echo htmlspecialchars($pedido['ciudad']); ?></p>
                                                <p>
                                                    <strong>Fecha de entrega:</strong> 
                                                    <?php echo date('d/m/Y H:i', strtotime($pedido['fecha_entrega'])); ?>
                                                </p>
                                                
                                                <?php if ($pedido['refrigeracion_requerida']): ?>
                                                    <p>
                                                        <strong>Refrigeración requerida:</strong> 
                                                        <?php if ($tiene_refrigeracion): ?>
                                                            <span class="badge bg-success">Si - Temperatura: <?php echo $pedido['temperatura_requerida']; ?>°C</span>
                                                        <?php else: ?>
                                                            <span class="badge bg-danger">Si - Tu vehículo no tiene refrigeración</span>
                                                        <?php endif; ?>
                                                    </p>
                                                <?php endif; ?>
                                                
                                                <?php if ($pedido['estado'] === 'en_camino'): ?>
                                                    <!-- Tracking Visual -->
                                                    <div class="tracking-container mt-3">
                                                        <div class="d-flex justify-content-between position-relative">
                                                            <div class="tracking-step text-center">
                                                                <div class="tracking-dot tracking-active"></div>
                                                                <small>Recogido</small>
                                                            </div>
                                                            <div class="tracking-step text-center">
                                                                <div class="tracking-dot tracking-inactive"></div>
                                                                <small>En ruta</small>
                                                            </div>
                                                            <div class="tracking-step text-center">
                                                                <div class="tracking-dot tracking-inactive"></div>
                                                                <small>Entregado</small>
                                                            </div>
                                                            
                                                            <!-- Línea de progreso -->
                                                            <div class="progress position-absolute" style="height: 2px; width: 70%; top: 7px; left: 15%; z-index: -1;">
                                                                <div class="progress-bar bg-success" role="progressbar" style="width: 33%"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                            <div class="col-md-4 text-end">
                                                <div class="d-grid gap-2">
                                                    <a href="ver_detalle.php?id=<?php echo $pedido['id']; ?>" class="btn btn-primary">
                                                        <i class="fas fa-eye me-2"></i> Ver detalles
                                                    </a>
                                                    
                                                    <?php if ($pedido['estado'] === 'en_camino'): ?>
                                                        <?php if ($pedido['tiene_tracking']): ?>
                                                            <a href="../rutas/tracking.php?id=<?php echo $pedido['id']; ?>" class="btn btn-success">
                                                                <i class="fas fa-location-arrow me-2"></i> Actualizar ubicación
                                                            </a>
                                                        <?php else: ?>
                                                            <a href="../rutas/activar_tracking.php?id=<?php echo $pedido['id']; ?>" class="btn btn-outline-success">
                                                                <i class="fas fa-map-marker-alt me-2"></i> Activar tracking
                                                            </a>
                                                        <?php endif; ?>
                                                        
                                                        <a href="marcar_entregado.php?id=<?php echo $pedido['id']; ?>" class="btn btn-outline-primary" onclick="return confirm('¿Confirma que el pedido ha sido entregado?');">
                                                            <i class="fas fa-check-circle me-2"></i> Marcar como entregado
                                                        </a>
                                                    <?php elseif ($pedido['estado'] === 'preparando' || $pedido['estado'] === 'confirmado'): ?>
                                                        <a href="iniciar_entrega.php?id=<?php echo $pedido['id']; ?>" class="btn btn-outline-primary" onclick="return confirm('¿Iniciar la entrega de este pedido?');">
                                                            <i class="fas fa-truck me-2"></i> Iniciar entrega
                                                        </a>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <?php endwhile; ?>
                    </div>
                    
                    <!-- Paginación -->
                    <?php if ($total_paginas > 0): ?>
                    <nav aria-label="Page navigation">
                        <ul class="pagination justify-content-center">
                            <li class="page-item <?php echo $pagina_actual <= 1 ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?pagina=<?php echo $pagina_actual - 1; ?>&estado=<?php echo urlencode($filtro_estado); ?>&fecha=<?php echo urlencode($filtro_fecha); ?>&cliente=<?php echo urlencode($filtro_cliente); ?>" aria-label="Anterior">
                                    <span aria-hidden="true">&laquo;</span>
                                </a>
                            </li>
                            
                            <?php for ($i = 1; $i <= $total_paginas; $i++): ?>
                                <li class="page-item <?php echo $pagina_actual == $i ? 'active' : ''; ?>">
                                    <a class="page-link" href="?pagina=<?php echo $i; ?>&estado=<?php echo urlencode($filtro_estado); ?>&fecha=<?php echo urlencode($filtro_fecha); ?>&cliente=<?php echo urlencode($filtro_cliente); ?>">
                                        <?php echo $i; ?>
                                    </a>
                                </li>
                            <?php endfor; ?>
                            
                            <li class="page-item <?php echo $pagina_actual >= $total_paginas ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?pagina=<?php echo $pagina_actual + 1; ?>&estado=<?php echo urlencode($filtro_estado); ?>&fecha=<?php echo urlencode($filtro_fecha); ?>&cliente=<?php echo urlencode($filtro_cliente); ?>" aria-label="Siguiente">
                                    <span aria-hidden="true">&raquo;</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                    <?php endif; ?>
                <?php else: ?>
                    <div class="alert alert-info text-center">
                        <i class="fas fa-info-circle me-2"></i> No tienes pedidos asignados actualmente.
                    </div>
                <?php endif; ?>
                
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
