/**
 * Funciones generales para Frutale
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes comunes
    inicializarComponentes();
    
    // Asignar eventos según la página
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'dashboard.php':
            initDashboard();
            break;
        case 'registrar_pedido.php':
            initPedidoForm();
            break;
        case 'gestionar_pedidos.php':
            initGestionPedidos();
            break;
        case 'consultar_reportes.php':
            initReportes();
            break;
    }
});

/**
 * Inicializa componentes comunes en todas las páginas
 */
function inicializarComponentes() {
    // Activar tooltips de Bootstrap
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
    
    // Activar popovers de Bootstrap
    const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
    popovers.forEach(popover => {
        new bootstrap.Popover(popover);
    });
}

/**
 * Función para mostrar notificaciones
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de alerta (success, danger, warning, info)
 * @param {number} duracion - Duración en milisegundos (por defecto 3000)
 */
function mostrarNotificacion(mensaje, tipo = 'success', duracion = 3000) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    notificacion.style.top = '20px';
    notificacion.style.right = '20px';
    notificacion.style.zIndex = '9999';
    
    // Contenido de la notificación
    notificacion.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Agregar al body
    document.body.appendChild(notificacion);
    
    // Eliminar después de la duración
    setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, duracion);
}

/**
 * Función para cargar datos mediante AJAX
 * @param {string} url - URL del endpoint
 * @param {Object} data - Datos a enviar (opcional)
 * @param {string} method - Método HTTP (GET, POST)
 * @returns {Promise} - Promesa con los datos
 */
function fetchData(url, data = null, method = 'GET') {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    if (data && method === 'GET') {
        const params = new URLSearchParams(data).toString();
        url = `${url}?${params}`;
    }
    
    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la solicitud');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarNotificacion('Error al obtener datos: ' + error.message, 'danger');
            throw error;
        });
}

/**
 * Inicializa funcionalidades del dashboard
 */
function initDashboard() {
    // Cargar estadísticas si existe el contenedor
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
        fetchData('api/dashboard_stats.php')
            .then(data => {
                // Actualizar los contadores con animación
                animateCounter('pedidos-count', data.totalPedidos);
                animateCounter('clientes-count', data.totalClientes);
                animateCounter('transportistas-count', data.totalTransportistas);
                animateCounter('productos-count', data.totalProductos);
            });
    }
    
    // Cargar gráfico de pedidos recientes si existe el contenedor
    const chartContainer = document.getElementById('pedidos-chart');
    if (chartContainer) {
        fetchData('api/chart_data.php')
            .then(data => {
                // Implementar gráfico (requiere librería externa como Chart.js)
                console.log('Datos para gráfico:', data);
            });
    }
}

/**
 * Anima un contador desde 0 hasta el valor objetivo
 * @param {string} elementId - ID del elemento
 * @param {number} targetValue - Valor final
 */
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let currentValue = 0;
    const duration = 1000; // 1 segundo
    const steps = 50;
    const increment = targetValue / steps;
    const interval = duration / steps;
    
    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentValue);
        }
    }, interval);
}

/**
 * Inicializa formulario de pedidos
 */
function initPedidoForm() {
    // Contenedor de productos
    const productosContainer = document.getElementById('productos-container');
    if (!productosContainer) return;
    
    // Botón para agregar producto
    const btnAgregarProducto = document.getElementById('btn-agregar-producto');
    if (btnAgregarProducto) {
        btnAgregarProducto.addEventListener('click', agregarFilaProducto);
    }
    
    // Evento para cálculo de total cuando cambia cantidad o precio
    productosContainer.addEventListener('change', function(e) {
        if (e.target.classList.contains('cantidad') || e.target.classList.contains('precio')) {
            calcularTotalPedido();
        }
    });
    
    // Iniciar con una fila de producto
    agregarFilaProducto();
    
    // Cargar clientes para el selector
    const selectCliente = document.getElementById('cliente');
    if (selectCliente) {
        fetchData('api/clientes.php')
            .then(data => {
                data.forEach(cliente => {
                    const option = document.createElement('option');
                    option.value = cliente.id;
                    option.textContent = `${cliente.nombre} ${cliente.apellidos}`;
                    selectCliente.appendChild(option);
                });
            });
    }
}

/**
 * Agrega una nueva fila de producto al formulario de pedidos
 */
function agregarFilaProducto() {
    const productosContainer = document.getElementById('productos-container');
    const productoIndex = document.querySelectorAll('.producto-fila').length;
    
    const filaHtml = `
        <div class="row producto-fila mb-3">
            <div class="col-md-5">
                <select class="form-control producto" name="productos[${productoIndex}][id]" required>
                    <option value="">Seleccionar producto</option>
                    <!-- Se cargarán dinámicamente -->
                </select>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control cantidad" name="productos[${productoIndex}][cantidad]" min="1" value="1" required>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control precio" name="productos[${productoIndex}][precio]" step="0.01" readonly>
            </div>
            <div class="col-md-2">
                <input type="number" class="form-control subtotal" name="productos[${productoIndex}][subtotal]" step="0.01" readonly>
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-eliminar-producto">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    productosContainer.insertAdjacentHTML('beforeend', filaHtml);
    
    // Obtener el nuevo select de productos
    const nuevoSelect = productosContainer.lastElementChild.querySelector('.producto');
    
    // Cargar productos
    fetchData('api/productos.php')
        .then(data => {
            data.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto.id;
                option.dataset.precio = producto.precio;
                option.textContent = `${producto.nombre} - ${producto.precio}€/${producto.unidad_medida}`;
                nuevoSelect.appendChild(option);
            });
        });
    
    // Asignar evento al select de productos
    nuevoSelect.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const precio = selectedOption.dataset.precio;
        const filaProducto = this.closest('.producto-fila');
        
        filaProducto.querySelector('.precio').value = precio;
        
        // Actualizar subtotal
        const cantidad = filaProducto.querySelector('.cantidad').value;
        filaProducto.querySelector('.subtotal').value = (precio * cantidad).toFixed(2);
        
        // Actualizar total del pedido
        calcularTotalPedido();
    });
    
    // Asignar evento al botón eliminar
    const btnEliminar = productosContainer.lastElementChild.querySelector('.btn-eliminar-producto');
    btnEliminar.addEventListener('click', function() {
        const filaProducto = this.closest('.producto-fila');
        filaProducto.remove();
        calcularTotalPedido();
    });
}

/**
 * Calcula el total del pedido sumando los subtotales
 */
function calcularTotalPedido() {
    const subtotales = document.querySelectorAll('.subtotal');
    let total = 0;
    
    subtotales.forEach(input => {
        if (input.value) {
            total += parseFloat(input.value);
        }
    });
    
    const totalPedidoInput = document.getElementById('total-pedido');
    if (totalPedidoInput) {
        totalPedidoInput.value = total.toFixed(2);
    }
}

/**
 * Inicializa la página de gestión de pedidos
 */
function initGestionPedidos() {
    // Filtro de estado
    const filtroEstado = document.getElementById('filtro-estado');
    if (filtroEstado) {
        filtroEstado.addEventListener('change', function() {
            const estado = this.value;
            window.location.href = `gestionar_pedidos.php?estado=${estado}`;
        });
    }
    
    // Botones de acción para cambiar estado
    const botonesEstado = document.querySelectorAll('.btn-cambiar-estado');
    botonesEstado.forEach(btn => {
        btn.addEventListener('click', function() {
            const pedidoId = this.dataset.pedidoId;
            const nuevoEstado = this.dataset.estado;
            
            if (confirm(`¿Estás seguro de cambiar el estado del pedido #${pedidoId} a ${nuevoEstado}?`)) {
                fetchData('api/actualizar_estado_pedido.php', {
                    pedido_id: pedidoId,
                    estado: nuevoEstado
                }, 'POST')
                .then(response => {
                    if (response.success) {
                        mostrarNotificacion(`Pedido #${pedidoId} actualizado a estado: ${nuevoEstado}`, 'success');
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        mostrarNotificacion('Error al actualizar el estado del pedido', 'danger');
                    }
                });
            }
        });
    });
}

/**
 * Inicializa la página de reportes
 */
function initReportes() {
    const tipoReporte = document.getElementById('tipo-reporte');
    const criteriosContainer = document.getElementById('criterios-container');
    
    if (tipoReporte && criteriosContainer) {
        tipoReporte.addEventListener('change', function() {
            // Obtener criterios según el tipo de reporte
            fetchData('api/criterios_reporte.php', {
                tipo: this.value
            })
            .then(data => {
                criteriosContainer.innerHTML = data.html;
            });
        });
    }
    
    // Botón generar reporte
    const btnGenerarReporte = document.getElementById('btn-generar-reporte');
    if (btnGenerarReporte) {
        btnGenerarReporte.addEventListener('click', function() {
            const form = document.getElementById('form-reporte');
            const formData = new FormData(form);
            
            // Convertir FormData a objeto
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Solicitar reporte
            fetchData('api/generar_reporte.php', data, 'POST')
                .then(response => {
                    if (response.success) {
                        mostrarNotificacion('Reporte generado correctamente', 'success');
                        
                        // Mostrar resultados o redirigir a la página del reporte
                        if (response.redirect) {
                            window.location.href = response.redirect;
                        } else if (response.html) {
                            document.getElementById('resultados-reporte').innerHTML = response.html;
                        }
                    } else {
                        mostrarNotificacion('Error al generar el reporte: ' + response.message, 'danger');
                    }
                });
        });
    }
}
