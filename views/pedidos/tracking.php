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

// Obtener el ID del pedido (si se proporciona)
$id_pedido = isset($_GET['id']) ? intval($_GET['id']) : 0;

// Si no se proporciona un ID de pedido, obtener los pedidos en camino del cliente
if ($id_pedido === 0) {
    $query_pedidos = "
        SELECT p.id, p.fecha_pedido, p.fecha_entrega, p.total, p.estado, 
               p.direccion_entrega, ci.nombre as ciudad, p.tiene_tracking,
               p.link_tracking, CONCAT(u.nombre, ' ', u.apellidos) as transportista,
               t.id as id_transportista, t.licencia, t.tiene_gps
        FROM pedidos p
        JOIN ciudades ci ON p.id_ciudad_entrega = ci.id
        LEFT JOIN transportistas t ON p.id_transportista = t.id
        LEFT JOIN usuarios u ON t.id_usuario = u.id
        WHERE p.id_cliente = ? AND p.estado = 'en_camino' AND p.tiene_tracking = 1
        ORDER BY p.fecha_entrega ASC
    ";
    $stmt = $conexion->prepare($query_pedidos);
    $stmt->bind_param("i", $id_cliente);
    $stmt->execute();
    $resultado_pedidos = $stmt->get_result();
    
    $pedido = null;
    if ($resultado_pedidos->num_rows > 0) {
        // Tomar el primer pedido en camino para mostrar
        $pedido = $resultado_pedidos->fetch_assoc();
        $id_pedido = $pedido['id'];
    }
} else {
    // Verificar que el pedido pertenece al cliente
    $query_pedido = "
        SELECT p.id, p.fecha_pedido, p.fecha_entrega, p.total, p.estado, 
               p.direccion_entrega, ci.nombre as ciudad, p.tiene_tracking,
               p.link_tracking, CONCAT(u.nombre, ' ', u.apellidos) as transportista,
               t.id as id_transportista, t.licencia, t.tiene_gps
        FROM pedidos p
        JOIN ciudades ci ON p.id_ciudad_entrega = ci.id
        LEFT JOIN transportistas t ON p.id_transportista = t.id
        LEFT JOIN usuarios u ON t.id_usuario = u.id
        WHERE p.id = ? AND p.id_cliente = ?
    ";
    $stmt = $conexion->prepare($query_pedido);
    $stmt->bind_param("ii", $id_pedido, $id_cliente);
    $stmt->execute();
    $resultado_pedido = $stmt->get_result();
    
    if ($resultado_pedido->num_rows === 0) {
        // El pedido no existe o no pertenece al cliente
        header('Location: mis_pedidos.php');
        exit;
    }
    
    $pedido = $resultado_pedido->fetch_assoc();
}

// Obtener los detalles del pedido si existe
if ($id_pedido > 0) {
    $query_detalles = "
        SELECT dp.id, dp.cantidad, dp.precio_unitario, dp.subtotal,
               p.nombre as producto, p.descripcion
        FROM detalles_pedido dp
        JOIN productos p ON dp.id_producto = p.id
        WHERE dp.id_pedido = ?
        ORDER BY dp.id
    ";
    $stmt = $conexion->prepare($query_detalles);
    $stmt->bind_param("i", $id_pedido);
    $stmt->execute();
    $resultado_detalles = $stmt->get_result();
    
    // Obtener datos de tracking si tiene GPS
    if ($pedido && $pedido['tiene_gps'] && $pedido['estado'] === 'en_camino') {
        $query_tracking = "
            SELECT hora_inicio, hora_fin, temperatura_promedio, link_tracking_gps,
                   tiempo_estimado_minutos, latitud, longitud, ultima_actualizacion
            FROM tracking_entregas
            WHERE id_transportista = ? AND id_pedido = ?
            ORDER BY id DESC
            LIMIT 1
        ";
        $stmt = $conexion->prepare($query_tracking);
        $stmt->bind_param("ii", $pedido['id_transportista'], $id_pedido);
        $stmt->execute();
        $resultado_tracking = $stmt->get_result();
        $tracking = $resultado_tracking->num_rows > 0 ? $resultado_tracking->fetch_assoc() : null;
    } else {
        $tracking = null;
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tracking de Pedido - Frutale</title>
    <link rel="stylesheet" href="../../assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="../../assets/css/estilos.css">
    <link rel="stylesheet" href="../../assets/css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <style>
        #map {
            height: 400px;
            width: 100%;
            border-radius: 5px;
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
        .tracking-info {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .temperatura-value {
            font-size: 24px;
            font-weight: bold;
        }
        .temperatura-unit {
            font-size: 16px;
            color: #6c757d;
        }
        .estimated-time {
            font-size: 18px;
            color: #0d6efd;
            font-weight: bold;
        }
    </style>
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
                    <a class="nav-link" href="mis_pedidos.php"><i class="fas fa-shopping-cart"></i> Mis Pedidos</a>
                    <a class="nav-link" href="nuevo.php"><i class="fas fa-plus-circle"></i> Nuevo Pedido</a>
                    <a class="nav-link active" href="#"><i class="fas fa-map-marker-alt"></i> Tracking</a>
                    <a class="nav-link" href="../perfil/editar.php"><i class="fas fa-user-edit"></i> Mi Perfil</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Tracking de Pedido</h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <a href="mis_pedidos.php" class="btn btn-sm btn-outline-secondary">
                            <i class="fas fa-arrow-left me-2"></i> Volver a Mis Pedidos
                        </a>
                    </div>
                </div>
                
                <?php if (!$pedido || $pedido['estado'] !== 'en_camino'): ?>
                    <div class="alert alert-info text-center">
                        <i class="fas fa-info-circle me-2"></i> No hay pedidos en camino con tracking disponible.
                        <p class="mt-3">
                            <a href="mis_pedidos.php" class="btn btn-primary">
                                <i class="fas fa-shopping-cart me-2"></i> Ver mis pedidos
                            </a>
                        </p>
                    </div>
                <?php else: ?>
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between">
                            <h5 class="mb-0">Pedido #<?php echo $pedido['id']; ?></h5>
                            <span class="badge bg-info">En camino</span>
                        </div>
                        <div class="card-body">
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <p><strong>Fecha de pedido:</strong> <?php echo date('d/m/Y H:i', strtotime($pedido['fecha_pedido'])); ?></p>
                                    <p><strong>Dirección de entrega:</strong> <?php echo htmlspecialchars($pedido['direccion_entrega']); ?>, <?php echo htmlspecialchars($pedido['ciudad']); ?></p>
                                    <p><strong>Transportista:</strong> <?php echo htmlspecialchars($pedido['transportista']); ?></p>
                                    <p><strong>Llegada estimada:</strong> <?php echo date('d/m/Y H:i', strtotime($pedido['fecha_entrega'])); ?></p>
                                </div>
                                <div class="col-md-6">
                                    <?php if ($tracking && isset($tracking['tiempo_estimado_minutos'])): ?>
                                        <div class="tracking-info text-center">
                                            <h6 class="text-muted mb-3">Tiempo estimado de llegada</h6>
                                            <p class="estimated-time"><?php echo $tracking['tiempo_estimado_minutos']; ?> minutos</p>
                                            <small class="text-muted">
                                                Última actualización: <?php echo isset($tracking['ultima_actualizacion']) ? date('d/m/Y H:i', strtotime($tracking['ultima_actualizacion'])) : 'No disponible'; ?>
                                            </small>
                                        </div>
                                    <?php endif; ?>
                                    
                                    <?php if ($tracking && isset($tracking['temperatura_promedio'])): ?>
                                        <div class="tracking-info text-center">
                                            <h6 class="text-muted mb-3">Temperatura de transporte</h6>
                                            <p class="mb-0">
                                                <span class="temperatura-value"><?php echo $tracking['temperatura_promedio']; ?></span>
                                                <span class="temperatura-unit">°C</span>
                                            </p>
                                            <small class="text-muted">Temperatura óptima para conservar tus jugos naturales</small>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                            
                            <!-- Tracking Visual -->
                            <div class="tracking-container mb-4">
                                <div class="d-flex justify-content-between position-relative">
                                    <div class="tracking-step text-center">
                                        <div class="tracking-dot tracking-active"></div>
                                        <small>Recogido</small>
                                    </div>
                                    <div class="tracking-step text-center">
                                        <div class="tracking-dot tracking-active"></div>
                                        <small>En ruta</small>
                                    </div>
                                    <div class="tracking-step text-center">
                                        <div class="tracking-dot tracking-inactive"></div>
                                        <small>Entregado</small>
                                    </div>
                                    
                                    <!-- Línea de progreso -->
                                    <div class="progress position-absolute" style="height: 2px; width: 70%; top: 7px; left: 15%; z-index: -1;">
                                        <div class="progress-bar bg-success" role="progressbar" style="width: 66%"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Mapa de seguimiento -->
                            <?php if ($tracking && isset($tracking['latitud']) && isset($tracking['longitud'])): ?>
                                <h5 class="mb-3">Ubicación en tiempo real</h5>
                                <div id="map" class="mb-4"></div>
                            <?php elseif ($pedido['tiene_tracking'] && $pedido['tiene_gps']): ?>
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle me-2"></i> El tracking GPS está activado pero aún no hay datos de ubicación disponibles.
                                </div>
                            <?php else: ?>
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i> Este pedido no cuenta con seguimiento GPS en tiempo real.
                                </div>
                            <?php endif; ?>
                            
                            <!-- Detalles del pedido -->
                            <h5 class="mb-3 mt-4">Detalle del Pedido</h5>
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php if (isset($resultado_detalles) && $resultado_detalles->num_rows > 0): ?>
                                            <?php while ($detalle = $resultado_detalles->fetch_assoc()): ?>
                                                <tr>
                                                    <td><?php echo htmlspecialchars($detalle['producto']); ?></td>
                                                    <td><?php echo $detalle['cantidad']; ?></td>
                                                    <td>$<?php echo number_format($detalle['precio_unitario'], 2); ?></td>
                                                    <td>$<?php echo number_format($detalle['subtotal'], 2); ?></td>
                                                </tr>
                                            <?php endwhile; ?>
                                        <?php else: ?>
                                            <tr>
                                                <td colspan="4" class="text-center">No hay detalles disponibles</td>
                                            </tr>
                                        <?php endif; ?>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colspan="3" class="text-end">Total:</th>
                                            <th>$<?php echo number_format($pedido['total'], 2); ?></th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
    <?php if (isset($tracking) && isset($tracking['latitud']) && isset($tracking['longitud'])): ?>
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // Coordenadas desde PHP
                const lat = <?php echo $tracking['latitud']; ?>;
                const lng = <?php echo $tracking['longitud']; ?>;
                
                // Inicializar mapa
                const map = L.map('map').setView([lat, lng], 15);
                
                // Agregar capa de OpenStreetMap
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                
                // Agregar marcador del transportista
                const truckIcon = L.icon({
                    iconUrl: '../../assets/img/truck-icon.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                });
                
                const marker = L.marker([lat, lng], {
                    icon: truckIcon
                }).addTo(map);
                
                marker.bindPopup("<b>Transportista:</b> <?php echo htmlspecialchars($pedido['transportista']); ?><br><b>Placa:</b> <?php echo htmlspecialchars($pedido['licencia']); ?>").openPopup();
                
                // Actualizar ubicación cada minuto
                setInterval(function() {
                    fetch(`../../api/tracking/ubicacion.php?id_pedido=<?php echo $pedido['id']; ?>`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.success && data.latitud && data.longitud) {
                                marker.setLatLng([data.latitud, data.longitud]);
                                map.panTo([data.latitud, data.longitud]);
                                
                                // Actualizar tiempo estimado
                                if (data.tiempo_estimado_minutos) {
                                    document.querySelector('.estimated-time').textContent = data.tiempo_estimado_minutos + ' minutos';
                                }
                            }
                        })
                        .catch(error => console.error('Error al actualizar ubicación:', error));
                }, 60000); // 60 segundos
            });
        </script>
    <?php endif; ?>
</body>
</html>
