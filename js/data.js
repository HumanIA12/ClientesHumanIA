// =====================================================
// CAPA DE DATOS — localStorage
// =====================================================
// Maneja persistencia de datos en el navegador.
// =====================================================

const DB_KEYS = {
  CLIENTES: "chia_clientes",
  USUARIOS: "chia_usuarios",
  SESION: "chia_sesion",
  CONFIG: "chia_config",
  ACTIVIDAD: "chia_actividad"
};

const DataStore = {
  // ---- CLIENTES ----
  getClientes() {
    const data = localStorage.getItem(DB_KEYS.CLIENTES);
    if (!data) {
      const ejemplos = this.generarClientesEjemplo();
      localStorage.setItem(DB_KEYS.CLIENTES, JSON.stringify(ejemplos));
      return ejemplos;
    }
    return JSON.parse(data);
  },

  saveClientes(clientes) {
    localStorage.setItem(DB_KEYS.CLIENTES, JSON.stringify(clientes));
  },

  addCliente(cliente) {
    const clientes = this.getClientes();
    cliente.id = Date.now();
    cliente.fechaRegistro = new Date().toISOString();
    clientes.push(cliente);
    this.saveClientes(clientes);
    this.registrarActividad("Nuevo cliente: " + cliente.nombre);
    return cliente;
  },

  updateCliente(id, datos) {
    const clientes = this.getClientes();
    const idx = clientes.findIndex(c => c.id === id);
    if (idx !== -1) {
      clientes[idx] = { ...clientes[idx], ...datos };
      this.saveClientes(clientes);
      this.registrarActividad("Cliente actualizado: " + clientes[idx].nombre);
      return clientes[idx];
    }
    return null;
  },

  deleteCliente(id) {
    const clientes = this.getClientes();
    const cliente = clientes.find(c => c.id === id);
    const filtrados = clientes.filter(c => c.id !== id);
    this.saveClientes(filtrados);
    if (cliente) this.registrarActividad("Cliente eliminado: " + cliente.nombre);
  },

  getClienteById(id) {
    return this.getClientes().find(c => c.id === id);
  },

  // ---- USUARIOS ----
  getUsuarios() {
    const data = localStorage.getItem(DB_KEYS.USUARIOS);
    if (!data) {
      localStorage.setItem(DB_KEYS.USUARIOS, JSON.stringify(APP_CONFIG.usuariosDefault));
      return APP_CONFIG.usuariosDefault;
    }
    return JSON.parse(data);
  },

  // ---- SESION ----
  getSesion() {
    const data = localStorage.getItem(DB_KEYS.SESION);
    return data ? JSON.parse(data) : null;
  },

  setSesion(usuario) {
    localStorage.setItem(DB_KEYS.SESION, JSON.stringify({
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      rol: usuario.rol,
      inicio: new Date().toISOString()
    }));
  },

  clearSesion() {
    localStorage.removeItem(DB_KEYS.SESION);
  },

  // ---- ACTIVIDAD ----
  registrarActividad(descripcion) {
    const data = localStorage.getItem(DB_KEYS.ACTIVIDAD);
    const actividad = data ? JSON.parse(data) : [];
    const sesion = this.getSesion();
    actividad.unshift({
      id: Date.now(),
      descripcion,
      usuario: sesion ? sesion.nombre : "Sistema",
      fecha: new Date().toISOString()
    });
    // Mantener solo las ultimas 50
    localStorage.setItem(DB_KEYS.ACTIVIDAD, JSON.stringify(actividad.slice(0, 50)));
  },

  getActividad() {
    const data = localStorage.getItem(DB_KEYS.ACTIVIDAD);
    return data ? JSON.parse(data) : [];
  },

  // ---- DATOS DE EJEMPLO ----
  generarClientesEjemplo() {
    const nombres = [
      "Maria Lopez", "Carlos Ramirez", "Ana Garcia", "Luis Torres",
      "Sofia Martinez", "Pedro Sanchez", "Laura Diaz", "Diego Flores",
      "Carmen Ruiz", "Jorge Mendoza", "Isabel Castro", "Miguel Vargas",
      "Patricia Silva", "Andres Rojas", "Gabriela Morales"
    ];
    const empresas = [
      "Inversiones SA", "TechCorp SAC", "Distribuidora Andina", "Comercial del Sur",
      "Servicios Globales", "Logistica Express", "Consultora Vision", "Industrias Lima",
      "Grupo Pacifico", "Soluciones Modernas"
    ];
    const ciudades = ["Lima", "Arequipa", "Cusco", "Trujillo", "Piura", "Chiclayo", "Iquitos"];
    const estados = ["Activo", "Activo", "Activo", "Inactivo", "Pendiente"];

    return Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      nombre: nombres[i % nombres.length],
      empresa: empresas[i % empresas.length],
      email: nombres[i % nombres.length].toLowerCase().replace(" ", ".") + "@correo.com",
      telefono: "+51 9" + Math.floor(10000000 + Math.random() * 89999999),
      ciudad: ciudades[i % ciudades.length],
      estado: estados[i % estados.length],
      monto: Math.floor(1000 + Math.random() * 50000),
      fechaRegistro: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    }));
  },

  // ---- RESET ----
  resetAll() {
    Object.values(DB_KEYS).forEach(k => localStorage.removeItem(k));
  }
};
