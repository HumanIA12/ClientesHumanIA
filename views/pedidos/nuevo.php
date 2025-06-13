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
$query_cliente = "SELECT c.*, ci.nombre as ciudad FROM clientes c 
                  JOIN ciudades ci ON c.id_ciudad = ci.id 
                  WHERE c.id_usuario = ?";
$stmt = $conexion->prepare($query_cliente);
$stmt->bind_param("i", $_SESSION['usuario_id']);
$stmt->execute();
$result = $stmt->get_result();
$cliente = $result->fetch_assoc();
$id_cliente = $cliente['id'];

// Obtener productos disponibles
$query_productos = "SELECT id, nombre, descripcion, precio, stock FROM productos WHERE estado = 'disponible' AND stock > 0 ORDER BY nombre";
$resultado_productos = $conexion->query($query_productos);

// Obtener ciudades para entrega
$query_ciudades = "SELECT id, nombre FROM ciudades ORDER BY nombre";
$resultado_ciudades = $conexion->query($query_ciudades);

// Variables para mensaje
$mensaje = '';
$tipo_mensaje = '';

// Procesar formulario de pedido
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Recoger datos del formulario
    $direccion_entrega = $_POST['direccion_entrega'] ?? '';
    $id_ciudad = $_POST['id_ciudad'] ?? $cliente['id_ciudad'];
    $fecha_entrega = $_POST['fecha_entrega'] ?? '';
    $hora_entrega = $_POST['hora_entrega'] ?? '12:00';
    $fecha_hora_entrega = $fecha_entrega . ' ' . $hora_entrega . ':00';
    $refrigeracion = isset($_POST['refrigeracion']) ? 1 : 0;
    $temperatura = $_POST['temperatura'] ?? '2.0';
    $metodo_pago = $_POST['metodo_pago'] ?? 'efectivo';
    $notas = $_POST['notas'] ?? '';
    
    // Productos y total
    $productos_pedido = [];
    $total = 0;
    
    if (isset($_POST['producto_id']) && is_array($_POST['producto_id'])) {
        for ($i = 0; $i < count($_POST['producto_id']); $i++) {
            if (empty($_POST['producto_id'][$i]) || empty($_POST['cantidad'][$i])) continue;
            
            $id_producto = intval($_POST['producto_id'][$i]);
            $cantidad = intval($_POST['cantidad'][$i]);
            $precio = floatval($_POST['precio'][$i]);
            $subtotal = $precio * $cantidad;
            $total += $subtotal;
            
            // Verificar stock disponible
            $query_stock = "SELECT stock FROM productos WHERE id = ?";
            $stmt_stock = $conexion->prepare($query_stock);
            $stmt_stock->bind_param("i", $id_producto);
            $stmt_stock->execute();
            $stock_actual = $stmt_stock->get_result()->fetch_assoc()['stock'];
            
            if ($stock_actual < $cantidad) {
                $mensaje = "No hay suficiente stock para el producto ID $id_producto. Stock disponible: $stock_actual";
                $tipo_mensaje = 'danger';
                break;
            }
            
            $productos_pedido[] = [
                'id' => $id_producto,
                'cantidad' => $cantidad,
                'precio' => $precio,
                'subtotal' => $subtotal
            ];
        }
    }
    
    // Calcular costo de transporte (10% del total)
    $costo_transporte = $total * 0.1;
    $total_facturado = $total + $costo_transporte;
    
    // Si no hay errores y hay productos, crear el pedido
    if (empty($mensaje) && !empty($productos_pedido)) {
        // Iniciar transacción
        $conexion->begin_transaction();
        
        try {
            // Insertar pedido
            $sql_pedido = "INSERT INTO pedidos (id_cliente, fecha_pedido, fecha_entrega, estado, total, 
                          costo_transporte, total_facturado, direccion_entrega, id_ciudad_entrega, 
                          refrigeracion_requerida, temperatura_requerida, notas, metodo_pago) 
                          VALUES (?, NOW(), ?, 'pendiente', ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt_pedido = $conexion->prepare($sql_pedido);
            $stmt_pedido->bind_param("isdddsidss", $id_cliente, $fecha_hora_entrega, $total, $costo_transporte, 
                               $total_facturado, $direccion_entrega, $id_ciudad, $refrigeracion, $temperatura, 
                               $notas, $metodo_pago);
            $stmt_pedido->execute();
            
            // Obtener ID del pedido insertado
            $id_pedido = $conexion->insert_id;
            
            // Insertar detalles del pedido
            $sql_detalle = "INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) 
                          VALUES (?, ?, ?, ?, ?)";
            $stmt_detalle = $conexion->prepare($sql_detalle);
            
            foreach ($productos_pedido as $producto) {
                $stmt_detalle->bind_param("iiids", $id_pedido, $producto['id'], $producto['cantidad'], 
                                      $producto['precio'], $producto['subtotal']);
                $stmt_detalle->execute();
                
                // Actualizar stock
                $sql_update_stock = "UPDATE productos SET stock = stock - ? WHERE id = ?";
                $stmt_stock = $conexion->prepare($sql_update_stock);
                $stmt_stock->bind_param("ii", $producto['cantidad'], $producto['id']);
                $stmt_stock->execute();
            }
            
            // Confirmar transacción
            $conexion->commit();
            
            $mensaje = "Pedido #$id_pedido creado correctamente";
            $tipo_mensaje = 'success';
            
            // Redireccionar a la página de mis pedidos
            header("Refresh: 2; URL=mis_pedidos.php");
            
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conexion->rollback();
            $mensaje = "Error al procesar el pedido: " . $e->getMessage();
            $tipo_mensaje = 'danger';
        }
    } elseif (empty($productos_pedido)) {
        $mensaje = "Debe agregar al menos un producto al pedido";
        $tipo_mensaje = 'danger';
    }
}

// Fecha mínima (hoy + 1 día)
$fecha_minima = date('Y-m-d', strtotime('+1 day'));
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuevo Pedido - Frutale</title>
    <link rel="stylesheet" href="../../assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="../../assets/css/estilos.css">
    <link rel="stylesheet" href="../../assets/css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        .producto-seleccionado {
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 5px;
            background-color: #f8f9fa;
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
                    <a class="nav-link active" href="#"><i class="fas fa-plus-circle"></i> Nuevo Pedido</a>
                    <a class="nav-link" href="tracking.php"><i class="fas fa-map-marker-alt"></i> Tracking</a>
                    <a class="nav-link" href="../perfil/editar.php"><i class="fas fa-user-edit"></i> Mi Perfil</a>
                    <a class="nav-link" href="../../api/auth/logout.php"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
                </div>
            </div>
            
            <!-- Main Content -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">Nuevo Pedido</h1>
                </div>
                
                <?php if (!empty($mensaje)): ?>
                    <div class="alert alert-<?php echo $tipo_mensaje; ?> alert-dismissible fade show" role="alert">
                        <?php echo $mensaje; ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                <?php endif; ?>
                
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Información del Pedido</h5>
                    </div>
                    <div class="card-body">
                        <form method="POST" action="" id="formulario-pedido">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="direccion_entrega" class="form-label">Dirección de entrega</label>
                                    <input type="text" class="form-control" id="direccion_entrega" name="direccion_entrega" value="<?php echo htmlspecialchars($cliente['direccion']); ?>" required>
                                </div>
                                <div class="col-md-6">
                                    <label for="id_ciudad" class="form-label">Ciudad de entrega</label>
                                    <select class="form-select" id="id_ciudad" name="id_ciudad" required>
                                        <?php while ($ciudad = $resultado_ciudades->fetch_assoc()): ?>
                                            <option value="<?php echo $ciudad['id']; ?>" <?php echo $ciudad['id'] == $cliente['id_ciudad'] ? 'selected' : ''; ?>>
                                                <?php echo htmlspecialchars($ciudad['nombre']); ?>
                                            </option>
                                        <?php endwhile; ?>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="fecha_entrega" class="form-label">Fecha de entrega</label>
                                    <input type="date" class="form-control" id="fecha_entrega" name="fecha_entrega" min="<?php echo $fecha_minima; ?>" required>
                                </div>
                                <div class="col-md-6">
                                    <label for="hora_entrega" class="form-label">Hora aproximada</label>
                                    <select class="form-select" id="hora_entrega" name="hora_entrega" required>
                                        <option value="09:00">09:00 AM</option>
                                        <option value="10:00">10:00 AM</option>
                                        <option value="11:00">11:00 AM</option>
                                        <option value="12:00" selected>12:00 PM</option>
                                        <option value="13:00">01:00 PM</option>
                                        <option value="14:00">02:00 PM</option>
                                        <option value="15:00">03:00 PM</option>
                                        <option value="16:00">04:00 PM</option>
                                        <option value="17:00">05:00 PM</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="refrigeracion" name="refrigeracion" checked>
                                        <label class="form-check-label" for="refrigeracion">Requiere refrigeración</label>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label for="temperatura" class="form-label">Temperatura requerida (°C)</label>
                                    <input type="number" class="form-control" id="temperatura" name="temperatura" value="2.0" step="0.5" min="0" max="10">
                                </div>
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label for="metodo_pago" class="form-label">Método de pago</label>
                                    <select class="form-select" id="metodo_pago" name="metodo_pago" required>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="transferencia">Transferencia bancaria</option>
                                        <option value="yape">Yape</option>
                                        <option value="plin">Plin</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label for="notas" class="form-label">Notas adicionales</label>
                                    <textarea class="form-control" id="notas" name="notas" rows="2"></textarea>
                                </div>
                            </div>
                            
                            <hr class="my-4">
                            
                            <h5 class="mb-3">Productos</h5>
                            
                            <div class="row mb-3">
                                <div class="col-md-8">
                                    <label for="producto_select" class="form-label">Seleccionar producto</label>
                                    <select class="form-select" id="producto_select">
                                        <option value="">-- Seleccione un producto --</option>
                                        <?php if ($resultado_productos->num_rows > 0): ?>
                                            <?php while ($producto = $resultado_productos->fetch_assoc()): ?>
                                                <option value="<?php echo $producto['id']; ?>" 
                                                        data-nombre="<?php echo htmlspecialchars($producto['nombre']); ?>"
                                                        data-precio="<?php echo $producto['precio']; ?>"
                                                        data-stock="<?php echo $producto['stock']; ?>">
                                                    <?php echo htmlspecialchars($producto['nombre']); ?> - $<?php echo $producto['precio']; ?> (Stock: <?php echo $producto['stock']; ?>)
                                                </option>
                                            <?php endwhile; ?>
                                        <?php endif; ?>
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label for="cantidad_select" class="form-label">Cantidad</label>
                                    <input type="number" class="form-control" id="cantidad_select" value="1" min="1" max="100">
                                </div>
                                <div class="col-md-1 d-flex align-items-end">
                                    <button type="button" class="btn btn-primary" id="agregar_producto">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div id="productos_seleccionados" class="mb-4">
                                <!-- Aquí se agregarán los productos seleccionados dinámicamente -->
                            </div>
                            
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between mb-2">
                                                <h6>Subtotal:</h6>
                                                <span id="subtotal">$0.00</span>
                                            </div>
                                            <div class="d-flex justify-content-between mb-2">
                                                <h6>Costo de transporte (10%):</h6>
                                                <span id="costo_transporte">$0.00</span>
                                            </div>
                                            <div class="d-flex justify-content-between">
                                                <h5>Total:</h5>
                                                <h5 id="total_facturado">$0.00</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <a href="mis_pedidos.php" class="btn btn-secondary me-md-2">Cancelar</a>
                                <button type="submit" class="btn btn-primary" id="btn_realizar_pedido">Realizar Pedido</button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    </div>
    
    <script src="../../assets/js/bootstrap.bundle.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const productoSelect = document.getElementById('producto_select');
            const cantidadSelect = document.getElementById('cantidad_select');
            const btnAgregar = document.getElementById('agregar_producto');
            const productosSeleccionados = document.getElementById('productos_seleccionados');
            const subtotalElement = document.getElementById('subtotal');
            const costoTransporteElement = document.getElementById('costo_transporte');
            const totalFacturadoElement = document.getElementById('total_facturado');
            const formPedido = document.getElementById('formulario-pedido');
            const refrigeracionCheck = document.getElementById('refrigeracion');
            const temperaturaInput = document.getElementById('temperatura');
            
            // Fecha mínima para entrega (hoy + 1 día)
            const fechaEntregaInput = document.getElementById('fecha_entrega');
            fechaEntregaInput.value = '<?php echo $fecha_minima; ?>';
            
            // Estado inicial de refrigeración
            temperaturaInput.disabled = !refrigeracionCheck.checked;
            
            // Eventos
            refrigeracionCheck.addEventListener('change', function() {
                temperaturaInput.disabled = !this.checked;
                if (!this.checked) {
                    temperaturaInput.value = "0";
                } else {
                    temperaturaInput.value = "2.0";
                }
            });
            
            let productos = [];
            let subtotal = 0;
            let costoTransporte = 0;
            let totalFacturado = 0;
            
            // Función para actualizar totales
            function actualizarTotales() {
                subtotal = productos.reduce((sum, producto) => sum + (producto.precio * producto.cantidad), 0);
                costoTransporte = subtotal * 0.1;
                totalFacturado = subtotal + costoTransporte;
                
                subtotalElement.textContent = '$' + subtotal.toFixed(2);
                costoTransporteElement.textContent = '$' + costoTransporte.toFixed(2);
                totalFacturadoElement.textContent = '$' + totalFacturado.toFixed(2);
            }
            
            // Función para renderizar productos seleccionados
            function renderizarProductos() {
                productosSeleccionados.innerHTML = '';
                
                productos.forEach((producto, index) => {
                    const div = document.createElement('div');
                    div.className = 'producto-seleccionado';
                    div.innerHTML = `
                        <div class="row">
                            <div class="col-md-5">
                                <strong>${producto.nombre}</strong>
                                <input type="hidden" name="producto_id[]" value="${producto.id}">
                                <input type="hidden" name="precio[]" value="${producto.precio}">
                            </div>
                            <div class="col-md-3">
                                <div class="input-group">
                                    <button type="button" class="btn btn-outline-secondary btn-sm decrementar" data-index="${index}">-</button>
                                    <input type="number" class="form-control form-control-sm cantidad-input" name="cantidad[]" value="${producto.cantidad}" min="1" max="${producto.stock}" data-index="${index}" required>
                                    <button type="button" class="btn btn-outline-secondary btn-sm incrementar" data-index="${index}">+</button>
                                </div>
                            </div>
                            <div class="col-md-3">
                                $${(producto.precio * producto.cantidad).toFixed(2)}
                                <input type="hidden" name="subtotal[]" value="${producto.precio * producto.cantidad}">
                            </div>
                            <div class="col-md-1">
                                <button type="button" class="btn btn-danger btn-sm eliminar" data-index="${index}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    productosSeleccionados.appendChild(div);
                });
                
                // Agregar eventos a los botones
                document.querySelectorAll('.decrementar').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.dataset.index);
                        if (productos[index].cantidad > 1) {
                            productos[index].cantidad--;
                            renderizarProductos();
                            actualizarTotales();
                        }
                    });
                });
                
                document.querySelectorAll('.incrementar').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.dataset.index);
                        if (productos[index].cantidad < productos[index].stock) {
                            productos[index].cantidad++;
                            renderizarProductos();
                            actualizarTotales();
                        }
                    });
                });
                
                document.querySelectorAll('.cantidad-input').forEach(input => {
                    input.addEventListener('change', function() {
                        const index = parseInt(this.dataset.index);
                        let cantidad = parseInt(this.value);
                        if (isNaN(cantidad) || cantidad < 1) {
                            cantidad = 1;
                        } else if (cantidad > productos[index].stock) {
                            cantidad = productos[index].stock;
                        }
                        productos[index].cantidad = cantidad;
                        this.value = cantidad;
                        renderizarProductos();
                        actualizarTotales();
                    });
                });
                
                document.querySelectorAll('.eliminar').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.dataset.index);
                        productos.splice(index, 1);
                        renderizarProductos();
                        actualizarTotales();
                    });
                });
            }
            
            // Agregar producto al carrito
            btnAgregar.addEventListener('click', function() {
                const productoId = productoSelect.value;
                if (!productoId) return;
                
                const option = productoSelect.options[productoSelect.selectedIndex];
                const nombre = option.dataset.nombre;
                const precio = parseFloat(option.dataset.precio);
                const stock = parseInt(option.dataset.stock);
                const cantidad = parseInt(cantidadSelect.value);
                
                // Validar cantidad
                if (isNaN(cantidad) || cantidad < 1) {
                    alert('Cantidad inválida');
                    return;
                }
                
                // Verificar si el producto ya está en la lista
                const productoExistente = productos.findIndex(p => p.id === productoId);
                
                if (productoExistente !== -1) {
                    // Aumentar cantidad si ya existe
                    const nuevaCantidad = productos[productoExistente].cantidad + cantidad;
                    if (nuevaCantidad <= stock) {
                        productos[productoExistente].cantidad = nuevaCantidad;
                    } else {
                        alert('No hay suficiente stock disponible');
                        return;
                    }
                } else {
                    // Agregar nuevo producto
                    if (cantidad <= stock) {
                        productos.push({
                            id: productoId,
                            nombre: nombre,
                            precio: precio,
                            stock: stock,
                            cantidad: cantidad
                        });
                    } else {
                        alert('No hay suficiente stock disponible');
                        return;
                    }
                }
                
                // Actualizar interfaz
                renderizarProductos();
                actualizarTotales();
                
                // Resetear selección
                productoSelect.value = '';
                cantidadSelect.value = 1;
            });
            
            // Validar formulario antes de enviar
            formPedido.addEventListener('submit', function(event) {
                if (productos.length === 0) {
                    event.preventDefault();
                    alert('Debe agregar al menos un producto al pedido');
                    return false;
                }
                
                return true;
            });
        });
    </script>
</body>
</html>
