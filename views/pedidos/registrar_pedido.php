<?php
// Incluir el encabezado
include '../includes/header.php';

// Verificar rol de usuario - Solo admin y clientes pueden registrar pedidos
if ($_SESSION['usuario_rol'] !== 'admin' && $_SESSION['usuario_rol'] !== 'cliente') {
    echo '<div class="alert alert-danger">No tiene permisos para acceder a esta sección</div>';
    include 'includes/footer.php';
    exit();
}

// Procesar el formulario de pedido
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validar datos básicos
    $id_cliente = isset($_POST['cliente']) ? intval($_POST['cliente']) : 0;
    $direccion_entrega = $_POST['direccion_entrega'] ?? '';
    $fecha_entrega = $_POST['fecha_entrega'] ?? '';
    $metodo_pago = $_POST['metodo_pago'] ?? 'efectivo';
    $notas = $_POST['notas'] ?? '';
    $total = isset($_POST['total']) ? floatval($_POST['total']) : 0;
    
    // Validar que haya productos
    if (!isset($_POST['productos']) || empty($_POST['productos'])) {
        echo '<div class="alert alert-danger">Debe agregar al menos un producto al pedido</div>';
    } else {
        // Iniciar transacción
        $conexion->begin_transaction();
        
        try {
            // Insertar pedido
            $sql_pedido = "INSERT INTO pedidos (id_cliente, fecha_entrega, estado, total, direccion_entrega, notas, metodo_pago) 
                          VALUES (?, ?, 'pendiente', ?, ?, ?, ?)";
            $stmt_pedido = $conexion->prepare($sql_pedido);
            $stmt_pedido->bind_param("isdsss", $id_cliente, $fecha_entrega, $total, $direccion_entrega, $notas, $metodo_pago);
            $stmt_pedido->execute();
            
            // Obtener ID del pedido insertado
            $id_pedido = $conexion->insert_id;
            
            // Insertar detalles del pedido
            $sql_detalle = "INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) 
                          VALUES (?, ?, ?, ?, ?)";
            $stmt_detalle = $conexion->prepare($sql_detalle);
            
            foreach ($_POST['productos'] as $producto) {
                if (empty($producto['id'])) continue;
                
                $id_producto = intval($producto['id']);
                $cantidad = intval($producto['cantidad']);
                $precio = floatval($producto['precio']);
                $subtotal = floatval($producto['subtotal']);
                
                $stmt_detalle->bind_param("iidd", $id_pedido, $id_producto, $cantidad, $precio, $subtotal);
                $stmt_detalle->execute();
                
                // Actualizar stock del producto (se resta la cantidad)
                $sql_stock = "UPDATE productos SET stock = stock - ? WHERE id = ?";
                $stmt_stock = $conexion->prepare($sql_stock);
                $stmt_stock->bind_param("ii", $cantidad, $id_producto);
                $stmt_stock->execute();
            }
            
            // Registrar en historial de estados
            $sql_historial = "INSERT INTO historial_estados (id_pedido, estado_anterior, estado_nuevo, id_usuario, comentario) 
                            VALUES (?, NULL, 'pendiente', ?, 'Pedido creado')";
            $stmt_historial = $conexion->prepare($sql_historial);
            $usuario_id = $_SESSION['usuario_id'];
            $stmt_historial->bind_param("ii", $id_pedido, $usuario_id);
            $stmt_historial->execute();
            
            // Confirmar transacción
            $conexion->commit();
            
            // Mostrar mensaje de éxito
            echo '<div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i> Pedido #'.$id_pedido.' registrado correctamente.
                    <a href="ver_pedido.php?id='.$id_pedido.'" class="alert-link">Ver detalles del pedido</a>
                  </div>';
            
            // Limpiar el formulario (redirigir a la misma página)
            echo '<script>
                    setTimeout(function() {
                        window.location.href = "registrar_pedido.php?success=true";
                    }, 2000);
                  </script>';
                  
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conexion->rollback();
            echo '<div class="alert alert-danger">Error al registrar el pedido: ' . $e->getMessage() . '</div>';
        }
    }
}

// Obtener clientes para el selector
$sql_clientes = "SELECT c.id, u.nombre, u.apellidos, c.direccion, c.ciudad 
                FROM clientes c 
                JOIN usuarios u ON c.id_usuario = u.id
                WHERE u.estado = 'activo'
                ORDER BY u.nombre, u.apellidos";
$result_clientes = $conexion->query($sql_clientes);
$clientes = array();
if ($result_clientes) {
    while ($row = $result_clientes->fetch_assoc()) {
        $clientes[] = $row;
    }
}

// Obtener productos disponibles
$sql_productos = "SELECT p.id, p.nombre, p.precio, p.unidad_medida, p.stock, p.categoria, pr.nombre_empresa
                 FROM productos p
                 LEFT JOIN proveedores pr ON p.id_proveedor = pr.id
                 WHERE p.estado = 'disponible' AND p.stock > 0
                 ORDER BY p.nombre";
$result_productos = $conexion->query($sql_productos);
$productos = array();
if ($result_productos) {
    while ($row = $result_productos->fetch_assoc()) {
        $productos[] = $row;
    }
}
?>

<div class="row mb-4">
    <div class="col-md-12">
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="../dashboard/dashboard.php">Dashboard</a></li>
                <li class="breadcrumb-item active" aria-current="page">Registrar Pedido</li>
            </ol>
        </nav>
        
        <h2 class="mb-4"><i class="fas fa-plus-circle me-2"></i>Registrar Nuevo Pedido</h2>
        
        <?php if (isset($_GET['success']) && $_GET['success'] === 'true'): ?>
        <div class="alert alert-success">
            <i class="fas fa-check-circle me-2"></i> Pedido registrado correctamente.
        </div>
        <?php endif; ?>
    </div>
</div>

<div class="row">
    <div class="col-md-12">
        <div class="card">
            <div class="card-header card-header-custom">
                <i class="fas fa-clipboard-list me-2"></i> Formulario de Pedido
            </div>
            <div class="card-body">
                <form action="registrar_pedido.php" method="POST" id="form-pedido">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h5 class="mb-3">Datos del Cliente</h5>
                            
                            <div class="mb-3">
                                <label for="cliente" class="form-label">Cliente</label>
                                <select class="form-control" id="cliente" name="cliente" required>
                                    <option value="">Seleccionar cliente</option>
                                    <?php foreach($clientes as $cliente): ?>
                                    <option value="<?php echo $cliente['id']; ?>" 
                                            data-direccion="<?php echo htmlspecialchars($cliente['direccion']); ?>"
                                            data-ciudad="<?php echo htmlspecialchars($cliente['ciudad']); ?>">
                                        <?php echo $cliente['nombre'] . ' ' . $cliente['apellidos']; ?>
                                    </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="direccion_entrega" class="form-label">Dirección de Entrega</label>
                                <textarea class="form-control" id="direccion_entrega" name="direccion_entrega" rows="3" required></textarea>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <h5 class="mb-3">Datos del Pedido</h5>
                            
                            <div class="mb-3">
                                <label for="fecha_entrega" class="form-label">Fecha de Entrega</label>
                                <input type="datetime-local" class="form-control" id="fecha_entrega" name="fecha_entrega" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="metodo_pago" class="form-label">Método de Pago</label>
                                <select class="form-control" id="metodo_pago" name="metodo_pago" required>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="transferencia">Transferencia</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="notas" class="form-label">Notas Adicionales</label>
                                <textarea class="form-control" id="notas" name="notas" rows="3"></textarea>
                            </div>
                        </div>
                    </div>
                    
                    <hr>
                    
                    <h5 class="mb-3">Productos</h5>
                    
                    <div class="row mb-3 bg-light py-2 fw-bold">
                        <div class="col-md-5">Producto</div>
                        <div class="col-md-2">Cantidad</div>
                        <div class="col-md-2">Precio</div>
                        <div class="col-md-2">Subtotal</div>
                        <div class="col-md-1">Acción</div>
                    </div>
                    
                    <div id="productos-container">
                        <!-- Aquí se agregarán dinámicamente los productos -->
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-md-12">
                            <button type="button" id="btn-agregar-producto" class="btn btn-outline-success">
                                <i class="fas fa-plus-circle me-2"></i>Agregar Producto
                            </button>
                        </div>
                    </div>
                    
                    <hr>
                    
                    <div class="row">
                        <div class="col-md-6 offset-md-6">
                            <div class="mb-3 d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Total:</h5>
                                <div class="input-group" style="max-width: 200px;">
                                    <span class="input-group-text">$</span>
                                    <input type="text" class="form-control text-end" id="total-pedido" name="total" value="0.00" readonly>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-end mt-4">
                        <a href="../dashboard/dashboard.php" class="btn btn-secondary me-2">Cancelar</a>
                        <button type="submit" class="btn btn-primary-custom">
                            <i class="fas fa-save me-2"></i>Registrar Pedido
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Template para productos -->
<template id="template-producto">
    <div class="row producto-fila mb-3">
        <div class="col-md-5">
            <select class="form-control producto" name="productos[__index__][id]" required>
                <option value="">Seleccionar producto</option>
                <?php foreach($productos as $producto): ?>
                <option value="<?php echo $producto['id']; ?>" 
                        data-precio="<?php echo $producto['precio']; ?>"
                        data-stock="<?php echo $producto['stock']; ?>"
                        data-unidad="<?php echo $producto['unidad_medida']; ?>">
                    <?php echo $producto['nombre']; ?> - $<?php echo number_format($producto['precio'], 2); ?>/<?php echo $producto['unidad_medida']; ?>
                    (<?php echo $producto['stock']; ?> disponibles)
                </option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control cantidad" name="productos[__index__][cantidad]" min="1" value="1" required>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control precio" name="productos[__index__][precio]" step="0.01" value="0.00" readonly>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control subtotal" name="productos[__index__][subtotal]" step="0.01" value="0.00" readonly>
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-danger btn-eliminar-producto">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    </div>
</template>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos
    const productosContainer = document.getElementById('productos-container');
    const btnAgregarProducto = document.getElementById('btn-agregar-producto');
    const templateProducto = document.getElementById('template-producto');
    const formPedido = document.getElementById('form-pedido');
    
    // Contador para índices de productos
    let productoIndex = 0;
    
    // Función para agregar producto
    function agregarProducto() {
        // Clonar template
        const productoHtml = templateProducto.innerHTML.replace(/__index__/g, productoIndex);
        
        // Insertar en el contenedor
        productosContainer.insertAdjacentHTML('beforeend', productoHtml);
        
        // Obtener la fila recién agregada
        const filaProducto = productosContainer.lastElementChild;
        
        // Asignar eventos
        const selectProducto = filaProducto.querySelector('.producto');
        const inputCantidad = filaProducto.querySelector('.cantidad');
        const btnEliminar = filaProducto.querySelector('.btn-eliminar-producto');
        
        // Evento al seleccionar producto
        selectProducto.addEventListener('change', function() {
            const option = this.options[this.selectedIndex];
            const precio = option.dataset.precio || 0;
            const stock = option.dataset.stock || 0;
            
            // Establecer precio y actualizar subtotal
            filaProducto.querySelector('.precio').value = precio;
            inputCantidad.max = stock;
            
            calcularSubtotal(filaProducto);
        });
        
        // Evento al cambiar cantidad
        inputCantidad.addEventListener('change', function() {
            calcularSubtotal(filaProducto);
        });
        
        // Evento al eliminar producto
        btnEliminar.addEventListener('click', function() {
            filaProducto.remove();
            calcularTotal();
        });
        
        // Incrementar contador
        productoIndex++;
    }
    
    // Calcular subtotal de un producto
    function calcularSubtotal(filaProducto) {
        const cantidad = parseFloat(filaProducto.querySelector('.cantidad').value) || 0;
        const precio = parseFloat(filaProducto.querySelector('.precio').value) || 0;
        const subtotal = cantidad * precio;
        
        filaProducto.querySelector('.subtotal').value = subtotal.toFixed(2);
        
        calcularTotal();
    }
    
    // Calcular total del pedido
    function calcularTotal() {
        const subtotales = document.querySelectorAll('.subtotal');
        let total = 0;
        
        subtotales.forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        
        document.getElementById('total-pedido').value = total.toFixed(2);
    }
    
    // Evento para agregar producto
    btnAgregarProducto.addEventListener('click', agregarProducto);
    
    // Autocompletar dirección al seleccionar cliente
    const selectCliente = document.getElementById('cliente');
    selectCliente.addEventListener('change', function() {
        const option = this.options[this.selectedIndex];
        if (option.value) {
            const direccion = option.dataset.direccion || '';
            const ciudad = option.dataset.ciudad || '';
            document.getElementById('direccion_entrega').value = `${direccion}, ${ciudad}`;
        } else {
            document.getElementById('direccion_entrega').value = '';
        }
    });
    
    // Validar formulario antes de enviar
    formPedido.addEventListener('submit', function(e) {
        const productos = productosContainer.querySelectorAll('.producto-fila');
        
        if (productos.length === 0) {
            e.preventDefault();
            alert('Debe agregar al menos un producto al pedido');
            return false;
        }
        
        // Verificar que todos los productos tengan un ID válido
        let valido = true;
        productos.forEach(fila => {
            const selectProducto = fila.querySelector('.producto');
            if (!selectProducto.value) {
                valido = false;
            }
        });
        
        if (!valido) {
            e.preventDefault();
            alert('Hay productos sin seleccionar');
            return false;
        }
        
        return true;
    });
    
    // Agregar un producto inicial
    agregarProducto();
    
    // Establecer fecha mínima de entrega (mañana)
    const fechaEntrega = document.getElementById('fecha_entrega');
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(12, 0, 0, 0);
    
    const fechaMin = manana.toISOString().slice(0, 16);
    fechaEntrega.min = fechaMin;
    fechaEntrega.value = fechaMin;
});
</script>

<?php
// Incluir el pie de página
include '../includes/footer.php';
?>
