<?php
require_once 'Controller.php';
require_once __DIR__ . '/../models/TransportistaModel.php';
require_once __DIR__ . '/../api/auth/auth_utils.php';

class TransportistaController extends Controller {
    public function listar() {
        session_start();
        requiereRol(1);
        $model = new TransportistaModel();
        $pagina_actual = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
        $registros_por_pagina = 10;
        $offset = ($pagina_actual - 1) * $registros_por_pagina;
        $filtro_nombre = $_GET['nombre'] ?? '';
        $filtro_empresa = $_GET['empresa'] ?? '';
        $filtro_disponibilidad = $_GET['disponibilidad'] ?? '';
        $total_registros = $model->contar($filtro_nombre, $filtro_empresa, $filtro_disponibilidad);
        $total_paginas = ceil($total_registros / $registros_por_pagina);
        $resultado_transportistas = $model->listar($filtro_nombre, $filtro_empresa, $filtro_disponibilidad, $registros_por_pagina, $offset);
        $resultado_empresas = $model->obtenerEmpresas();
        $this->view(__DIR__ . '/../views/transportistas/listar.php', compact(
            'resultado_transportistas','resultado_empresas','pagina_actual','total_paginas',
            'filtro_nombre','filtro_empresa','filtro_disponibilidad'
        ));
    }
}
?>
