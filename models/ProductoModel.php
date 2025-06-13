<?php
require_once 'Model.php';
class ProductoModel extends Model {
    private function buildWhere(&$types, &$params, $nombre, $estado, $stock) {
        $where = [];
        if ($nombre !== '') {
            $where[] = 'nombre LIKE ?';
            $params[] = "%$nombre%";
            $types .= 's';
        }
        if ($estado !== '') {
            $where[] = 'estado = ?';
            $params[] = $estado;
            $types .= 's';
        }
        if ($stock !== '') {
            if ($stock === 'sin_stock') {
                $where[] = 'stock = 0';
            } elseif ($stock === 'bajo_stock') {
                $where[] = 'stock > 0 AND stock <= 10';
            } elseif ($stock === 'stock_normal') {
                $where[] = 'stock > 10';
            }
        }
        return $where ? 'WHERE ' . implode(' AND ', $where) : '';
    }
    public function contar($nombre, $estado, $stock) {
        $types = '';
        $params = [];
        $where_sql = $this->buildWhere($types, $params, $nombre, $estado, $stock);
        $sql = "SELECT COUNT(*) as total FROM productos $where_sql";
        $stmt = $this->db->prepare($sql);
        if ($params) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc()['total'];
    }
    public function listar($nombre, $estado, $stock, $limit, $offset) {
        $types = '';
        $params = [];
        $where_sql = $this->buildWhere($types, $params, $nombre, $estado, $stock);
        $sql = "SELECT id, nombre, descripcion, precio, stock, estado, fecha_agregado FROM productos $where_sql ORDER BY nombre LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        return $stmt->get_result();
    }
    public function resumen() {
        $sql = "SELECT COUNT(*) as total_productos,
                       SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as sin_stock,
                       SUM(CASE WHEN stock > 0 AND stock <= 10 THEN 1 ELSE 0 END) as bajo_stock,
                       SUM(CASE WHEN stock > 10 THEN 1 ELSE 0 END) as stock_normal,
                       SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) as disponibles,
                       SUM(CASE WHEN estado = 'agotado' THEN 1 ELSE 0 END) as agotados,
                       SUM(CASE WHEN estado = 'descontinuado' THEN 1 ELSE 0 END) as descontinuados
                FROM productos";
        return $this->db->query($sql)->fetch_assoc();
    }
}
?>
