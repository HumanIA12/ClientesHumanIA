<?php
// Incluir el encabezado
include '../includes/header.php';

// Verificar rol de usuario - Solo admin puede gestionar transportistas
if ($_SESSION['usuario_rol'] !== 'admin') {
    echo '<div class="alert alert-danger">No tiene permisos para acceder a esta sección</div>';
    include 'includes/footer.php';
    exit();
}

// Procesar asignación de pedidos a transportistas
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['asignar_pedido'])) {
    $id_pedido = intval($_POST['id_pedido']);
    $id_transportista = intval($_POST['id_transportista']);
    
    if ($id_pedido > 0 && $id_transportista > 0) {
        // Actualizar pedido con el transportista asignado
        $sql_asignar = "UPDATE pedidos SET id_transportista = ?, estado = 'preparando' WHERE id = ?";
        $stmt_asignar = $conexion->prepare($sql_asignar);
        $stmt_asignar->bind_param("ii", $id_transportista, $id_pedido);
        
        if ($stmt_asignar->execute()) {
            // Registrar en historial
            $sql_historial = "INSERT INTO historial_estados 
                            (id_pedido, estado_anterior, estado_nuevo, id_usuario, comentario) 
                            VALUES (?, 'pendiente', 'preparando', ?, 'Asignado transportista #$id_transportista')";
            $stmt_historial = $conexion->prepare($sql_historial);
            $usuario_id = $_SESSION['usuario_id'];
            $stmt_historial->bind_param("ii", $id_pedido, $usuario_id);
            $stmt_historial->execute();
            
            echo '<div class="alert alert-success">Pedido asignado correctamente al transportista</div>';
        } else {
            echo '<div class="alert alert-danger">Error al asignar el pedido: ' . $conexion->error . '</div>';
        }
    }
}

// Procesar cambio de disponibilidad de transportista
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['cambiar_disponibilidad'])) {
    $id_transportista = intval($_POST['id_transportista']);
    $nueva_disponibilidad = $_POST['disponibilidad'];
    
    if ($id_transportista > 0) {
        $sql_disponibilidad = "UPDATE transportistas SET disponibilidad = ? WHERE id = ?";
        $stmt_disponibilidad = $conexion->prepare($sql_disponibilidad);
        $stmt_disponibilidad->bind_param("si", $nueva_disponibilidad, $id_transportista);
        
        if ($stmt_disponibilidad->execute()) {
            echo '<div class="alert alert-success">Disponibilidad actualizada correctamente</div>';
        } else {
            echo '<div class="alert alert-danger">Error al actualizar disponibilidad: ' . $conexion->error . '</div>';
        }
    }
}

// Obtener transportistas
$sql_transportistas = "SELECT t.id, t.licencia, t.tipo_vehiculo, t.capacidad_carga, 
                      t.zona_cobertura, t.disponibilidad, u.nombre, u.apellidos, u.telefono, u.email
                      FROM transportistas t
                      JOIN usuarios u ON t.id_usuario = u.id
                      ORDER BY t.disponibilidad, u.nombre";
$result_transportistas = $conexion->query($sql_transportistas);

// Obtener pedidos pendientes sin transportista asignado
$sql_pedidos = "SELECT p.id, p.fecha_pedido, p.fecha_entrega, p.total, p.direccion_entrega,
               c.id as cliente_id, u.nombre, u.apellidos
               FROM pedidos p
               JOIN clientes c ON p.id_cliente = c.id
               JOIN usuarios u ON c.id_usuario = u.id
               WHERE p.estado = 'pendiente' AND p.id_transportista IS NULL
               ORDER BY p.fecha_pedido";
$result_pedidos = $conexion->query($sql_pedidos);
?>

<div class="row mb-4">
    <div class="col-md-12">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="../dashboard/dashboard.php">Dashboard</a></li>
                <li class="breadcrumb-item active" aria-current="page">Gestionar Transportistas</li>
            </ol>
        </nav>
        
        <h2 class="mb-4"><i class="fas fa-truck me-2"></i>Gestionar Transportistas</h2>
    </div>
</div>

<div class="row mb-4">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-users me-2"></i> Transportistas Disponibles
                </div>
                <a href="registrar_transportista.php" class="btn btn-success btn-sm">
                    <i class="fas fa-plus-circle me-2"></i>Nuevo Transportista
                </a>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Transportista</th>
                                <th>Contacto</th>
                                <th>Vehículo</th>
                                <th>Capacidad</th>
                                <th>Zona</th>
                                <th>Disponibilidad</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if ($result_transportistas && $result_transportistas->num_rows > 0): ?>
                                <?php while($transportista = $result_transportistas->fetch_assoc()): ?>
                                <tr>
                                    <td><?php echo $transportista['id']; ?></td>
                                    <td>
                                        <strong><?php echo $transportista['nombre'] . ' ' . $transportista['apellidos']; ?></strong><br>
                                        <small>Lic: <?php echo $transportista['licencia']; ?></small>
                                    </td>
                                    <td>
                                        <i class="fas fa-phone me-1"></i> <?php echo $transportista['telefono']; ?><br>
                                        <i class="fas fa-envelope me-1"></i> <?php echo $transportista['email']; ?>
                                    </td>
                                    <td><?php echo $transportista['tipo_vehiculo']; ?></td>
                                    <td><?php echo $transportista['capacidad_carga']; ?> kg</td>
                                    <td><?php echo $transportista['zona_cobertura']; ?></td>
                                    <td>
                                        <?php 
                                        $disponibilidad_class = '';
                                        switch($transportista['disponibilidad']) {
                                            case 'disponible':
                                                $disponibilidad_class = 'success';
                                                break;
                                            case 'en ruta':
                                                $disponibilidad_class = 'primary';
                                                break;
                                            case 'no disponible':
                                                $disponibilidad_class = 'danger';
                                                break;
                                        }
                                        ?>
                                        <span class="badge bg-<?php echo $disponibilidad_class; ?>">
                                            <?php echo ucfirst($transportista['disponibilidad']); ?>
                                        </span>
                                    </td>
                                    <td>
                                        <div class="btn-group">
                                            <button type="button" class="btn btn-info btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                                                Acciones
                                            </button>
                                            <ul class="dropdown-menu">
                                                <li>
                                                    <a class="dropdown-item" href="ver_transportista.php?id=<?php echo $transportista['id']; ?>">
                                                        <i class="fas fa-eye me-2"></i>Ver Detalles
                                                    </a>
                                                </li>
                                                <li>
                                                    <a class="dropdown-item" href="editar_transportista.php?id=<?php echo $transportista['id']; ?>">
                                                        <i class="fas fa-edit me-2"></i>Editar
                                                    </a>
                                                </li>
                                                <li><hr class="dropdown-divider"></li>
                                                <li>
                                                    <button class="dropdown-item btn-cambiar-disponibilidad" 
                                                            data-id="<?php echo $transportista['id']; ?>"
                                                            data-nombre="<?php echo $transportista['nombre'] . ' ' . $transportista['apellidos']; ?>"
                                                            data-disponibilidad="<?php echo $transportista['disponibilidad']; ?>">
                                                        <i class="fas fa-exchange-alt me-2"></i>Cambiar Disponibilidad
                                                    </button>
                                                </li>
                                                <li>
                                                    <a class="dropdown-item" href="rutas_transportista.php?id=<?php echo $transportista['id']; ?>">
                                                        <i class="fas fa-route me-2"></i>Ver Rutas
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                                <?php endwhile; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="8" class="text-center">No hay transportistas registrados</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Pedidos pendientes por asignar -->
<div class="row">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header card-header-custom">
                <i class="fas fa-clipboard-list me-2"></i> Pedidos Pendientes por Asignar
            </div>
            <div class="card-body">
                <?php if ($result_pedidos && $result_pedidos->num_rows > 0): ?>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente</th>
                                <th>Fecha Pedido</th>
                                <th>Fecha Entrega</th>
                                <th>Dirección</th>
                                <th>Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php while($pedido = $result_pedidos->fetch_assoc()): ?>
                            <tr>
                                <td><?php echo $pedido['id']; ?></td>
                                <td><?php echo $pedido['nombre'] . ' ' . $pedido['apellidos']; ?></td>
                                <td><?php echo date('d/m/Y H:i', strtotime($pedido['fecha_pedido'])); ?></td>
                                <td>
                                    <?php 
                                    echo !empty($pedido['fecha_entrega']) 
                                        ? date('d/m/Y H:i', strtotime($pedido['fecha_entrega']))
                                        : 'No programada';
                                    ?>
                                </td>
                                <td><?php echo $pedido['direccion_entrega']; ?></td>
                                <td>$<?php echo number_format($pedido['total'], 2); ?></td>
                                <td>
                                    <button type="button" class="btn btn-primary btn-sm btn-asignar-pedido"
                                            data-id="<?php echo $pedido['id']; ?>"
                                            data-cliente="<?php echo htmlspecialchars($pedido['nombre'] . ' ' . $pedido['apellidos']); ?>"
                                            data-direccion="<?php echo htmlspecialchars($pedido['direccion_entrega']); ?>">
                                        <i class="fas fa-truck me-1"></i> Asignar Transportista
                                    </button>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
                <?php else: ?>
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i> No hay pedidos pendientes por asignar.
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<!-- Modal Asignar Transportista -->
<div class="modal fade" id="modalAsignarTransportista" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header text-white" style="background-color: var(--verde-oscuro);">
                <h5 class="modal-title">Asignar Transportista</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="form-asignar" action="gestionar_transportistas.php" method="POST">
                    <input type="hidden" name="asignar_pedido" value="1">
                    <input type="hidden" name="id_pedido" id="id_pedido">
                    
                    <div class="mb-3">
                        <p><strong>Pedido:</strong> #<span id="modal-pedido-id"></span></p>
                        <p><strong>Cliente:</strong> <span id="modal-cliente"></span></p>
                        <p><strong>Dirección:</strong> <span id="modal-direccion"></span></p>
                    </div>
                    
                    <div class="mb-3">
                        <label for="id_transportista" class="form-label">Seleccionar Transportista</label>
                        <select class="form-control" name="id_transportista" id="id_transportista" required>
                            <option value="">Seleccione un transportista...</option>
                            <?php 
                            // Reiniciar el puntero del resultado
                            if ($result_transportistas) {
                                $result_transportistas->data_seek(0);
                                while($t = $result_transportistas->fetch_assoc()) {
                                    if ($t['disponibilidad'] === 'disponible') {
                                        echo '<option value="'.$t['id'].'">'.$t['nombre'].' '.$t['apellidos'].' - '.$t['tipo_vehiculo'].' ('.$t['zona_cobertura'].')</option>';
                                    }
                                }
                            }
                            ?>
                        </select>
                        <?php if ($result_transportistas && $result_transportistas->num_rows > 0): ?>
                            <div class="form-text">Solo se muestran transportistas disponibles</div>
                        <?php else: ?>
                            <div class="form-text text-danger">No hay transportistas disponibles</div>
                        <?php endif; ?>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-naranja" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" form="form-asignar" class="btn btn-verde">Asignar</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal Cambiar Disponibilidad -->
<div class="modal fade" id="modalDisponibilidad" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header bg-success text-white">
                <h5 class="modal-title">Cambiar Disponibilidad</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="form-disponibilidad" action="gestionar_transportistas.php" method="POST">
                    <input type="hidden" name="cambiar_disponibilidad" value="1">
                    <input type="hidden" name="id_transportista" id="id_transportista_disp">
                    
                    <div class="mb-3">
                        <p>Transportista: <strong><span id="nombre-transportista"></span></strong></p>
                        <p>Disponibilidad actual: <span id="disponibilidad-actual"></span></p>
                    </div>
                    
                    <div class="mb-3">
                        <label for="disponibilidad" class="form-label">Nueva Disponibilidad</label>
                        <select class="form-control" name="disponibilidad" id="disponibilidad" required>
                            <option value="disponible">Disponible</option>
                            <option value="en ruta">En Ruta</option>
                            <option value="no disponible">No Disponible</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" form="form-disponibilidad" class="btn btn-success">Guardar Cambios</button>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Modal Asignar Transportista
    const modalAsignar = new bootstrap.Modal(document.getElementById('modalAsignarTransportista'));
    const btnsAsignar = document.querySelectorAll('.btn-asignar-pedido');
    
    btnsAsignar.forEach(btn => {
        btn.addEventListener('click', function() {
            const pedidoId = this.dataset.id;
            const cliente = this.dataset.cliente;
            const direccion = this.dataset.direccion;
            
            document.getElementById('id_pedido').value = pedidoId;
            document.getElementById('modal-pedido-id').textContent = pedidoId;
            document.getElementById('modal-cliente').textContent = cliente;
            document.getElementById('modal-direccion').textContent = direccion;
            
            modalAsignar.show();
        });
    });
    
    // Modal Cambiar Disponibilidad
    const modalDisponibilidad = new bootstrap.Modal(document.getElementById('modalDisponibilidad'));
    const btnsCambiarDisponibilidad = document.querySelectorAll('.btn-cambiar-disponibilidad');
    
    btnsCambiarDisponibilidad.forEach(btn => {
        btn.addEventListener('click', function() {
            const transportistaId = this.dataset.id;
            const nombre = this.dataset.nombre;
            const disponibilidadActual = this.dataset.disponibilidad;
            
            document.getElementById('id_transportista_disp').value = transportistaId;
            document.getElementById('nombre-transportista').textContent = nombre;
            
            // Mostrar disponibilidad actual con formato
            let badgeClass = '';
            switch(disponibilidadActual) {
                case 'disponible':
                    badgeClass = 'success';
                    break;
                case 'en ruta':
                    badgeClass = 'primary';
                    break;
                case 'no disponible':
                    badgeClass = 'danger';
                    break;
            }
            
            document.getElementById('disponibilidad-actual').innerHTML = 
                `<span class="badge bg-${badgeClass}">${disponibilidadActual.charAt(0).toUpperCase() + disponibilidadActual.slice(1)}</span>`;
            
            // Seleccionar la disponibilidad actual en el select
            document.getElementById('disponibilidad').value = disponibilidadActual;
            
            modalDisponibilidad.show();
        });
    });
});
</script>

<?php
// Incluir el pie de página
include '../includes/footer.php';
?>
