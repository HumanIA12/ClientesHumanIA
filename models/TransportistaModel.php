<?php
require_once 'Model.php';
class TransportistaModel extends Model {
    private function buildWhere(&$types, &$params, $nombre, $empresa, $disp) {
        $where = [];
        if ($nombre !== '') {
            $where[] = "CONCAT(u.nombre, ' ', u.apellidos) LIKE ?";
            $params[] = "%$nombre%";
            $types .= 's';
        }
        if ($empresa !== '') {
            $where[] = 'et.id = ?';
            $params[] = $empresa;
            $types .= 'i';
        }
        if ($disp !== '') {
            $where[] = 't.disponibilidad = ?';
            $params[] = $disp;
            $types .= 's';
        }
        return $where ? 'WHERE ' . implode(' AND ', $where) : '';
    }
    public function contar($nombre, $empresa, $disp) {
        $types = '';
        $params = [];
        $where_sql = $this->buildWhere($types, $params, $nombre, $empresa, $disp);
        $sql = "SELECT COUNT(*) as total FROM transportistas t JOIN usuarios u ON t.id_usuario = u.id JOIN empresas_transporte et ON t.id_empresa = et.id JOIN tipos_vehiculo tv ON t.id_tipo_vehiculo = tv.id $where_sql";
        $stmt = $this->db->prepare($sql);
        if ($params) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc()['total'];
    }
    public function listar($nombre, $empresa, $disp, $limit, $offset) {
        $types = '';
        $params = [];
        $where_sql = $this->buildWhere($types, $params, $nombre, $empresa, $disp);
        $sql = "SELECT t.id, u.nombre, u.apellidos, u.username, u.email, u.telefono,
                       t.licencia, et.nombre as empresa, tv.nombre as tipo_vehiculo,
                       t.disponibilidad, t.tiene_gps, tv.tiene_refrigeracion, u.estado
                FROM transportistas t
                JOIN usuarios u ON t.id_usuario = u.id
                JOIN empresas_transporte et ON t.id_empresa = et.id
                JOIN tipos_vehiculo tv ON t.id_tipo_vehiculo = tv.id
                $where_sql
                ORDER BY u.nombre, u.apellidos
                LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        return $stmt->get_result();
    }
    public function obtenerEmpresas() {
        return $this->db->query("SELECT id, nombre FROM empresas_transporte ORDER BY nombre");
    }
}
?>
