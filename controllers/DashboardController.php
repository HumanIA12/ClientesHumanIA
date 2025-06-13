<?php
require_once 'Controller.php';
require_once __DIR__ . '/../models/DashboardModel.php';
require_once __DIR__ . '/../api/auth/auth_utils.php';

class DashboardController extends Controller {
    public function admin() {
        session_start();
        requiereRol(1);
        $model = new DashboardModel();
        $total_pedidos = $model->totalPedidos();
        $total_clientes = $model->totalClientes();
        $total_transportistas = $model->totalTransportistas();
        $pedidos_por_estado = $model->pedidosPorEstado();
        $pedidos_recientes = $model->pedidosRecientes();
        $requieren_refrigeracion = $model->pedidosRefrigeracion();
        $this->view(__DIR__ . '/../views/dashboard/admin.php', compact(
            'total_pedidos', 'total_clientes', 'total_transportistas',
            'pedidos_por_estado', 'pedidos_recientes', 'requieren_refrigeracion'
        ));
    }

    public function cliente() {
        session_start();
        requiereRol(2);
        $model = new DashboardModel();
        $data = $model->clienteStats($_SESSION['usuario_id']);
        $this->view(__DIR__ . '/../views/dashboard/cliente.php', $data);
    }

    public function transportista() {
        session_start();
        requiereRol(3);
        $model = new DashboardModel();
        $data = $model->transportistaStats($_SESSION['usuario_id']);
        $this->view(__DIR__ . '/../views/dashboard/transportista.php', $data);
    }
}
?>
