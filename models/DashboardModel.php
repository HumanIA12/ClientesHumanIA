<?php
require_once 'Model.php';
class DashboardModel extends Model {
    public function totalPedidos() {
        $res = $this->db->query("SELECT COUNT(*) as total FROM pedidos");
        return $res->fetch_assoc()['total'];
    }
    public function totalClientes() {
        $res = $this->db->query("SELECT COUNT(*) as total FROM clientes");
        return $res->fetch_assoc()['total'];
    }
    public function totalTransportistas() {
        $res = $this->db->query("SELECT COUNT(*) as total FROM transportistas");
        return $res->fetch_assoc()['total'];
    }
    public function pedidosPorEstado() {
        $res = $this->db->query("SELECT estado, COUNT(*) as total FROM pedidos GROUP BY estado");
        $datos = [];
        while ($row = $res->fetch_assoc()) {
            $datos[$row['estado']] = $row['total'];
        }
        return $datos;
    }
    public function pedidosRecientes($limit = 5) {
        $sql = "SELECT p.id, CONCAT(u.nombre,' ',u.apellidos) as cliente, p.fecha_pedido, p.total, p.estado
                FROM pedidos p
                JOIN clientes c ON p.id_cliente = c.id
                JOIN usuarios u ON c.id_usuario = u.id
                ORDER BY p.fecha_pedido DESC
                LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $limit);
        $stmt->execute();
        return $stmt->get_result();
    }
    public function pedidosRefrigeracion() {
        $res = $this->db->query("SELECT COUNT(*) as total FROM pedidos WHERE refrigeracion_requerida = TRUE");
        return $res->fetch_assoc()['total'];
    }
    public function clienteStats($usuario_id) {
        $stmt = $this->db->prepare("SELECT id FROM clientes WHERE id_usuario = ?");
        $stmt->bind_param('i', $usuario_id);
        $stmt->execute();
        $id_cliente = $stmt->get_result()->fetch_assoc()['id'];

        $stats = [];
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM pedidos WHERE id_cliente = ?");
        $stmt->bind_param('i', $id_cliente);
        $stmt->execute();
        $stats['total_pedidos'] = $stmt->get_result()->fetch_assoc()['total'];

        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM pedidos WHERE id_cliente = ? AND estado = 'en_camino'");
        $stmt->bind_param('i', $id_cliente);
        $stmt->execute();
        $stats['total_en_camino'] = $stmt->get_result()->fetch_assoc()['total'];

        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM pedidos WHERE id_cliente = ? AND estado = 'entregado'");
        $stmt->bind_param('i', $id_cliente);
        $stmt->execute();
        $stats['total_entregados'] = $stmt->get_result()->fetch_assoc()['total'];

        return $stats;
    }
    public function transportistaStats($usuario_id) {
        $stmt = $this->db->prepare("SELECT id FROM transportistas WHERE id_usuario = ?");
        $stmt->bind_param('i', $usuario_id);
        $stmt->execute();
        $id_transportista = $stmt->get_result()->fetch_assoc()['id'];

        $stats = [];
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM pedidos WHERE id_transportista = ?");
        $stmt->bind_param('i', $id_transportista);
        $stmt->execute();
        $stats['total_pedidos'] = $stmt->get_result()->fetch_assoc()['total'];

        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM pedidos WHERE id_transportista = ? AND estado = 'en_camino'");
        $stmt->bind_param('i', $id_transportista);
        $stmt->execute();
        $stats['total_en_camino'] = $stmt->get_result()->fetch_assoc()['total'];

        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM pedidos WHERE id_transportista = ? AND estado = 'entregado'");
        $stmt->bind_param('i', $id_transportista);
        $stmt->execute();
        $stats['total_entregados'] = $stmt->get_result()->fetch_assoc()['total'];

        return $stats;
    }
}
?>
