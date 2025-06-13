<?php
// Incluir el encabezado
include '../includes/header.php';

// Obtener filtros
$estado = isset($_GET['estado']) ? $_GET['estado'] : '';
$fecha_inicio = isset($_GET['fecha_inicio']) ? $_GET['fecha_inicio'] : '';
$fecha_fin = isset($_GET['fecha_fin']) ? $_GET['fecha_fin'] : '';
$cliente = isset($_GET['cliente']) ? intval($_GET['cliente']) : 0;

// Construir la consulta base
$sql = "SELECT p.id, p.fecha_pedido, p.fecha_entrega, p.estado, p.total, 
              c.id as cliente_id, u.nombre, u.apellidos, 
              t.id as transportista_id, ut.nombre as transportista_nombre, ut.apellidos as transportista_apellidos
       FROM pedidos p
       JOIN clientes c ON p.id_cliente = c.id
       JOIN usuarios u ON c.id_usuario = u.id
       LEFT JOIN transportistas t ON p.id_transportista = t.id
       LEFT JOIN usuarios ut ON t.id_usuario = ut.id
       WHERE 1=1";

// Aplicar filtros
$params = array();
$types = "";

if (!empty($estado)) {
    $sql .= " AND p.estado = ?";
    $params[] = $estado;
    $types .= "s";
}

if (!empty($fecha_inicio)) {
    $sql .= " AND DATE(p.fecha_pedido) >= ?";
    $params[] = $fecha_inicio;
    $types .= "s";
}

if (!empty($fecha_fin)) {
    $sql .= " AND DATE(p.fecha_pedido) <= ?";
    $params[] = $fecha_fin;
    $types .= "s";
}

if ($cliente > 0) {
    $sql .= " AND c.id = ?";
    $params[] = $cliente;
    $types .= "i";
}

// Si es cliente, solo mostrar sus pedidos
if ($_SESSION['usuario_rol'] === 'cliente') {
    // Obtener el ID del cliente
    $sql_cliente = "SELECT id FROM clientes WHERE id_usuario = ?";
    $stmt_cliente = $conexion->prepare($sql_cliente);
    $stmt_cliente->bind_param("i", $_SESSION['usuario_id']);
    $stmt_cliente->execute();
    $result_cliente = $stmt_cliente->get_result();
    
    if ($result_cliente->num_rows > 0) {
        $cliente_data = $result_cliente->fetch_assoc();
        $id_cliente = $cliente_data['id'];
        
        $sql .= " AND c.id = ?";
        $params[] = $id_cliente;
        $types .= "i";
    } else {
        // No tiene cliente asociado
        echo '<div class="alert alert-warning">No tiene un perfil de cliente asociado.</div>';
        include 'includes/footer.php';
        exit();
    }
}

// Si es transportista, solo mostrar sus pedidos asignados
if ($_SESSION['usuario_rol'] === 'transportista') {
    // Obtener el ID del transportista
    $sql_transportista = "SELECT id FROM transportistas WHERE id_usuario = ?";
    $stmt_transportista = $conexion->prepare($sql_transportista);
    $stmt_transportista->bind_param("i", $_SESSION['usuario_id']);
    $stmt_transportista->execute();
    $result_transportista = $stmt_transportista->get_result();
    
    if ($result_transportista->num_rows > 0) {
        $transportista_data = $result_transportista->fetch_assoc();
        $id_transportista = $transportista_data['id'];
        
        $sql .= " AND t.id = ?";
        $params[] = $id_transportista;
        $types .= "i";
    } else {
        // No tiene transportista asociado
        echo '<div class="alert alert-warning">No tiene un perfil de transportista asociado.</div>';
        include 'includes/footer.php';
        exit();
    }
}

// Ordenar por fecha de pedido, más recientes primero
$sql .= " ORDER BY p.fecha_pedido DESC";

// Preparar y ejecutar consulta
$stmt = $conexion->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

// Obtener clientes para el filtro
$sql_clientes = "SELECT c.id, u.nombre, u.apellidos 
                FROM clientes c 
                JOIN usuarios u ON c.id_usuario = u.id
                ORDER BY u.nombre, u.apellidos";
$result_clientes = $conexion->query($sql_clientes);
$clientes = array();
if ($result_clientes) {
    while ($row = $result_clientes->fetch_assoc()) {
        $clientes[] = $row;
    }
}
?>

<div class="row mb-4">
    <div class="col-md-12">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="../dashboard/dashboard.php">Dashboard</a></li>
                <li class="breadcrumb-item active" aria-current="page">Consultar Pedidos</li>
            </ol>
        </nav>
        
        <h2 class="mb-4"><i class="fas fa-search me-2"></i>Consultar Pedidos</h2>
    </div>
</div>

<!-- Filtros -->
<div class="row mb-4">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header card-header-custom">
                <i class="fas fa-filter me-2"></i> Filtros de Búsqueda
            </div>
            <div class="card-body">
                <form action="consultar_pedidos.php" method="GET" class="row g-3">
                    <!-- Estado -->
                    <div class="col-md-3">
                        <label for="estado" class="form-label">Estado</label>
                        <select class="form-control" id="estado" name="estado">
                            <option value="">Todos</option>
                            <option value="pendiente" <?php echo $estado === 'pendiente' ? 'selected' : ''; ?>>Pendiente</option>
                            <option value="preparando" <?php echo $estado === 'preparando' ? 'selected' : ''; ?>>Preparando</option>
                            <option value="en_camino" <?php echo $estado === 'en_camino' ? 'selected' : ''; ?>>En Camino</option>
                            <option value="entregado" <?php echo $estado === 'entregado' ? 'selected' : ''; ?>>Entregado</option>
                            <option value="cancelado" <?php echo $estado === 'cancelado' ? 'selected' : ''; ?>>Cancelado</option>
                        </select>
                    </div>
                    
                    <!-- Rango de fechas -->
                    <div class="col-md-3">
                        <label for="fecha_inicio" class="form-label">Desde</label>
                        <input type="date" class="form-control" id="fecha_inicio" name="fecha_inicio" value="<?php echo $fecha_inicio; ?>">
                    </div>
                    
                    <div class="col-md-3">
                        <label for="fecha_fin" class="form-label">Hasta</label>
                        <input type="date" class="form-control" id="fecha_fin" name="fecha_fin" value="<?php echo $fecha_fin; ?>">
                    </div>
                    
                    <!-- Cliente (solo para admin) -->
                    <?php if ($_SESSION['usuario_rol'] === 'admin'): ?>
                    <div class="col-md-3">
                        <label for="cliente" class="form-label">Cliente</label>
                        <select class="form-control" id="cliente" name="cliente">
                            <option value="0">Todos</option>
                            <?php foreach($clientes as $c): ?>
                            <option value="<?php echo $c['id']; ?>" <?php echo $cliente === intval($c['id']) ? 'selected' : ''; ?>>
                                <?php echo $c['nombre'] . ' ' . $c['apellidos']; ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <?php endif; ?>
                    
                    <!-- Botones -->
                    <div class="col-12">
                        <button type="submit" class="btn btn-primary-custom">
                            <i class="fas fa-search me-2"></i>Buscar
                        </button>
                        <a href="consultar_pedidos.php" class="btn btn-secondary ms-2">
                            <i class="fas fa-sync-alt me-2"></i>Limpiar Filtros
                        </a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Resultados -->
<div class="row">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header card-header-custom d-flex justify-content-between align-items-center">
                <div>
                    <i class="fas fa-clipboard-list me-2"></i> Listado de Pedidos
                </div>
                <?php if ($_SESSION['usuario_rol'] === 'admin' || $_SESSION['usuario_rol'] === 'cliente'): ?>
                <a href="registrar_pedido.php" class="btn btn-verde btn-sm">
                    <i class="fas fa-plus-circle me-2"></i>Nuevo Pedido
                </a>
                <?php endif; ?>
            </div>
            <div class="card-body">
                <?php if ($result->num_rows > 0): ?>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Cliente</th>
                                <th>Fecha Pedido</th>
                                <th>Fecha Entrega</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Transportista</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php while($pedido = $result->fetch_assoc()): ?>
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
                                <td>$<?php echo number_format($pedido['total'], 2); ?></td>
                                <td>
                                    <span class="estado-<?php echo str_replace('_', '-', $pedido['estado']); ?>">
                                        <?php 
                                        $estados = [
                                            'pendiente' => 'Pendiente',
                                            'preparando' => 'Preparando',
                                            'en_camino' => 'En Camino',
                                            'entregado' => 'Entregado',
                                            'cancelado' => 'Cancelado'
                                        ];
                                        echo $estados[$pedido['estado']] ?? ucfirst($pedido['estado']);
                                        ?>
                                    </span>
                                </td>
                                <td>
                                    <?php 
                                    echo !empty($pedido['transportista_id']) 
                                        ? $pedido['transportista_nombre'] . ' ' . $pedido['transportista_apellidos']
                                        : 'No asignado';
                                    ?>
                                </td>
                                <td>
                                    <a href="ver_pedido.php?id=<?php echo $pedido['id']; ?>" class="btn btn-info btn-sm" title="Ver detalles">
                                        <i class="fas fa-eye"></i>
                                    </a>
                                    
                                    <?php if ($_SESSION['usuario_rol'] === 'admin'): ?>
                                    <a href="editar_pedido.php?id=<?php echo $pedido['id']; ?>" class="btn btn-warning btn-sm" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                    
                                    <?php if ($pedido['estado'] === 'pendiente'): ?>
                                    <button type="button" class="btn btn-danger btn-sm btn-cancelar" 
                                            data-id="<?php echo $pedido['id']; ?>" title="Cancelar">
                                        <i class="fas fa-times"></i>
                                    </button>
                                    <?php endif; ?>
                                    <?php endif; ?>
                                    
                                    <?php if ($_SESSION['usuario_rol'] === 'transportista' && $pedido['estado'] === 'en_camino'): ?>
                                    <a href="actualizar_entrega.php?id=<?php echo $pedido['id']; ?>" class="btn btn-success btn-sm" title="Actualizar entrega">
                                        <i class="fas fa-truck"></i>
                                    </a>
                                    <?php endif; ?>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
                <?php else: ?>
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i> No se encontraron pedidos con los filtros seleccionados.
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<!-- Modal de Cancelación -->
<div class="modal fade" id="modalCancelar" tabindex="-1" aria-labelledby="modalCancelarLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title" id="modalCancelarLabel">Cancelar Pedido</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>¿Está seguro que desea cancelar el pedido #<span id="pedido-id"></span>?</p>
                <p>Esta acción no se puede deshacer.</p>
                
                <div class="mb-3">
                    <label for="motivo_cancelacion" class="form-label">Motivo de Cancelación</label>
                    <textarea class="form-control" id="motivo_cancelacion" rows="3" required></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                <button type="button" class="btn btn-danger" id="btn-confirmar-cancelar">Confirmar Cancelación</button>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Modal de cancelación
    const modalCancelar = new bootstrap.Modal(document.getElementById('modalCancelar'));
    const btnsEliminar = document.querySelectorAll('.btn-cancelar');
    let pedidoIdCancelar = 0;
    
    btnsEliminar.forEach(btn => {
        btn.addEventListener('click', function() {
            pedidoIdCancelar = this.dataset.id;
            document.getElementById('pedido-id').textContent = pedidoIdCancelar;
            modalCancelar.show();
        });
    });
    
    // Confirmar cancelación
    document.getElementById('btn-confirmar-cancelar').addEventListener('click', function() {
        const motivo = document.getElementById('motivo_cancelacion').value.trim();
        
        if (!motivo) {
            alert('Por favor, indique el motivo de cancelación');
            return;
        }
        
        // Enviar solicitud de cancelación
        const formData = new FormData();
        formData.append('id_pedido', pedidoIdCancelar);
        formData.append('motivo', motivo);
        
        fetch('api/cancelar_pedido.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                modalCancelar.hide();
                
                // Mostrar mensaje y recargar
                const alert = document.createElement('div');
                alert.className = 'alert alert-success';
                alert.innerHTML = `<i class="fas fa-check-circle me-2"></i> ${data.message}`;
                
                document.querySelector('.container').insertAdjacentElement('afterbegin', alert);
                
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                alert(data.message || 'Error al cancelar el pedido');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error de conexión');
        });
    });
});
</script>

<?php
// Incluir el pie de página
include '../includes/footer.php';
?>
