// =====================================================
// AUTENTICACION
// =====================================================

const Auth = {
  login(usuario, password) {
    const usuarios = DataStore.getUsuarios();
    const encontrado = usuarios.find(u => u.usuario === usuario && u.password === password);
    if (encontrado) {
      DataStore.setSesion(encontrado);
      return { ok: true, usuario: encontrado };
    }
    return { ok: false, mensaje: "Usuario o contraseña incorrectos" };
  },

  logout() {
    DataStore.clearSesion();
    window.location.href = "index.html";
  },

  getSesionActual() {
    return DataStore.getSesion();
  },

  requireAuth() {
    const sesion = DataStore.getSesion();
    if (!sesion) {
      window.location.href = "index.html";
      return null;
    }
    return sesion;
  }
};
