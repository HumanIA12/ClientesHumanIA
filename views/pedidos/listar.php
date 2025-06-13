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
$filtro_estado = isset($_GET['estado']) ? $_GET['estado'] : '';
$filtro_cliente = isset($_GET['cliente']) ? $_GET['cliente'] : '';
$filtro_fecha = isset($_GET['fecha']) ? $_GET['fecha'] : '';

// Construir la consulta base
$where_clauses = [];
$params = [];
$types = "";

if (!empty($filtro_estado)) {
    $where_clauses[] = "p.estado = ?";
    $params[] = $filtro_estado;
    $types .= "s";
}

if (!empty($filtro_cliente)) {
    $where_clauses[] = "CONCAT(u.nombre, ' ', u.apellidos) LIKE ?";
    $params[] = "%$filtro_cliente%";
    $types .= "s";
}

if (!empty($filtro_fecha)) {
    $where_clauses[] = "DATE(p.fecha_pedido) = ?";
    $params[] = $filtro_fecha;
    $types .= "s";
}

$where_sql = '';
if (!empty($where_clauses)) {
    $where_sql = "WHERE " . implode(" AND ", $where_clauses);
}

// Consulta para obtener el total de registros con filtros
$query_count = "
    SELECT COUNT(*) as total 
    FROM pedidos p
    JOIN clientes c ON p.id_cliente = c.id
    JOIN usuarios u ON c.id_usuario = u.id
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

// Consulta para obtener los pedidos con paginación
$query_pedidos = "
    SELECT p.id, p.fecha_pedido, CONCAT(u.nombre, ' ', u.apellidos) as cliente, 
           p.total, p.estado, p.direccion_entrega, ci.nombre as ciudad, 
           p.refrigeracion_requerida, p.tiene_tracking, t.id as id_transportista,
           CONCAT(ut.nombre, ' ', ut.apellidos) as transportista
    FROM pedidos p
    JOIN clientes c ON p.id_cliente = c.id
    JOIN usuarios u ON c.id_usuario = u.id
    JOIN ciudades ci ON p.id_ciudad_entrega = ci.id
    LEFT JOIN transportistas t ON p.id_transportista = t.id
    LEFT JOIN usuarios ut ON t.id_usuario = ut.id
    $where_sql
    ORDER BY p.fecha_pedido DESC
    LIMIT ? OFFSET ?
";

$stmt_pedidos = $conexion->prepare($query_pedidos);
$params[] = $registros_por_pagina;
$params[] = $offset;
$types .= "ii";

$stmt_pedidos->bind_param($types, ...$params);
$stmt_pedidos->execute();
$resultado_pedidos = $stmt_pedidos->get_result();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Listado de Pedidos - Frutale</title>
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
                    <a class="nav-link active" href="#"><i class="fas fa-shopping-cart"></i> Pedidos</a>
                    <a class="nav-link" href="../clientes/listar.php"><i class="fas fa-users"></i> Clientes</a>
                    <a class="nav-link" href="../transportistas/listar.php"><i class="fas fa-truck"></i> Transportistas</a>
                    <a class="nav-link" href="../productos/listar.php"><i class="fas fa-box"></i> Productos</a>
                    <a class="nav-link" href="../reportes/index.php"><i class="fas fa-chart-bar"></i> Reportes</a>
                    <a class="nav-link" href="../usuarios/listar.php"><i class="fas fa-user-cog"></i> Usuarios</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Listado de Pedidos</h1>
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
                            <div class="col-md-3">
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
                            <div class="col-md-3">
                                <label for="cliente" class="form-label">Cliente</label>
                                <input type="text" class="form-control" id="cliente" name="cliente" value="<?php echo htmlspecialchars($filtro_cliente); ?>">
                            </div>
                            <div class="col-md-3">
                                <label for="fecha" class="form-label">Fecha</label>
                                <input type="date" class="form-control" id="fecha" name="fecha" value="<?php echo htmlspecialchars($filtro_fecha); ?>">
                            </div>
                            <div class="col-md-3 d-flex align-items-end">
                                <button type="submit" class="btn btn-primary me-2">Filtrar</button>
                                <a href="listar.php" class="btn btn-secondary">Limpiar</a>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Tabla de Pedidos -->
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Ciudad</th>
                                <th>Transportista</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if ($resultado_pedidos->num_rows > 0): ?>
                                <?php while ($pedido = $resultado_pedidos->fetch_assoc()): ?>
                                    <tr>
                                        <td><?php echo $pedido['id']; ?></td>
                                        <td><?php echo date('d/m/Y H:i', strtotime($pedido['fecha_pedido'])); ?></td>
                                        <td><?php echo htmlspecialchars($pedido['cliente']); ?></td>
                                        <td>$<?php echo number_format($pedido['total'], 2); ?></td>
                                        <td>
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
                                        </td>
                                        <td><?php echo htmlspecialchars($pedido['ciudad']); ?></td>
                                        <td>
                                            <?php if (!empty($pedido['transportista'])): ?>
                                                <?php echo htmlspecialchars($pedido['transportista']); ?>
                                            <?php else: ?>
                                                <span class="text-muted">No asignado</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <div class="btn-group btn-group-sm">
                                                <a href="ver.php?id=<?php echo $pedido['id']; ?>" class="btn btn-info" title="Ver detalles">
                                                    <i class="fas fa-eye"></i>
                                                </a>
                                                <a href="editar.php?id=<?php echo $pedido['id']; ?>" class="btn btn-primary" title="Editar">
                                                    <i class="fas fa-edit"></i>
                                                </a>
                                                <?php if ($pedido['estado'] !== 'entregado' && $pedido['estado'] !== 'cancelado'): ?>
                                                    <a href="cambiar_estado.php?id=<?php echo $pedido['id']; ?>" class="btn btn-success" title="Cambiar estado">
                                                        <i class="fas fa-exchange-alt"></i>
                                                    </a>
                                                <?php endif; ?>
                                                <?php if (empty($pedido['id_transportista']) && ($pedido['estado'] === 'confirmado' || $pedido['estado'] === 'preparando')): ?>
                                                    <a href="asignar_transportista.php?id=<?php echo $pedido['id']; ?>" class="btn btn-warning" title="Asignar transportista">
                                                        <i class="fas fa-truck"></i>
                                                    </a>
                                                <?php endif; ?>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endwhile; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="8" class="text-center">No hay pedidos que coincidan con los filtros</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
                
                <!-- Paginación -->
                <?php if ($total_paginas > 0): ?>
                <nav aria-label="Page navigation">
                    <ul class="pagination justify-content-center">
                        <li class="page-item <?php echo $pagina_actual <= 1 ? 'disabled' : ''; ?>">
                            <a class="page-link" href="?pagina=<?php echo $pagina_actual - 1; ?>&estado=<?php echo urlencode($filtro_estado); ?>&cliente=<?php echo urlencode($filtro_cliente); ?>&fecha=<?php echo urlencode($filtro_fecha); ?>" aria-label="Anterior">
                                <span aria-hidden="true">&laquo;</span>
                            </a>
                        </li>
                        
                        <?php for ($i = 1; $i <= $total_paginas; $i++): ?>
                            <li class="page-item <?php echo $pagina_actual == $i ? 'active' : ''; ?>">
                                <a class="page-link" href="?pagina=<?php echo $i; ?>&estado=<?php echo urlencode($filtro_estado); ?>&cliente=<?php echo urlencode($filtro_cliente); ?>&fecha=<?php echo urlencode($filtro_fecha); ?>">
                                    <?php echo $i; ?>
                                </a>
                            </li>
                        <?php endfor; ?>
                        
                        <li class="page-item <?php echo $pagina_actual >= $total_paginas ? 'disabled' : ''; ?>">
                            <a class="page-link" href="?pagina=<?php echo $pagina_actual + 1; ?>&estado=<?php echo urlencode($filtro_estado); ?>&cliente=<?php echo urlencode($filtro_cliente); ?>&fecha=<?php echo urlencode($filtro_fecha); ?>" aria-label="Siguiente">
                                <span aria-hidden="true">&raquo;</span>
                            </a>
                        </li>
                    </ul>
                </nav>
                <?php endif; ?>
                
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
</body>
</html>
