<?php
// Iniciar sesión
session_start();

// Incluir utilidades de autenticación
require_once '../../api/auth/auth_utils.php';

// Verificar que el usuario tiene rol de administrador
requiereRol(1);

// Incluir la conexión a la base de datos
$conexion = require_once '../../config/db.php';

// Obtener fechas para filtrado
$fecha_inicio = isset($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : date('Y-m-01');
$fecha_fin = isset($_GET['fecha_fin']) ? $_GET['fecha_fin'] : date('Y-m-d');
$tipo_reporte = isset($_GET['tipo_reporte']) ? $_GET['tipo_reporte'] : 'ventas';

// Estadísticas generales
$query_estadisticas = "
    SELECT 
        COUNT(DISTINCT p.id) as total_pedidos,
        SUM(dp.cantidad * dp.precio_unitario) as total_ventas,
        COUNT(DISTINCT p.id_cliente) as total_clientes_compraron,
        AVG(p.total) as promedio_venta
    FROM pedidos p
    JOIN detalles_pedido dp ON p.id = dp.id_pedido
    WHERE p.fecha_pedido BETWEEN ? AND ?
";

$stmt_estadisticas = $conexion->prepare($query_estadisticas);
$stmt_estadisticas->bind_param("ss", $fecha_inicio, $fecha_fin);
$stmt_estadisticas->execute();
$resultado_estadisticas = $stmt_estadisticas->get_result();
$estadisticas = $resultado_estadisticas->fetch_assoc();

// Productos más vendidos
$query_productos = "
    SELECT 
        pr.id,
        pr.nombre,
        SUM(dp.cantidad) as cantidad_vendida,
        SUM(dp.cantidad * dp.precio_unitario) as total_vendido
    FROM detalles_pedido dp
    JOIN productos pr ON dp.id_producto = pr.id
    JOIN pedidos p ON dp.id_pedido = p.id
    WHERE p.fecha_pedido BETWEEN ? AND ?
    GROUP BY pr.id
    ORDER BY cantidad_vendida DESC
    LIMIT 10
";

$stmt_productos = $conexion->prepare($query_productos);
$stmt_productos->bind_param("ss", $fecha_inicio, $fecha_fin);
$stmt_productos->execute();
$resultado_productos = $stmt_productos->get_result();

// Ventas por día
$query_ventas_dia = "
    SELECT 
        DATE(p.fecha_pedido) as fecha,
        COUNT(p.id) as total_pedidos,
        SUM(p.total) as total_ventas
    FROM pedidos p
    WHERE p.fecha_pedido BETWEEN ? AND ?
    GROUP BY DATE(p.fecha_pedido)
    ORDER BY fecha
";

$stmt_ventas_dia = $conexion->prepare($query_ventas_dia);
$stmt_ventas_dia->bind_param("ss", $fecha_inicio, $fecha_fin);
$stmt_ventas_dia->execute();
$resultado_ventas_dia = $stmt_ventas_dia->get_result();

// Clientes con más compras
$query_clientes = "
    SELECT 
        c.id,
        CONCAT(u.nombre, ' ', u.apellidos) as nombre_cliente,
        COUNT(p.id) as total_pedidos,
        SUM(p.total) as total_comprado
    FROM pedidos p
    JOIN clientes c ON p.id_cliente = c.id
    JOIN usuarios u ON c.id_usuario = u.id
    WHERE p.fecha_pedido BETWEEN ? AND ?
    GROUP BY c.id
    ORDER BY total_comprado DESC
    LIMIT 10
";

$stmt_clientes = $conexion->prepare($query_clientes);
$stmt_clientes->bind_param("ss", $fecha_inicio, $fecha_fin);
$stmt_clientes->execute();
$resultado_clientes = $stmt_clientes->get_result();

// Transportistas con más pedidos entregados
$query_transportistas = "
    SELECT 
        t.id,
        CONCAT(u.nombre, ' ', u.apellidos) as nombre_transportista,
        COUNT(p.id) as total_pedidos,
        COUNT(CASE WHEN p.estado = 'entregado' THEN 1 END) as pedidos_entregados
    FROM pedidos p
    JOIN transportistas t ON p.id_transportista = t.id
    JOIN usuarios u ON t.id_usuario = u.id
    WHERE p.fecha_pedido BETWEEN ? AND ?
    GROUP BY t.id
    ORDER BY pedidos_entregados DESC
    LIMIT 10
";

$stmt_transportistas = $conexion->prepare($query_transportistas);
$stmt_transportistas->bind_param("ss", $fecha_inicio, $fecha_fin);
$stmt_transportistas->execute();
$resultado_transportistas = $stmt_transportistas->get_result();

// Ciudades con más pedidos
$query_ciudades = "
    SELECT 
        ci.id,
        ci.nombre as ciudad,
        COUNT(p.id) as total_pedidos,
        SUM(p.total) as total_ventas
    FROM pedidos p
    JOIN clientes c ON p.id_cliente = c.id
    JOIN ciudades ci ON c.id_ciudad = ci.id
    WHERE p.fecha_pedido BETWEEN ? AND ?
    GROUP BY ci.id
    ORDER BY total_pedidos DESC
    LIMIT 10
";

$stmt_ciudades = $conexion->prepare($query_ciudades);
$stmt_ciudades->bind_param("ss", $fecha_inicio, $fecha_fin);
$stmt_ciudades->execute();
$resultado_ciudades = $stmt_ciudades->get_result();

// Preparar datos para gráficos
$fechas = [];
$ventas = [];
while ($venta = $resultado_ventas_dia->fetch_assoc()) {
    $fechas[] = date('d/m/Y', strtotime($venta['fecha']));
    $ventas[] = $venta['total_ventas'];
}
$fechas_json = json_encode($fechas);
$ventas_json = json_encode($ventas);

// Productos para gráfico
$nombres_productos = [];
$cantidades_productos = [];
$resultado_productos->data_seek(0);
while ($producto = $resultado_productos->fetch_assoc()) {
    $nombres_productos[] = $producto['nombre'];
    $cantidades_productos[] = $producto['cantidad_vendida'];
}
$nombres_productos_json = json_encode($nombres_productos);
$cantidades_productos_json = json_encode($cantidades_productos);

// Ciudades para gráfico
$nombres_ciudades = [];
$ventas_ciudades = [];
while ($ciudad = $resultado_ciudades->fetch_assoc()) {
    $nombres_ciudades[] = $ciudad['ciudad'];
    $ventas_ciudades[] = $ciudad['total_ventas'];
}
$nombres_ciudades_json = json_encode($nombres_ciudades);
$ventas_ciudades_json = json_encode($ventas_ciudades);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reportes - Frutale</title>
    <link rel="stylesheet" href="../../assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="../../assets/css/estilos.css">
    <link rel="stylesheet" href="../../assets/css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                    <a class="nav-link active" href="#"><i class="fas fa-chart-bar"></i> Reportes</a>
                    <a class="nav-link" href="../usuarios/listar.php"><i class="fas fa-user-cog"></i> Usuarios</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Reportes y Estadísticas</h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <div class="btn-group me-2">
                            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="exportarPDF()">
                                <i class="fas fa-file-pdf"></i> Exportar PDF
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="exportarExcel()">
                                <i class="fas fa-file-excel"></i> Exportar Excel
                            </button>
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
                            <div class="col-md-3">
                                <label for="fecha_inicio" class="form-label">Fecha inicio</label>
                                <input type="date" class="form-control" id="fecha_inicio" name="fecha_inicio" value="<?php echo $fecha_inicio; ?>">
                            </div>
                            <div class="col-md-3">
                                <label for="fecha_fin" class="form-label">Fecha fin</label>
                                <input type="date" class="form-control" id="fecha_fin" name="fecha_fin" value="<?php echo $fecha_fin; ?>">
                            </div>
                            <div class="col-md-3">
                                <label for="tipo_reporte" class="form-label">Tipo de reporte</label>
                                <select class="form-select" id="tipo_reporte" name="tipo_reporte">
                                    <option value="ventas" <?php echo $tipo_reporte === 'ventas' ? 'selected' : ''; ?>>Ventas</option>
                                    <option value="productos" <?php echo $tipo_reporte === 'productos' ? 'selected' : ''; ?>>Productos</option>
                                    <option value="clientes" <?php echo $tipo_reporte === 'clientes' ? 'selected' : ''; ?>>Clientes</option>
                                    <option value="transportistas" <?php echo $tipo_reporte === 'transportistas' ? 'selected' : ''; ?>>Transportistas</option>
                                </select>
                            </div>
                            <div class="col-md-3 d-flex align-items-end">
                                <button type="submit" class="btn btn-primary">Generar reporte</button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Resumen Estadístico -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card h-100 shadow-sm border-primary">
                            <div class="card-body text-center">
                                <h5 class="card-title">Total de pedidos</h5>
                                <h2 class="text-primary"><?php echo number_format($estadisticas['total_pedidos']); ?></h2>
                                <p class="card-text text-muted">en el período seleccionado</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card h-100 shadow-sm border-success">
                            <div class="card-body text-center">
                                <h5 class="card-title">Ventas totales</h5>
                                <h2 class="text-success">$<?php echo number_format($estadisticas['total_ventas'], 2); ?></h2>
                                <p class="card-text text-muted">en el período seleccionado</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card h-100 shadow-sm border-info">
                            <div class="card-body text-center">
                                <h5 class="card-title">Clientes activos</h5>
                                <h2 class="text-info"><?php echo number_format($estadisticas['total_clientes_compraron']); ?></h2>
                                <p class="card-text text-muted">que realizaron compras</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card h-100 shadow-sm border-warning">
                            <div class="card-body text-center">
                                <h5 class="card-title">Venta promedio</h5>
                                <h2 class="text-warning">$<?php echo number_format($estadisticas['promedio_venta'], 2); ?></h2>
                                <p class="card-text text-muted">por pedido</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Gráfico Principal -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Ventas diarias</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="ventasChart"></canvas>
                    </div>
                </div>
                
                <div class="row mb-4">
                    <!-- Productos más vendidos -->
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="mb-0">Productos más vendidos</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="productosChart"></canvas>
                                <div class="table-responsive mt-3">
                                    <table class="table table-sm table-striped">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Cantidad</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php $resultado_productos->data_seek(0); ?>
                                            <?php while ($producto = $resultado_productos->fetch_assoc()): ?>
                                                <tr>
                                                    <td><?php echo htmlspecialchars($producto['nombre']); ?></td>
                                                    <td><?php echo number_format($producto['cantidad_vendida']); ?></td>
                                                    <td>$<?php echo number_format($producto['total_vendido'], 2); ?></td>
                                                </tr>
                                            <?php endwhile; ?>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ciudades con más pedidos -->
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="mb-0">Ventas por ciudad</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="ciudadesChart"></canvas>
                                <div class="table-responsive mt-3">
                                    <table class="table table-sm table-striped">
                                        <thead>
                                            <tr>
                                                <th>Ciudad</th>
                                                <th>Pedidos</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php $resultado_ciudades->data_seek(0); ?>
                                            <?php while ($ciudad = $resultado_ciudades->fetch_assoc()): ?>
                                                <tr>
                                                    <td><?php echo htmlspecialchars($ciudad['ciudad']); ?></td>
                                                    <td><?php echo number_format($ciudad['total_pedidos']); ?></td>
                                                    <td>$<?php echo number_format($ciudad['total_ventas'], 2); ?></td>
                                                </tr>
                                            <?php endwhile; ?>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mb-4">
                    <!-- Clientes con más compras -->
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="mb-0">Clientes con más compras</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Cliente</th>
                                                <th>Pedidos</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php while ($cliente = $resultado_clientes->fetch_assoc()): ?>
                                                <tr>
                                                    <td><?php echo htmlspecialchars($cliente['nombre_cliente']); ?></td>
                                                    <td><?php echo number_format($cliente['total_pedidos']); ?></td>
                                                    <td>$<?php echo number_format($cliente['total_comprado'], 2); ?></td>
                                                </tr>
                                            <?php endwhile; ?>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Transportistas con más pedidos -->
                    <div class="col-md-6">
                        <div class="card h-100">
                            <div class="card-header">
                                <h5 class="mb-0">Transportistas con más entregas</h5>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Transportista</th>
                                                <th>Asignados</th>
                                                <th>Entregados</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php while ($transportista = $resultado_transportistas->fetch_assoc()): ?>
                                                <tr>
                                                    <td><?php echo htmlspecialchars($transportista['nombre_transportista']); ?></td>
                                                    <td><?php echo number_format($transportista['total_pedidos']); ?></td>
                                                    <td>
                                                        <?php echo number_format($transportista['pedidos_entregados']); ?>
                                                        (<?php echo round(($transportista['pedidos_entregados'] / $transportista['total_pedidos']) * 100); ?>%)
                                                    </td>
                                                </tr>
                                            <?php endwhile; ?>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Informes Adicionales -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Informes disponibles</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <a href="reporte_ventas.php" class="btn btn-outline-primary w-100">
                                    <i class="fas fa-chart-line mb-2 d-block fs-3"></i>
                                    Reporte detallado de ventas
                                </a>
                            </div>
                            <div class="col-md-3 mb-3">
                                <a href="reporte_productos.php" class="btn btn-outline-success w-100">
                                    <i class="fas fa-box mb-2 d-block fs-3"></i>
                                    Análisis de productos
                                </a>
                            </div>
                            <div class="col-md-3 mb-3">
                                <a href="reporte_clientes.php" class="btn btn-outline-info w-100">
                                    <i class="fas fa-users mb-2 d-block fs-3"></i>
                                    Comportamiento de clientes
                                </a>
                            </div>
                            <div class="col-md-3 mb-3">
                                <a href="reporte_rutas.php" class="btn btn-outline-warning w-100">
                                    <i class="fas fa-route mb-2 d-block fs-3"></i>
                                    Eficiencia de rutas
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
    <script>
        // Gráfico de ventas
        const ctxVentas = document.getElementById('ventasChart').getContext('2d');
        const ventasChart = new Chart(ctxVentas, {
            type: 'line',
            data: {
                labels: <?php echo $fechas_json; ?>,
                datasets: [{
                    label: 'Ventas diarias',
                    data: <?php echo $ventas_json; ?>,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Ventas diarias en el período seleccionado'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
        // Gráfico de productos
        const ctxProductos = document.getElementById('productosChart').getContext('2d');
        const productosChart = new Chart(ctxProductos, {
            type: 'bar',
            data: {
                labels: <?php echo $nombres_productos_json; ?>,
                datasets: [{
                    label: 'Cantidad vendida',
                    data: <?php echo $cantidades_productos_json; ?>,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Productos más vendidos'
                    }
                }
            }
        });
        
        // Gráfico de ciudades
        const ctxCiudades = document.getElementById('ciudadesChart').getContext('2d');
        const ciudadesChart = new Chart(ctxCiudades, {
            type: 'pie',
            data: {
                labels: <?php echo $nombres_ciudades_json; ?>,
                datasets: [{
                    data: <?php echo $ventas_ciudades_json; ?>,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    title: {
                        display: true,
                        text: 'Ventas por ciudad'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                let value = context.parsed || 0;
                                return label + ': $' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
        // Funciones para exportar
        function exportarPDF() {
            window.location.href = 'exportar_pdf.php?fecha_inicio=' + document.getElementById('fecha_inicio').value + 
                                 '&fecha_fin=' + document.getElementById('fecha_fin').value + 
                                 '&tipo_reporte=' + document.getElementById('tipo_reporte').value;
        }
        
        function exportarExcel() {
            window.location.href = 'exportar_excel.php?fecha_inicio=' + document.getElementById('fecha_inicio').value + 
                                 '&fecha_fin=' + document.getElementById('fecha_fin').value + 
                                 '&tipo_reporte=' + document.getElementById('tipo_reporte').value;
        }
    </script>
</body>
</html>
