import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import PedidosView from '../views/PedidosView.vue'

const routes = [
  { path: '/', component: DashboardView },
  { path: '/pedidos', component: PedidosView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
