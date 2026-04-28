// =====================================================
// CONFIGURACION
// =====================================================

const CFG_KEY = "chia_config_user";

document.addEventListener("DOMContentLoaded", () => {
  if (!Auth.requireAuth()) return;

  renderSidebar("configuracion");
  renderTopbar("Configuracion", "Personaliza tu experiencia");
  lucide.createIcons();

  cargarValores();
  configurarEventos();
  mostrarStorage();
});

function cargarValores() {
  const saved = JSON.parse(localStorage.getItem(CFG_KEY) || "{}");
  document.getElementById("cfg-nombre").value = saved.nombre || APP_CONFIG.nombre;
  document.getElementById("cfg-eslogan").value = saved.eslogan || APP_CONFIG.eslogan;
  document.getElementById("cfg-empresa").value = saved.empresa || APP_CONFIG.empresa;
  document.getElementById("cfg-email").value = saved.email || APP_CONFIG.email;
  document.getElementById("cfg-primario").value = saved.colorPrimario || APP_CONFIG.colorPrimario;
  document.getElementById("cfg-secundario").value = saved.colorSecundario || APP_CONFIG.colorSecundario;
}

function configurarEventos() {
  document.getElementById("form-branding").onsubmit = (e) => {
    e.preventDefault();
    const cfg = {
      nombre: document.getElementById("cfg-nombre").value.trim(),
      eslogan: document.getElementById("cfg-eslogan").value.trim(),
      empresa: document.getElementById("cfg-empresa").value.trim(),
      email: document.getElementById("cfg-email").value.trim(),
      colorPrimario: document.getElementById("cfg-primario").value,
      colorSecundario: document.getElementById("cfg-secundario").value
    };
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
    // Actualiza APP_CONFIG en memoria para que se aplique sin recargar
    Object.assign(APP_CONFIG, cfg);
    document.documentElement.style.setProperty("--color-primario", cfg.colorPrimario);
    document.documentElement.style.setProperty("--color-secundario", cfg.colorSecundario);
    document.querySelectorAll("[data-app-nombre]").forEach(el => el.textContent = cfg.nombre);
    document.querySelectorAll("[data-app-eslogan]").forEach(el => el.textContent = cfg.eslogan);
    document.querySelectorAll("[data-app-empresa]").forEach(el => el.textContent = cfg.empresa);
    Utils.toast("Configuracion guardada", "success");
  };

  document.getElementById("btn-restaurar").onclick = () => {
    Utils.confirmar("¿Restaurar valores por defecto?", () => {
      localStorage.removeItem(CFG_KEY);
      location.reload();
    });
  };

  document.getElementById("btn-exportar-json").onclick = () => {
    const data = {
      clientes: DataStore.getClientes(),
      usuarios: DataStore.getUsuarios(),
      actividad: DataStore.getActividad(),
      config: JSON.parse(localStorage.getItem(CFG_KEY) || "{}"),
      exportado: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "respaldo_chia_" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    Utils.toast("Respaldo descargado", "success");
  };

  document.getElementById("file-importar").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        Utils.confirmar("¿Reemplazar todos los datos actuales con el archivo?", () => {
          if (data.clientes) DataStore.saveClientes(data.clientes);
          if (data.config) localStorage.setItem(CFG_KEY, JSON.stringify(data.config));
          Utils.toast("Datos importados correctamente", "success");
          setTimeout(() => location.reload(), 800);
        });
      } catch (err) {
        Utils.toast("Archivo JSON invalido", "error");
      }
    };
    reader.readAsText(file);
  };

  document.getElementById("btn-reset").onclick = () => {
    Utils.confirmar("Esto borrara todos los datos. ¿Continuar?", () => {
      DataStore.resetAll();
      localStorage.removeItem(CFG_KEY);
      Utils.toast("Datos borrados", "success");
      setTimeout(() => window.location.href = "index.html", 800);
    });
  };
}

function mostrarStorage() {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += (localStorage[key].length + key.length) * 2;
    }
  }
  const kb = (total / 1024).toFixed(2);
  document.getElementById("info-storage").textContent = kb + " KB";
}
