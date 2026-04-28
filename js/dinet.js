// =====================================================
// DINET DASHBOARD — Logica principal
// =====================================================

const Estado = {
  tab: "TODOS",                // TODOS | LOCAL | PROVINCIA | COPACKERS
  filtroEstado: "TODOS",       // TODOS | COMPLETO | EN_PROCESO | PENDIENTE
  busqueda: "",
  dia: "",                     // dd/mm/yyyy
  turno: "",
  transporte: "",
  pagina: 1,
  porPagina: 15,
  vivo: true,
  intervalo: null
};

let gaugePiking = null;
let gaugeDespacho = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!Auth.requireAuth()) return;

  lucide.createIcons();
  configurarEventos();
  inicializarFiltros();
  refrescarTodo();
  iniciarVivo();
});

// =====================================================
// EVENTOS
// =====================================================
function configurarEventos() {
  // Tabs principales
  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.onclick = () => {
      Estado.tab = btn.dataset.tab;
      Estado.pagina = 1;
      pintarTabs();
      refrescarTodo();
    };
  });

  // Filtros estado tabla
  document.querySelectorAll("[data-estado]").forEach(btn => {
    btn.onclick = () => {
      Estado.filtroEstado = btn.dataset.estado;
      Estado.pagina = 1;
      pintarFiltrosEstado();
      pintarTabla();
    };
  });

  document.getElementById("buscador").oninput = (e) => {
    Estado.busqueda = e.target.value.toLowerCase().trim();
    Estado.pagina = 1;
    pintarTabla();
  };

  document.getElementById("filtro-dia").onchange = (e) => {
    Estado.dia = e.target.value;
    Estado.pagina = 1;
    refrescarTodo();
  };

  document.getElementById("filtro-turno").onchange = (e) => {
    Estado.turno = e.target.value;
    Estado.pagina = 1;
    refrescarTodo();
  };

  document.getElementById("filtro-transporte").onchange = (e) => {
    Estado.transporte = e.target.value;
    Estado.pagina = 1;
    refrescarTodo();
  };

  // Cargar Excel
  document.getElementById("input-excel").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      Utils.toast("Procesando archivo Excel...", "info");
      const { filas, archivo, hoja } = await DataStore.parsearExcel(file);
      if (filas.length === 0) {
        Utils.toast("El archivo no contiene datos validos", "warning");
        return;
      }
      DataStore.saveEmbarques(filas, archivo, hoja);
      Utils.toast(`${filas.length} registros cargados desde ${archivo}`, "success");
      inicializarFiltros();
      refrescarTodo();
    } catch (err) {
      console.error(err);
      Utils.toast("Error al leer el archivo: " + err.message, "error");
    } finally {
      e.target.value = "";
    }
  };

  document.getElementById("btn-exportar").onclick = () => {
    const datos = filtrar();
    if (!datos.length) return Utils.toast("No hay datos para exportar", "warning");
    Utils.exportarCSV(datos.map(d => ({
      DT: d.dt, Fecha: d.fecha, Hora: d.hora, Transporte: d.transporte,
      Cliente: d.cliente, Destino: d.destino, Tipo: d.tipoDestino,
      Ton: d.pesoTon, "M3": d.volumenM3, Solicitado: d.undSolicitada, Picado: d.undPicada,
      Placa: d.placa, Avance: d.pctAvance + "%", Estado: d.estado,
      Stage: d.stage, Turno: d.turno
    })), "embarques_dinet");
  };

  document.getElementById("btn-tema").onclick = () => {
    Utils.toggleDarkMode();
    setTimeout(() => refrescarTodo(), 100); // re-render para colores de chart
  };

  document.getElementById("btn-salir").onclick = () => Auth.logout();

  document.getElementById("cerrar-modal").onclick = cerrarModal;
  document.getElementById("modal-detalle").onclick = (e) => {
    if (e.target.id === "modal-detalle") cerrarModal();
  };
}

// =====================================================
// FILTROS DINAMICOS (poblar selects)
// =====================================================
function inicializarFiltros() {
  const datos = DataStore.getEmbarques();

  // Dias unicos
  const dias = [...new Set(datos.map(d => d.fecha).filter(Boolean))];
  const selDia = document.getElementById("filtro-dia");
  const valActual = selDia.value;
  selDia.innerHTML = `<option value="">Todos los dias</option>` +
    dias.map(d => `<option value="${d}">${d}</option>`).join("");
  if (dias.includes(valActual)) selDia.value = valActual;

  // Transportes unicos
  const transportes = [...new Set(datos.map(d => d.transporte).filter(Boolean))].sort();
  const selT = document.getElementById("filtro-transporte");
  const valT = selT.value;
  selT.innerHTML = `<option value="">Todos los transportes</option>` +
    transportes.map(t => `<option value="${t}">${t}</option>`).join("");
  if (transportes.includes(valT)) selT.value = valT;
}

// =====================================================
// FILTRADO
// =====================================================
function porTab(datos) {
  if (Estado.tab === "TODOS") return datos;
  const tipos = APP_CONFIG.categorias[Estado.tab] || [];
  return datos.filter(d => tipos.includes(d.tipoDestino));
}

function filtrar() {
  let datos = DataStore.getEmbarques();
  datos = porTab(datos);

  if (Estado.dia)        datos = datos.filter(d => d.fecha === Estado.dia);
  if (Estado.turno)      datos = datos.filter(d => d.turno === Estado.turno);
  if (Estado.transporte) datos = datos.filter(d => d.transporte === Estado.transporte);

  if (Estado.busqueda) {
    const q = Estado.busqueda;
    datos = datos.filter(d =>
      d.dt.toLowerCase().includes(q) ||
      d.destino.toLowerCase().includes(q) ||
      d.cliente.toLowerCase().includes(q) ||
      d.transporte.toLowerCase().includes(q) ||
      (d.placa || "").toLowerCase().includes(q)
    );
  }
  return datos;
}

function clasificar(d) {
  if (d.estado === "pending" || d.pctAvance === 0) return "PENDIENTE";
  if (d.pctAvance >= 100) return "COMPLETO";
  return "EN_PROCESO";
}

function filtrarPorEstado(datos) {
  if (Estado.filtroEstado === "TODOS") return datos;
  return datos.filter(d => clasificar(d) === Estado.filtroEstado);
}

// =====================================================
// REFRESCO COMPLETO
// =====================================================
function refrescarTodo() {
  pintarMeta();
  pintarTabs();
  pintarFiltrosEstado();
  pintarGauges();
  pintarResumen();
  pintarTurnos();
  pintarTabla();
  lucide.createIcons();
}

function pintarMeta() {
  const meta = DataStore.getMeta();
  const fecha = new Date(meta.actualizado);
  const fechaStr = fecha.toLocaleDateString("es-PE") + ", " + fecha.toLocaleTimeString("es-PE", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  document.getElementById("meta-base").textContent =
    `Base: ${meta.archivo} | Hoja: ${meta.hoja} | Actualizado: ${fechaStr}`;
}

// =====================================================
// TABS
// =====================================================
function pintarTabs() {
  const todos = DataStore.getEmbarques();
  const conteo = {
    TODOS: todos.length,
    LOCAL: todos.filter(d => APP_CONFIG.categorias.LOCAL.includes(d.tipoDestino)).length,
    PROVINCIA: todos.filter(d => APP_CONFIG.categorias.PROVINCIA.includes(d.tipoDestino)).length,
    COPACKERS: todos.filter(d => APP_CONFIG.categorias.COPACKERS.includes(d.tipoDestino)).length
  };

  const colores = {
    TODOS: "border-blue-500 text-blue-600 dark:text-blue-400",
    LOCAL: "border-emerald-500 text-emerald-600 dark:text-emerald-400",
    PROVINCIA: "border-amber-500 text-amber-600 dark:text-amber-400",
    COPACKERS: "border-purple-500 text-purple-600 dark:text-purple-400"
  };

  document.querySelectorAll("[data-tab]").forEach(btn => {
    const k = btn.dataset.tab;
    btn.querySelector(".tab-count").textContent = conteo[k];
    if (k === Estado.tab) {
      btn.className = `tab-btn flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${colores[k]}`;
    } else {
      btn.className = "tab-btn flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors";
    }
  });

  // Subtitulo gauge piking
  const tit = document.getElementById("titulo-piking");
  if (tit) tit.textContent = Estado.tab === "TODOS" ? "PIKING" : `PIKING ${Estado.tab}`;
}

// =====================================================
// FILTROS ESTADO (TODOS / COMPLETO / EN PROCESO / PENDIENTE)
// =====================================================
function pintarFiltrosEstado() {
  const datos = filtrar();
  const conteo = {
    TODOS: datos.length,
    COMPLETO: datos.filter(d => clasificar(d) === "COMPLETO").length,
    EN_PROCESO: datos.filter(d => clasificar(d) === "EN_PROCESO").length,
    PENDIENTE: datos.filter(d => clasificar(d) === "PENDIENTE").length
  };

  const estilos = {
    TODOS:      { activo: "bg-blue-600 text-white",       inactivo: "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300" },
    COMPLETO:   { activo: "bg-emerald-600 text-white",    inactivo: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300" },
    EN_PROCESO: { activo: "bg-amber-600 text-white",      inactivo: "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300" },
    PENDIENTE:  { activo: "bg-rose-600 text-white",       inactivo: "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300" }
  };

  document.querySelectorAll("[data-estado]").forEach(btn => {
    const k = btn.dataset.estado;
    btn.querySelector(".estado-count").textContent = conteo[k];
    const e = estilos[k];
    btn.className = `estado-btn flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${k === Estado.filtroEstado ? e.activo : e.inactivo}`;
  });
}

// =====================================================
// GAUGES
// =====================================================
function crearGauge(canvasId, valor, color) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  const v = Math.max(0, Math.min(100, valor));

  // Color dinamico segun valor
  const c = color || (v >= 80 ? "#10b981" : v >= 50 ? "#f59e0b" : "#ef4444");

  return new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [v, 100 - v],
        backgroundColor: [c, "rgba(148, 163, 184, 0.15)"],
        borderWidth: 0,
        circumference: 180,
        rotation: 270,
        cutout: "75%"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      animation: {
        duration: 800,
        easing: "easeOutQuart"
      }
    },
    plugins: [{
      id: "ticks",
      afterDraw: (chart) => {
        const { ctx, chartArea: { width, height, left, top } } = chart;
        const cx = left + width / 2;
        const cy = top + height; // base del semicirculo
        const radio = Math.min(width, height * 2) / 2;

        ctx.save();
        ctx.font = "10px Inter, sans-serif";
        ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#94a3b8" : "#64748b";
        ctx.textAlign = "center";

        // Etiquetas 0%, 25%, 50%, 75%, 100%
        const ticks = [0, 25, 50, 75, 100];
        ticks.forEach(t => {
          const ang = Math.PI + (t / 100) * Math.PI;
          const r = radio * 0.95;
          const x = cx + Math.cos(ang) * r;
          const y = cy + Math.sin(ang) * r - 5;
          ctx.fillText(t + "%", x, y);
        });

        // Aguja
        const ang = Math.PI + (v / 100) * Math.PI;
        const x2 = cx + Math.cos(ang) * (radio * 0.7);
        const y2 = cy + Math.sin(ang) * (radio * 0.7);
        ctx.strokeStyle = document.documentElement.classList.contains("dark") ? "#e2e8f0" : "#0f172a";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Punto base aguja
        ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#e2e8f0" : "#0f172a";
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#0f172a" : "#fff";
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }]
  });
}

function pintarGauges() {
  const datos = filtrar();
  const totales = calcularTotales(datos);

  const pctPik = totales.solicitadas > 0 ? (totales.picadas / totales.solicitadas) * 100 : 0;
  const pctDes = totales.solicitadas > 0 ? (totales.despachadas / totales.solicitadas) * 100 : 0;

  // Destruye y recrea
  if (gaugePiking)  gaugePiking.destroy();
  if (gaugeDespacho) gaugeDespacho.destroy();
  gaugePiking   = crearGauge("gauge-piking", pctPik);
  gaugeDespacho = crearGauge("gauge-despacho", pctDes);

  document.getElementById("gauge-piking-valor").textContent = pctPik.toFixed(1) + "%";
  document.getElementById("gauge-piking-detalle").textContent =
    `${Utils.formatoNum(totales.picadas)} / ${Utils.formatoNum(totales.solicitadas)} Cjs`;

  document.getElementById("gauge-despacho-valor").textContent = pctDes.toFixed(1) + "%";
  document.getElementById("gauge-despacho-detalle").textContent =
    `${Utils.formatoNum(totales.despachadas)} cjs cargadas`;

  // Color del valor
  const colorTexto = (v) => v >= 80 ? "text-emerald-600 dark:text-emerald-400"
                          : v >= 50 ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400";
  document.getElementById("gauge-piking-valor").className = "text-4xl font-extrabold " + colorTexto(pctPik);
  document.getElementById("gauge-despacho-valor").className = "text-4xl font-extrabold " + colorTexto(pctDes);
}

function calcularTotales(datos) {
  const ton = datos.reduce((s, d) => s + d.pesoTon, 0);
  const m3  = datos.reduce((s, d) => s + d.volumenM3, 0);
  const sol = datos.reduce((s, d) => s + d.undSolicitada, 0);
  const pic = datos.reduce((s, d) => s + d.undPicada, 0);
  const desp = datos.filter(d => d.finCarga === "ok").reduce((s, d) => s + d.undPicada, 0);

  // Avance picking en ton/m3
  const tonAv  = datos.reduce((s, d) => s + (d.pesoTon * (d.pctAvance / 100)), 0);
  const m3Av   = datos.reduce((s, d) => s + (d.volumenM3 * (d.pctAvance / 100)), 0);
  // Despacho ton/m3 solo de los que tienen finCarga ok
  const tonDes = datos.filter(d => d.finCarga === "ok").reduce((s, d) => s + d.pesoTon, 0);
  const m3Des  = datos.filter(d => d.finCarga === "ok").reduce((s, d) => s + d.volumenM3, 0);

  return {
    toneladas: ton, volumen: m3,
    solicitadas: sol, picadas: pic, despachadas: desp,
    tonAvance: tonAv, m3Avance: m3Av,
    tonDespacho: tonDes, m3Despacho: m3Des
  };
}

// =====================================================
// RESUMEN OPERATIVO
// =====================================================
function pintarResumen() {
  const datos = filtrar();
  const t = calcularTotales(datos);

  document.getElementById("r-total-ton").textContent = t.toneladas.toFixed(1) + " Ton";
  document.getElementById("r-total-m3").textContent  = t.volumen.toFixed(1) + " m³";
  document.getElementById("r-total-cj").textContent  = Utils.formatoNum(t.solicitadas) + " Cj";

  document.getElementById("r-avance-ton").textContent = t.tonAvance.toFixed(1) + " Ton";
  document.getElementById("r-avance-m3").textContent  = t.m3Avance.toFixed(1) + " m³";
  document.getElementById("r-avance-cj").textContent  = Utils.formatoNum(t.picadas) + " Cj";

  const pendTon = Math.max(0, t.toneladas - t.tonAvance);
  const pendM3  = Math.max(0, t.volumen - t.m3Avance);
  const pendCj  = Math.max(0, t.solicitadas - t.picadas);
  document.getElementById("r-pend-ton").textContent = pendTon.toFixed(1) + " Ton";
  document.getElementById("r-pend-m3").textContent  = pendM3.toFixed(1) + " m³";
  document.getElementById("r-pend-cj").textContent  = Utils.formatoNum(pendCj) + " Cj";

  document.getElementById("r-desp-ton").textContent = t.tonDespacho.toFixed(1) + " Ton";
  document.getElementById("r-desp-m3").textContent  = t.m3Despacho.toFixed(1) + " m³";
  document.getElementById("r-desp-cj").textContent  = Utils.formatoNum(t.despachadas) + " Cj";
}

// =====================================================
// AVANCE POR TURNO
// =====================================================
function pintarTurnos() {
  const datos = filtrar();
  const totalSol = datos.reduce((s, d) => s + d.undSolicitada, 0) || 1;

  const turnos = ["T1", "T2", "T3"];
  const cont = document.getElementById("turnos-bars");
  cont.innerHTML = turnos.map(t => {
    const filtrados = datos.filter(d => d.turno === t);
    if (filtrados.length === 0) return "";

    const ton = filtrados.reduce((s, d) => s + d.pesoTon, 0);
    const m3  = filtrados.reduce((s, d) => s + d.volumenM3, 0);
    const cj  = filtrados.reduce((s, d) => s + d.undPicada, 0);
    const sol = filtrados.reduce((s, d) => s + d.undSolicitada, 0);
    const pct = sol > 0 ? (cj / sol) * 100 : 0;

    return `
      <div>
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="font-bold text-slate-700 dark:text-slate-300">${t === "T1" ? "1 TURNO" : t === "T2" ? "2 TURNO" : "3 TURNO"}</span>
          <span class="text-slate-500 dark:text-slate-400">
            ${ton.toFixed(1)} Ton  ·  ${m3.toFixed(1)} m³  ·  ${Utils.formatoNum(cj)} Cjs
          </span>
        </div>
        <div class="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
          <div class="h-full rounded-full transition-all duration-500" style="width: ${pct}%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
          <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold ${pct > 50 ? 'text-white' : 'text-slate-700 dark:text-slate-300'}">${pct.toFixed(0)}%</span>
        </div>
      </div>
    `;
  }).join("") || `<p class="text-sm text-slate-400 text-center py-2">Sin datos por turno</p>`;
}

// =====================================================
// TABLA DETALLE
// =====================================================
function pintarTabla() {
  const todos = filtrar();
  const filtrados = filtrarPorEstado(todos);

  const tbody = document.getElementById("tbody-detalle");
  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="15" class="text-center py-12 text-slate-400">
        <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2"></i>
        <p>No hay registros que coincidan con los filtros</p>
      </td></tr>`;
    document.getElementById("footer-tabla").innerHTML = "";
    lucide.createIcons();
    return;
  }

  // Paginacion
  const totalPag = Math.ceil(filtrados.length / Estado.porPagina);
  if (Estado.pagina > totalPag) Estado.pagina = totalPag;
  const inicio = (Estado.pagina - 1) * Estado.porPagina;
  const visibles = filtrados.slice(inicio, inicio + Estado.porPagina);

  tbody.innerHTML = visibles.map(d => filaDT(d)).join("");

  document.getElementById("footer-tabla").innerHTML = `
    <span>Mostrando ${inicio + 1}-${Math.min(inicio + Estado.porPagina, filtrados.length)} de <strong>${filtrados.length}</strong> DTs</span>
    <div class="flex items-center gap-1">
      <button onclick="cambiarPagina(${Estado.pagina - 1})" ${Estado.pagina === 1 ? "disabled" : ""} class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700">‹ Anterior</button>
      <span class="px-3 font-medium">${Estado.pagina} / ${totalPag}</span>
      <button onclick="cambiarPagina(${Estado.pagina + 1})" ${Estado.pagina === totalPag ? "disabled" : ""} class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700">Siguiente ›</button>
    </div>
  `;

  lucide.createIcons();
}

function filaDT(d) {
  const clase = clasificar(d);
  const colorBorde = {
    COMPLETO:   "border-l-emerald-500",
    EN_PROCESO: "border-l-amber-500",
    PENDIENTE:  "border-l-rose-500"
  }[clase];

  const colorAvance = d.pctAvance >= 100 ? "bg-emerald-500"
                    : d.pctAvance > 0    ? "bg-amber-500"
                    : "bg-rose-500";

  const iconoCarga = d.finCarga === "ok"
    ? `<div class="flex flex-col items-center"><i data-lucide="truck" class="w-5 h-5 text-emerald-500"></i><span class="text-[9px] font-bold text-emerald-600 mt-0.5">CARGADO</span></div>`
    : d.pctAvance > 0
      ? `<div class="flex flex-col items-center"><i data-lucide="package" class="w-5 h-5 text-amber-500"></i><span class="text-[9px] font-bold text-amber-600 mt-0.5">EN CURSO</span></div>`
      : `<div class="flex flex-col items-center"><i data-lucide="clock" class="w-5 h-5 text-rose-500"></i><span class="text-[9px] font-bold text-rose-600 mt-0.5">PENDIENTE</span></div>`;

  const dtLink = `<button onclick="abrirDetalle('${d.dt}')" class="font-semibold text-emerald-600 hover:underline">${d.dt}</button>`;

  return `
    <tr class="border-l-4 ${colorBorde} hover:bg-slate-50 dark:hover:bg-slate-700/30">
      <td class="px-4 py-3 whitespace-nowrap">${dtLink}</td>
      <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 max-w-[150px] truncate" title="${d.transporte}">${d.transporte}</td>
      <td class="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 max-w-[200px]" title="${d.cliente}">${d.cliente}</td>
      <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[180px]" title="${d.destino}">${d.destino}</td>
      <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-300">${d.pesoTon.toFixed(1)}</td>
      <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-300">${d.volumenM3.toFixed(1)}</td>
      <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-300">${Utils.formatoNum(d.undSolicitada)}</td>
      <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-300">${Utils.formatoNum(d.undPicada)}</td>
      <td class="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400">${d.placa || "—"}</td>
      <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">${d.hora || "—"}</td>
      <td class="px-4 py-3 min-w-[140px]">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-700 dark:text-slate-200 w-12">${d.pctAvance.toFixed(1)}%</span>
          <div class="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full ${colorAvance} rounded-full transition-all" style="width: ${d.pctAvance}%"></div>
          </div>
        </div>
      </td>
      <td class="px-4 py-3 text-center">${iconoCarga}</td>
      <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">${d.rampa || "—"}</td>
      <td class="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400 max-w-[140px] truncate" title="${d.stage}">${d.stage || "—"}</td>
      <td class="px-4 py-3 text-xs">${d.cita ? `<span class="badge badge-cita">${d.cita}</span>` : "—"}</td>
    </tr>
  `;
}

function cambiarPagina(p) {
  Estado.pagina = p;
  pintarTabla();
}

// =====================================================
// MODAL DETALLE
// =====================================================
function abrirDetalle(dt) {
  const d = DataStore.getEmbarques().find(x => x.dt === dt);
  if (!d) return;

  const clase = clasificar(d);
  const colorBadge = {
    COMPLETO:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    EN_PROCESO: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    PENDIENTE:  "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
  }[clase];

  document.getElementById("modal-titulo").innerHTML =
    `DT <span class="font-mono text-emerald-600">${d.dt}</span>
     <span class="ml-2 text-xs px-2 py-1 rounded-full ${colorBadge}">${clase.replace("_", " ")}</span>`;

  document.getElementById("modal-contenido").innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
      ${campoDetalle("Cliente", d.cliente)}
      ${campoDetalle("Cliente DINET", d.clienteDinet)}
      ${campoDetalle("Cod. Cliente", d.codCliente)}
      ${campoDetalle("Destino", d.destino)}
      ${campoDetalle("Tipo Destino", d.tipoDestino)}
      ${campoDetalle("Familias", d.familias)}
      ${campoDetalle("Transporte", d.transporte)}
      ${campoDetalle("Placa", d.placa)}
      ${campoDetalle("Stage", d.stage)}
      ${campoDetalle("Rampa", d.rampa)}
      ${campoDetalle("Turno", d.turno)}
      ${campoDetalle("Cita", d.cita || "—")}
    </div>

    <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
      <h4 class="font-semibold text-slate-700 dark:text-slate-300 mb-3">Avance del picking</h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="bg-slate-50 dark:bg-slate-700/40 rounded-lg p-3">
          <p class="text-xs text-slate-500 dark:text-slate-400 uppercase">Solicitado</p>
          <p class="text-xl font-bold text-slate-900 dark:text-white">${Utils.formatoNum(d.undSolicitada)}</p>
        </div>
        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
          <p class="text-xs text-emerald-600 dark:text-emerald-400 uppercase">Picado</p>
          <p class="text-xl font-bold text-emerald-700 dark:text-emerald-300">${Utils.formatoNum(d.undPicada)}</p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p class="text-xs text-blue-600 dark:text-blue-400 uppercase">Peso</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">${d.pesoTon.toFixed(1)} Ton</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p class="text-xs text-purple-600 dark:text-purple-400 uppercase">Volumen</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">${d.volumenM3.toFixed(1)} m³</p>
        </div>
      </div>
      <div class="mt-4">
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="text-slate-500">Avance</span>
          <span class="font-bold">${d.pctAvance.toFixed(1)}%</span>
        </div>
        <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full" style="width: ${d.pctAvance}%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
        </div>
      </div>
    </div>

    ${d.inicioPicking ? `
    <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
      <h4 class="font-semibold text-slate-700 dark:text-slate-300 mb-3">Tiempos</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        ${campoDetalle("Inicio Picking", d.inicioPicking)}
        ${campoDetalle("Fin Picking", d.finPicking)}
        ${campoDetalle("Tiempo total", d.tiempoPicking)}
      </div>
    </div>` : ""}

    ${d.usuarioEjec ? `
    <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
      <h4 class="font-semibold text-slate-700 dark:text-slate-300 mb-2">Operadores</h4>
      <div class="flex flex-wrap gap-1.5">
        ${d.usuarioEjec.split("/").map(u => `<span class="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">${u.trim()}</span>`).join("")}
      </div>
    </div>` : ""}

    ${d.motivoDif ? `
    <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
      <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <p class="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase mb-1">Motivo de diferencia</p>
        <p class="text-sm text-amber-900 dark:text-amber-200">${d.motivoDif}</p>
      </div>
    </div>` : ""}
  `;

  const modal = document.getElementById("modal-detalle");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  lucide.createIcons();
}

function campoDetalle(label, valor) {
  return `
    <div>
      <p class="text-xs uppercase text-slate-400 dark:text-slate-500 font-semibold">${label}</p>
      <p class="text-slate-900 dark:text-white mt-0.5">${valor || "—"}</p>
    </div>
  `;
}

function cerrarModal() {
  const modal = document.getElementById("modal-detalle");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// =====================================================
// EN VIVO
// =====================================================
function iniciarVivo() {
  if (Estado.intervalo) clearInterval(Estado.intervalo);
  Estado.intervalo = setInterval(() => {
    if (Estado.vivo) {
      pintarMeta();
      // Solo refresca la tabla y resumen sin reanimar gauges
      pintarFiltrosEstado();
      pintarTabla();
    }
  }, APP_CONFIG.refrescoSegundos * 1000);
}
