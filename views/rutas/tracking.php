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

// Obtener rutas activas para este transportista
$query_rutas = "
    SELECT r.id, r.fecha_ruta, r.hora_inicio, r.hora_fin, 
           r.estado, r.kilometros_totales as distancia_total, r.tiempo_estimado_minutos as tiempo_estimado
    FROM rutas_entrega r
    WHERE r.id_transportista = ? AND r.estado = 'en_progreso'
    ORDER BY r.fecha_ruta, r.hora_inicio
";

$stmt_rutas = $conexion->prepare($query_rutas);
$stmt_rutas->bind_param("i", $id_transportista);
$stmt_rutas->execute();
$resultado_rutas = $stmt_rutas->get_result();

// Si hay una ruta activa, obtenemos sus paradas (pedidos)
$ruta_activa = null;
$paradas = [];

if ($resultado_rutas->num_rows > 0) {
    $ruta_activa = $resultado_rutas->fetch_assoc();
    
    // Obtener las paradas de la ruta
    $query_paradas = "
        SELECT p.id, p.numero_seguimiento, p.fecha_entrega_estimada, p.direccion_entrega, 
               p.estado, p.latitud, p.longitud, c.nombre as cliente,
               CONCAT(u.nombre, ' ', u.apellidos) as nombre_cliente,
               c.telefono, p.notas_entrega, pr.orden_entrega
        FROM pedidos_en_ruta pr
        JOIN pedidos p ON pr.id_pedido = p.id
        JOIN clientes c ON p.id_cliente = c.id
        JOIN usuarios u ON c.id_usuario = u.id
        WHERE pr.id_ruta = ?
        ORDER BY pr.orden_entrega
    ";
    
    $stmt_paradas = $conexion->prepare($query_paradas);
    $stmt_paradas->bind_param("i", $ruta_activa['id']);
    $stmt_paradas->execute();
    $resultado_paradas = $stmt_paradas->get_result();
    
    while ($parada = $resultado_paradas->fetch_assoc()) {
        $paradas[] = $parada;
    }
}

// Obtener la posición actual del transportista (simulada o desde la base de datos)
$posicion_actual = [
    'latitud' => 19.4326, // Valor por defecto o desde la última actualización
    'longitud' => -99.1332
];

// Si se está recibiendo una actualización de posición GPS
if (isset($_POST['actualizar_posicion']) && isset($_POST['latitud']) && isset($_POST['longitud'])) {
    $posicion_actual['latitud'] = $_POST['latitud'];
    $posicion_actual['longitud'] = $_POST['longitud'];
    
    // Aquí se guardaría la posición en la base de datos
    // ...
    
    // Redirigir para evitar reenvío del formulario
    header('Location: tracking.php');
    exit;
}

// Si se está actualizando el estado de un pedido
if (isset($_POST['actualizar_pedido']) && isset($_POST['id_pedido']) && isset($_POST['estado'])) {
    $id_pedido = $_POST['id_pedido'];
    $estado = $_POST['estado'];
    $comentario = isset($_POST['comentario']) ? $_POST['comentario'] : '';
    
    $query_update = "
        UPDATE pedidos 
        SET estado = ?, 
            comentarios = CONCAT(IFNULL(comentarios, ''), '\n', NOW(), ': ', ?)
        WHERE id = ?
    ";
    
    $stmt_update = $conexion->prepare($query_update);
    $stmt_update->bind_param("ssi", $estado, $comentario, $id_pedido);
    $stmt_update->execute();
    
    // Si el pedido se marca como entregado, registramos la hora de entrega
    if ($estado === 'entregado') {
        $query_entrega = "UPDATE pedidos SET fecha_entrega = NOW() WHERE id = ?";
        $stmt_entrega = $conexion->prepare($query_entrega);
        $stmt_entrega->bind_param("i", $id_pedido);
        $stmt_entrega->execute();
    }
    
    // Verificar si todos los pedidos de la ruta están entregados
    if ($ruta_activa) {
        $query_check = "
            SELECT COUNT(*) as total, 
                   SUM(CASE WHEN estado = 'entregado' THEN 1 ELSE 0 END) as entregados
            FROM pedidos
            WHERE id_ruta = ?
        ";
        
        $stmt_check = $conexion->prepare($query_check);
        $stmt_check->bind_param("i", $ruta_activa['id']);
        $stmt_check->execute();
        $resultado_check = $stmt_check->get_result();
        $check = $resultado_check->fetch_assoc();
        
        // Si todos los pedidos están entregados, completamos la ruta
        if ($check['total'] == $check['entregados']) {
            $query_ruta = "UPDATE rutas_entrega SET estado = 'completada', hora_fin = NOW() WHERE id = ?";
            $stmt_ruta = $conexion->prepare($query_ruta);
            $stmt_ruta->bind_param("i", $ruta_activa['id']);
            $stmt_ruta->execute();
        }
    }
    
    // Redirigir para evitar reenvío del formulario
    header('Location: tracking.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tracking en Vivo - Frutale</title>
    <link rel="stylesheet" href="../../assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="../../assets/css/estilos.css">
    <link rel="stylesheet" href="../../assets/css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <style>
        #map {
            height: 500px;
            width: 100%;
            border-radius: 8px;
        }
        .parada-card {
            border-left: 4px solid #0d6efd;
            margin-bottom: 15px;
        }
        .parada-card.actual {
            border-left-color: #198754;
            background-color: #f8f9fa;
        }
        .parada-card.completada {
            border-left-color: #adb5bd;
            opacity: 0.7;
        }
        .estado-badge {
            position: absolute;
            top: 10px;
            right: 10px;
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
                    <a class="nav-link" href="../pedidos/asignados.php"><i class="fas fa-box"></i> Pedidos Asignados</a>
                    <a class="nav-link" href="mis_rutas.php"><i class="fas fa-route"></i> Mis Rutas</a>
                    <a class="nav-link active" href="#"><i class="fas fa-map-marked-alt"></i> Activar Tracking</a>
                    <a class="nav-link" href="../perfil/editar.php"><i class="fas fa-user-edit"></i> Mi Perfil</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Activar Tracking</h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <button type="button" class="btn btn-sm btn-verde" id="actualizar-gps">
                            <i class="fas fa-location-arrow"></i> Actualizar Ubicación
                        </button>
                    </div>
                </div>
                
                <?php if (!$ruta_activa): ?>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i> No tienes rutas activas en este momento. Para iniciar una ruta, dirígete a la sección <a href="mis_rutas.php" class="alert-link">Mis Rutas</a>.
                    </div>
                <?php else: ?>
                    <!-- Detalles de la Ruta Activa -->
                    <div class="card mb-4">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-route me-2"></i> 
                                Ruta Activa #<?php echo $ruta_activa['id']; ?> - 
                                <?php echo date('d/m/Y', strtotime($ruta_activa['fecha_ruta'])); ?>
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3">
                                    <strong>Hora inicio:</strong> 
                                    <?php echo date('H:i', strtotime($ruta_activa['hora_inicio'])); ?>
                                </div>
                                <div class="col-md-3">
                                    <strong>Paradas:</strong> 
                                    <?php echo count($paradas); ?>
                                </div>
                                <div class="col-md-3">
                                    <strong>Distancia total:</strong> 
                                    <?php echo $ruta_activa['distancia_total'] ? number_format($ruta_activa['distancia_total'], 1) . ' km' : '-'; ?>
                                </div>
                                <div class="col-md-3">
                                    <strong>Tiempo estimado:</strong> 
                                    <?php echo $ruta_activa['tiempo_estimado'] ? $ruta_activa['tiempo_estimado'] . ' min' : '-'; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mb-4">
                        <!-- Mapa de la Ruta -->
                        <div class="col-md-8">
                            <div class="card h-100">
                                <div class="card-header">
                                    <h5 class="mb-0">Mapa de Ruta</h5>
                                </div>
                                <div class="card-body">
                                    <div id="map"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Paradas de la Ruta -->
                        <div class="col-md-4">
                            <div class="card h-100">
                                <div class="card-header">
                                    <h5 class="mb-0">Paradas de la Ruta</h5>
                                </div>
                                <div class="card-body" style="overflow-y: auto; max-height: 500px;">
                                    <?php if (empty($paradas)): ?>
                                        <div class="alert alert-warning">
                                            No hay paradas definidas para esta ruta.
                                        </div>
                                    <?php else: ?>
                                        <?php foreach ($paradas as $index => $parada): ?>
                                            <div class="card parada-card <?php echo $parada['estado'] === 'entregado' ? 'completada' : ($index === 0 ? 'actual' : ''); ?> position-relative">
                                                <div class="card-body">
                                                    <span class="estado-badge badge <?php echo $parada['estado'] === 'entregado' ? 'bg-success' : 'bg-primary'; ?>">
                                                        <?php echo $index + 1; ?>
                                                    </span>
                                                    <h6 class="card-title">
                                                        <?php echo htmlspecialchars($parada['nombre_cliente']); ?>
                                                    </h6>
                                                    <p class="card-text small mb-1">
                                                        <i class="fas fa-map-marker-alt me-1"></i>
                                                        <?php echo htmlspecialchars($parada['direccion_entrega']); ?>
                                                    </p>
                                                    <p class="card-text small mb-1">
                                                        <i class="fas fa-phone-alt me-1"></i>
                                                        <?php echo htmlspecialchars($parada['telefono']); ?>
                                                    </p>
                                                    <p class="card-text small mb-2">
                                                        <i class="fas fa-tag me-1"></i>
                                                        Pedido #<?php echo $parada['id']; ?> - 
                                                        <?php echo $parada['numero_seguimiento']; ?>
                                                    </p>
                                                    
                                                    <?php if ($parada['estado'] !== 'entregado'): ?>
                                                        <form method="POST" action="">
                                                            <input type="hidden" name="actualizar_pedido" value="1">
                                                            <input type="hidden" name="id_pedido" value="<?php echo $parada['id']; ?>">
                                                            <input type="hidden" name="estado" value="entregado">
                                                            <div class="input-group mb-2">
                                                                <input type="text" class="form-control form-control-sm" name="comentario" placeholder="Comentarios de entrega">
                                                                <button type="submit" class="btn btn-sm btn-success">
                                                                    <i class="fas fa-check me-1"></i> Entregar
                                                                </button>
                                                            </div>
                                                        </form>
                                                    <?php else: ?>
                                                        <span class="badge bg-success">
                                                            <i class="fas fa-check me-1"></i> Entregado
                                                        </span>
                                                    <?php endif; ?>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                
                <!-- Formulario oculto para actualizar posición -->
                <form id="formulario-posicion" method="POST" action="" style="display: none;">
                    <input type="hidden" name="actualizar_posicion" value="1">
                    <input type="hidden" name="latitud" id="latitud" value="">
                    <input type="hidden" name="longitud" id="longitud" value="">
                </form>
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script>
        // Inicializar el mapa
        const map = L.map('map').setView([<?php echo $posicion_actual['latitud']; ?>, <?php echo $posicion_actual['longitud']; ?>], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Marcador para la posición actual
        const currentMarker = L.marker([<?php echo $posicion_actual['latitud']; ?>, <?php echo $posicion_actual['longitud']; ?>], {
            icon: L.icon({
                iconUrl: '../../assets/img/truck-marker.png',
                iconSize: [38, 38],
                iconAnchor: [19, 38],
                popupAnchor: [0, -38]
            })
        }).addTo(map);
        currentMarker.bindPopup('Tu ubicación actual').openPopup();
        
        // Marcadores para las paradas
        const paradas = <?php echo json_encode($paradas); ?>;
        const markers = [];
        const latlngs = [];
        
        paradas.forEach((parada, index) => {
            if (parada.latitud && parada.longitud) {
                const latLng = [parada.latitud, parada.longitud];
                latlngs.push(latLng);
                
                const icon = parada.estado === 'entregado' 
                    ? L.icon({
                        iconUrl: '../../assets/img/marker-delivered.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [0, -41]
                    })
                    : L.icon({
                        iconUrl: '../../assets/img/marker-pending.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [0, -41]
                    });
                
                const marker = L.marker(latLng, {icon: icon}).addTo(map);
                marker.bindPopup(`<b>Parada ${index + 1}</b><br>${parada.nombre_cliente}<br>${parada.direccion_entrega}`);
                markers.push(marker);
            }
        });
        
        // Dibujar la ruta
        if (latlngs.length > 0) {
            const polyline = L.polyline([
                [<?php echo $posicion_actual['latitud']; ?>, <?php echo $posicion_actual['longitud']; ?>],
                ...latlngs
            ], {color: 'blue'}).addTo(map);
            
            // Ajustar la vista para mostrar toda la ruta
            map.fitBounds(polyline.getBounds(), {padding: [50, 50]});
        }
        
        // Actualizar posición GPS
        document.getElementById('actualizar-gps').addEventListener('click', function() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // Actualizar los campos del formulario
                    document.getElementById('latitud').value = lat;
                    document.getElementById('longitud').value = lng;
                    
                    // Enviar el formulario
                    document.getElementById('formulario-posicion').submit();
                }, function(error) {
                    console.error('Error obteniendo geolocalización:', error);
                    alert('No se pudo obtener tu ubicación. Por favor, verifica los permisos de ubicación.');
                });
            } else {
                alert('Tu navegador no soporta geolocalización.');
            }
        });
        
        // Actualizar la posición automáticamente cada 5 minutos
        setInterval(function() {
            document.getElementById('actualizar-gps').click();
        }, 5 * 60 * 1000);
    </script>
</body>
</html>
