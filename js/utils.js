// =====================================================
// UTILIDADES
// =====================================================

const Utils = {
  formatoMoneda(num) {
    return "S/ " + Number(num).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  formatoFecha(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  },

  formatoFechaHora(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
  },

  fechaRelativa(iso) {
    if (!iso) return "—";
    const ahora = new Date();
    const fecha = new Date(iso);
    const seg = Math.floor((ahora - fecha) / 1000);
    if (seg < 60) return "hace " + seg + "s";
    if (seg < 3600) return "hace " + Math.floor(seg / 60) + " min";
    if (seg < 86400) return "hace " + Math.floor(seg / 3600) + " h";
    if (seg < 604800) return "hace " + Math.floor(seg / 86400) + " d";
    return this.formatoFecha(iso);
  },

  // Notificacion tipo toast
  toast(mensaje, tipo = "info") {
    const colores = {
      info:    "bg-blue-500",
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      error:   "bg-rose-500"
    };
    const iconos = {
      info: "info",
      success: "check-circle",
      warning: "alert-triangle",
      error: "x-circle"
    };
    const div = document.createElement("div");
    div.className = `fixed top-6 right-6 z-50 ${colores[tipo]} text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in`;
    div.innerHTML = `<i data-lucide="${iconos[tipo]}" class="w-5 h-5"></i><span>${mensaje}</span>`;
    document.body.appendChild(div);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
      div.style.transition = "opacity 0.3s, transform 0.3s";
      div.style.opacity = "0";
      div.style.transform = "translateX(100%)";
      setTimeout(() => div.remove(), 300);
    }, 3000);
  },

  // Confirmacion modal
  confirmar(mensaje, onAceptar) {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in";
    overlay.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div class="flex items-start gap-4">
          <div class="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-full">
            <i data-lucide="alert-triangle" class="w-6 h-6 text-rose-600"></i>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-slate-900 dark:text-white text-lg">Confirmar accion</h3>
            <p class="text-slate-600 dark:text-slate-400 mt-1">${mensaje}</p>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button id="btn-cancelar" class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancelar</button>
          <button id="btn-aceptar" class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white">Aceptar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    if (window.lucide) lucide.createIcons();
    overlay.querySelector("#btn-cancelar").onclick = () => overlay.remove();
    overlay.querySelector("#btn-aceptar").onclick = () => { overlay.remove(); onAceptar(); };
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  },

  // Modo oscuro
  toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    localStorage.setItem("chia_theme", isDark ? "dark" : "light");
    return isDark;
  },

  initTheme() {
    const saved = localStorage.getItem("chia_theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
  },

  // Exportar a CSV
  exportarCSV(filas, nombreArchivo) {
    if (!filas || filas.length === 0) {
      this.toast("No hay datos para exportar", "warning");
      return;
    }
    const headers = Object.keys(filas[0]);
    const csv = [
      headers.join(","),
      ...filas.map(f => headers.map(h => `"${(f[h] ?? "").toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo + "_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    this.toast("Archivo exportado correctamente", "success");
  }
};

// Inicializa tema antes de pintar
Utils.initTheme();
