<?php
require_once 'Controller.php';
require_once __DIR__ . '/../models/PedidoModel.php';
require_once __DIR__ . '/../api/auth/auth_utils.php';

class PedidoController extends Controller {
    public function listar() {
        session_start();
        requiereRol(1);
        $model = new PedidoModel();
        $pagina_actual = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
        $registros_por_pagina = 10;
        $offset = ($pagina_actual - 1) * $registros_por_pagina;
        $filtro_estado = $_GET['estado'] ?? '';
        $filtro_cliente = $_GET['cliente'] ?? '';
        $filtro_fecha = $_GET['fecha'] ?? '';
        $total_registros = $model->contar($filtro_estado, $filtro_cliente, $filtro_fecha);
        $total_paginas = ceil($total_registros / $registros_por_pagina);
        $resultado_pedidos = $model->listar($filtro_estado, $filtro_cliente, $filtro_fecha, $registros_por_pagina, $offset);
        $this->view(__DIR__ . '/../views/pedidos/listar.php', compact(
            'resultado_pedidos','pagina_actual','total_paginas',
            'filtro_estado','filtro_cliente','filtro_fecha'
        ));
    }
}
?>
