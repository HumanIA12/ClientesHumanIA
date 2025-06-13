<?php
// Iniciar sesión
session_start();

// Incluir utilidades de autenticación
require_once '../../api/auth/auth_utils.php';

// Verificar que el usuario tiene rol de administrador
requiereRol(1);

// Incluir la conexión a la base de datos
$conexion = require_once '../../config/db.php';

// Consultas para el dashboard
// 1. Total de pedidos
$query_pedidos = "SELECT COUNT(*) as total FROM pedidos";
$resultado_pedidos = $conexion->query($query_pedidos);
$total_pedidos = $resultado_pedidos->fetch_assoc()['total'];

// 2. Total de clientes
$query_clientes = "SELECT COUNT(*) as total FROM clientes";
$resultado_clientes = $conexion->query($query_clientes);
$total_clientes = $resultado_clientes->fetch_assoc()['total'];

// 3. Total de transportistas
$query_transportistas = "SELECT COUNT(*) as total FROM transportistas";
$resultado_transportistas = $conexion->query($query_transportistas);
$total_transportistas = $resultado_transportistas->fetch_assoc()['total'];

// 4. Pedidos por estado
$query_estados = "SELECT estado, COUNT(*) as total FROM pedidos GROUP BY estado";
$resultado_estados = $conexion->query($query_estados);
$pedidos_por_estado = [];
while ($row = $resultado_estados->fetch_assoc()) {
    $pedidos_por_estado[$row['estado']] = $row['total'];
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Administrador - Frutale</title>
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
                    <a class="nav-link active" href="#"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a class="nav-link" href="../pedidos/listar.php"><i class="fas fa-shopping-cart"></i> Pedidos</a>
                    <a class="nav-link" href="../../index.php?ruta=clientes/listar"><i class="fas fa-users"></i> Clientes</a>
                    <a class="nav-link" href="../transportistas/listar.php"><i class="fas fa-truck"></i> Transportistas</a>
                    <a class="nav-link" href="../productos/listar.php"><i class="fas fa-box"></i> Productos</a>
                    <a class="nav-link" href="../reportes/index.php"><i class="fas fa-chart-bar"></i> Reportes</a>
                    <a class="nav-link" href="../usuarios/listar.php"><i class="fas fa-user-cog"></i> Usuarios</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="welcome-banner">
                    <h1 class="h2">Bienvenido, <?php echo htmlspecialchars($_SESSION['usuario_nombre']); ?></h1>
                    <p class="text-muted">Panel de administración de Frutale</p>
                </div>
                
                <!-- Stats Cards -->
                <div class="row">
                    <div class="col-md-3">
                        <div class="dashboard-card bg-primary text-white">
                            <div class="card-icon">
                                <i class="fas fa-shopping-cart"></i>
                            </div>
                            <div class="card-title">Total Pedidos</div>
                            <div class="card-value"><?php echo $total_pedidos; ?></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="dashboard-card bg-success text-white">
                            <div class="card-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="card-title">Clientes</div>
                            <div class="card-value"><?php echo $total_clientes; ?></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="dashboard-card bg-warning text-white">
                            <div class="card-icon">
                                <i class="fas fa-truck"></i>
                            </div>
                            <div class="card-title">Transportistas</div>
                            <div class="card-value"><?php echo $total_transportistas; ?></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="dashboard-card bg-info text-white">
                            <div class="card-icon">
                                <i class="fas fa-thermometer-half"></i>
                            </div>
                            <div class="card-title">Requieren Refrigeración</div>
                            <div class="card-value"><?php 
                                $query_refrigeracion = "SELECT COUNT(*) as total FROM pedidos WHERE refrigeracion_requerida = TRUE";
                                $result_refrigeracion = $conexion->query($query_refrigeracion);
                                echo $result_refrigeracion->fetch_assoc()['total']; 
                            ?></div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Orders -->
                <div class="row mt-4">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Pedidos Recientes</h5>
                                <a href="../pedidos/listar.php" class="btn btn-sm btn-verde">Ver todos</a>
                            </div>
                            <div class="card-body">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Cliente</th>
                                            <th>Fecha</th>
                                            <th>Total</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php
                                        $query_recientes = "
                                            SELECT p.id, CONCAT(u.nombre, ' ', u.apellidos) as cliente, 
                                                   p.fecha_pedido, p.total, p.estado
                                            FROM pedidos p
                                            JOIN clientes c ON p.id_cliente = c.id
                                            JOIN usuarios u ON c.id_usuario = u.id
                                            ORDER BY p.fecha_pedido DESC
                                            LIMIT 5
                                        ";
                                        $resultado_recientes = $conexion->query($query_recientes);
                                        
                                        if ($resultado_recientes->num_rows > 0) {
                                            while ($pedido = $resultado_recientes->fetch_assoc()) {
                                                echo '<tr>';
                                                echo '<td>' . $pedido['id'] . '</td>';
                                                echo '<td>' . htmlspecialchars($pedido['cliente']) . '</td>';
                                                echo '<td>' . date('d/m/Y H:i', strtotime($pedido['fecha_pedido'])) . '</td>';
                                                echo '<td>S/. ' . number_format($pedido['total'], 2) . '</td>';
                                                
                                                // Mostrar estado con color
                                                $clase_estado = '';
                                                switch ($pedido['estado']) {
                                                    case 'pendiente': $clase_estado = 'badge bg-warning'; break;
                                                    case 'confirmado': $clase_estado = 'badge bg-info'; break;
                                                    case 'preparando': $clase_estado = 'badge bg-primary'; break;
                                                    case 'en_camino': $clase_estado = 'badge bg-info'; break;
                                                    case 'entregado': $clase_estado = 'badge bg-success'; break;
                                                    case 'cancelado': $clase_estado = 'badge bg-danger'; break;
                                                }
                                                
                                                echo '<td><span class="' . $clase_estado . '">' . ucfirst(str_replace('_', ' ', $pedido['estado'])) . '</span></td>';
                                                echo '</tr>';
                                            }
                                        } else {
                                            echo '<tr><td colspan="5" class="text-center">No hay pedidos recientes</td></tr>';
                                        }
                                        ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Orders by Status -->
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Pedidos por Estado</h5>
                            </div>
                            <div class="card-body">
                                <ul class="list-group">
                                    <?php
                                    $estados = [
                                        'pendiente' => ['label' => 'Pendientes', 'icon' => 'clock', 'color' => 'warning'],
                                        'confirmado' => ['label' => 'Confirmados', 'icon' => 'check-circle', 'color' => 'info'],
                                        'preparando' => ['label' => 'En preparación', 'icon' => 'box', 'color' => 'primary'],
                                        'en_camino' => ['label' => 'En camino', 'icon' => 'truck', 'color' => 'info'],
                                        'entregado' => ['label' => 'Entregados', 'icon' => 'check-double', 'color' => 'success'],
                                        'cancelado' => ['label' => 'Cancelados', 'icon' => 'times-circle', 'color' => 'danger']
                                    ];
                                    
                                    foreach ($estados as $estado_key => $estado_info) {
                                        $cantidad = isset($pedidos_por_estado[$estado_key]) ? $pedidos_por_estado[$estado_key] : 0;
                                        echo '<li class="list-group-item d-flex justify-content-between align-items-center">';
                                        echo '<span><i class="fas fa-' . $estado_info['icon'] . ' text-' . $estado_info['color'] . ' me-2"></i> ' . $estado_info['label'] . '</span>';
                                        echo '<span class="badge bg-' . $estado_info['color'] . ' rounded-pill">' . $cantidad . '</span>';
                                        echo '</li>';
                                    }
                                    ?>
                                </ul>
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
