<?php
require_once 'Controller.php';
require_once __DIR__ . '/../models/ClienteModel.php';
require_once __DIR__ . '/../api/auth/auth_utils.php';

class ClienteController extends Controller {
    public function listar() {
        session_start();
        requiereRol(1);
        $model = new ClienteModel();

        $pagina_actual = isset($_GET['pagina']) ? (int)$_GET['pagina'] : 1;
        $registros_por_pagina = 10;
        $offset = ($pagina_actual - 1) * $registros_por_pagina;
        $filtro_nombre = isset($_GET['nombre']) ? $_GET['nombre'] : '';
        $filtro_ciudad = isset($_GET['ciudad']) ? $_GET['ciudad'] : '';

        $total_registros = $model->contar($filtro_nombre, $filtro_ciudad);
        $total_paginas = ceil($total_registros / $registros_por_pagina);
        $resultado_clientes = $model->listar($filtro_nombre, $filtro_ciudad, $registros_por_pagina, $offset);
        $resultado_ciudades = $model->obtenerCiudades();

        $this->view(__DIR__ . '/../views/clientes/listar.php', [
            'resultado_clientes' => $resultado_clientes,
            'resultado_ciudades' => $resultado_ciudades,
            'pagina_actual' => $pagina_actual,
            'total_paginas' => $total_paginas,
            'filtro_nombre' => $filtro_nombre,
            'filtro_ciudad' => $filtro_ciudad
        ]);
    }
}
?>
