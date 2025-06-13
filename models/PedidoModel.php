<?php
require_once 'Model.php';
class PedidoModel extends Model {
    private function buildWhere(&$types, &$params, $estado, $cliente, $fecha) {
        $where = [];
        if ($estado !== '') {
            $where[] = 'p.estado = ?';
            $params[] = $estado;
            $types .= 's';
        }
        if ($cliente !== '') {
            $where[] = "CONCAT(u.nombre, ' ', u.apellidos) LIKE ?";
            $params[] = "%$cliente%";
            $types .= 's';
        }
        if ($fecha !== '') {
            $where[] = 'DATE(p.fecha_pedido) = ?';
            $params[] = $fecha;
            $types .= 's';
        }
        return $where ? 'WHERE ' . implode(' AND ', $where) : '';
    }
    public function contar($estado, $cliente, $fecha) {
        $types = '';
        $params = [];
        $where_sql = $this->buildWhere($types, $params, $estado, $cliente, $fecha);
        $sql = "SELECT COUNT(*) as total FROM pedidos p JOIN clientes c ON p.id_cliente = c.id JOIN usuarios u ON c.id_usuario = u.id $where_sql";
        $stmt = $this->db->prepare($sql);
        if ($params) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc()['total'];
    }
    public function listar($estado, $cliente, $fecha, $limit, $offset) {
        $types = '';
        $params = [];
        $where_sql = $this->buildWhere($types, $params, $estado, $cliente, $fecha);
        $sql = "SELECT p.id, p.fecha_pedido, CONCAT(u.nombre, ' ', u.apellidos) as cliente,
                       p.total, p.estado, p.direccion_entrega, ci.nombre as ciudad,
                       p.refrigeracion_requerida, p.tiene_tracking, t.id as id_transportista,
                       CONCAT(ut.nombre, ' ', ut.apellidos) as transportista
                FROM pedidos p
                JOIN clientes c ON p.id_cliente = c.id
                JOIN usuarios u ON c.id_usuario = u.id
                JOIN ciudades ci ON p.id_ciudad_entrega = ci.id
                LEFT JOIN transportistas t ON p.id_transportista = t.id
                LEFT JOIN usuarios ut ON t.id_usuario = ut.id
                $where_sql
                ORDER BY p.fecha_pedido DESC
                LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        return $stmt->get_result();
    }
}
?>
