// =====================================================
// SIDEBAR — componente reutilizable
// =====================================================

function renderSidebar(activo = "dashboard") {
  const sesion = Auth.requireAuth();
  if (!sesion) return;

  const items = [
    { id: "dashboard",     icono: "layout-dashboard", texto: "Dashboard",     href: "dashboard.html" },
    { id: "clientes",      icono: "users",            texto: "Clientes",      href: "clientes.html" },
    { id: "reportes",      icono: "bar-chart-3",      texto: "Reportes",      href: "reportes.html" },
    { id: "configuracion", icono: "settings",         texto: "Configuracion", href: "configuracion.html" }
  ];

  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style="background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));">
        <span data-app-nombre>C</span>
      </div>
      <div class="flex-1 min-w-0">
        <h1 class="font-bold text-slate-900 dark:text-white truncate" data-app-nombre>App</h1>
        <p class="text-xs text-slate-500 dark:text-slate-400" data-app-version>v</p>
      </div>
    </div>

    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      ${items.map(item => `
        <a href="${item.href}" class="sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${item.id === activo
          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"}">
          <i data-lucide="${item.icono}" class="w-5 h-5"></i>
          <span>${item.texto}</span>
        </a>
      `).join("")}
    </nav>

    <div class="px-3 py-4 border-t border-slate-200 dark:border-slate-700">
      <div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
        <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium" style="background: linear-gradient(135deg, var(--color-primario), var(--color-acento));">
          ${sesion.nombre.charAt(0).toUpperCase()}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-900 dark:text-white truncate">${sesion.nombre}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 truncate">${sesion.rol}</p>
        </div>
        <button onclick="Auth.logout()" class="text-slate-400 hover:text-rose-500 transition-colors" title="Cerrar sesion">
          <i data-lucide="log-out" class="w-5 h-5"></i>
        </button>
      </div>
    </div>
  `;
}

function renderTopbar(titulo, subtitulo = "") {
  const topbar = document.getElementById("topbar");
  if (!topbar) return;

  topbar.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button id="btn-toggle-sidebar" class="lg:hidden text-slate-600 dark:text-slate-300">
          <i data-lucide="menu" class="w-6 h-6"></i>
        </button>
        <div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">${titulo}</h2>
          ${subtitulo ? `<p class="text-sm text-slate-500 dark:text-slate-400">${subtitulo}</p>` : ""}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button id="btn-tema" class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" title="Cambiar tema">
          <i data-lucide="moon" class="w-5 h-5 dark:hidden"></i>
          <i data-lucide="sun" class="w-5 h-5 hidden dark:block"></i>
        </button>
        <button class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 relative" title="Notificaciones">
          <i data-lucide="bell" class="w-5 h-5"></i>
          <span class="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>
      </div>
    </div>
  `;

  setTimeout(() => {
    const btnTema = document.getElementById("btn-tema");
    if (btnTema) btnTema.onclick = () => Utils.toggleDarkMode();

    const btnToggle = document.getElementById("btn-toggle-sidebar");
    if (btnToggle) btnToggle.onclick = () => {
      document.getElementById("sidebar").classList.toggle("-translate-x-full");
    };
  }, 0);
}
