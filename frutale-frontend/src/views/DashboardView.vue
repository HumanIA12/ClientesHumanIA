<template>
  <div class="admin-dashboard">
    <h1>Dashboard de Administrador</h1>

    <!-- Resumen de pedidos y estadísticas -->
    <div class="row mt-4">
      <div class="col-md-3">
        <div class="card bg-primary text-white mb-4">
          <div class="card-body">
            <h5 class="card-title">Total Pedidos</h5>
            <h2 class="display-4">{{ estadisticas.totalPedidos || 0 }}</h2>
          </div>
          <div class="card-footer d-flex align-items-center justify-content-between">
            <router-link class="text-white stretched-link text-decoration-none" :to="{ name: 'admin-pedidos' }">
              Ver Detalles
            </router-link>
            <font-awesome-icon icon="angle-right" />
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card bg-success text-white mb-4">
          <div class="card-body">
            <h5 class="card-title">Pedidos Entregados</h5>
            <h2 class="display-4">{{ estadisticas.pedidosEntregados || 0 }}</h2>
          </div>
          <div class="card-footer d-flex align-items-center justify-content-between">
            <router-link class="text-white stretched-link text-decoration-none" :to="{ name: 'admin-pedidos', query: { estado: 'entregado' } }">
              Ver Detalles
            </router-link>
            <font-awesome-icon icon="angle-right" />
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card bg-warning text-white mb-4">
          <div class="card-body">
            <h5 class="card-title">Pedidos en Proceso</h5>
            <h2 class="display-4">{{ estadisticas.pedidosProceso || 0 }}</h2>
          </div>
          <div class="card-footer d-flex align-items-center justify-content-between">
            <router-link class="text-white stretched-link text-decoration-none" :to="{ name: 'admin-pedidos', query: { estado: 'en_proceso' } }">
              Ver Detalles
            </router-link>
            <font-awesome-icon icon="angle-right" />
          </div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="card bg-danger text-white mb-4">
          <div class="card-body">
            <h5 class="card-title">Pedidos Pendientes</h5>
            <h2 class="display-4">{{ estadisticas.pedidosPendientes || 0 }}</h2>
          </div>
          <div class="card-footer d-flex align-items-center justify-content-between">
            <router-link class="text-white stretched-link text-decoration-none" :to="{ name: 'admin-pedidos', query: { estado: 'pendiente' } }">
              Ver Detalles
            </router-link>
            <font-awesome-icon icon="angle-right" />
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfico de pedidos últimos 7 días -->
    <div class="row mt-4">
      <div class="col-md-8">
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">Pedidos - Últimos 7 días</h5>
          </div>
          <div class="card-body">
            <div class="chart-container" style="height: 300px;">
              <p v-if="cargandoGrafico" class="text-center">
                <span class="spinner-border text-primary" role="status"></span>
                <span class="ms-2">Cargando gráfico...</span>
              </p>
              <div v-else id="pedidosChart" style="width: 100%; height: 100%;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">Estadísticas Generales</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between align-items-center">
                Clientes Registrados
                <span class="badge bg-primary rounded-pill">{{ estadisticas.totalClientes || 0 }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                Transportistas
                <span class="badge bg-primary rounded-pill">{{ estadisticas.totalTransportistas || 0 }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                Productos
                <span class="badge bg-primary rounded-pill">{{ estadisticas.totalProductos || 0 }}</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                Ingresos Totales
                <span class="badge bg-success rounded-pill">{{ formatMoney(estadisticas.ingresos || 0) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Pedidos recientes -->
    <div class="row mt-2">
      <div class="col-12">
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">Pedidos Recientes</h5>
          </div>
          <div class="card-body">
            <div v-if="loadingPedidos" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="mt-2">Cargando pedidos...</p>
            </div>
            <div v-else-if="pedidosRecientes.length === 0" class="text-center py-5">
              <font-awesome-icon icon="inbox" size="3x" class="text-muted mb-3" />
              <p class="lead">No hay pedidos recientes</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="pedido in pedidosRecientes" :key="pedido.id">
                    <td># {{ pedido.id }}</td>
                    <td>{{ pedido.cliente_nombre }}</td>
                    <td>{{ formatDate(pedido.fecha_pedido) }}</td>
                    <td>{{ formatMoney(pedido.total) }}</td>
                    <td>
                      <span class="badge" :class="getEstadoClass(pedido.estado)">
                        {{ getEstadoLabel(pedido.estado) }}
                      </span>
                    </td>
                    <td>
                      <router-link :to="{ name: 'admin-pedido-detalle', params: { id: pedido.id } }" class="btn btn-sm btn-primary me-2">
                        <font-awesome-icon icon="eye" />
                      </router-link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card-footer text-center">
            <router-link :to="{ name: 'admin-pedidos' }" class="btn btn-outline-primary">
              Ver Todos los Pedidos
            </router-link>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'AdminDashboard',
  data() {
    return {
      cargandoGrafico: true,
      loadingPedidos: true,
      estadisticas: {
        totalPedidos: 0,
        pedidosEntregados: 0,
        pedidosProceso: 0,
        pedidosPendientes: 0,
        totalClientes: 0,
        totalTransportistas: 0,
        totalProductos: 0,
        ingresos: 0
      },
      pedidosRecientes: []
    }
  },
  created() {
    this.loadDashboardData();
  },
  methods: {
    async loadDashboardData() {
      try {
        // En un proyecto real aquí se podría mostrar un loader global
        await this.fetchEstadisticas();
        await this.fetchPedidosRecientes();

        setTimeout(() => {
          this.cargandoGrafico = false;
          this.renderChart();
        }, 1000);

      } catch (error) {
        console.error('Error cargando dashboard:', error);
      }
    },

    async fetchEstadisticas() {
      // Simulando llamada a la API
      this.estadisticas = {
        totalPedidos: 125,
        pedidosEntregados: 78,
        pedidosProceso: 32,
        pedidosPendientes: 15,
        totalClientes: 45,
        totalTransportistas: 18,
        totalProductos: 64,
        ingresos: 8750000
      };
    },

    async fetchPedidosRecientes() {
      setTimeout(() => {
        this.pedidosRecientes = [
          { id: 123, cliente_nombre: 'Juan Pérez', fecha_pedido: '2025-06-12', total: 150000, estado: 'entregado' },
          { id: 122, cliente_nombre: 'María López', fecha_pedido: '2025-06-11', total: 235000, estado: 'en_proceso' },
          { id: 121, cliente_nombre: 'Carlos Rodríguez', fecha_pedido: '2025-06-11', total: 98000, estado: 'pendiente' },
          { id: 120, cliente_nombre: 'Ana Martínez', fecha_pedido: '2025-06-10', total: 175000, estado: 'en_proceso' },
          { id: 119, cliente_nombre: 'Roberto Gómez', fecha_pedido: '2025-06-09', total: 320000, estado: 'entregado' }
        ];
        this.loadingPedidos = false;
      }, 800);
    },

    renderChart() {
      console.log('Renderizando gráfico...');
    },

    formatDate(dateString) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('es-ES', options);
    },

    formatMoney(amount) {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(amount);
    },

    getEstadoClass(estado) {
      switch (estado) {
        case 'entregado': return 'bg-success';
        case 'en_proceso': return 'bg-warning text-dark';
        case 'pendiente': return 'bg-info text-dark';
        case 'cancelado': return 'bg-danger';
        default: return 'bg-secondary';
      }
    },

    getEstadoLabel(estado) {
      switch (estado) {
        case 'entregado': return 'Entregado';
        case 'en_proceso': return 'En Proceso';
        case 'pendiente': return 'Pendiente';
        case 'cancelado': return 'Cancelado';
        default: return estado;
      }
    }
  }
}
</script>
