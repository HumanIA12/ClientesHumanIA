const pptxgen = require('pptxgenjs');
const pptx = new pptxgen();

pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Julio André Llanos Torres';
pptx.company = 'Universidad Nacional de Trujillo';
pptx.subject = 'Proyecto de investigación — Gerencia de Operaciones';
pptx.title = 'Propuesta de mejora de la gestión de propuestas técnico-económicas para la eficiencia operativa en JJ STIRPE S.A.C., Trujillo, 2026';
pptx.lang = 'es-PE';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'es-PE'
};
pptx.defineSlideMaster({
  title: 'MASTER_LIGHT',
  background: { color: 'F6F4EF' },
  objects: [
    { rect: { x: 0, y: 0, w: 13.333, h: 0.12, fill: { color: 'D2AD4F' }, line: { color: 'D2AD4F' } } },
    { line: { x: 0.7, y: 7.12, w: 11.95, h: 0, line: { color: 'D8DEE8', width: 1 } } }
  ],
  slideNumber: { x: 12.25, y: 7.13, w: 0.35, h: 0.2, fontFace: 'Aptos', fontSize: 9, color: '65738A', align: 'right', margin: 0 }
});
pptx.defineSlideMaster({
  title: 'MASTER_DARK',
  background: { color: '0D213B' },
  objects: [
    { rect: { x: 0, y: 0, w: 13.333, h: 0.12, fill: { color: 'D2AD4F' }, line: { color: 'D2AD4F' } } },
    { line: { x: 0.7, y: 7.12, w: 11.95, h: 0, line: { color: '38506D', width: 1 } } }
  ],
  slideNumber: { x: 12.25, y: 7.13, w: 0.35, h: 0.2, fontFace: 'Aptos', fontSize: 9, color: 'A9B6C9', align: 'right', margin: 0 }
});

const C = {
  NAVY: '0D213B',
  NAVY2: '173B61',
  BLUE: '2B638E',
  GOLD: 'D2AD4F',
  GOLD2: 'E9D99A',
  CREAM: 'F6F4EF',
  WHITE: 'FFFFFF',
  INK: '14233A',
  SLATE: '56657A',
  LIGHT: 'E7EDF4',
  LIGHT2: 'EEF2F7',
  TEAL: '2F7C78',
  TEAL2: 'DCECE9',
  RED: 'B5534F',
  RED2: 'F4E3E1',
  GREEN: '4D8061',
  GREEN2: 'E2EDE5',
  PURPLE: '75608A',
  PURPLE2: 'EDE8F2'
};

function tx(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: opts.fontFace || 'Aptos',
    fontSize: opts.fontSize || 18,
    color: opts.color || C.INK,
    bold: opts.bold || false,
    italic: opts.italic || false,
    align: opts.align || 'left',
    valign: opts.valign || 'mid',
    margin: opts.margin !== undefined ? opts.margin : 0,
    breakLine: false,
    fit: 'shrink',
    ...opts
  });
}

function box(slide, x, y, w, h, fill, radius = 0.14, line = null) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: radius,
    fill: { color: fill },
    line: line || { color: fill, transparency: 100 }
  });
}

function circle(slide, x, y, d, fill, lineColor = fill, lineWidth = 1) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x, y, w: d, h: d,
    fill: { color: fill },
    line: { color: lineColor, width: lineWidth }
  });
}

function line(slide, x, y, w, h, color = C.SLATE, width = 1.5, arrow = false, dash = 'solid') {
  slide.addShape(pptx.ShapeType.line, {
    x, y, w, h,
    line: {
      color, width, dash,
      endArrowType: arrow ? 'triangle' : 'none'
    }
  });
}

function header(slide, title, section, dark = false) {
  tx(slide, section.toUpperCase(), 0.72, 0.22, 3.5, 0.25, {
    fontSize: 9.5, bold: true, color: dark ? C.GOLD2 : C.BLUE, charSpacing: 1.4
  });
  tx(slide, title, 0.72, 0.55, 11.9, 0.55, {
    fontSize: 27, bold: true, color: dark ? C.WHITE : C.NAVY, margin: 0
  });
}

function footer(slide, text, dark = false) {
  tx(slide, text, 0.72, 7.17, 10.9, 0.18, {
    fontSize: 8.5, color: dark ? 'A9B6C9' : '6A788B', margin: 0
  });
}

function pill(slide, text, x, y, w, fill, color = C.INK, size = 11, border = null) {
  box(slide, x, y, w, 0.38, fill, 0.16, border || { color: fill, transparency: 100 });
  tx(slide, text, x + 0.08, y + 0.02, w - 0.16, 0.32, {
    fontSize: size, bold: true, color, align: 'center', margin: 0
  });
}

function metric(slide, value, label, x, y, w, accent = C.GOLD) {
  box(slide, x, y, w, 1.05, C.WHITE, 0.12, { color: 'D8DEE8', width: 1 });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.1, h: 1.05, fill: { color: accent }, line: { color: accent } });
  tx(slide, value, x + 0.22, y + 0.12, w - 0.3, 0.43, { fontSize: 25, bold: true, color: C.NAVY, margin: 0 });
  tx(slide, label, x + 0.22, y + 0.56, w - 0.3, 0.3, { fontSize: 11.5, color: C.SLATE, margin: 0 });
}

function miniCard(slide, title, body, x, y, w, h, accent = C.BLUE, fill = C.WHITE, dark = false) {
  box(slide, x, y, w, h, fill, 0.12, { color: dark ? '38506D' : 'D7DEE8', width: 1 });
  slide.addShape(pptx.ShapeType.rect, { x, y, w: 0.08, h, fill: { color: accent }, line: { color: accent } });
  tx(slide, title, x + 0.22, y + 0.14, w - 0.35, 0.3, { fontSize: 15, bold: true, color: dark ? C.WHITE : C.NAVY, margin: 0 });
  tx(slide, body, x + 0.22, y + 0.49, w - 0.35, h - 0.6, { fontSize: 11.5, color: dark ? 'DCE5F0' : C.SLATE, valign: 'top', margin: 0 });
}

function iconLabel(slide, initials, title, x, y, w, fill = C.NAVY, pale = C.LIGHT2) {
  box(slide, x, y, w, 0.72, pale, 0.12, { color: pale, transparency: 100 });
  circle(slide, x + 0.12, y + 0.12, 0.48, fill, fill);
  tx(slide, initials, x + 0.12, y + 0.13, 0.48, 0.45, { fontSize: 12, bold: true, color: C.WHITE, align: 'center', margin: 0 });
  tx(slide, title, x + 0.72, y + 0.12, w - 0.83, 0.48, { fontSize: 12, bold: true, color: C.NAVY, margin: 0 });
}

function note(slide, text) {
  if (typeof slide.addNotes === 'function') slide.addNotes(text);
}

// 1. PORTADA
{
  const s = pptx.addSlide('MASTER_DARK');
  s.background = { color: C.NAVY };
  tx(s, 'UNIVERSIDAD NACIONAL DE TRUJILLO', 0.78, 0.33, 5.6, 0.3, { fontSize: 11, bold: true, color: C.GOLD2, charSpacing: 1.2 });
  tx(s, 'Escuela de Posgrado · Maestría en Gerencia de Operaciones', 0.78, 0.69, 6.2, 0.28, { fontSize: 12, color: 'C7D1DF' });
  pill(s, 'PROYECTO DE INVESTIGACIÓN', 0.78, 1.32, 2.65, C.GOLD, C.NAVY, 11);
  tx(s, 'Propuesta de mejora de la gestión de propuestas técnico-económicas para la eficiencia operativa en JJ STIRPE S.A.C., Trujillo, 2026', 0.78, 1.92, 7.55, 2.55, { fontSize: 28, bold: true, color: C.WHITE, valign: 'top', margin: 0, breakLine: false });
  slideLine = s.addShape(pptx.ShapeType.rect, { x: 0.78, y: 4.75, w: 1.1, h: 0.08, fill: { color: C.GOLD }, line: { color: C.GOLD } });
  tx(s, 'Julio André Llanos Torres', 0.78, 5.04, 4.5, 0.35, { fontSize: 17, bold: true, color: C.WHITE });
  tx(s, 'Trujillo, Perú · 2026', 0.78, 5.46, 4.2, 0.28, { fontSize: 12.5, color: 'B8C5D6' });

  // Visual editable: sistema de nodos y flujo
  const nx = 9.15, ny = 1.35;
  box(s, nx, ny, 3.2, 4.85, '132C49', 0.18, { color: '38506D', width: 1 });
  tx(s, 'GESTIÓN', nx + 0.35, ny + 0.3, 2.5, 0.3, { fontSize: 12, bold: true, color: C.GOLD2, align: 'center', charSpacing: 1.2 });
  const nodes = [
    { x: nx + 1.24, y: ny + 0.92, t: 'Solicitud', c: C.BLUE },
    { x: nx + 0.42, y: ny + 2.0, t: 'Información', c: C.TEAL },
    { x: nx + 2.08, y: ny + 2.0, t: 'Costeo', c: C.PURPLE },
    { x: nx + 1.24, y: ny + 3.18, t: 'Propuesta', c: C.GOLD },
    { x: nx + 1.24, y: ny + 4.05, t: 'Control', c: C.GREEN }
  ];
  line(s, nx + 1.6, ny + 1.52, -0.65, 0.55, '7F98B3', 1.4, true);
  line(s, nx + 1.6, ny + 1.52, 0.65, 0.55, '7F98B3', 1.4, true);
  line(s, nx + 0.9, ny + 2.6, 0.7, 0.62, '7F98B3', 1.4, true);
  line(s, nx + 2.28, ny + 2.6, -0.65, 0.62, '7F98B3', 1.4, true);
  line(s, nx + 1.6, ny + 3.78, 0, 0.33, '7F98B3', 1.4, true);
  nodes.forEach(n => {
    circle(s, n.x, n.y, 0.72, n.c, n.c);
    tx(s, n.t, n.x - 0.2, n.y + 0.78, 1.12, 0.25, { fontSize: 9.5, bold: true, color: C.WHITE, align: 'center' });
  });
  tx(s, 'UNT · Gerencia de Operaciones', 9.35, 6.38, 2.8, 0.24, { fontSize: 9, color: 'A9B6C9', align: 'center' });
  note(s, 'Buenas tardes. Presento el proyecto de investigación titulado Propuesta de mejora de la gestión de propuestas técnico-económicas para la eficiencia operativa en JJ STIRPE S.A.C., Trujillo, 2026. El estudio se desarrolla en la Maestría en Gerencia de Operaciones de la Universidad Nacional de Trujillo. Durante la exposición presentaré el problema, el diagnóstico, el sustento conceptual, la metodología y los productos esperados. Tiempo estimado: 20 segundos.');
}

// 2. SITUACIÓN PROBLEMÁTICA
{
  const s = pptx.addSlide('MASTER_LIGHT');
  header(s, 'El problema está en la gestión, no en el formato final', '01 · Situación problemática');
  metric(s, '≈ 20', 'solicitudes de cotización al mes*', 0.72, 1.26, 2.35, C.GOLD);
  metric(s, '2–3 días', 'para elaborar una propuesta*', 3.25, 1.26, 2.65, C.TEAL);
  miniCard(s, 'Dependencia operativa', 'La gerencia concentra visita, alcance, consulta de precios, costeo, revisión y emisión.', 6.15, 1.26, 3.05, 1.05, C.RED, C.WHITE);
  miniCard(s, 'Información dispersa', 'No existe una base técnico-económica ni un banco de partidas centralizado.', 9.45, 1.26, 3.15, 1.05, C.BLUE, C.WHITE);

  tx(s, 'Flujo actual de elaboración', 0.72, 2.65, 3.1, 0.3, { fontSize: 14, bold: true, color: C.NAVY });
  const steps = [
    ['01', 'Solicitud'], ['02', 'Visita'], ['03', 'Alcance'], ['04', 'Precios'], ['05', 'Costeo'], ['06', 'Redacción'], ['07', 'Envío']
  ];
  const startX = 0.76, stepW = 1.52, gap = 0.24, y = 3.08;
  steps.forEach((st, i) => {
    const x = startX + i * (stepW + gap);
    box(s, x, y, stepW, 0.92, i === 6 ? C.NAVY : C.WHITE, 0.12, { color: i === 6 ? C.NAVY : 'D5DDE8', width: 1 });
    circle(s, x + 0.12, y + 0.17, 0.38, i === 6 ? C.GOLD : C.LIGHT, i === 6 ? C.GOLD : C.LIGHT);
    tx(s, st[0], x + 0.12, y + 0.18, 0.38, 0.34, { fontSize: 9, bold: true, color: i === 6 ? C.NAVY : C.BLUE, align: 'center' });
    tx(s, st[1], x + 0.58, y + 0.17, stepW - 0.66, 0.48, { fontSize: 11.5, bold: true, color: i === 6 ? C.WHITE : C.NAVY });
    if (i < steps.length - 1) line(s, x + stepW, y + 0.46, gap, 0, C.GOLD, 2, true);
  });

  const probs = [
    ['Sin procedimiento formal', C.RED2, C.RED],
    ['Sin clasificación por complejidad', C.LIGHT2, C.BLUE],
    ['Sin indicadores de control', C.PURPLE2, C.PURPLE],
    ['Históricos difíciles de recuperar', C.TEAL2, C.TEAL],
    ['Propuestas pendientes', C.GOLD2, '8A6A15'],
    ['Sobrecarga gerencial', C.RED2, C.RED]
  ];
  tx(s, 'Manifestaciones principales', 0.72, 4.36, 3.2, 0.3, { fontSize: 14, bold: true, color: C.NAVY });
  probs.forEach((p, i) => {
    const row = Math.floor(i / 3), col = i % 3;
    pill(s, p[0], 0.76 + col * 4.12, 4.76 + row * 0.56, 3.78, p[1], p[2], 10.5, { color: p[2], transparency: 40, width: 0.8 });
  });
  box(s, 0.72, 6.06, 11.88, 0.62, 'FFF8DE', 0.1, { color: 'E4C96F', width: 1 });
  tx(s, '* Información preliminar proporcionada por la empresa; pendiente de verificación documental.', 0.92, 6.19, 11.45, 0.24, { fontSize: 10.5, color: '6C5A20', italic: true });
  footer(s, 'Fuente: Informe de investigación · Situación problemática');
  note(s, 'La empresa elabora propuestas con una estructura documental robusta; sin embargo, el proceso previo presenta limitaciones de gestión. De manera preliminar, se atienden alrededor de veinte solicitudes mensuales y una propuesta puede requerir entre dos y tres días. La gerencia concentra gran parte de las actividades, mientras la información de materiales, proveedores, partidas y propuestas históricas permanece dispersa. Esto genera variabilidad, acumulación de pendientes y escaso control. Los datos de volumen y tiempo serán verificados mediante el análisis documental. Tiempo acumulado estimado: 1 minuto 20 segundos.');
}

// 3. VESTER
{
  const s = pptx.addSlide('MASTER_LIGHT');
  header(s, 'Matriz de Vester: dónde intervenir primero', '02 · Diagnóstico causal');
  pill(s, 'Punto de corte: 14,67', 10.36, 0.55, 2.22, C.GOLD2, '6C5310', 11);

  // Cuadrante
  const qx = 0.78, qy = 1.42, qw = 6.25, qh = 4.78;
  box(s, qx, qy, qw, qh, C.WHITE, 0.12, { color: 'CFD8E4', width: 1 });
  // zonas
  s.addShape(pptx.ShapeType.rect, { x: qx + 0.25, y: qy + 0.28, w: 2.75, h: 1.92, fill: { color: C.TEAL2, transparency: 12 }, line: { color: C.TEAL2, transparency: 100 } });
  s.addShape(pptx.ShapeType.rect, { x: qx + 3.0, y: qy + 0.28, w: 2.95, h: 1.92, fill: { color: C.RED2, transparency: 8 }, line: { color: C.RED2, transparency: 100 } });
  s.addShape(pptx.ShapeType.rect, { x: qx + 0.25, y: qy + 2.2, w: 2.75, h: 2.18, fill: { color: C.LIGHT2 }, line: { color: C.LIGHT2, transparency: 100 } });
  s.addShape(pptx.ShapeType.rect, { x: qx + 3.0, y: qy + 2.2, w: 2.95, h: 2.18, fill: { color: C.PURPLE2, transparency: 20 }, line: { color: C.PURPLE2, transparency: 100 } });
  line(s, qx + 3.0, qy + 0.28, 0, 4.1, C.NAVY2, 1.5);
  line(s, qx + 0.25, qy + 2.2, 5.7, 0, C.NAVY2, 1.5);
  tx(s, 'ACTIVOS', qx + 0.45, qy + 0.42, 1.2, 0.25, { fontSize: 10, bold: true, color: C.TEAL });
  tx(s, 'CRÍTICOS', qx + 4.48, qy + 0.42, 1.2, 0.25, { fontSize: 10, bold: true, color: C.RED, align: 'right' });
  tx(s, 'INDIFERENTES', qx + 0.45, qy + 3.95, 1.6, 0.25, { fontSize: 10, bold: true, color: C.SLATE });
  tx(s, 'PASIVOS', qx + 4.63, qy + 3.95, 1.0, 0.25, { fontSize: 10, bold: true, color: C.PURPLE, align: 'right' });
  tx(s, 'Influencia →', qx + 0.08, qy + 1.8, 1.5, 0.2, { fontSize: 9, color: C.SLATE, rotate: 270, align: 'center' });
  tx(s, 'Dependencia →', qx + 2.45, qy + 4.45, 1.45, 0.2, { fontSize: 9, color: C.SLATE, align: 'center' });

  const vnodes = [
    { id: 'P7', x: 0.72, y: 0.80, c: C.TEAL },
    { id: 'P3', x: 1.45, y: 0.97, c: C.TEAL },
    { id: 'P10', x: 2.05, y: 0.82, c: C.TEAL },
    { id: 'P4', x: 1.05, y: 1.40, c: C.TEAL },
    { id: 'P8', x: 2.30, y: 1.38, c: C.TEAL },
    { id: 'P5', x: 2.55, y: 1.83, c: C.TEAL },
    { id: 'P1', x: 5.22, y: 0.88, c: C.RED },
    { id: 'P2', x: 4.20, y: 1.48, c: C.RED },
    { id: 'P12', x: 5.05, y: 1.52, c: C.RED }
  ];
  vnodes.forEach(n => {
    circle(s, qx + n.x, qy + n.y, 0.42, n.c, C.WHITE, 1.3);
    tx(s, n.id, qx + n.x, qy + n.y + 0.04, 0.42, 0.26, { fontSize: 9.5, bold: true, color: C.WHITE, align: 'center' });
  });

  miniCard(s, 'Problemas críticos', 'P1 · tiempos variables\nP2 · dependencia gerencial\nP12 · sobrecarga operativa', 7.35, 1.44, 5.25, 1.46, C.RED, C.WHITE);
  miniCard(s, 'Causas prioritarias', 'P3 · procedimiento formal\nP4 · base técnico-económica\nP5 · banco y plantillas\nP7 · variabilidad técnica\nP8 · clasificación\nP10 · indicadores', 7.35, 3.08, 5.25, 2.31, C.TEAL, C.WHITE);
  box(s, 7.35, 5.64, 5.25, 0.72, C.NAVY, 0.1, { color: C.NAVY });
  tx(s, 'Hallazgo clave', 7.62, 5.77, 1.25, 0.22, { fontSize: 11, bold: true, color: C.GOLD2 });
  tx(s, 'La prioridad es ordenar, centralizar y controlar el proceso.', 8.8, 5.73, 3.5, 0.3, { fontSize: 13, bold: true, color: C.WHITE });
  footer(s, 'Elaboración propia a partir de la Matriz de Vester del informe');
  note(s, 'La Matriz de Vester permitió priorizar quince problemas mediante influencia y dependencia, con un punto de corte de 14,67. Los problemas críticos son los tiempos variables, la alta dependencia de la gerencia y la sobrecarga operativa. Las causas activas son la ausencia de procedimiento, base técnico-económica, banco de partidas, clasificación e indicadores, además de la variabilidad técnica. El hallazgo central es que la intervención debe concentrarse en ordenar, centralizar y controlar el proceso, no únicamente en mejorar el diseño del documento final. Tiempo acumulado estimado: 2 minutos 30 segundos.');
}

// 4. PROBLEMA Y OBJETIVOS
{
  const s = pptx.addSlide('MASTER_LIGHT');
  header(s, 'De la pregunta de investigación a una ruta de acción', '03 · Problema y objetivos');
  box(s, 0.72, 1.28, 11.88, 1.28, C.NAVY, 0.15, { color: C.NAVY });
  tx(s, 'PREGUNTA GENERAL', 0.98, 1.48, 1.72, 0.25, { fontSize: 10, bold: true, color: C.GOLD2, charSpacing: 1.1 });
  tx(s, '¿De qué manera puede diseñarse una propuesta de mejora de la gestión de propuestas técnico-económicas para la eficiencia operativa en JJ STIRPE S.A.C., Trujillo, 2026?', 2.78, 1.40, 9.45, 0.8, { fontSize: 17.5, bold: true, color: C.WHITE, margin: 0 });
  box(s, 0.72, 2.83, 11.88, 1.05, C.WHITE, 0.15, { color: 'CED7E3', width: 1 });
  tx(s, 'OBJETIVO GENERAL', 0.98, 3.04, 1.72, 0.25, { fontSize: 10, bold: true, color: C.BLUE, charSpacing: 1.1 });
  tx(s, 'Diseñar una propuesta de mejora de la gestión de propuestas técnico-económicas para la eficiencia operativa en JJ STIRPE S.A.C., Trujillo, 2026.', 2.78, 2.98, 9.45, 0.56, { fontSize: 16.5, bold: true, color: C.NAVY, margin: 0 });

  tx(s, 'Objetivos específicos', 0.72, 4.25, 2.2, 0.28, { fontSize: 14, bold: true, color: C.NAVY });
  const objs = [
    ['01', 'Diagnosticar'], ['02', 'Analizar'], ['03', 'Diseñar'], ['04', 'Estructurar'], ['05', 'Formular'], ['06', 'Validar']
  ];
  objs.forEach((o, i) => {
    const x = 0.78 + i * 2.03;
    circle(s, x, 4.78, 0.62, i === 5 ? C.GOLD : C.NAVY, i === 5 ? C.GOLD : C.NAVY);
    tx(s, o[0], x, 4.91, 0.62, 0.24, { fontSize: 10, bold: true, color: i === 5 ? C.NAVY : C.WHITE, align: 'center' });
    tx(s, o[1], x - 0.22, 5.52, 1.06, 0.28, { fontSize: 12, bold: true, color: C.NAVY, align: 'center' });
    if (i < objs.length - 1) line(s, x + 0.68, 5.08, 1.18, 0, C.GOLD, 2, true);
  });
  tx(s, 'gestión actual', 0.47, 5.92, 1.25, 0.22, { fontSize: 9.5, color: C.SLATE, align: 'center' });
  tx(s, 'indicadores', 2.50, 5.92, 1.25, 0.22, { fontSize: 9.5, color: C.SLATE, align: 'center' });
  tx(s, 'estandarización', 4.53, 5.92, 1.25, 0.22, { fontSize: 9.5, color: C.SLATE, align: 'center' });
  tx(s, 'base técnica', 6.56, 5.92, 1.25, 0.22, { fontSize: 9.5, color: C.SLATE, align: 'center' });
  tx(s, 'roles y control', 8.59, 5.92, 1.25, 0.22, { fontSize: 9.5, color: C.SLATE, align: 'center' });
  tx(s, 'juicio experto', 10.62, 5.92, 1.25, 0.22, { fontSize: 9.5, color: C.SLATE, align: 'center' });
  footer(s, 'Enfoque descriptivo y propositivo · Sin afirmación causal');
  note(s, 'La pregunta general se formula en términos de diseño y no de influencia causal. Por ello, el objetivo general es construir una propuesta pertinente para la eficiencia operativa. Los objetivos específicos siguen una secuencia lógica: diagnosticar la gestión, analizar los indicadores, diseñar la estandarización, estructurar la base técnico-económica, formular responsabilidades e indicadores y validar la propuesta mediante expertos. Esta secuencia mantiene alineados el título, el problema, el objetivo y la metodología. Tiempo acumulado estimado: 3 minutos 25 segundos.');
}

// 5. JUSTIFICACIÓN
{
  const s = pptx.addSlide('MASTER_LIGHT');
  header(s, '¿Por qué vale la pena desarrollar la investigación?', '04 · Justificación y aporte');
  miniCard(s, 'Teórica', 'Organiza conocimientos sobre gestión de procesos, información técnico-económica y eficiencia operativa en empresas de ingeniería.', 0.72, 1.35, 3.75, 2.15, C.BLUE, C.WHITE);
  miniCard(s, 'Práctica', 'Estructura procedimientos, plantillas, base de datos, banco de partidas, responsabilidades e indicadores para el proceso.', 4.78, 1.35, 3.75, 2.15, C.GOLD, C.WHITE);
  miniCard(s, 'Social y empresarial', 'La aplicación futura puede reducir la sobrecarga, mejorar la atención al cliente y fortalecer la sostenibilidad operativa.', 8.84, 1.35, 3.75, 2.15, C.TEAL, C.WHITE);

  box(s, 0.72, 3.88, 11.88, 2.18, C.NAVY, 0.16, { color: C.NAVY });
  tx(s, 'APORTE CENTRAL', 1.02, 4.18, 2.0, 0.25, { fontSize: 11, bold: true, color: C.GOLD2, charSpacing: 1.4 });
  tx(s, 'Convertir un proceso dependiente del conocimiento individual en un proceso documentado, trazable y controlable.', 1.02, 4.58, 8.4, 0.88, { fontSize: 23, bold: true, color: C.WHITE, margin: 0 });
  // mini before-after graphic
  box(s, 9.8, 4.12, 1.05, 1.42, '233D5B', 0.12, { color: '3B5876', width: 1 });
  tx(s, 'HOY', 10.0, 4.31, 0.65, 0.22, { fontSize: 10, bold: true, color: C.GOLD2, align: 'center' });
  tx(s, 'Persona\nclave', 9.95, 4.72, 0.75, 0.48, { fontSize: 12, bold: true, color: C.WHITE, align: 'center' });
  line(s, 10.98, 4.82, 0.58, 0, C.GOLD, 2, true);
  box(s, 11.66, 4.12, 0.68, 1.42, C.GOLD, 0.12, { color: C.GOLD });
  tx(s, 'META', 11.72, 4.31, 0.56, 0.22, { fontSize: 10, bold: true, color: C.NAVY, align: 'center' });
  tx(s, 'Sistema', 11.72, 4.78, 0.56, 0.28, { fontSize: 10.5, bold: true, color: C.NAVY, align: 'center' });
  footer(s, 'Aporte esperado · No representa un resultado de implementación');
  note(s, 'La investigación se justifica en tres niveles. En el plano teórico, organiza conceptos y evidencia sobre gestión de propuestas y eficiencia. En el plano práctico, plantea productos concretos: procedimiento, plantillas, base de datos, banco de partidas, responsabilidades e indicadores. En el plano social y empresarial, su aplicación futura podría reducir la sobrecarga y mejorar la oportunidad de atención. El aporte central consiste en transformar el conocimiento disperso y dependiente de una persona en un sistema documentado, trazable y controlable. Tiempo acumulado estimado: 4 minutos 15 segundos.');
}

// 6. ANTECEDENTES
{
  const s = pptx.addSlide('MASTER_LIGHT');
  header(s, 'La evidencia converge en tres mecanismos de mejora', '05 · Antecedentes y sustento conceptual');
  tx(s, 'Internacionales', 0.72, 1.23, 2.0, 0.3, { fontSize: 14, bold: true, color: C.BLUE });
  miniCard(s, 'Oncioiu et al. · 2021', 'Rediseño de procesos y costeo objetivo en construcción.', 0.72, 1.62, 3.78, 1.0, C.BLUE, C.WHITE);
  miniCard(s, 'Hendrata et al. · 2025', 'Minería de procesos para identificar tiempos y cuellos de botella.', 0.72, 2.82, 3.78, 1.0, C.TEAL, C.WHITE);
  miniCard(s, 'Lambret · 2025', 'Herramientas digitales y datos para hacer más consistente la cotización.', 0.72, 4.02, 3.78, 1.0, C.PURPLE, C.WHITE);

  tx(s, 'Nacionales', 4.78, 1.23, 2.0, 0.3, { fontSize: 14, bold: true, color: '8A6A15' });
  miniCard(s, 'Núñez Melgar · 2021', 'Procedimientos, formatos y control para el proceso de cotizaciones.', 4.78, 1.62, 3.78, 1.0, C.GOLD, C.WHITE);
  miniCard(s, 'Zaravia y Solar · 2022', 'Sistematización digital de cotizaciones, clientes y ventas.', 4.78, 2.82, 3.78, 1.0, C.GREEN, C.WHITE);
  miniCard(s, 'Cisneros y Eccoña · 2021', 'Actualización de costos para reducir distorsiones económicas.', 4.78, 4.02, 3.78, 1.0, C.RED, C.WHITE);

  box(s, 8.92, 1.48, 3.68, 3.85, C.NAVY, 0.16, { color: C.NAVY });
  tx(s, 'SÍNTESIS', 9.22, 1.77, 1.2, 0.25, { fontSize: 10.5, bold: true, color: C.GOLD2, charSpacing: 1.3 });
  const chain = [
    ['1', 'Gestión de procesos'], ['2', 'Estandarización'], ['3', 'Información técnica'], ['4', 'Eficiencia operativa']
  ];
  chain.forEach((c, i) => {
    const yy = 2.25 + i * 0.72;
    circle(s, 9.24, yy, 0.42, i === 3 ? C.GOLD : C.BLUE, i === 3 ? C.GOLD : C.BLUE);
    tx(s, c[0], 9.24, yy + 0.05, 0.42, 0.22, { fontSize: 9.5, bold: true, color: i === 3 ? C.NAVY : C.WHITE, align: 'center' });
    tx(s, c[1], 9.84, yy + 0.02, 2.35, 0.3, { fontSize: 13, bold: true, color: C.WHITE });
    if (i < 3) line(s, 9.45, yy + 0.44, 0, 0.28, '6E8AA8', 1.4, true);
  });
  box(s, 0.72, 5.45, 11.88, 0.73, 'FFF8DE', 0.1, { color: 'E7CC76', width: 1 });
  tx(s, 'Conclusión común:', 0.95, 5.68, 1.58, 0.22, { fontSize: 11.5, bold: true, color: '6C5310' });
  tx(s, 'la rapidez y precisión dependen de procesos estandarizados, información estructurada e indicadores.', 2.55, 5.62, 9.7, 0.33, { fontSize: 14, bold: true, color: C.NAVY });
  footer(s, 'Referencias abreviadas en APA 7 · Detalle en diapositiva de respaldo');
  note(s, 'Los antecedentes internacionales muestran que el rediseño, la minería de procesos y las herramientas digitales permiten identificar demoras y mejorar la consistencia de las estimaciones. En el Perú, los estudios revisados destacan el valor de procedimientos, sistemas de cotización y actualización de costos. En conjunto, la evidencia converge en tres mecanismos: estandarizar el proceso, estructurar la información técnico-económica y controlar el desempeño mediante indicadores. Estos mecanismos sustentan la arquitectura de la propuesta. Tiempo acumulado estimado: 5 minutos 15 segundos.');
}

// 7. VARIABLES
{
  const s = pptx.addSlide('MASTER_LIGHT');
  header(s, 'Variables que orientan el diagnóstico y el diseño', '06 · Variables y componentes');
  box(s, 0.72, 1.25, 5.78, 2.55, C.NAVY, 0.16, { color: C.NAVY });
  pill(s, 'VARIABLE 1', 0.98, 1.52, 1.35, C.GOLD, C.NAVY, 10.5);
  tx(s, 'Gestión de propuestas técnico-económicas', 0.98, 2.02, 4.95, 0.48, { fontSize: 20, bold: true, color: C.WHITE, margin: 0 });
  const d1 = ['Estandarización', 'Información técnico-económica', 'Digitalización', 'Control', 'Responsabilidades'];
  d1.forEach((d, i) => pill(s, d, 0.98 + (i % 2) * 2.52, 2.68 + Math.floor(i / 2) * 0.43, i === 4 ? 4.74 : 2.30, '203B59', 'DDE7F2', 9.5, { color: '47637E', width: 0.7 }));

  box(s, 6.82, 1.25, 5.78, 2.55, C.WHITE, 0.16, { color: 'C8D2DF', width: 1 });
  pill(s, 'VARIABLE 2', 7.08, 1.52, 1.35, C.TEAL2, C.TEAL, 10.5);
  tx(s, 'Eficiencia operativa', 7.08, 2.02, 4.95, 0.48, { fontSize: 21, bold: true, color: C.NAVY, margin: 0 });
  const d2 = ['Tiempo de ciclo', 'Productividad', 'Uso de recursos', 'Precisión del costeo'];
  d2.forEach((d, i) => pill(s, d, 7.08 + (i % 2) * 2.52, 2.68 + Math.floor(i / 2) * 0.43, 2.30, C.LIGHT2, C.BLUE, 9.5, { color: 'C6D2E0', width: 0.7 }));

  tx(s, 'Arquitectura de la propuesta', 0.72, 4.15, 3.2, 0.3, { fontSize: 14, bold: true, color: C.NAVY });
  const comps = [
    ['01', 'Procedimiento'], ['02', 'Base de datos'], ['03', 'Banco de partidas'], ['04', 'Plantillas'], ['05', 'Clasificación'], ['06', 'Responsabilidades'], ['07', 'Indicadores']
  ];
  comps.forEach((c, i) => {
    const x = 0.72 + i * 1.72;
    box(s, x, 4.63, 1.52, 1.15, i === 6 ? C.GOLD : C.WHITE, 0.12, { color: i === 6 ? C.GOLD : 'D2DAE5', width: 1 });
    tx(s, c[0], x + 0.15, 4.78, 0.36, 0.22, { fontSize: 9.5, bold: true, color: i === 6 ? C.NAVY : C.BLUE });
    tx(s, c[1], x + 0.15, 5.08, 1.22, 0.42, { fontSize: 11, bold: true, color: C.NAVY, valign: 'top' });
  });
  box(s, 0.72, 6.05, 11.88, 0.53, C.TEAL2, 0.1, { color: 'B9D9D3', width: 1 });
  tx(s, 'Las variables se diagnostican; la propuesta es el producto que integra los hallazgos.', 0.95, 6.18, 11.35, 0.22, { fontSize: 12.5, bold: true, color: C.TEAL, align: 'center' });
  footer(s, 'Operacionalización resumida en diapositiva de respaldo');
  note(s, 'El diagnóstico se organiza en dos variables. La primera es la gestión de propuestas, observada mediante estandarización, información técnico-económica, digitalización, control y responsabilidades. La segunda es la eficiencia operativa, analizada mediante tiempo de ciclo, productividad, utilización de recursos y precisión del costeo. La propuesta no se trata como una tercera variable; constituye el producto que integra siete componentes: procedimiento, base de datos, banco de partidas, plantillas, clasificación, responsabilidades e indicadores. Tiempo acumulado estimado: 6 minutos 25 segundos.');
}

// 8. METODOLOGÍA
{
  const s = pptx.addSlide('MASTER_DARK');
  s.background = { color: C.NAVY };
  header(s, 'Un diseño que combina evidencia documental y comprensión del proceso', '07 · Diseño metodológico', true);
  const tags = [
    ['Aplicada', C.GOLD, C.NAVY], ['Mixta', C.TEAL, C.WHITE], ['No experimental', C.BLUE, C.WHITE], ['Descriptiva', C.PURPLE, C.WHITE], ['Propositiva', C.GREEN, C.WHITE]
  ];
  tags.forEach((t, i) => pill(s, t[0], 0.76 + i * 2.43, 1.28, 2.1, t[1], t[2], 11));

  tx(s, 'Ruta metodológica', 0.76, 2.04, 2.2, 0.3, { fontSize: 14, bold: true, color: C.GOLD2 });
  const flow = [
    ['01', 'Diagnóstico', 'Documentos + entrevistas + observación'],
    ['02', 'Deficiencias', 'Tiempos, versiones, archivo y responsabilidades'],
    ['03', 'Diseño', 'Componentes de la propuesta de mejora'],
    ['04', 'Validación', 'Juicio de cinco expertos'],
    ['05', 'Propuesta final', 'Ajustes y entrega para Tesis I']
  ];
  flow.forEach((f, i) => {
    const x = 0.76 + i * 2.48;
    box(s, x, 2.55, 2.12, 2.45, i === 4 ? C.GOLD : '17314E', 0.14, { color: i === 4 ? C.GOLD : '3A5674', width: 1 });
    circle(s, x + 0.18, 2.78, 0.48, i === 4 ? C.NAVY : C.GOLD, i === 4 ? C.NAVY : C.GOLD);
    tx(s, f[0], x + 0.18, 2.87, 0.48, 0.18, { fontSize: 9.5, bold: true, color: i === 4 ? C.WHITE : C.NAVY, align: 'center' });
    tx(s, f[1], x + 0.18, 3.47, 1.75, 0.3, { fontSize: 15, bold: true, color: i === 4 ? C.NAVY : C.WHITE });
    tx(s, f[2], x + 0.18, 3.94, 1.74, 0.7, { fontSize: 10.5, color: i === 4 ? '4C3E18' : 'C7D4E3', valign: 'top' });
    if (i < flow.length - 1) line(s, x + 2.13, 3.79, 0.34, 0, C.GOLD, 1.8, true);
  });
  box(s, 0.76, 5.42, 11.84, 0.84, '132C49', 0.12, { color: '3B5876', width: 1 });
  tx(s, 'Sin manipulación de variables', 1.0, 5.64, 3.05, 0.3, { fontSize: 13, bold: true, color: C.WHITE, align: 'center' });
  tx(s, 'Sin comparación antes–después', 5.1, 5.64, 3.05, 0.3, { fontSize: 13, bold: true, color: C.WHITE, align: 'center' });
  tx(s, 'Sin afirmación causal', 9.1, 5.64, 2.85, 0.3, { fontSize: 13, bold: true, color: C.WHITE, align: 'center' });
  footer(s, 'Proyecto descriptivo-propositivo · Hipótesis estadística no formulada', true);
  note(s, 'La investigación es aplicada, de enfoque mixto con predominio cuantitativo, diseño no experimental, alcance descriptivo y componente propositivo. El diagnóstico combinará documentos, entrevistas y observación. Luego se identificarán deficiencias, se diseñarán los componentes y la propuesta será validada por cinco expertos. No se manipularán variables, no se aplicará una comparación antes y después y no se afirmará causalidad. La ejecución y los resultados definitivos se desarrollarán en Tesis I. Tiempo acumulado estimado: 7 minutos 35 segundos.');
}

// 9. POBLACIÓN E INSTRUMENTOS
{
  const s = pptx.addSlide('MASTER_LIGHT');
  header(s, 'Población censal e instrumentos complementarios', '08 · Población y recolección');
  tx(s, 'Población humana', 0.72, 1.28, 2.2, 0.3, { fontSize: 14, bold: true, color: C.NAVY });
  miniCard(s, 'R01 · Gerencia General', 'Informante clave y participante directo del proceso.', 0.72, 1.68, 3.55, 1.0, C.GOLD, C.WHITE);
  miniCard(s, 'R02 · Project Manager', 'Participante directo en la gestión de propuestas.', 0.72, 2.86, 3.55, 1.0, C.TEAL, C.WHITE);
  box(s, 0.72, 4.12, 3.55, 1.55, C.NAVY, 0.14, { color: C.NAVY });
  tx(s, 'CENSO DOCUMENTAL', 0.98, 4.36, 2.95, 0.25, { fontSize: 10.5, bold: true, color: C.GOLD2, align: 'center', charSpacing: 1.2 });
  tx(s, '01/04/2025 — 31/03/2026', 0.98, 4.78, 2.95, 0.3, { fontSize: 17, bold: true, color: C.WHITE, align: 'center' });
  tx(s, 'Solicitudes como unidad principal · versiones como unidad secundaria', 0.98, 5.16, 2.95, 0.32, { fontSize: 9.5, color: 'C7D4E3', align: 'center' });

  tx(s, 'Técnica', 4.72, 1.28, 2.2, 0.3, { fontSize: 14, bold: true, color: C.NAVY });
  tx(s, 'Instrumento', 8.15, 1.28, 2.2, 0.3, { fontSize: 14, bold: true, color: C.NAVY });
  const inst = [
    ['AD', 'Análisis documental', 'Ficha documental'],
    ['LC', 'Lista de cotejo', 'Escala ordinal 0–3'],
    ['OB', 'Observación directa', 'Ficha de observación'],
    ['EN', 'Entrevista', 'Guía semiestructurada'],
    ['JE', 'Juicio de expertos', 'Fichas de validación']
  ];
  inst.forEach((r, i) => {
    const yy = 1.68 + i * 0.82;
    iconLabel(s, r[0], r[1], 4.72, yy, 3.18, i === 4 ? C.GOLD : C.BLUE, C.WHITE);
    line(s, 7.98, yy + 0.36, 0.42, 0, C.GOLD, 1.5, true);
    box(s, 8.5, yy, 3.95, 0.72, i === 4 ? 'FFF8DE' : C.LIGHT2, 0.1, { color: i === 4 ? 'E6CB72' : 'D6DEE8', width: 1 });
    tx(s, r[2], 8.72, yy + 0.15, 3.45, 0.34, { fontSize: 12.5, bold: true, color: C.NAVY });
  });
  box(s, 4.72, 5.98, 7.73, 0.58, C.TEAL2, 0.1, { color: 'BAD8D4', width: 1 });
  tx(s, 'Confidencialidad: participantes y clientes codificados; información económica agregada.', 4.95, 6.12, 7.25, 0.25, { fontSize: 11.5, bold: true, color: C.TEAL, align: 'center' });
  footer(s, 'Población humana: 2 participantes · Selección censal');
  note(s, 'La población humana está integrada por dos participantes: la gerencia general y el Project Manager. Debido a su tamaño y participación directa, se aplicará un censo. La población documental comprende todas las solicitudes y propuestas del periodo abril de 2025 a marzo de 2026. La recolección combinará ficha documental, lista de cotejo, observación, entrevista y juicio de expertos. La codificación R01 y R02, junto con la anonimización de clientes, protege la confidencialidad de la información. Tiempo acumulado estimado: 8 minutos 45 segundos.');
}

// 10. RESULTADOS ESPERADOS
{
  const s = pptx.addSlide('MASTER_LIGHT');
  header(s, 'Resultados esperados: productos verificables', '09 · Resultados esperados');
  tx(s, 'Situación actual', 0.72, 1.3, 2.1, 0.3, { fontSize: 14, bold: true, color: C.RED });
  box(s, 0.72, 1.72, 3.25, 4.48, C.RED2, 0.16, { color: 'E2B9B6', width: 1 });
  const current = ['Información dispersa', 'Dependencia individual', 'Versiones poco trazables', 'Control limitado'];
  current.forEach((t, i) => {
    circle(s, 1.02, 2.10 + i * 0.85, 0.42, C.RED, C.RED);
    tx(s, '–', 1.02, 2.14 + i * 0.85, 0.42, 0.25, { fontSize: 14, bold: true, color: C.WHITE, align: 'center' });
    tx(s, t, 1.62, 2.08 + i * 0.85, 2.05, 0.34, { fontSize: 13.5, bold: true, color: C.INK });
  });
  tx(s, 'Diagnóstico\n+ diseño', 4.30, 3.03, 1.25, 0.62, { fontSize: 15, bold: true, color: C.NAVY, align: 'center' });
  line(s, 4.18, 3.77, 1.48, 0, C.GOLD, 3, true);

  tx(s, 'Productos del proyecto', 5.85, 1.3, 2.6, 0.3, { fontSize: 14, bold: true, color: C.TEAL });
  box(s, 5.85, 1.72, 6.75, 4.48, C.TEAL2, 0.16, { color: 'B7D7D2', width: 1 });
  const products = [
    ['BD', 'Base documental anonimizada'], ['DG', 'Diagnóstico del proceso'], ['PR', 'Procedimiento estandarizado'],
    ['BT', 'Base técnica y banco de partidas'], ['RM', 'Matriz de responsabilidades'], ['IG', 'Indicadores de gestión'],
    ['VE', 'Propuesta validada por expertos']
  ];
  products.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 6.14 + col * 3.05, y = 2.03 + row * 0.91;
    circle(s, x, y, 0.48, i === 6 ? C.GOLD : C.TEAL, i === 6 ? C.GOLD : C.TEAL);
    tx(s, p[0], x, y + 0.08, 0.48, 0.2, { fontSize: 9, bold: true, color: i === 6 ? C.NAVY : C.WHITE, align: 'center' });
    tx(s, p[1], x + 0.62, y + 0.03, 2.12, 0.38, { fontSize: 11.5, bold: true, color: C.NAVY });
  });
  box(s, 0.72, 6.42, 11.88, 0.35, C.NAVY, 0.08, { color: C.NAVY });
  tx(s, 'No se presentan resultados de implementación: son productos que se desarrollarán y validarán en Tesis I.', 0.95, 6.47, 11.4, 0.2, { fontSize: 10.5, bold: true, color: C.WHITE, align: 'center' });
  footer(s, 'Resultados esperados · No son resultados obtenidos');
  note(s, 'En esta etapa no se presentan resultados finales, sino productos esperados. El estudio debe producir una base documental anonimizada, un diagnóstico del proceso, un procedimiento estandarizado, una base técnico-económica con banco de partidas, una matriz de responsabilidades, indicadores de gestión y una propuesta validada por expertos. La diapositiva diferencia la situación actual del sistema propuesto, sin asignar porcentajes de mejora ni afirmar efectos que aún no han sido medidos. Tiempo acumulado estimado: 9 minutos 45 segundos.');
}

// 11. PLAN Y CIERRE
{
  const s = pptx.addSlide('MASTER_DARK');
  s.background = { color: C.NAVY };
  header(s, 'Una hoja de ruta para continuar en Tesis I', '10 · Plan de trabajo y cierre', true);
  const phases = [
    ['1', 'Preparar', 'Validación e inventario'],
    ['2', 'Diagnosticar', 'Datos, entrevistas y observación'],
    ['3', 'Diseñar', 'Procedimiento, base y controles'],
    ['4', 'Validar', 'Expertos y ajuste final']
  ];
  phases.forEach((p, i) => {
    const x = 0.78 + i * 2.65;
    circle(s, x, 1.65, 0.62, i === 3 ? C.GOLD : C.BLUE, i === 3 ? C.GOLD : C.BLUE);
    tx(s, p[0], x, 1.79, 0.62, 0.22, { fontSize: 10, bold: true, color: i === 3 ? C.NAVY : C.WHITE, align: 'center' });
    tx(s, p[1], x - 0.02, 2.47, 1.78, 0.28, { fontSize: 15, bold: true, color: C.WHITE });
    tx(s, p[2], x - 0.02, 2.86, 1.92, 0.5, { fontSize: 10.5, color: 'C7D4E3', valign: 'top' });
    if (i < 3) line(s, x + 0.72, 1.96, 1.72, 0, C.GOLD, 2, true);
  });
  box(s, 10.95, 1.34, 1.65, 2.35, C.GOLD, 0.16, { color: C.GOLD });
  tx(s, 'PRESUPUESTO', 11.12, 1.66, 1.31, 0.25, { fontSize: 10, bold: true, color: C.NAVY, align: 'center', charSpacing: 1.0 });
  tx(s, 'S/ 1 700', 11.12, 2.15, 1.31, 0.42, { fontSize: 21, bold: true, color: C.NAVY, align: 'center' });
  tx(s, 'Recursos propios', 11.12, 2.84, 1.31, 0.3, { fontSize: 10.5, bold: true, color: '5A4915', align: 'center' });

  box(s, 0.78, 4.15, 11.82, 1.68, '132C49', 0.16, { color: '3B5876', width: 1 });
  tx(s, 'CIERRE', 1.05, 4.43, 1.0, 0.25, { fontSize: 10.5, bold: true, color: C.GOLD2, charSpacing: 1.4 });
  tx(s, 'La investigación establece las bases para pasar de una gestión concentrada e informal a un proceso estandarizado, trazable y medible.', 1.05, 4.82, 10.95, 0.62, { fontSize: 21, bold: true, color: C.WHITE, align: 'center' });
  pill(s, 'EJECUCIÓN Y RESULTADOS: TESIS I', 4.42, 6.18, 4.48, C.GOLD, C.NAVY, 11.5);
  footer(s, 'Proyecto de investigación · Julio André Llanos Torres', true);
  note(s, 'El proyecto se ejecutará en cuatro fases: preparación, diagnóstico, diseño y validación. El presupuesto preliminar asciende a mil setecientos soles y será financiado con recursos propios. Como cierre, la investigación establece las bases para que la empresa avance desde una gestión concentrada e informal hacia un proceso estandarizado, trazable y medible. La recolección, el análisis de resultados y la validación final continuarán en el curso de Tesis I. Muchas gracias. Tiempo total estimado: 10 minutos 30 segundos.');
}

// 12. RESPALDO OPERACIONALIZACIÓN
{
  const s = pptx.addSlide('MASTER_LIGHT');
  header(s, 'Operacionalización resumida', 'RESPALDO · No forma parte del tiempo principal');
  const rows = [
    [
      { text: 'Variable', options: { bold: true, color: C.WHITE, fill: C.NAVY } },
      { text: 'Dimensiones', options: { bold: true, color: C.WHITE, fill: C.NAVY } },
      { text: 'Indicadores principales', options: { bold: true, color: C.WHITE, fill: C.NAVY } },
      { text: 'Instrumentos', options: { bold: true, color: C.WHITE, fill: C.NAVY } },
      { text: 'Escala', options: { bold: true, color: C.WHITE, fill: C.NAVY } }
    ],
    ['Gestión de propuestas técnico-económicas', 'Estandarización', 'Flujo, procedimiento, plantillas y clasificación', 'Lista de cotejo + entrevista', 'Ordinal 0–3'],
    ['', 'Información técnico-económica', 'Históricos, proveedores, materiales y banco de partidas', 'Ficha documental + entrevista', 'Ordinal 0–3'],
    ['', 'Digitalización', 'Registro digital, trazabilidad y respaldo', 'Lista de cotejo + observación', 'Ordinal 0–3'],
    ['', 'Control y responsabilidades', 'Seguimiento, pendientes, indicadores y dependencia de R01', 'Lista de cotejo + entrevista', 'Ordinal 0–3'],
    ['Eficiencia operativa', 'Tiempo de ciclo', 'Solicitud–visita, visita–envío y respuesta total', 'Ficha documental', 'Razón'],
    ['', 'Productividad', 'Propuestas emitidas, pendientes y cumplimiento del plazo', 'Ficha documental', 'Razón'],
    ['', 'Utilización de recursos', 'Propuestas por responsable y carga operativa', 'Ficha documental + observación', 'Razón'],
    ['', 'Precisión del costeo', 'Diferencia entre costo estimado y real, cuando existan ambos', 'Ficha documental', 'Razón']
  ];
  s.addTable(rows, {
    x: 0.55, y: 1.35, w: 12.2, h: 4.95,
    colW: [2.25, 2.0, 3.45, 2.55, 1.45],
    rowH: [0.48, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54, 0.54],
    fontFace: 'Aptos', fontSize: 10.5, color: C.INK,
    border: { type: 'solid', color: 'C6D0DD', width: 0.8 },
    fill: C.WHITE, margin: 0.08, valign: 'mid',
    autoFit: false
  });
  box(s, 0.72, 6.45, 11.88, 0.35, 'FFF8DE', 0.08, { color: 'E4C96F', width: 1 });
  tx(s, 'La precisión del costeo solo se calculará en servicios con costo estimado y costo real verificables.', 0.92, 6.50, 11.45, 0.2, { fontSize: 10, italic: true, color: '6C5310', align: 'center' });
  footer(s, 'Diapositiva de respaldo');
  note(s, 'Diapositiva de respaldo. Utilizar únicamente si el jurado consulta cómo se medirán las variables. La primera variable se evalúa con una escala ordinal de formalización; la eficiencia se registra mediante tiempos, conteos, porcentajes y diferencias económicas verificables.');
}

// 13. RESPALDO REFERENCIAS
{
  const s = pptx.addSlide('MASTER_LIGHT');
  header(s, 'Referencias clave', 'RESPALDO · APA 7 abreviado');
  const leftRefs = [
    'AACE International. (2020). Cost estimate classification system.',
    'Camilleri, E. (2024). Key performance indicators.',
    'Dumas, M., La Rosa, M., Mendling, J., & Reijers, H. A. (2018). Fundamentals of BPM.',
    'Hendrata, F., Vanany, I., Suwignjo, P., & Siswanto, N. (2025). Construction tendering performance.',
    'ISO. (2015). The process approach in ISO 9001:2015.'
  ];
  const rightRefs = [
    'Lambret, E. (2025). Enhancing quotation efficiency in precision engineering.',
    'Núñez Melgar Arias, C. S. (2021). Plan de mejora del proceso de cotizaciones.',
    'Oncioiu, I., et al. (2021). Improving business processes in construction.',
    'Parmenter, D. (2019). Key performance indicators.',
    'Slack, N., Brandon-Jones, A., & Burgess, N. (2022). Operations management.'
  ];
  box(s, 0.72, 1.38, 5.84, 4.98, C.WHITE, 0.14, { color: 'D2DAE5', width: 1 });
  box(s, 6.78, 1.38, 5.82, 4.98, C.WHITE, 0.14, { color: 'D2DAE5', width: 1 });
  leftRefs.forEach((r, i) => {
    circle(s, 1.02, 1.75 + i * 0.86, 0.32, C.BLUE, C.BLUE);
    tx(s, String(i + 1), 1.02, 1.80 + i * 0.86, 0.32, 0.16, { fontSize: 8.5, bold: true, color: C.WHITE, align: 'center' });
    tx(s, r, 1.48, 1.68 + i * 0.86, 4.65, 0.52, { fontSize: 11.5, color: C.INK, valign: 'top' });
  });
  rightRefs.forEach((r, i) => {
    circle(s, 7.08, 1.75 + i * 0.86, 0.32, C.GOLD, C.GOLD);
    tx(s, String(i + 6), 7.08, 1.80 + i * 0.86, 0.32, 0.16, { fontSize: 8.5, bold: true, color: C.NAVY, align: 'center' });
    tx(s, r, 7.54, 1.68 + i * 0.86, 4.65, 0.52, { fontSize: 11.5, color: C.INK, valign: 'top' });
  });
  box(s, 0.72, 6.5, 11.88, 0.3, C.NAVY, 0.06, { color: C.NAVY });
  tx(s, 'Las referencias completas se encuentran en el informe de investigación.', 0.9, 6.54, 11.5, 0.18, { fontSize: 10, bold: true, color: C.WHITE, align: 'center' });
  footer(s, 'Diapositiva de respaldo');
  note(s, 'Diapositiva de respaldo. Presenta las fuentes principales que sustentan la gestión de procesos, los indicadores, el costeo, la eficiencia operativa y los antecedentes del estudio.');
}

pptx.writeFile({ fileName: '.temp_ppt/Presentacion_Tesis_Julio_Llanos.pptx' });
