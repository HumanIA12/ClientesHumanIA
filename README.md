# ClientesHumanIA — Dashboard V2

Dashboard moderno de gestion de clientes con KPIs, graficos, CRUD completo y reportes.

## Caracteristicas

- Login con autenticacion local (2 usuarios demo)
- Dashboard con KPIs y graficos (Chart.js)
- CRUD de clientes con buscador, filtros y paginacion
- Modulo de reportes con analisis por estado y ciudad
- Exportacion CSV / JSON / impresion
- Modo claro/oscuro
- Branding personalizable (nombre, eslogan, colores)
- Persistencia en localStorage (sin backend)
- Diseño responsive (movil y escritorio)

## Stack tecnologico

- HTML5 + TailwindCSS (CDN)
- JavaScript Vanilla
- Chart.js para graficos
- Lucide Icons
- localStorage para persistencia

## Instalacion

### Opcion 1 — Doble clic
1. Abre `index.html` con tu navegador (Chrome, Edge, Firefox).
2. Listo. No requiere instalar nada.

### Opcion 2 — Servidor local (opcional)
```bash
# Con Python
python -m http.server 8080

# Con Node.js
npx serve .
```
Luego abre http://localhost:8080

## Credenciales de prueba

| Usuario   | Contraseña    | Rol           |
|-----------|---------------|---------------|
| admin     | admin123      | Administrador |
| vendedor  | vendedor123   | Vendedor      |

## Estructura del proyecto

```
ClientesHumanIA/
├── index.html              Login
├── dashboard.html          Dashboard principal
├── clientes.html           CRUD clientes
├── reportes.html           Reportes y analisis
├── configuracion.html      Configuracion
├── css/
│   └── style.css           Estilos personalizados
├── js/
│   ├── config.js           Configuracion global (editable)
│   ├── data.js             Capa de datos (localStorage)
│   ├── auth.js             Autenticacion
│   ├── utils.js            Utilidades (toast, confirmar, exportar)
│   ├── sidebar.js          Componentes de layout
│   ├── dashboard.js        Logica del dashboard
│   ├── clientes.js         Logica de clientes
│   ├── reportes.js         Logica de reportes
│   └── configuracion.js    Logica de configuracion
└── README.md
```

## Personalizacion

Edita `js/config.js` para cambiar:
- Nombre de la app
- Eslogan
- Colores de marca
- Datos de empresa
- Usuarios por defecto

O hazlo desde la pagina **Configuracion** dentro de la app (se guarda en el navegador).

## Roadmap (futuro)

- [ ] Integracion con backend real (Node, PHP, Firebase)
- [ ] Multiples roles y permisos
- [ ] Historial de cambios por cliente
- [ ] Notificaciones en tiempo real
- [ ] Dashboard movil PWA

---

© HumanIA — v2.0.0
