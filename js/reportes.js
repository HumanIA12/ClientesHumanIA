// =====================================================
// REPORTES
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  if (!Auth.requireAuth()) return;

  renderSidebar("reportes");
  renderTopbar("Reportes", "Analisis y estadisticas de tu cartera");
  lucide.createIcons();

  cargarResumen();
  cargarGrafico();
  cargarTopClientes();
  cargarTablaCiudades();

  document.getElementById("btn-exportar-todo").onclick = () => {
    const clientes = DataStore.getClientes();
    Utils.exportarCSV(clientes.map(c => ({
      Nombre: c.nombre, Empresa: c.empresa, Email: c.email,
      Telefono: c.telefono, Ciudad: c.ciudad,
      Monto: c.monto, Estado: c.estado,
      Registrado: Utils.formatoFecha(c.fechaRegistro)
    })), "reporte_clientes");
  };
});

function cargarResumen() {
  const clientes = DataStore.getClientes();
  const total = clientes.length;
  const ingresos = clientes.reduce((s, c) => s + (c.monto || 0), 0);
  const promedio = total > 0 ? ingresos / total : 0;
  const ciudades = new Set(clientes.map(c => c.ciudad).filter(Boolean));

  document.getElementById("r-total").textContent = total;
  document.getElementById("r-ingresos").textContent = Utils.formatoMoneda(ingresos);
  document.getElementById("r-promedio").textContent = Utils.formatoMoneda(promedio);
  document.getElementById("r-ciudades").textContent = ciudades.size;
}

function cargarGrafico() {
  const clientes = DataStore.getClientes();
  const isDark = document.documentElement.classList.contains("dark");
  const textColor = isDark ? "#cbd5e1" : "#475569";

  const estados = ["Activo", "Inactivo", "Pendiente"];
  const montos = estados.map(e =>
    clientes.filter(c => c.estado === e).reduce((s, c) => s + (c.monto || 0), 0)
  );

  new Chart(document.getElementById("g-estado"), {
    type: "bar",
    data: {
      labels: estados,
      datasets: [{
        label: "Monto (S/)",
        data: montos,
        backgroundColor: ["#10b981", "#f43f5e", "#f59e0b"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor }, grid: { display: false } },
        y: { ticks: { color: textColor }, beginAtZero: true }
      }
    }
  });
}

function cargarTopClientes() {
  const top = DataStore.getClientes()
    .sort((a, b) => (b.monto || 0) - (a.monto || 0))
    .slice(0, 5);

  const cont = document.getElementById("top-clientes");
  if (top.length === 0) {
    cont.innerHTML = `<p class="text-center text-slate-400 py-4">Sin datos</p>`;
    return;
  }

  const max = top[0].monto || 1;
  cont.innerHTML = top.map((c, i) => `
    <div>
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">${i + 1}</span>
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">${c.nombre}</span>
        </div>
        <span class="text-sm font-semibold text-slate-900 dark:text-white">${Utils.formatoMoneda(c.monto || 0)}</span>
      </div>
      <div class="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full rounded-full" style="width: ${((c.monto || 0) / max) * 100}%; background: linear-gradient(to right, var(--color-primario), var(--color-secundario));"></div>
      </div>
    </div>
  `).join("");
}

function cargarTablaCiudades() {
  const clientes = DataStore.getClientes();
  const tabla = {};
  clientes.forEach(c => {
    if (!c.ciudad) return;
    if (!tabla[c.ciudad]) tabla[c.ciudad] = { total: 0, activos: 0, monto: 0 };
    tabla[c.ciudad].total++;
    if (c.estado === "Activo") tabla[c.ciudad].activos++;
    tabla[c.ciudad].monto += c.monto || 0;
  });

  const filas = Object.entries(tabla).sort((a, b) => b[1].monto - a[1].monto);
  const tbody = document.getElementById("tabla-ciudades");

  if (filas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-400">Sin datos</td></tr>`;
    return;
  }

  tbody.innerHTML = filas.map(([ciudad, d]) => `
    <tr>
      <td class="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">${ciudad}</td>
      <td class="px-4 py-3 text-sm text-right text-slate-700 dark:text-slate-300">${d.total}</td>
      <td class="px-4 py-3 text-sm text-right text-emerald-600 font-semibold">${d.activos}</td>
      <td class="px-4 py-3 text-sm text-right font-semibold text-slate-900 dark:text-white">${Utils.formatoMoneda(d.monto)}</td>
    </tr>
  `).join("");
}
