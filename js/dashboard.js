// =====================================================
// DASHBOARD — KPIs, graficos, actividad
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  if (!Auth.requireAuth()) return;

  renderSidebar("dashboard");
  renderTopbar("Dashboard", "Resumen general de tu negocio");
  lucide.createIcons();

  cargarKPIs();
  cargarGraficos();
  cargarActividad();
});

function cargarKPIs() {
  const clientes = DataStore.getClientes();
  const total = clientes.length;
  const activos = clientes.filter(c => c.estado === "Activo").length;
  const pendientes = clientes.filter(c => c.estado === "Pendiente").length;
  const monto = clientes.reduce((sum, c) => sum + (c.monto || 0), 0);

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-activos").textContent = activos;
  document.getElementById("kpi-monto").textContent = Utils.formatoMoneda(monto);
  document.getElementById("kpi-pendientes").textContent = pendientes;
}

function cargarGraficos() {
  const clientes = DataStore.getClientes();
  const isDark = document.documentElement.classList.contains("dark");
  const textColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(100, 116, 139, 0.1)";

  // ---- LINEA: clientes por mes (ultimos 6 meses) ----
  const meses = [];
  const conteoMes = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString("es-PE", { month: "short" });
    meses.push(label.charAt(0).toUpperCase() + label.slice(1));
    const mesActual = d.getMonth();
    const anioActual = d.getFullYear();
    conteoMes.push(clientes.filter(c => {
      const fc = new Date(c.fechaRegistro);
      return fc.getMonth() === mesActual && fc.getFullYear() === anioActual;
    }).length);
  }

  new Chart(document.getElementById("grafico-linea"), {
    type: "line",
    data: {
      labels: meses,
      datasets: [{
        label: "Nuevos clientes",
        data: conteoMes,
        borderColor: APP_CONFIG.colorPrimario,
        backgroundColor: APP_CONFIG.colorPrimario + "20",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: APP_CONFIG.colorPrimario,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
      }
    }
  });

  // ---- DONA: estados ----
  const estados = ["Activo", "Inactivo", "Pendiente"];
  const colores = ["#10b981", "#f43f5e", "#f59e0b"];
  const conteoEst = estados.map(e => clientes.filter(c => c.estado === e).length);

  new Chart(document.getElementById("grafico-dona"), {
    type: "doughnut",
    data: {
      labels: estados,
      datasets: [{ data: conteoEst, backgroundColor: colores, borderWidth: 0 }]
    },
    options: {
      responsive: true,
      cutout: "70%",
      plugins: { legend: { display: false } }
    }
  });

  // Leyenda dona
  const leyenda = document.getElementById("leyenda-dona");
  leyenda.innerHTML = estados.map((e, i) => `
    <div class="flex items-center justify-between text-sm">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full" style="background: ${colores[i]}"></span>
        <span class="text-slate-600 dark:text-slate-400">${e}</span>
      </div>
      <span class="font-semibold text-slate-900 dark:text-white">${conteoEst[i]}</span>
    </div>
  `).join("");

  // ---- BARRAS: top ciudades ----
  const ciudades = {};
  clientes.forEach(c => {
    ciudades[c.ciudad] = (ciudades[c.ciudad] || 0) + 1;
  });
  const ciudadesOrdenadas = Object.entries(ciudades).sort((a, b) => b[1] - a[1]).slice(0, 5);

  new Chart(document.getElementById("grafico-barras"), {
    type: "bar",
    data: {
      labels: ciudadesOrdenadas.map(c => c[0]),
      datasets: [{
        label: "Clientes",
        data: ciudadesOrdenadas.map(c => c[1]),
        backgroundColor: APP_CONFIG.colorSecundario,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true }
      }
    }
  });
}

function cargarActividad() {
  const lista = document.getElementById("lista-actividad");
  const actividad = DataStore.getActividad();

  if (actividad.length === 0) {
    lista.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2"></i>
        <p class="text-sm">Sin actividad registrada</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  lista.innerHTML = actividad.slice(0, 10).map(a => `
    <div class="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
        <i data-lucide="activity" class="w-4 h-4 text-indigo-600 dark:text-indigo-400"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-slate-700 dark:text-slate-300">${a.descripcion}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          ${a.usuario} · ${Utils.fechaRelativa(a.fecha)}
        </p>
      </div>
    </div>
  `).join("");
  lucide.createIcons();
}
