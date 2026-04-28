// =====================================================
// CLIENTES — CRUD
// =====================================================

let estado = {
  busqueda: "",
  filtroEstado: "",
  pagina: 1,
  porPagina: 8
};

document.addEventListener("DOMContentLoaded", () => {
  if (!Auth.requireAuth()) return;

  renderSidebar("clientes");
  renderTopbar("Clientes", "Administra tu cartera de clientes");
  lucide.createIcons();

  configurarEventos();
  renderTabla();
});

function configurarEventos() {
  document.getElementById("buscador").addEventListener("input", (e) => {
    estado.busqueda = e.target.value.toLowerCase();
    estado.pagina = 1;
    renderTabla();
  });

  document.getElementById("filtro-estado").addEventListener("change", (e) => {
    estado.filtroEstado = e.target.value;
    estado.pagina = 1;
    renderTabla();
  });

  document.getElementById("btn-nuevo").onclick = () => abrirModal();
  document.getElementById("cerrar-modal").onclick = cerrarModal;
  document.getElementById("btn-cancelar-modal").onclick = cerrarModal;
  document.getElementById("modal").onclick = (e) => {
    if (e.target.id === "modal") cerrarModal();
  };

  document.getElementById("form-cliente").onsubmit = (e) => {
    e.preventDefault();
    guardarCliente();
  };

  document.getElementById("btn-exportar").onclick = () => {
    const clientes = filtrar();
    Utils.exportarCSV(clientes.map(c => ({
      Nombre: c.nombre, Empresa: c.empresa, Email: c.email,
      Telefono: c.telefono, Ciudad: c.ciudad, Monto: c.monto,
      Estado: c.estado, Registrado: Utils.formatoFecha(c.fechaRegistro)
    })), "clientes");
  };
}

function filtrar() {
  let clientes = DataStore.getClientes();
  if (estado.busqueda) {
    clientes = clientes.filter(c =>
      c.nombre.toLowerCase().includes(estado.busqueda) ||
      (c.empresa || "").toLowerCase().includes(estado.busqueda) ||
      (c.email || "").toLowerCase().includes(estado.busqueda) ||
      (c.ciudad || "").toLowerCase().includes(estado.busqueda)
    );
  }
  if (estado.filtroEstado) {
    clientes = clientes.filter(c => c.estado === estado.filtroEstado);
  }
  return clientes;
}

function renderTabla() {
  const clientes = filtrar();
  const tbody = document.getElementById("tabla-clientes");

  if (clientes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-12 text-slate-400">
          <i data-lucide="users-x" class="w-12 h-12 mx-auto mb-3"></i>
          <p>No se encontraron clientes</p>
        </td>
      </tr>
    `;
    document.getElementById("paginacion").innerHTML = "";
    lucide.createIcons();
    return;
  }

  // Paginacion
  const totalPag = Math.ceil(clientes.length / estado.porPagina);
  if (estado.pagina > totalPag) estado.pagina = totalPag;
  const inicio = (estado.pagina - 1) * estado.porPagina;
  const visibles = clientes.slice(inicio, inicio + estado.porPagina);

  tbody.innerHTML = visibles.map(c => `
    <tr class="tabla-fila">
      <td class="px-6 py-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm" style="background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));">
            ${c.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <p class="font-medium text-slate-900 dark:text-white">${c.nombre}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">${Utils.formatoFecha(c.fechaRegistro)}</p>
          </div>
        </div>
      </td>
      <td class="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">${c.empresa || "—"}</td>
      <td class="px-6 py-3 text-sm">
        <p class="text-slate-700 dark:text-slate-300">${c.email}</p>
        <p class="text-xs text-slate-500">${c.telefono || ""}</p>
      </td>
      <td class="px-6 py-3 text-sm text-slate-700 dark:text-slate-300">${c.ciudad || "—"}</td>
      <td class="px-6 py-3 text-sm font-medium text-slate-900 dark:text-white">${Utils.formatoMoneda(c.monto || 0)}</td>
      <td class="px-6 py-3">
        <span class="badge badge-${c.estado.toLowerCase()}">${c.estado}</span>
      </td>
      <td class="px-6 py-3 text-right">
        <div class="flex items-center justify-end gap-1">
          <button onclick="editarCliente(${c.id})" class="p-1.5 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30" title="Editar">
            <i data-lucide="edit" class="w-4 h-4"></i>
          </button>
          <button onclick="eliminarCliente(${c.id})" class="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" title="Eliminar">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  // Paginacion UI
  document.getElementById("paginacion").innerHTML = `
    <span>Mostrando ${inicio + 1}-${Math.min(inicio + estado.porPagina, clientes.length)} de ${clientes.length}</span>
    <div class="flex items-center gap-1">
      <button onclick="cambiarPagina(${estado.pagina - 1})" ${estado.pagina === 1 ? "disabled" : ""} class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700">‹</button>
      <span class="px-3">${estado.pagina} / ${totalPag}</span>
      <button onclick="cambiarPagina(${estado.pagina + 1})" ${estado.pagina === totalPag ? "disabled" : ""} class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700">›</button>
    </div>
  `;

  lucide.createIcons();
}

function cambiarPagina(p) {
  estado.pagina = p;
  renderTabla();
}

function abrirModal(cliente = null) {
  const modal = document.getElementById("modal");
  const titulo = document.getElementById("modal-titulo");

  if (cliente) {
    titulo.textContent = "Editar cliente";
    document.getElementById("cliente-id").value = cliente.id;
    document.getElementById("cliente-nombre").value = cliente.nombre;
    document.getElementById("cliente-empresa").value = cliente.empresa || "";
    document.getElementById("cliente-email").value = cliente.email;
    document.getElementById("cliente-telefono").value = cliente.telefono || "";
    document.getElementById("cliente-ciudad").value = cliente.ciudad || "";
    document.getElementById("cliente-monto").value = cliente.monto || "";
    document.getElementById("cliente-estado").value = cliente.estado;
  } else {
    titulo.textContent = "Nuevo cliente";
    document.getElementById("form-cliente").reset();
    document.getElementById("cliente-id").value = "";
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function cerrarModal() {
  const modal = document.getElementById("modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function guardarCliente() {
  const id = document.getElementById("cliente-id").value;
  const datos = {
    nombre: document.getElementById("cliente-nombre").value.trim(),
    empresa: document.getElementById("cliente-empresa").value.trim(),
    email: document.getElementById("cliente-email").value.trim(),
    telefono: document.getElementById("cliente-telefono").value.trim(),
    ciudad: document.getElementById("cliente-ciudad").value.trim(),
    monto: parseFloat(document.getElementById("cliente-monto").value) || 0,
    estado: document.getElementById("cliente-estado").value
  };

  if (id) {
    DataStore.updateCliente(parseInt(id), datos);
    Utils.toast("Cliente actualizado correctamente", "success");
  } else {
    DataStore.addCliente(datos);
    Utils.toast("Cliente creado correctamente", "success");
  }

  cerrarModal();
  renderTabla();
}

function editarCliente(id) {
  const cliente = DataStore.getClienteById(id);
  if (cliente) abrirModal(cliente);
}

function eliminarCliente(id) {
  const cliente = DataStore.getClienteById(id);
  if (!cliente) return;
  Utils.confirmar(`¿Seguro que deseas eliminar a "${cliente.nombre}"?`, () => {
    DataStore.deleteCliente(id);
    Utils.toast("Cliente eliminado", "success");
    renderTabla();
  });
}
