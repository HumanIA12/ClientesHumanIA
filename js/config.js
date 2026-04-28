// =====================================================
// CONFIGURACION GENERAL — Editable
// =====================================================
// Cambia aqui el nombre, logo y colores de tu marca.
// =====================================================

const APP_CONFIG = {
  // Branding
  nombre: "DINET",
  nombreCorto: "D",
  subtitulo: "Estatus Picking Unilever",
  eslogan: "Sistema de monitoreo de embarques en tiempo real",

  // Colores (acordes al diseño DINET)
  colorPrimario: "#2563eb",   // Azul
  colorSecundario: "#0ea5e9", // Sky
  colorAcento: "#f59e0b",     // Ambar
  colorExito: "#10b981",      // Verde
  colorPeligro: "#ef4444",    // Rojo
  colorAlerta: "#f59e0b",     // Naranja

  // Modo en vivo
  refrescoSegundos: 30,

  // Fuente de datos
  archivoBase: "dinet_embarques_data.xlsx",
  hojaExcel: "Embarques",

  // Version y empresa
  version: "2.0.0",
  empresa: "DINET S.A",
  email: "logistica@dinet.com.pe",
  anio: new Date().getFullYear(),

  // Mapeo de Tipo_Destino a categorias del dashboard
  // LOCAL agrupa los canales de Lima; PROVINCIA y COPACKERS son aparte
  categorias: {
    "LOCAL":     ["Canal Tradicional", "Canal Moderno"],
    "PROVINCIA": ["Provincia"],
    "COPACKERS": ["Copackers"]
  },

  // Credenciales por defecto
  usuariosDefault: [
    { usuario: "admin",    password: "admin123",    rol: "Administrador",      nombre: "Administrador DINET" },
    { usuario: "operador", password: "operador123", rol: "Operador Logistica", nombre: "Operador" }
  ]
};

// Aplica el color primario a las variables CSS
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.style.setProperty("--color-primario", APP_CONFIG.colorPrimario);
  document.documentElement.style.setProperty("--color-secundario", APP_CONFIG.colorSecundario);
  document.documentElement.style.setProperty("--color-acento", APP_CONFIG.colorAcento);
  document.documentElement.style.setProperty("--color-exito", APP_CONFIG.colorExito);
  document.documentElement.style.setProperty("--color-peligro", APP_CONFIG.colorPeligro);

  document.querySelectorAll("[data-app-nombre]").forEach(el => el.textContent = APP_CONFIG.nombre);
  document.querySelectorAll("[data-app-subtitulo]").forEach(el => el.textContent = APP_CONFIG.subtitulo);
  document.querySelectorAll("[data-app-empresa]").forEach(el => el.textContent = APP_CONFIG.empresa);
  document.querySelectorAll("[data-app-anio]").forEach(el => el.textContent = APP_CONFIG.anio);
  document.querySelectorAll("[data-app-version]").forEach(el => el.textContent = "v" + APP_CONFIG.version);
});
