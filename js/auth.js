// =====================================================
// AUTENTICACION
// =====================================================

const Auth = {
  login(usuario, password) {
    const usuarios = DataStore.getUsuarios();
    const encontrado = usuarios.find(u => u.usuario === usuario && u.password === password);
    if (encontrado) {
      DataStore.setSesion(encontrado);
      DataStore.registrarActividad("Inicio de sesion: " + encontrado.nombre);
      return { ok: true, usuario: encontrado };
    }
    return { ok: false, mensaje: "Usuario o contraseña incorrectos" };
  },

  logout() {
    const sesion = DataStore.getSesion();
    if (sesion) DataStore.registrarActividad("Cierre de sesion: " + sesion.nombre);
    DataStore.clearSesion();
    window.location.href = "index.html";
  },

  getSesionActual() {
    return DataStore.getSesion();
  },

  // Protege paginas internas
  requireAuth() {
    const sesion = DataStore.getSesion();
    if (!sesion) {
      window.location.href = "index.html";
      return null;
    }
    return sesion;
  }
};
