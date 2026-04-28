// =====================================================
// CONFIGURACION GENERAL — Editable
// =====================================================
// Cambia aqui el nombre, logo y colores de tu marca.
// Los cambios se aplican en toda la aplicacion.
// =====================================================

const APP_CONFIG = {
  // Nombre de la app (aparece en login, sidebar, titulos)
  nombre: "ClientesHumanIA",
  nombreCorto: "CHIA",
  eslogan: "Gestion inteligente de clientes",

  // Colores principales (usa codigos hex)
  colorPrimario: "#4f46e5",   // Indigo
  colorSecundario: "#06b6d4", // Cian
  colorAcento: "#f59e0b",     // Ambar

  // Version
  version: "2.0.0",

  // Empresa
  empresa: "HumanIA",
  email: "contacto@humania.com",
  anio: new Date().getFullYear(),

  // Credenciales por defecto (cambiar en produccion)
  usuariosDefault: [
    { usuario: "admin",     password: "admin123",   rol: "Administrador", nombre: "Administrador" },
    { usuario: "vendedor",  password: "vendedor123", rol: "Vendedor",     nombre: "Juan Vendedor" }
  ]
};

// Aplica el color primario a las variables CSS
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.style.setProperty("--color-primario", APP_CONFIG.colorPrimario);
  document.documentElement.style.setProperty("--color-secundario", APP_CONFIG.colorSecundario);
  document.documentElement.style.setProperty("--color-acento", APP_CONFIG.colorAcento);

  // Coloca el nombre de la app en cualquier elemento con [data-app-nombre]
  document.querySelectorAll("[data-app-nombre]").forEach(el => el.textContent = APP_CONFIG.nombre);
  document.querySelectorAll("[data-app-eslogan]").forEach(el => el.textContent = APP_CONFIG.eslogan);
  document.querySelectorAll("[data-app-empresa]").forEach(el => el.textContent = APP_CONFIG.empresa);
  document.querySelectorAll("[data-app-anio]").forEach(el => el.textContent = APP_CONFIG.anio);
  document.querySelectorAll("[data-app-version]").forEach(el => el.textContent = "v" + APP_CONFIG.version);
});
