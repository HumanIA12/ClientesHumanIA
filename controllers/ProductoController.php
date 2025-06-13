<?php
require_once 'Controller.php';
require_once __DIR__ . '/../models/ProductoModel.php';
require_once __DIR__ . '/../api/auth/auth_utils.php';

class ProductoController extends Controller {
    public function listar() {
        session_start();
        requiereRol(1);
        $model = new ProductoModel();
        $pagina_actual = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
        $registros_por_pagina = 10;
        $offset = ($pagina_actual - 1) * $registros_por_pagina;
        $filtro_nombre = $_GET['nombre'] ?? '';
        $filtro_estado = $_GET['estado'] ?? '';
        $filtro_stock = $_GET['stock'] ?? '';
        $total_registros = $model->contar($filtro_nombre, $filtro_estado, $filtro_stock);
        $total_paginas = ceil($total_registros / $registros_por_pagina);
        $resultado_productos = $model->listar($filtro_nombre, $filtro_estado, $filtro_stock, $registros_por_pagina, $offset);
        $resumen = $model->resumen();
        $mensaje = $_SESSION['mensaje'] ?? '';
        $tipo_mensaje = $_SESSION['tipo_mensaje'] ?? '';
        unset($_SESSION['mensaje'], $_SESSION['tipo_mensaje']);
        $this->view(__DIR__ . '/../views/productos/listar.php', compact(
            'resultado_productos','pagina_actual','total_paginas','filtro_nombre','filtro_estado','filtro_stock','mensaje','tipo_mensaje','resumen'
        ));
    }
}
?>
