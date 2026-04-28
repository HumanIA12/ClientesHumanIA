// =====================================================
// CAPA DE DATOS — Embarques DINET
// Maneja parsing de Excel + persistencia + datos mock
// =====================================================

const DB_KEYS = {
  EMBARQUES: "dinet_embarques",
  META:      "dinet_meta",
  USUARIOS:  "dinet_usuarios",
  SESION:    "dinet_sesion",
  CONFIG:    "dinet_config_user"
};

const DataStore = {

  // ===== METADATA =====
  getMeta() {
    const data = localStorage.getItem(DB_KEYS.META);
    if (data) return JSON.parse(data);
    return {
      archivo: APP_CONFIG.archivoBase,
      hoja: APP_CONFIG.hojaExcel,
      actualizado: new Date().toISOString(),
      origen: "demo"
    };
  },

  setMeta(meta) {
    localStorage.setItem(DB_KEYS.META, JSON.stringify(meta));
  },

  // ===== EMBARQUES =====
  getEmbarques() {
    const data = localStorage.getItem(DB_KEYS.EMBARQUES);
    if (!data) {
      const mock = this.generarDatosDemo();
      localStorage.setItem(DB_KEYS.EMBARQUES, JSON.stringify(mock));
      this.setMeta({
        archivo: APP_CONFIG.archivoBase,
        hoja: APP_CONFIG.hojaExcel,
        actualizado: new Date().toISOString(),
        origen: "demo"
      });
      return mock;
    }
    return JSON.parse(data);
  },

  saveEmbarques(filas, archivo = null, hoja = null) {
    localStorage.setItem(DB_KEYS.EMBARQUES, JSON.stringify(filas));
    this.setMeta({
      archivo: archivo || APP_CONFIG.archivoBase,
      hoja: hoja || APP_CONFIG.hojaExcel,
      actualizado: new Date().toISOString(),
      origen: archivo ? "excel" : "demo"
    });
  },

  // ===== PARSER EXCEL =====
  // Recibe un File del input y lo convierte en filas normalizadas.
  // Requiere que SheetJS (window.XLSX) este cargado.
  async parsearExcel(file) {
    if (!window.XLSX) throw new Error("Libreria XLSX no cargada");

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

    // Busca hoja "Embarques", o usa la primera
    let nombreHoja = workbook.SheetNames.find(n => n.toLowerCase().includes("embarque"))
                  || workbook.SheetNames[0];
    const sheet = workbook.Sheets[nombreHoja];

    const filas = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
    const normalizadas = filas.map(f => this.normalizarFila(f)).filter(f => f.dt);

    return { filas: normalizadas, hoja: nombreHoja, archivo: file.name };
  },

  // Convierte una fila del Excel a formato interno
  normalizarFila(f) {
    const num = (v) => {
      if (v === null || v === undefined || v === "") return 0;
      const n = parseFloat(String(v).replace(",", "."));
      return isNaN(n) ? 0 : n;
    };
    const str = (v) => (v === null || v === undefined) ? "" : String(v).trim();

    // Fecha_Hora puede venir como string o Date
    let fechaHora = f.Fecha_Hora || f.fecha_hora || "";
    if (fechaHora instanceof Date) fechaHora = fechaHora.toISOString();

    return {
      fecha:           str(f.Fecha || f.fecha),
      hora:            str(f.Hora || f.hora),
      fechaHora:       str(fechaHora),
      dt:              str(f.DT || f.dt),
      transporte:      str(f.Transporte || f.transporte),
      cliente:         str(f.Cliente || f.cliente),
      destino:         str(f.Destino || f.destino),
      tipoDestino:     str(f.Tipo_Destino || f.tipo_destino),
      pesoTon:         num(f.Peso_Ton || f.peso_ton),
      volumenM3:       num(f["Volumen_m³"] || f["Volumen_m3"] || f.volumen_m3),
      undSolicitada:   num(f.Und_Solicitada || f.und_solicitada),
      undPicada:       num(f.Und_Picada || f.und_picada),
      placa:           str(f.Placa || f.placa),
      pctAvance:       num(f.Pct_Avance || f.pct_avance),
      estado:          str(f.Estado || f.estado).toLowerCase(),
      stage:           str(f.Stage_Destino || f.stage_destino),
      rampa:           str(f.Rampa || f.rampa),
      finCarga:        str(f.Fin_Carga || f.fin_carga).toLowerCase(),
      turno:           str(f.Turno || f.turno),
      inicioPicking:   str(f.Inicio_Picking || f.inicio_picking),
      finPicking:      str(f.Fin_Picking || f.fin_picking),
      tiempoPicking:   str(f.Tiempo_Picking || f.tiempo_picking),
      cita:            str(f.Cita || f.cita),
      filtrador:       str(f.Filtrador || f.filtrador),
      codCliente:      str(f.Cod_Cliente_DINET || f.cod_cliente_dinet),
      clienteDinet:    str(f.Cliente_DINET || f.cliente_dinet),
      familias:        str(f.Familias_DINET || f.familias_dinet),
      motivoDif:       str(f.Motivo_Diferencia || f.motivo_diferencia),
      volumenDinet:    num(f.Volumen_DINET || f.volumen_dinet),
      pesoDinet:       num(f.Peso_DINET || f.peso_dinet),
      picado:          num(f.Picado || f.picado),
      usuarioEjec:     str(f.Usuario_Ejecucion || f.usuario_ejecucion)
    };
  },

  // ===== USUARIOS / SESION =====
  getUsuarios() {
    const data = localStorage.getItem(DB_KEYS.USUARIOS);
    if (!data) {
      localStorage.setItem(DB_KEYS.USUARIOS, JSON.stringify(APP_CONFIG.usuariosDefault));
      return APP_CONFIG.usuariosDefault;
    }
    return JSON.parse(data);
  },

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

  // ===== RESET =====
  resetAll() {
    Object.values(DB_KEYS).forEach(k => localStorage.removeItem(k));
  },

  resetEmbarques() {
    localStorage.removeItem(DB_KEYS.EMBARQUES);
    localStorage.removeItem(DB_KEYS.META);
  },

  // ===== DATOS DEMO =====
  // Genera ~60 registros realistas con la estructura exacta del Excel
  generarDatosDemo() {
    const transportes = [
      "TRANSP ZEM E I R L", "CODISO SAC", "JUAN GALARZA RIOS S C R",
      "DINET S A", "INCA COURIER S A", "TRANSPORTE ZAVALA CARGO SAC",
      "HIPERMERC TOTTUS S A", "FORZAR LOTE (MAIL)", "13942506*"
    ];
    const clientes = [
      { c: "TEMPANO S A C",                     d: "PE 150141 SURQUILLO",     t: "Canal Tradicional" },
      { c: "DEHOCA S A",                        d: "PE 150108 CHORRILLOS",    t: "Canal Tradicional" },
      { c: "VARTINI PACKING S A C",             d: "PE 150135 SAN MARTIN",    t: "Copackers" },
      { c: "UNILEVER ANDINA PERU S A",          d: "PE 150122 MIRAFLORES",    t: "Canal Tradicional" },
      { c: "D OLPHINS E I R L",                 d: "PE 021801 SANTA",         t: "Provincia" },
      { c: "SUPERM PERUANOS S A",               d: "PE 130107 TRUJILLO",      t: "Canal Moderno" },
      { c: "DISTRIB CHALI S A C",               d: "PE 060101 CAJAMARCA",     t: "Provincia" },
      { c: "INRETAIL PHARMA S A",               d: "PE 150127 PUNTA NEGRA",   t: "Canal Moderno" },
      { c: "INRETAIL PHARMA S A",               d: "PE 150137 LIMA",          t: "Canal Moderno" },
      { c: "HIPERMERCADOS TOTTUS S A",          d: "PE 150118 LURIGANCHO",    t: "Canal Moderno" },
      { c: "CENCOSUD RETAIL PERU S",            d: "PE 150137 SANTA ANITA",   t: "Canal Moderno" },
      { c: "CORPORACION VEGA S A C",            d: "PE 150110 LIMA",          t: "Canal Tradicional" },
      { c: "ZV INVERSIONES GENERAL",            d: "PE 150117 LIMA",          t: "Canal Tradicional" },
      { c: "INVERSIONES FAVEL E I R L",         d: "PE 150137 SANTA ANITA",   t: "Canal Tradicional" },
      { c: "GOLDEN FOODS S C R L",              d: "PE 100101 HUANUCO",       t: "Provincia" },
      { c: "LIDER S R LTDA",                    d: "PE 150801 HUACHO",        t: "Provincia" },
      { c: "CORPORACION BOTICAS PERU",          d: "PE 150133 SAN JUAN",      t: "Canal Moderno" },
      { c: "KMC INTERNATIONAL SAC",             d: "PE 150103 LIMA",          t: "Canal Tradicional" },
      { c: "GOLOPLUS SAC",                      d: "PE 150101 LIMA",          t: "Canal Tradicional" },
      { c: "ALMACENES DE LA SELVA S A C",       d: "PE 250101 UCAYALI",       t: "Provincia" }
    ];
    const stages = [
      "ST.03.05", "ST.06.01", "ST.11.01", "ST.10.05", "ST.15.04",
      "ST.16.04", "ST.09.01", "ST.04.03", "ST.05.06", "ST.12.01",
      "ST.07.01", "ST.10.04", "ST.13.01", "ST.14.01", "ST.04.04 / ST.04.01"
    ];
    const turnos = ["T1", "T2", "T3"];
    const operadores = [
      "JCARDENASB", "CSEMPERT", "EYNCAS", "EBALTAZARB", "ATAIPER", "FSUYOR",
      "RPINTOM", "JCHAVARRIM", "JPALACIOSA", "IDELGADOJ", "DRIVERAZ", "LQUEVEDOR",
      "CTORREALV", "EGUTIERREZA", "RSAAVEDRAV", "VVINCESS", "LTORRES", "RALMEIDAO",
      "JESPINOZAH", "JSANTAMARIA", "MANTONIOG", "CCASTRO", "DVILLALOBOSM", "JMONTEROP"
    ];
    const familias = ["HPC / JABONES / AEROSOLES", "JABONES / AEROSOLES / HPC", "DETERGENTES / HC", "FOODS", "JABONES / AEROSOLES / HPC / HC"];

    const placa = () => {
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const L = () => letras[Math.floor(Math.random() * 26)];
      return `${L()}${L()}${L()}-${Math.floor(100 + Math.random() * 899)}`;
    };

    const hoy = new Date();
    const fechaStr = hoy.toLocaleDateString("es-PE");

    const filas = [];
    let idx = 98223000;

    for (let i = 0; i < 60; i++) {
      const cli = clientes[i % clientes.length];
      const turno = turnos[Math.floor(Math.random() * 3)];
      const op = operadores[Math.floor(Math.random() * operadores.length)];
      const numOps = 2 + Math.floor(Math.random() * 5);
      const opsList = [];
      for (let k = 0; k < numOps; k++) opsList.push(operadores[Math.floor(Math.random() * operadores.length)]);

      const undSolic = Math.floor(100 + Math.random() * 5000);
      // 80% completas, 15% en proceso, 5% pendientes
      const r = Math.random();
      let undPic, pct, estado, finCarga;
      if (r < 0.8)      { undPic = undSolic;                                 pct = 100; estado = "ok";      finCarga = "ok"; }
      else if (r < 0.95){ undPic = Math.floor(undSolic * (0.5 + Math.random() * 0.4)); pct = (undPic / undSolic) * 100; estado = "ok"; finCarga = "ok"; }
      else              { undPic = 0;                                         pct = 0;   estado = "pending"; finCarga = ""; }

      const peso = +(0.5 + Math.random() * 25).toFixed(3);
      const vol  = +(1 + Math.random() * 60).toFixed(3);
      const horaH = String(7 + Math.floor(Math.random() * 16)).padStart(2, "0");
      const horaM = String(Math.floor(Math.random() * 60)).padStart(2, "0");
      const hora = `${horaH}:${horaM}`;

      filas.push({
        fecha:         fechaStr,
        hora:          hora,
        fechaHora:     `${fechaStr} ${hora}`,
        dt:            String(idx++),
        transporte:    transportes[Math.floor(Math.random() * transportes.length)],
        cliente:       cli.c,
        destino:       cli.d,
        tipoDestino:   cli.t,
        pesoTon:       peso,
        volumenM3:     vol,
        undSolicitada: undSolic,
        undPicada:     Math.round(undPic),
        placa:         placa(),
        pctAvance:     +pct.toFixed(1),
        estado:        estado,
        stage:         stages[Math.floor(Math.random() * stages.length)],
        rampa:         "",
        finCarga:      finCarga,
        turno:         turno,
        inicioPicking: estado === "ok" ? `${fechaStr} ${hora}` : "",
        finPicking:    estado === "ok" ? `${fechaStr} ${horaH}:${String((parseInt(horaM)+30)%60).padStart(2,"0")}` : "",
        tiempoPicking: estado === "ok" ? "00:30" : "",
        cita:          Math.random() > 0.7 ? "H" : "",
        filtrador:     "",
        codCliente:    "00" + Math.floor(10000000 + Math.random() * 89999999),
        clienteDinet:  cli.c,
        familias:      familias[Math.floor(Math.random() * familias.length)],
        motivoDif:     pct < 100 && pct > 0 ? "" : (Math.random() > 0.95 ? "LOTE ERRADO" : ""),
        volumenDinet:  +(vol * (0.95 + Math.random() * 0.1)).toFixed(3),
        pesoDinet:     +(peso * 1000 * (0.95 + Math.random() * 0.1)).toFixed(3),
        picado:        pct >= 100 ? 100 : 50,
        usuarioEjec:   opsList.join(" / ")
      });
    }
    return filas;
  }
};
