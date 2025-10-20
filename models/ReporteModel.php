<?php
require_once 'Model.php';
class ReporteModel extends Model {
    public function obtenerDatos($fecha_inicio, $fecha_fin) {
        $datos = [];
        $stmt = $this->db->prepare("SELECT COUNT(DISTINCT p.id) as total_pedidos,
                                          SUM(dp.cantidad * dp.precio_unitario) as total_ventas,
                                          COUNT(DISTINCT p.id_cliente) as total_clientes_compraron,
                                          AVG(p.total) as promedio_venta
                                   FROM pedidos p
                                   JOIN detalles_pedido dp ON p.id = dp.id_pedido
                                   WHERE p.fecha_pedido BETWEEN ? AND ?");
        $stmt->bind_param('ss', $fecha_inicio, $fecha_fin);
        $stmt->execute();
        $datos['estadisticas'] = $stmt->get_result()->fetch_assoc();

        $stmt = $this->db->prepare("SELECT pr.id, pr.nombre, SUM(dp.cantidad) as cantidad_vendida,
                                          SUM(dp.cantidad * dp.precio_unitario) as total_vendido
                                   FROM detalles_pedido dp
                                   JOIN productos pr ON dp.id_producto = pr.id
                                   JOIN pedidos p ON dp.id_pedido = p.id
                                   WHERE p.fecha_pedido BETWEEN ? AND ?
                                   GROUP BY pr.id
                                   ORDER BY cantidad_vendida DESC
                                   LIMIT 10");
        $stmt->bind_param('ss', $fecha_inicio, $fecha_fin);
        $stmt->execute();
        $datos['productos'] = $stmt->get_result();

        $stmt = $this->db->prepare("SELECT DATE(p.fecha_pedido) as fecha, COUNT(p.id) as total_pedidos, SUM(p.total) as total_ventas
                                   FROM pedidos p
                                   WHERE p.fecha_pedido BETWEEN ? AND ?
                                   GROUP BY DATE(p.fecha_pedido)
                                   ORDER BY fecha");
        $stmt->bind_param('ss', $fecha_inicio, $fecha_fin);
        $stmt->execute();
        $datos['ventas_dia'] = $stmt->get_result();

        $stmt = $this->db->prepare("SELECT c.id, CONCAT(u.nombre, ' ', u.apellidos) as nombre_cliente,
                                          COUNT(p.id) as total_pedidos, SUM(p.total) as total_comprado
                                   FROM pedidos p
                                   JOIN clientes c ON p.id_cliente = c.id
                                   JOIN usuarios u ON c.id_usuario = u.id
                                   WHERE p.fecha_pedido BETWEEN ? AND ?
                                   GROUP BY c.id
                                   ORDER BY total_comprado DESC
                                   LIMIT 10");
        $stmt->bind_param('ss', $fecha_inicio, $fecha_fin);
        $stmt->execute();
        $datos['clientes'] = $stmt->get_result();

        $stmt = $this->db->prepare("SELECT t.id, CONCAT(u.nombre, ' ', u.apellidos) as nombre_transportista,
                                          COUNT(p.id) as total_pedidos,
                                          COUNT(CASE WHEN p.estado = 'entregado' THEN 1 END) as pedidos_entregados
                                   FROM pedidos p
                                   JOIN transportistas t ON p.id_transportista = t.id
                                   JOIN usuarios u ON t.id_usuario = u.id
                                   WHERE p.fecha_pedido BETWEEN ? AND ?
                                   GROUP BY t.id
                                   ORDER BY pedidos_entregados DESC
                                   LIMIT 10");
        $stmt->bind_param('ss', $fecha_inicio, $fecha_fin);
        $stmt->execute();
        $datos['transportistas'] = $stmt->get_result();

        $stmt = $this->db->prepare("SELECT ci.id, ci.nombre as ciudad, COUNT(p.id) as total_pedidos, SUM(p.total) as total_ventas
                                   FROM pedidos p
                                   JOIN clientes c ON p.id_cliente = c.id
                                   JOIN ciudades ci ON c.id_ciudad = ci.id
                                   WHERE p.fecha_pedido BETWEEN ? AND ?
                                   GROUP BY ci.id
                                   ORDER BY total_pedidos DESC
                                   LIMIT 10");
        $stmt->bind_param('ss', $fecha_inicio, $fecha_fin);
        $stmt->execute();
        $datos['ciudades'] = $stmt->get_result();

        return $datos;
    }
}
?>
