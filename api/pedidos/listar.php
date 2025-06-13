<?php
// API para listar pedidos
require_once '../config.php';

// Verificar sesión
$usuario_id = verificarSesion();
$rol = $_SESSION['usuario_rol'];

// Obtener parámetros de filtro
$estado = isset($_GET['estado']) ? sanitizarEntrada($_GET['estado']) : '';
$fecha_inicio = isset($_GET['fecha_inicio']) ? sanitizarEntrada($_GET['fecha_inicio']) : '';
$fecha_fin = isset($_GET['fecha_fin']) ? sanitizarEntrada($_GET['fecha_fin']) : '';

// Construir consulta base
$sql = "SELECT p.id, p.fecha_pedido, p.fecha_entrega, p.estado, p.total, p.direccion_entrega,
              c.id as cliente_id, u.nombre as cliente_nombre, u.apellidos as cliente_apellidos,
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

// Restricciones según el rol
if ($rol === 'cliente') {
    // Obtener el ID del cliente asociado al usuario
    $sql_cliente = "SELECT id FROM clientes WHERE id_usuario = ?";
    $stmt_cliente = $conexion->prepare($sql_cliente);
    $stmt_cliente->bind_param("i", $usuario_id);
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
        responderJSON(['error' => 'No tiene un perfil de cliente asociado'], 403);
    }
} else if ($rol === 'transportista') {
    // Obtener el ID del transportista asociado al usuario
    $sql_transportista = "SELECT id FROM transportistas WHERE id_usuario = ?";
    $stmt_transportista = $conexion->prepare($sql_transportista);
    $stmt_transportista->bind_param("i", $usuario_id);
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
        responderJSON(['error' => 'No tiene un perfil de transportista asociado'], 403);
    }
}

// Ordenar por fecha de pedido, más recientes primero
$sql .= " ORDER BY p.fecha_pedido DESC";

// Limitar resultados para paginación
$pagina = isset($_GET['pagina']) ? intval($_GET['pagina']) : 1;
$por_pagina = isset($_GET['por_pagina']) ? intval($_GET['por_pagina']) : 10;
$offset = ($pagina - 1) * $por_pagina;

$sql .= " LIMIT ?, ?";
$params[] = $offset;
$params[] = $por_pagina;
$types .= "ii";

// Preparar y ejecutar consulta
$stmt = $conexion->prepare($sql);
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

// Obtener resultados
$pedidos = array();
while ($row = $result->fetch_assoc()) {
    // Formatear datos
    $row['fecha_pedido_formateada'] = date('d/m/Y H:i', strtotime($row['fecha_pedido']));
    $row['fecha_entrega_formateada'] = !empty($row['fecha_entrega']) 
        ? date('d/m/Y H:i', strtotime($row['fecha_entrega']))
        : null;
    $row['cliente'] = $row['cliente_nombre'] . ' ' . $row['cliente_apellidos'];
    $row['transportista'] = !empty($row['transportista_id']) 
        ? $row['transportista_nombre'] . ' ' . $row['transportista_apellidos']
        : null;
    
    $pedidos[] = $row;
}

// Contar total de pedidos para paginación
$sql_total = "SELECT COUNT(*) AS total FROM pedidos p JOIN clientes c ON p.id_cliente = c.id WHERE 1=1";
$tipos_total = "";
$params_total = array();

if (!empty($estado)) {
    $sql_total .= " AND p.estado = ?";
    $params_total[] = $estado;
    $tipos_total .= "s";
}

if (!empty($fecha_inicio)) {
    $sql_total .= " AND DATE(p.fecha_pedido) >= ?";
    $params_total[] = $fecha_inicio;
    $tipos_total .= "s";
}

if (!empty($fecha_fin)) {
    $sql_total .= " AND DATE(p.fecha_pedido) <= ?";
    $params_total[] = $fecha_fin;
    $tipos_total .= "s";
}

if ($rol === 'cliente' && isset($id_cliente)) {
    $sql_total .= " AND c.id = ?";
    $params_total[] = $id_cliente;
    $tipos_total .= "i";
} else if ($rol === 'transportista' && isset($id_transportista)) {
    $sql_total .= " AND p.id_transportista = ?";
    $params_total[] = $id_transportista;
    $tipos_total .= "i";
}

$stmt_total = $conexion->prepare($sql_total);
if (!empty($params_total)) {
    $stmt_total->bind_param($tipos_total, ...$params_total);
}
$stmt_total->execute();
$result_total = $stmt_total->get_result();
$row_total = $result_total->fetch_assoc();
$total_pedidos = $row_total['total'];

// Preparar respuesta con paginación
$respuesta = [
    'pedidos' => $pedidos,
    'paginacion' => [
        'total' => $total_pedidos,
        'pagina_actual' => $pagina,
        'por_pagina' => $por_pagina,
        'total_paginas' => ceil($total_pedidos / $por_pagina)
    ]
];

responderJSON($respuesta);
?>
