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
$filtro_estado = isset($_GET['estado']) ? $_GET['estado'] : '';
$filtro_stock = isset($_GET['stock']) ? $_GET['stock'] : '';

// Construir la consulta base
$where_clauses = [];
$params = [];
$types = "";

if (!empty($filtro_nombre)) {
    $where_clauses[] = "nombre LIKE ?";
    $params[] = "%$filtro_nombre%";
    $types .= "s";
}

if (!empty($filtro_estado)) {
    $where_clauses[] = "estado = ?";
    $params[] = $filtro_estado;
    $types .= "s";
}

if (!empty($filtro_stock)) {
    switch ($filtro_stock) {
        case 'sin_stock':
            $where_clauses[] = "stock = 0";
            break;
        case 'bajo_stock':
            $where_clauses[] = "stock > 0 AND stock <= 10";
            break;
        case 'stock_normal':
            $where_clauses[] = "stock > 10";
            break;
    }
}

$where_sql = '';
if (!empty($where_clauses)) {
    $where_sql = "WHERE " . implode(" AND ", $where_clauses);
}

// Consulta para obtener el total de registros con filtros
$query_count = "
    SELECT COUNT(*) as total 
    FROM productos
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

// Consulta para obtener los productos con paginación
$query_productos = "
    SELECT id, nombre, descripcion, precio, stock, estado, fecha_agregado
    FROM productos
    $where_sql
    ORDER BY nombre
    LIMIT ? OFFSET ?
";

$params[] = $registros_por_pagina;
$params[] = $offset;
$types .= "ii";

$stmt_productos = $conexion->prepare($query_productos);
$stmt_productos->bind_param($types, ...$params);
$stmt_productos->execute();
$resultado_productos = $stmt_productos->get_result();

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
    <title>Gestión de Productos - Frutale</title>
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
                    <a class="nav-link active" href="#"><i class="fas fa-box"></i> Productos</a>
                    <a class="nav-link" href="../reportes/index.php"><i class="fas fa-chart-bar"></i> Reportes</a>
                    <a class="nav-link" href="../usuarios/listar.php"><i class="fas fa-user-cog"></i> Usuarios</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Gestión de Productos</h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <a href="nuevo.php" class="btn btn-sm btn-primary">
                            <i class="fas fa-plus-circle"></i> Nuevo Producto
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
                                <label for="nombre" class="form-label">Nombre del producto</label>
                                <input type="text" class="form-control" id="nombre" name="nombre" value="<?php echo htmlspecialchars($filtro_nombre); ?>">
                            </div>
                            <div class="col-md-3">
                                <label for="estado" class="form-label">Estado</label>
                                <select class="form-select" id="estado" name="estado">
                                    <option value="">Todos</option>
                                    <option value="disponible" <?php echo $filtro_estado === 'disponible' ? 'selected' : ''; ?>>Disponible</option>
                                    <option value="agotado" <?php echo $filtro_estado === 'agotado' ? 'selected' : ''; ?>>Agotado</option>
                                    <option value="descontinuado" <?php echo $filtro_estado === 'descontinuado' ? 'selected' : ''; ?>>Descontinuado</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="stock" class="form-label">Stock</label>
                                <select class="form-select" id="stock" name="stock">
                                    <option value="">Todos</option>
                                    <option value="sin_stock" <?php echo $filtro_stock === 'sin_stock' ? 'selected' : ''; ?>>Sin stock</option>
                                    <option value="bajo_stock" <?php echo $filtro_stock === 'bajo_stock' ? 'selected' : ''; ?>>Bajo stock (1-10)</option>
                                    <option value="stock_normal" <?php echo $filtro_stock === 'stock_normal' ? 'selected' : ''; ?>>Stock normal (>10)</option>
                                </select>
                            </div>
                            <div class="col-md-2 d-flex align-items-end">
                                <button type="submit" class="btn btn-verde me-2">Filtrar</button>
                                <a href="listar.php" class="btn btn-naranja">Limpiar</a>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Tabla de Productos -->
                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Producto</th>
                                        <th>Descripción</th>
                                        <th>Precio</th>
                                        <th>Stock</th>
                                        <th>Estado</th>
                                        <th>Fecha agregado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if ($resultado_productos->num_rows > 0): ?>
                                        <?php while ($producto = $resultado_productos->fetch_assoc()): ?>
                                            <tr>
                                                <td><?php echo $producto['id']; ?></td>
                                                <td><?php echo htmlspecialchars($producto['nombre']); ?></td>
                                                <td>
                                                    <?php 
                                                    $descripcion = $producto['descripcion'];
                                                    echo htmlspecialchars(strlen($descripcion) > 50 ? substr($descripcion, 0, 50) . '...' : $descripcion); 
                                                    ?>
                                                </td>
                                                <td>$<?php echo number_format($producto['precio'], 2); ?></td>
                                                <td>
                                                    <?php 
                                                    if ($producto['stock'] == 0) {
                                                        echo '<span class="badge bg-danger">Sin stock</span>';
                                                    } elseif ($producto['stock'] <= 10) {
                                                        echo '<span class="badge bg-warning">' . $producto['stock'] . '</span>';
                                                    } else {
                                                        echo '<span class="badge bg-success">' . $producto['stock'] . '</span>';
                                                    }
                                                    ?>
                                                </td>
                                                <td>
                                                    <?php 
                                                    switch ($producto['estado']) {
                                                        case 'disponible':
                                                            echo '<span class="badge bg-success">Disponible</span>';
                                                            break;
                                                        case 'agotado':
                                                            echo '<span class="badge bg-warning">Agotado</span>';
                                                            break;
                                                        case 'descontinuado':
                                                            echo '<span class="badge bg-danger">Descontinuado</span>';
                                                            break;
                                                    }
                                                    ?>
                                                </td>
                                                <td><?php echo date('d/m/Y', strtotime($producto['fecha_agregado'])); ?></td>
                                                <td>
                                                    <div class="btn-group btn-group-sm">
                                                        <a href="ver.php?id=<?php echo $producto['id']; ?>" class="btn btn-ver" title="Ver detalles">
                                                            <i class="fas fa-eye"></i>
                                                        </a>
                                                        <a href="editar.php?id=<?php echo $producto['id']; ?>" class="btn btn-editar" title="Editar">
                                                            <i class="fas fa-edit"></i>
                                                        </a>
                                                        <?php if ($producto['estado'] !== 'descontinuado'): ?>
                                                            <a href="cambiar_estado.php?id=<?php echo $producto['id']; ?>&estado=descontinuado" class="btn btn-danger" title="Descontinuar" onclick="return confirm('¿Está seguro de descontinuar este producto?');">
                                                                <i class="fas fa-ban"></i>
                                                            </a>
                                                        <?php endif; ?>
                                                        <a href="ajustar_stock.php?id=<?php echo $producto['id']; ?>" class="btn btn-secondary" title="Ajustar stock">
                                                            <i class="fas fa-cubes"></i>
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        <?php endwhile; ?>
                                    <?php else: ?>
                                        <tr>
                                            <td colspan="8" class="text-center">No se encontraron productos</td>
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
                                    <a class="page-link" href="?pagina=<?php echo $pagina_actual - 1; ?>&nombre=<?php echo urlencode($filtro_nombre); ?>&estado=<?php echo urlencode($filtro_estado); ?>&stock=<?php echo urlencode($filtro_stock); ?>" aria-label="Anterior">
                                        <span aria-hidden="true">&laquo;</span>
                                    </a>
                                </li>
                                
                                <?php for ($i = 1; $i <= $total_paginas; $i++): ?>
                                    <li class="page-item <?php echo $pagina_actual == $i ? 'active' : ''; ?>">
                                        <a class="page-link" href="?pagina=<?php echo $i; ?>&nombre=<?php echo urlencode($filtro_nombre); ?>&estado=<?php echo urlencode($filtro_estado); ?>&stock=<?php echo urlencode($filtro_stock); ?>">
                                            <?php echo $i; ?>
                                        </a>
                                    </li>
                                <?php endfor; ?>
                                
                                <li class="page-item <?php echo $pagina_actual >= $total_paginas ? 'disabled' : ''; ?>">
                                    <a class="page-link" href="?pagina=<?php echo $pagina_actual + 1; ?>&nombre=<?php echo urlencode($filtro_nombre); ?>&estado=<?php echo urlencode($filtro_estado); ?>&stock=<?php echo urlencode($filtro_stock); ?>" aria-label="Siguiente">
                                        <span aria-hidden="true">&raquo;</span>
                                    </a>
                                </li>
                            </ul>
                        </nav>
                        <?php endif; ?>
                    </div>
                </div>
                
                <!-- Resumen de Inventario -->
                <div class="card mt-4">
                    <div class="card-header">
                        <h5 class="mb-0">Resumen de Inventario</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <?php
                            // Consulta para obtener el resumen de productos
                            $query_resumen = "
                                SELECT COUNT(*) as total_productos,
                                       SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as sin_stock,
                                       SUM(CASE WHEN stock > 0 AND stock <= 10 THEN 1 ELSE 0 END) as bajo_stock,
                                       SUM(CASE WHEN stock > 10 THEN 1 ELSE 0 END) as stock_normal,
                                       SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles,
                                       SUM(CASE WHEN estado = 'agotado' THEN 1 ELSE 0 END) as agotados,
                                       SUM(CASE WHEN estado = 'descontinuado' THEN 1 ELSE 0 END) as descontinuados
                                FROM productos
                            ";
                            $resultado_resumen = $conexion->query($query_resumen);
                            $resumen = $resultado_resumen->fetch_assoc();
                            ?>
                            
                            <div class="col-md-4">
                                <h6>Total de productos: <?php echo $resumen['total_productos']; ?></h6>
                                <div class="progress mb-3">
                                    <div class="progress-bar bg-success" style="width: <?php echo $resumen['disponibles'] / $resumen['total_productos'] * 100; ?>%" title="Disponibles"></div>
                                    <div class="progress-bar bg-warning" style="width: <?php echo $resumen['agotados'] / $resumen['total_productos'] * 100; ?>%" title="Agotados"></div>
                                    <div class="progress-bar bg-danger" style="width: <?php echo $resumen['descontinuados'] / $resumen['total_productos'] * 100; ?>%" title="Descontinuados"></div>
                                </div>
                                <small>
                                    <span class="badge bg-success">Disponibles: <?php echo $resumen['disponibles']; ?></span>
                                    <span class="badge bg-warning">Agotados: <?php echo $resumen['agotados']; ?></span>
                                    <span class="badge bg-danger">Descontinuados: <?php echo $resumen['descontinuados']; ?></span>
                                </small>
                            </div>
                            
                            <div class="col-md-4">
                                <h6>Niveles de stock:</h6>
                                <div class="progress mb-3">
                                    <div class="progress-bar bg-success" style="width: <?php echo $resumen['stock_normal'] / $resumen['total_productos'] * 100; ?>%" title="Stock normal"></div>
                                    <div class="progress-bar bg-warning" style="width: <?php echo $resumen['bajo_stock'] / $resumen['total_productos'] * 100; ?>%" title="Bajo stock"></div>
                                    <div class="progress-bar bg-danger" style="width: <?php echo $resumen['sin_stock'] / $resumen['total_productos'] * 100; ?>%" title="Sin stock"></div>
                                </div>
                                <small>
                                    <span class="badge bg-success">Stock normal: <?php echo $resumen['stock_normal']; ?></span>
                                    <span class="badge bg-warning">Bajo stock: <?php echo $resumen['bajo_stock']; ?></span>
                                    <span class="badge bg-danger">Sin stock: <?php echo $resumen['sin_stock']; ?></span>
                                </small>
                            </div>
                            
                            <div class="col-md-4 text-end">
                                <a href="exportar.php" class="btn btn-outline-primary btn-sm">
                                    <i class="fas fa-file-export me-2"></i> Exportar inventario
                                </a>
                                <a href="generar_reporte.php" class="btn btn-outline-secondary btn-sm mt-2">
                                    <i class="fas fa-chart-line me-2"></i> Generar reporte
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
