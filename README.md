# DINET · Estatus Picking Unilever — Dashboard V2

Sistema de monitoreo en tiempo real de embarques y picking, inspirado en el dashboard operativo DINET. Permite cargar archivos Excel reales y visualizar el avance de despachos por categoria, turno y estado.

## Caracteristicas

- **Carga de Excel real** (`.xlsx`) con la estructura de embarques DINET
- **Tabs por categoria:** TODOS / LOCAL / PROVINCIA / COPACKERS
- **Velocimetros (gauges)** de Picking y Despacho con aguja animada
- **Resumen Operativo** con Toneladas, m³ y Cajas (Total / Avance / Pendiente / Despacho)
- **Avance por turno** (T1, T2, T3) con barras de progreso
- **Detalle priorizado** con filtros: TODOS / COMPLETO / EN PROCESO / PENDIENTE
- **Modal de detalle por DT** con operadores, tiempos, motivos de diferencia
- **Modo EN VIVO** con auto-refresco configurable
- **Filtros:** dia, turno, transporte, busqueda por DT/destino/cliente/placa
- **Exportacion CSV** de la vista filtrada
- **Modo claro/oscuro**
- **Branding personalizable** (nombre, colores, refresco)

## Estructura del Excel esperado

El archivo debe tener una hoja llamada `Embarques` (o la primera hoja) con estas columnas:

| Col | Campo | Descripcion |
|-----|-------|-------------|
| A | Fecha | Fecha del embarque |
| B | Hora | Hora |
| C | Fecha_Hora | Fecha y hora |
| D | DT | Numero de DT |
| E | Transporte | Empresa transportista |
| F | Cliente | Cliente |
| G | Destino | Destino completo |
| H | Tipo_Destino | Canal Tradicional / Canal Moderno / Provincia / Copackers |
| I | Peso_Ton | Peso en toneladas |
| J | Volumen_m³ | Volumen en m³ |
| K | Und_Solicitada | Unidades solicitadas |
| L | Und_Picada | Unidades picadas |
| M | Placa | Placa del vehiculo |
| N | Pct_Avance | % de avance |
| O | Estado | ok / pending |
| P | Stage_Destino | Stage |
| Q | Rampa | Rampa |
| R | Fin_Carga | ok si esta cargado |
| S | Turno | T1 / T2 / T3 |
| T | Inicio_Picking | Inicio del picking |
| U | Fin_Picking | Fin del picking |
| V | Tiempo_Picking | Tiempo total |
| W | Cita | Cita |
| X-AA | Filtrador, Cod_Cliente_DINET, Cliente_DINET, Familias_DINET | Datos DINET |
| AB | Motivo_Diferencia | Motivo si hay diferencia |
| AC | Volumen_DINET | Volumen DINET |
| AD | Peso_DINET | Peso DINET |
| AE | Picado | % picado |
| AF | Usuario_Ejecucion | Operadores separados por `/` |

## Stack tecnologico

- HTML5 + TailwindCSS (CDN)
- JavaScript Vanilla
- Chart.js para gauges semi-circulares
- SheetJS (xlsx.full.min.js) para parsing de Excel
- Lucide Icons
- localStorage para persistencia

## Instalacion rapida

### Windows — Doble clic en `instalar-dashboard.bat`
Descarga, instala y abre el sistema automaticamente.

### Manual
1. Descarga el ZIP del repo
2. Descomprimelo
3. Abre `index.html` con tu navegador

## Credenciales de prueba

| Usuario   | Contraseña    | Rol               |
|-----------|---------------|-------------------|
| admin     | admin123      | Administrador     |
| operador  | operador123   | Operador Logistica|

## Estructura del proyecto

```
DINET/
├── index.html              Login
├── dashboard.html          Dashboard principal (DINET style)
├── configuracion.html      Configuracion
├── instalar-dashboard.bat  Instalador automatico Windows
├── css/
│   └── style.css
├── js/
│   ├── config.js           Branding y categorias
│   ├── data.js             Capa de datos + parser Excel
│   ├── auth.js             Login
│   ├── utils.js            Utilidades (toast, confirmar, exportar)
│   └── dinet.js            Logica del dashboard
└── README.md
```

## Personalizacion

### Mapeo de categorias
En `js/config.js` editar `APP_CONFIG.categorias`:
```js
categorias: {
  "LOCAL":     ["Canal Tradicional", "Canal Moderno"],
  "PROVINCIA": ["Provincia"],
  "COPACKERS": ["Copackers"]
}
```

### Otros ajustes
- Refresco EN VIVO, colores, nombre → `js/config.js` o pagina **Configuracion** dentro de la app

---

© DINET S.A — v2.0.0
