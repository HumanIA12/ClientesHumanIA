<?php
// Iniciar sesión
session_start();

// Incluir utilidades de autenticación
require_once '../../api/auth/auth_utils.php';

// Verificar que el usuario tiene rol de cliente
requiereRol(2);

// Incluir la conexión a la base de datos
$conexion = require_once '../../config/db.php';

// Obtener el ID del cliente
$query_cliente = "SELECT id FROM clientes WHERE id_usuario = ?";
$stmt = $conexion->prepare($query_cliente);
$stmt->bind_param("i", $_SESSION['usuario_id']);
$stmt->execute();
$result = $stmt->get_result();
$cliente = $result->fetch_assoc();
$id_cliente = $cliente['id'];

// Paginación
$pagina_actual = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
$registros_por_pagina = 5;
$offset = ($pagina_actual - 1) * $registros_por_pagina;

// Filtros
$filtro_estado = isset($_GET['estado']) ? $_GET['estado'] : '';
$filtro_fecha = isset($_GET['fecha']) ? $_GET['fecha'] : '';

// Construir la consulta base
$where_clauses = ["p.id_cliente = ?"];
$params = [$id_cliente];
$types = "i";

if (!empty($filtro_estado)) {
    $where_clauses[] = "p.estado = ?";
    $params[] = $filtro_estado;
    $types .= "s";
}

if (!empty($filtro_fecha)) {
    $where_clauses[] = "DATE(p.fecha_pedido) = ?";
    $params[] = $filtro_fecha;
    $types .= "s";
}

$where_sql = "WHERE " . implode(" AND ", $where_clauses);

// Consulta para obtener el total de registros con filtros
$query_count = "
    SELECT COUNT(*) as total 
    FROM pedidos p
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
           p.direccion_entrega, ci.nombre as ciudad, p.tiene_tracking,
           p.link_tracking, p.refrigeracion_requerida, 
           CONCAT(ut.nombre, ' ', ut.apellidos) as transportista
    FROM pedidos p
    JOIN ciudades ci ON p.id_ciudad_entrega = ci.id
    LEFT JOIN transportistas t ON p.id_transportista = t.id
    LEFT JOIN usuarios ut ON t.id_usuario = ut.id
    $where_sql
    ORDER BY p.fecha_pedido DESC
    LIMIT ? OFFSET ?
";

$params[] = $registros_por_pagina;
$params[] = $offset;
$types .= "ii";

$stmt_pedidos = $conexion->prepare($query_pedidos);
$stmt_pedidos->bind_param($types, ...$params);
$stmt_pedidos->execute();
$resultado_pedidos = $stmt_pedidos->get_result();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mis Pedidos - Frutale</title>
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
            <div class="col-md-3 col-lg-2 cliente-sidebar d-none d-md-block">
                <h5 class="px-3 mb-4">Panel de Cliente</h5>
                <div class="nav flex-column">
                    <a class="nav-link" href="../dashboard/cliente.php"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a class="nav-link active" href="#"><i class="fas fa-shopping-cart"></i> Mis Pedidos</a>
                    <a class="nav-link" href="nuevo.php"><i class="fas fa-plus-circle"></i> Nuevo Pedido</a>
                    <a class="nav-link" href="tracking.php"><i class="fas fa-map-marker-alt"></i> Tracking</a>
                    <a class="nav-link" href="../perfil/editar.php"><i class="fas fa-user-edit"></i> Mi Perfil</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Mis Pedidos</h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <a href="nuevo.php" class="btn btn-sm btn-primary">
                            <i class="fas fa-plus-circle"></i> Nuevo Pedido
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
                                <label for="estado" class="form-label">Estado</label>
                                <select class="form-select" id="estado" name="estado">
                                    <option value="">Todos</option>
                                    <option value="pendiente" <?php echo $filtro_estado === 'pendiente' ? 'selected' : ''; ?>>Pendiente</option>
                                    <option value="confirmado" <?php echo $filtro_estado === 'confirmado' ? 'selected' : ''; ?>>Confirmado</option>
                                    <option value="preparando" <?php echo $filtro_estado === 'preparando' ? 'selected' : ''; ?>>Preparando</option>
                                    <option value="en_camino" <?php echo $filtro_estado === 'en_camino' ? 'selected' : ''; ?>>En camino</option>
                                    <option value="entregado" <?php echo $filtro_estado === 'entregado' ? 'selected' : ''; ?>>Entregado</option>
                                    <option value="cancelado" <?php echo $filtro_estado === 'cancelado' ? 'selected' : ''; ?>>Cancelado</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="fecha" class="form-label">Fecha</label>
                                <input type="date" class="form-control" id="fecha" name="fecha" value="<?php echo htmlspecialchars($filtro_fecha); ?>">
                            </div>
                            <div class="col-md-4 d-flex align-items-end">
                                <button type="submit" class="btn btn-primary me-2">Filtrar</button>
                                <a href="mis_pedidos.php" class="btn btn-secondary">Limpiar</a>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Lista de Pedidos -->
                <?php if ($resultado_pedidos->num_rows > 0): ?>
                    <div class="row">
                        <?php while ($pedido = $resultado_pedidos->fetch_assoc()): ?>
                            <div class="col-lg-12 mb-4">
                                <div class="card">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h5 class="mb-0">Pedido #<?php echo $pedido['id']; ?></h5>
                                        <?php
                                        $clase_estado = '';
                                        switch ($pedido['estado']) {
                                            case 'pendiente': $clase_estado = 'badge bg-warning'; break;
                                            case 'confirmado': $clase_estado = 'badge bg-info'; break;
                                            case 'preparando': $clase_estado = 'badge bg-primary'; break;
                                            case 'en_camino': $clase_estado = 'badge bg-info'; break;
                                            case 'entregado': $clase_estado = 'badge bg-success'; break;
                                            case 'cancelado': $clase_estado = 'badge bg-danger'; break;
                                        }
                                        echo '<span class="' . $clase_estado . '">' . ucfirst(str_replace('_', ' ', $pedido['estado'])) . '</span>';
                                        ?>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-8">
                                                <p><strong>Fecha de pedido:</strong> <?php echo date('d/m/Y H:i', strtotime($pedido['fecha_pedido'])); ?></p>
                                                <p><strong>Dirección de entrega:</strong> <?php echo htmlspecialchars($pedido['direccion_entrega']); ?>, <?php echo htmlspecialchars($pedido['ciudad']); ?></p>
                                                <p><strong>Total:</strong> $<?php echo number_format($pedido['total'], 2); ?></p>
                                                
                                                <?php if (!empty($pedido['transportista'])): ?>
                                                    <p><strong>Transportista:</strong> <?php echo htmlspecialchars($pedido['transportista']); ?></p>
                                                <?php endif; ?>
                                                
                                                <?php if ($pedido['estado'] === 'en_camino' || $pedido['estado'] === 'entregado'): ?>
                                                    <p><strong>Fecha de entrega estimada:</strong> <?php echo date('d/m/Y H:i', strtotime($pedido['fecha_entrega'])); ?></p>
                                                
                                                    <!-- Tracking Visual -->
                                                    <?php if ($pedido['estado'] !== 'entregado'): ?>
                                                        <div class="tracking-container mt-3">
                                                            <div class="d-flex justify-content-between position-relative">
                                                                <?php
                                                                $estados = ['confirmado', 'preparando', 'en_camino', 'entregado'];
                                                                $estadoActual = $pedido['estado'];
                                                                $progreso = 25;
                                                                
                                                                if ($estadoActual === 'confirmado') $progreso = 25;
                                                                if ($estadoActual === 'preparando') $progreso = 50;
                                                                if ($estadoActual === 'en_camino') $progreso = 75;
                                                                if ($estadoActual === 'entregado') $progreso = 100;
                                                                
                                                                foreach ($estados as $indice => $estado):
                                                                    $activo = array_search($estadoActual, $estados) >= $indice;
                                                                ?>
                                                                    <div class="tracking-step text-center">
                                                                        <div class="tracking-dot <?php echo $activo ? 'tracking-active' : 'tracking-inactive'; ?>"></div>
                                                                        <small><?php echo ucfirst($estado); ?></small>
                                                                    </div>
                                                                <?php endforeach; ?>
                                                                
                                                                <!-- Línea de progreso -->
                                                                <div class="progress position-absolute" style="height: 2px; width: 75%; top: 7px; left: 12%; z-index: -1;">
                                                                    <div class="progress-bar bg-success" role="progressbar" style="width: <?php echo $progreso; ?>%"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    <?php endif; ?>
                                                <?php endif; ?>
                                            </div>
                                            <div class="col-md-4 text-end">
                                                <div class="d-grid gap-2">
                                                    <a href="ver.php?id=<?php echo $pedido['id']; ?>" class="btn btn-primary">
                                                        <i class="fas fa-eye me-2"></i> Ver detalles
                                                    </a>
                                                    
                                                    <?php if ($pedido['tiene_tracking'] && $pedido['estado'] === 'en_camino'): ?>
                                                        <a href="<?php echo !empty($pedido['link_tracking']) ? $pedido['link_tracking'] : 'tracking.php?id=' . $pedido['id']; ?>" class="btn btn-success" <?php echo !empty($pedido['link_tracking']) ? 'target="_blank"' : ''; ?>>
                                                            <i class="fas fa-map-marker-alt me-2"></i> Seguir pedido
                                                        </a>
                                                    <?php endif; ?>
                                                    
                                                    <?php if ($pedido['estado'] === 'pendiente'): ?>
                                                        <a href="cancelar.php?id=<?php echo $pedido['id']; ?>" class="btn btn-danger" onclick="return confirm('¿Está seguro de cancelar este pedido?');">
                                                            <i class="fas fa-times-circle me-2"></i> Cancelar pedido
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
                                <a class="page-link" href="?pagina=<?php echo $pagina_actual - 1; ?>&estado=<?php echo urlencode($filtro_estado); ?>&fecha=<?php echo urlencode($filtro_fecha); ?>" aria-label="Anterior">
                                    <span aria-hidden="true">&laquo;</span>
                                </a>
                            </li>
                            
                            <?php for ($i = 1; $i <= $total_paginas; $i++): ?>
                                <li class="page-item <?php echo $pagina_actual == $i ? 'active' : ''; ?>">
                                    <a class="page-link" href="?pagina=<?php echo $i; ?>&estado=<?php echo urlencode($filtro_estado); ?>&fecha=<?php echo urlencode($filtro_fecha); ?>">
                                        <?php echo $i; ?>
                                    </a>
                                </li>
                            <?php endfor; ?>
                            
                            <li class="page-item <?php echo $pagina_actual >= $total_paginas ? 'disabled' : ''; ?>">
                                <a class="page-link" href="?pagina=<?php echo $pagina_actual + 1; ?>&estado=<?php echo urlencode($filtro_estado); ?>&fecha=<?php echo urlencode($filtro_fecha); ?>" aria-label="Siguiente">
                                    <span aria-hidden="true">&raquo;</span>
                                </a>
                            </li>
                        </ul>
                    </nav>
                    <?php endif; ?>
                <?php else: ?>
                    <div class="alert alert-info text-center">
                        <i class="fas fa-info-circle me-2"></i> No tienes pedidos registrados.
                        <p class="mt-3">
                            <a href="nuevo.php" class="btn btn-primary">
                                <i class="fas fa-plus-circle me-2"></i> Realizar un nuevo pedido
                            </a>
                        </p>
                    </div>
                <?php endif; ?>
                
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
