<?php
// API para cancelar pedidos
require_once 'config.php';

// Verificar sesión y permisos (solo admin puede cancelar pedidos)
verificarRol(['admin']);
$usuario_id = $_SESSION['usuario_id'];

// Recibir datos
$id_pedido = isset($_POST['id_pedido']) ? intval($_POST['id_pedido']) : 0;
$motivo = isset($_POST['motivo']) ? sanitizarEntrada($_POST['motivo']) : '';

if ($id_pedido <= 0 || empty($motivo)) {
    responderJSON(['success' => false, 'message' => 'Datos incompletos'], 400);
}

// Verificar que el pedido exista y pueda ser cancelado (solo pendiente o preparando)
$sql_verificar = "SELECT estado FROM pedidos WHERE id = ?";
$stmt_verificar = $conexion->prepare($sql_verificar);
$stmt_verificar->bind_param("i", $id_pedido);
$stmt_verificar->execute();
$result_verificar = $stmt_verificar->get_result();

if ($result_verificar->num_rows === 0) {
    responderJSON(['success' => false, 'message' => 'Pedido no encontrado'], 404);
}

$pedido = $result_verificar->fetch_assoc();
if ($pedido['estado'] !== 'pendiente' && $pedido['estado'] !== 'preparando') {
    responderJSON(['success' => false, 'message' => 'No se puede cancelar un pedido que ya está en camino o entregado'], 400);
}

// Iniciar transacción
$conexion->begin_transaction();

try {
    // Actualizar estado del pedido
    $sql_actualizar = "UPDATE pedidos SET estado = 'cancelado' WHERE id = ?";
    $stmt_actualizar = $conexion->prepare($sql_actualizar);
    $stmt_actualizar->bind_param("i", $id_pedido);
    $stmt_actualizar->execute();
    
    // Registrar en historial
    $sql_historial = "INSERT INTO historial_estados 
                    (id_pedido, estado_anterior, estado_nuevo, id_usuario, comentario) 
                    VALUES (?, ?, 'cancelado', ?, ?)";
    $stmt_historial = $conexion->prepare($sql_historial);
    $estado_anterior = $pedido['estado'];
    $stmt_historial->bind_param("isis", $id_pedido, $estado_anterior, $usuario_id, $motivo);
    $stmt_historial->execute();
    
    // Reintegrar productos al inventario
    $sql_detalles = "SELECT id_producto, cantidad FROM detalles_pedido WHERE id_pedido = ?";
    $stmt_detalles = $conexion->prepare($sql_detalles);
    $stmt_detalles->bind_param("i", $id_pedido);
    $stmt_detalles->execute();
    $result_detalles = $stmt_detalles->get_result();
    
    while ($detalle = $result_detalles->fetch_assoc()) {
        $sql_stock = "UPDATE productos SET stock = stock + ? WHERE id = ?";
        $stmt_stock = $conexion->prepare($sql_stock);
        $stmt_stock->bind_param("ii", $detalle['cantidad'], $detalle['id_producto']);
        $stmt_stock->execute();
    }
    
    // Confirmar transacción
    $conexion->commit();
    
    responderJSON([
        'success' => true,
        'message' => 'Pedido #' . $id_pedido . ' cancelado correctamente',
        'pedido_id' => $id_pedido
    ]);
    
} catch (Exception $e) {
    // Revertir transacción
    $conexion->rollback();
    responderJSON(['success' => false, 'message' => 'Error al cancelar pedido: ' . $e->getMessage()], 500);
}
?>
