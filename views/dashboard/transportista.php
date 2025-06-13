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
$query_transportista = "SELECT t.*, tv.nombre as tipo_vehiculo, tv.tiene_refrigeracion, et.nombre as empresa 
                        FROM transportistas t 
                        JOIN tipos_vehiculo tv ON t.id_tipo_vehiculo = tv.id
                        JOIN empresas_transporte et ON t.id_empresa = et.id
                        WHERE t.id_usuario = ?";
$stmt = $conexion->prepare($query_transportista);
$stmt->bind_param("i", $_SESSION['usuario_id']);
$stmt->execute();
$result = $stmt->get_result();
$transportista = $result->fetch_assoc();
$id_transportista = $transportista['id'];

// Consultas para el dashboard
// 1. Total de pedidos asignados al transportista
$query_pedidos = "SELECT COUNT(*) as total FROM pedidos WHERE id_transportista = ?";
$stmt = $conexion->prepare($query_pedidos);
$stmt->bind_param("i", $id_transportista);
$stmt->execute();
$resultado_pedidos = $stmt->get_result();
$total_pedidos = $resultado_pedidos->fetch_assoc()['total'];

// 2. Pedidos en camino
$query_en_camino = "SELECT COUNT(*) as total FROM pedidos WHERE id_transportista = ? AND estado = 'en_camino'";
$stmt = $conexion->prepare($query_en_camino);
$stmt->bind_param("i", $id_transportista);
$stmt->execute();
$resultado_en_camino = $stmt->get_result();
$total_en_camino = $resultado_en_camino->fetch_assoc()['total'];

// 3. Pedidos entregados
$query_entregados = "SELECT COUNT(*) as total FROM pedidos WHERE id_transportista = ? AND estado = 'entregado'";
$stmt = $conexion->prepare($query_entregados);
$stmt->bind_param("i", $id_transportista);
$stmt->execute();
$resultado_entregados = $stmt->get_result();
$total_entregados = $resultado_entregados->fetch_assoc()['total'];

// 4. Rutas planificadas
$query_rutas = "SELECT COUNT(*) as total FROM rutas_entrega WHERE id_transportista = ? AND estado = 'planificada'";
$stmt = $conexion->prepare($query_rutas);
$stmt->bind_param("i", $id_transportista);
$stmt->execute();
$resultado_rutas = $stmt->get_result();
$total_rutas = $resultado_rutas->fetch_assoc()['total'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Transportista - Frutale</title>
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
                    <a class="nav-link active" href="#"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a class="nav-link" href="../pedidos/asignados.php"><i class="fas fa-box"></i> Pedidos Asignados</a>
                    <a class="nav-link" href="../rutas/mis_rutas.php"><i class="fas fa-route"></i> Mis Rutas</a>
                    <a class="nav-link" href="../rutas/tracking.php"><i class="fas fa-map-marked-alt"></i> Activar Tracking</a>
                    <a class="nav-link" href="../perfil/editar.php"><i class="fas fa-user-edit"></i> Mi Perfil</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="welcome-banner">
                    <h1 class="h2">Bienvenido, <?php echo htmlspecialchars($_SESSION['usuario_nombre']); ?></h1>
                    <p class="text-muted">Panel de transportista de Frutale</p>
                </div>
                
                <!-- Vehicle Status -->
                <div class="vehicle-status bg-<?php echo $transportista['tiene_refrigeracion'] ? 'info' : 'secondary'; ?> d-flex align-items-center">
                    <div class="vehicle-icon">
                        <i class="fas fa-truck"></i>
                    </div>
                    <div>
                        <h4 class="mb-1"><?php echo htmlspecialchars($transportista['tipo_vehiculo']); ?></h4>
                        <p class="mb-0">
                            <i class="fas fa-<?php echo $transportista['tiene_refrigeracion'] ? 'snowflake' : 'times-circle'; ?> me-2"></i>
                            <?php echo $transportista['tiene_refrigeracion'] ? 'Con refrigeración' : 'Sin refrigeración'; ?> |
                            <i class="fas fa-weight me-2"></i>
                            Capacidad: <?php echo number_format($transportista['capacidad_carga'], 2); ?> kg |
                            <i class="fas fa-building me-2"></i>
                            <?php echo htmlspecialchars($transportista['empresa']); ?>
                        </p>
                    </div>
                    <div class="ms-auto">
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" id="disponibilidadSwitch" 
                                   <?php echo $transportista['disponibilidad'] == 'disponible' ? 'checked' : ''; ?>>
                            <label class="form-check-label" for="disponibilidadSwitch">Disponible</label>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Cards -->
                <div class="row">
                    <div class="col-md-3">
                        <div class="dashboard-card bg-primary text-white">
                            <div class="card-icon">
                                <i class="fas fa-box"></i>
                            </div>
                            <div class="card-title">Total Pedidos</div>
                            <div class="card-value"><?php echo $total_pedidos; ?></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="dashboard-card bg-warning text-white">
                            <div class="card-icon">
                                <i class="fas fa-truck"></i>
                            </div>
                            <div class="card-title">En Camino</div>
                            <div class="card-value"><?php echo $total_en_camino; ?></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="dashboard-card bg-success text-white">
                            <div class="card-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="card-title">Entregados</div>
                            <div class="card-value"><?php echo $total_entregados; ?></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="dashboard-card bg-info text-white">
                            <div class="card-icon">
                                <i class="fas fa-route"></i>
                            </div>
                            <div class="card-title">Rutas Planificadas</div>
                            <div class="card-value"><?php echo $total_rutas; ?></div>
                        </div>
                    </div>
                </div>
                
                <!-- Today's Deliveries -->
                <div class="row mt-4">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Entregas de Hoy</h5>
                                <a href="../pedidos/asignados.php" class="btn btn-sm btn-primary">Ver todas</a>
                            </div>
                            <div class="card-body">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Cliente</th>
                                            <th>Dirección</th>
                                            <th>Hora Estimada</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php
                                        $fecha_hoy = date('Y-m-d');
                                        $query_entregas = "
                                            SELECT p.id, CONCAT(u.nombre, ' ', u.apellidos) as cliente, 
                                                   p.direccion_entrega, p.fecha_entrega, p.estado,
                                                   c.nombre as ciudad, p.tiene_tracking
                                            FROM pedidos p
                                            JOIN clientes cl ON p.id_cliente = cl.id
                                            JOIN usuarios u ON cl.id_usuario = u.id
                                            JOIN ciudades c ON p.id_ciudad_entrega = c.id
                                            WHERE p.id_transportista = ? 
                                              AND DATE(p.fecha_entrega) = ?
                                              AND (p.estado = 'en_camino' OR p.estado = 'preparando')
                                            ORDER BY p.fecha_entrega ASC
                                        ";
                                        $stmt = $conexion->prepare($query_entregas);
                                        $stmt->bind_param("is", $id_transportista, $fecha_hoy);
                                        $stmt->execute();
                                        $resultado_entregas = $stmt->get_result();
                                        
                                        if ($resultado_entregas->num_rows > 0) {
                                            while ($entrega = $resultado_entregas->fetch_assoc()) {
                                                echo '<tr>';
                                                echo '<td>' . $entrega['id'] . '</td>';
                                                echo '<td>' . htmlspecialchars($entrega['cliente']) . '</td>';
                                                echo '<td>' . htmlspecialchars($entrega['direccion_entrega']) . ', ' . htmlspecialchars($entrega['ciudad']) . '</td>';
                                                echo '<td>' . date('H:i', strtotime($entrega['fecha_entrega'])) . '</td>';
                                                
                                                // Mostrar estado con color
                                                $clase_estado = '';
                                                switch ($entrega['estado']) {
                                                    case 'preparando': $clase_estado = 'badge bg-primary'; break;
                                                    case 'en_camino': $clase_estado = 'badge bg-info'; break;
                                                }
                                                
                                                echo '<td><span class="' . $clase_estado . '">' . ucfirst(str_replace('_', ' ', $entrega['estado'])) . '</span></td>';
                                                
                                                // Acciones
                                                echo '<td>';
                                                if ($entrega['estado'] == 'preparando') {
                                                    echo '<a href="../pedidos/iniciar_entrega.php?id=' . $entrega['id'] . '" class="btn btn-sm btn-primary">Iniciar</a>';
                                                } else {
                                                    echo '<a href="../pedidos/completar_entrega.php?id=' . $entrega['id'] . '" class="btn btn-sm btn-success">Completar</a>';
                                                }
                                                
                                                if ($entrega['tiene_tracking']) {
                                                    echo ' <a href="../rutas/tracking.php?id=' . $entrega['id'] . '" class="btn btn-sm btn-info"><i class="fas fa-map-marker-alt"></i></a>';
                                                }
                                                
                                                echo '</td>';
                                                echo '</tr>';
                                            }
                                        } else {
                                            echo '<tr><td colspan="6" class="text-center">No hay entregas programadas para hoy</td></tr>';
                                        }
                                        ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Active Route -->
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Ruta Activa</h5>
                            </div>
                            <div class="card-body">
                                <?php
                                $query_ruta_activa = "
                                    SELECT r.*, COUNT(per.id) as total_pedidos
                                    FROM rutas_entrega r
                                    LEFT JOIN pedidos_en_ruta per ON r.id = per.id_ruta
                                    WHERE r.id_transportista = ? AND r.estado = 'en_progreso'
                                    GROUP BY r.id
                                ";
                                $stmt = $conexion->prepare($query_ruta_activa);
                                $stmt->bind_param("i", $id_transportista);
                                $stmt->execute();
                                $resultado_ruta = $stmt->get_result();
                                
                                if ($resultado_ruta->num_rows > 0) {
                                    $ruta = $resultado_ruta->fetch_assoc();
                                    ?>
                                    <div class="text-center mb-3">
                                        <div class="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                                            <i class="fas fa-route fa-3x"></i>
                                        </div>
                                    </div>
                                    
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item d-flex justify-content-between">
                                            <strong>ID Ruta:</strong>
                                            <span>#<?php echo $ruta['id']; ?></span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between">
                                            <strong>Fecha:</strong>
                                            <span><?php echo date('d/m/Y', strtotime($ruta['fecha_ruta'])); ?></span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between">
                                            <strong>Hora inicio:</strong>
                                            <span><?php echo $ruta['hora_inicio']; ?></span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between">
                                            <strong>Pedidos:</strong>
                                            <span><?php echo $ruta['total_pedidos']; ?></span>
                                        </li>
                                        <li class="list-group-item d-flex justify-content-between">
                                            <strong>Kilómetros:</strong>
                                            <span><?php echo number_format($ruta['kilometros_totales'], 1); ?> km</span>
                                        </li>
                                        <?php if ($transportista['tiene_refrigeracion']): ?>
                                        <li class="list-group-item d-flex justify-content-between">
                                            <strong>Temperatura:</strong>
                                            <span><?php echo number_format($ruta['temperatura_promedio'], 1); ?> °C</span>
                                        </li>
                                        <?php endif; ?>
                                    </ul>
                                    
                                    <div class="d-grid gap-2 mt-3">
                                        <?php if (!empty($ruta['link_tracking_gps'])): ?>
                                        <a href="<?php echo $ruta['link_tracking_gps']; ?>" target="_blank" class="btn btn-info">
                                            <i class="fas fa-map-marker-alt me-2"></i> Ver Tracking GPS
                                        </a>
                                        <?php endif; ?>
                                        <a href="../rutas/detalle.php?id=<?php echo $ruta['id']; ?>" class="btn btn-primary">
                                            Ver Detalles
                                        </a>
                                        <a href="../rutas/completar.php?id=<?php echo $ruta['id']; ?>" class="btn btn-success">
                                            Completar Ruta
                                        </a>
                                    </div>
                                    
                                <?php } else { ?>
                                    <div class="text-center py-5">
                                        <i class="fas fa-map fa-4x text-muted mb-3"></i>
                                        <h5>No hay ruta activa</h5>
                                        <p class="text-muted">No tienes ninguna ruta en progreso actualmente</p>
                                        <a href="../rutas/mis_rutas.php" class="btn btn-primary mt-2">Ver Rutas Planificadas</a>
                                    </div>
                                <?php } ?>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Refrigeration Status (if applicable) -->
                <?php if ($transportista['tiene_refrigeracion']): ?>
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Estado de Refrigeración</h5>
                                <button class="btn btn-sm btn-info">Actualizar</button>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="temperature-gauge text-center">
                                            <div class="d-inline-block position-relative" style="width: 120px; height: 120px;">
                                                <div class="position-absolute top-50 start-50 translate-middle">
                                                    <i class="fas fa-snowflake fa-2x text-info"></i>
                                                    <h3 class="mt-1">2.5°C</h3>
                                                </div>
                                                <svg viewBox="0 0 100 100" style="width: 120px; height: 120px;">
                                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e9ecef" stroke-width="10" />
                                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#17a2b8" stroke-width="10" stroke-dasharray="282.7" stroke-dashoffset="70" />
                                                </svg>
                                            </div>
                                            <p class="mt-2">Temperatura Actual</p>
                                        </div>
                                    </div>
                                    <div class="col-md-8">
                                        <div class="chart-container">
                                            <canvas id="temperatureChart" height="200"></canvas>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-md-6">
                                        <div class="alert alert-success">
                                            <i class="fas fa-check-circle me-2"></i>
                                            La temperatura está dentro del rango óptimo para el transporte de jugos naturales.
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group">
                                            <label for="temperaturaDeseada">Temperatura deseada (°C)</label>
                                            <div class="input-group">
                                                <input type="number" class="form-control" id="temperaturaDeseada" value="2.0" step="0.5" min="0" max="10">
                                                <button class="btn btn-primary">Ajustar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // Simulación de datos para el gráfico de temperatura
        <?php if ($transportista['tiene_refrigeracion']): ?>
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('temperatureChart').getContext('2d');
            
            const temperatureData = {
                labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
                datasets: [{
                    label: 'Temperatura (°C)',
                    data: [2.8, 2.7, 2.4, 2.6, 2.9, 3.1, 2.7, 2.5],
                    fill: false,
                    borderColor: '#17a2b8',
                    tension: 0.4
                }]
            };
            
            const temperatureChart = new Chart(ctx, {
                type: 'line',
                data: temperatureData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 0,
                            max: 10,
                            ticks: {
                                stepSize: 1
                            },
                            title: {
                                display: true,
                                text: 'Temperatura (°C)'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Registro de Temperatura Durante el Día'
                        }
                    }
                }
            });
            
            // Simulación de cambio de disponibilidad
            const disponibilidadSwitch = document.getElementById('disponibilidadSwitch');
            disponibilidadSwitch.addEventListener('change', function() {
                const estado = this.checked ? 'disponible' : 'no disponible';
                alert(`Estado cambiado a: ${estado}. En una aplicación real, esto se guardaría en la base de datos.`);
            });
        });
        <?php endif; ?>
    </script>
</body>
</html>
