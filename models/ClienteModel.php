<?php
require_once 'Model.php';
class ClienteModel extends Model {
    public function contar($filtro_nombre, $filtro_ciudad) {
        $where = [];
        $params = [];
        $types = '';
        if ($filtro_nombre !== '') {
            $where[] = "CONCAT(u.nombre, ' ', u.apellidos) LIKE ?";
            $params[] = "%$filtro_nombre%";
            $types .= 's';
        }
        if ($filtro_ciudad !== '') {
            $where[] = "ci.id = ?";
            $params[] = $filtro_ciudad;
            $types .= 'i';
        }
        $where_sql = '';
        if ($where) {
            $where_sql = 'WHERE ' . implode(' AND ', $where);
        }
        $sql = "SELECT COUNT(*) as total FROM clientes c JOIN usuarios u ON c.id_usuario = u.id JOIN ciudades ci ON c.id_ciudad = ci.id $where_sql";
        $stmt = $this->db->prepare($sql);
        if ($params) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $res = $stmt->get_result();
        return $res->fetch_assoc()['total'];
    }

    public function listar($filtro_nombre, $filtro_ciudad, $limit, $offset) {
        $where = [];
        $params = [];
        $types = '';
        if ($filtro_nombre !== '') {
            $where[] = "CONCAT(u.nombre, ' ', u.apellidos) LIKE ?";
            $params[] = "%$filtro_nombre%";
            $types .= 's';
        }
        if ($filtro_ciudad !== '') {
            $where[] = "ci.id = ?";
            $params[] = $filtro_ciudad;
            $types .= 'i';
        }
        $where_sql = '';
        if ($where) {
            $where_sql = 'WHERE ' . implode(' AND ', $where);
        }
        $sql = "SELECT c.id, u.nombre, u.apellidos, u.username, u.email, u.telefono, c.direccion, ci.nombre as ciudad, c.codigo_postal, u.estado FROM clientes c JOIN usuarios u ON c.id_usuario = u.id JOIN ciudades ci ON c.id_ciudad = ci.id $where_sql ORDER BY u.nombre, u.apellidos LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        return $stmt->get_result();
    }

    public function obtenerCiudades() {
        $sql = "SELECT id, nombre FROM ciudades ORDER BY nombre";
        return $this->db->query($sql);
    }
}
?>
