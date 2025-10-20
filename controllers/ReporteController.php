<?php
require_once 'Controller.php';
require_once __DIR__ . '/../models/ReporteModel.php';
require_once __DIR__ . '/../api/auth/auth_utils.php';

class ReporteController extends Controller {
    public function index() {
        session_start();
        requiereRol(1);
        $model = new ReporteModel();
        $fecha_inicio = $_GET['fecha_inicio'] ?? date('Y-m-01');
        $fecha_fin = $_GET['fecha_fin'] ?? date('Y-m-d');
        $tipo_reporte = $_GET['tipo_reporte'] ?? 'ventas';
        $datos = $model->obtenerDatos($fecha_inicio, $fecha_fin);
        $fechas = [];
        $ventas = [];
        foreach ($datos['ventas_dia'] as $venta) {
            $fechas[] = date('d/m/Y', strtotime($venta['fecha']));
            $ventas[] = $venta['total_ventas'];
        }
        $fechas_json = json_encode($fechas);
        $ventas_json = json_encode($ventas);

        $nombres_productos = [];
        $cantidades_productos = [];
        $datos['productos']->data_seek(0);
        while ($p = $datos['productos']->fetch_assoc()) {
            $nombres_productos[] = $p['nombre'];
            $cantidades_productos[] = $p['cantidad_vendida'];
        }
        $nombres_productos_json = json_encode($nombres_productos);
        $cantidades_productos_json = json_encode($cantidades_productos);

        $nombres_ciudades = [];
        $ventas_ciudades = [];
        while ($c = $datos['ciudades']->fetch_assoc()) {
            $nombres_ciudades[] = $c['ciudad'];
            $ventas_ciudades[] = $c['total_ventas'];
        }
        $nombres_ciudades_json = json_encode($nombres_ciudades);
        $ventas_ciudades_json = json_encode($ventas_ciudades);

        $this->view(__DIR__ . '/../views/reportes/index.php', [
            'fecha_inicio' => $fecha_inicio,
            'fecha_fin' => $fecha_fin,
            'tipo_reporte' => $tipo_reporte,
            'estadisticas' => $datos['estadisticas'],
            'resultado_productos' => $datos['productos'],
            'resultado_clientes' => $datos['clientes'],
            'resultado_transportistas' => $datos['transportistas'],
            'fechas_json' => $fechas_json,
            'ventas_json' => $ventas_json,
            'nombres_productos_json' => $nombres_productos_json,
            'cantidades_productos_json' => $cantidades_productos_json,
            'nombres_ciudades_json' => $nombres_ciudades_json,
            'ventas_ciudades_json' => $ventas_ciudades_json
        ]);
    }
}
?>
