```bash
raul@madrid:~$ cat crm-mapfre-web/README.md
```

# Seguros Zurbano · CRM web

Web corporativa de una agencia de seguros MAPFRE con un **panel privado de gestión** (tipo CRM): bandeja de solicitudes, agenda de clientes y equipo de trabajo.

**Demo:** https://raulo9.github.io/crm-mapfre-web/

## Acceso al panel (demo)

| Usuario | Contraseña |
|---|---|
| `demo@zurbano.es` | `demo1234` |

Entra desde el botón **Acceso** de la web. Los datos de ejemplo son ficticios.

## Funciones

- Formulario público de solicitud de presupuesto (con adjunto opcional).
- Bandeja de solicitudes con estados: Pendiente · En proceso · Gestionada.
- Detalle de solicitud: editar datos del cliente, cambiar estado, anotaciones internas y eliminar.
- Agenda de clientes: alta, edición y borrado.
- Gestión del equipo: alta, edición y revocación de acceso.

## Versión original y versión demo

El proyecto original está hecho en **PHP + PDO + MySQL**. GitHub Pages solo sirve archivos estáticos, así que esta versión reproduce las mismas funciones con **HTML, CSS y JavaScript**, y guarda los datos en el `localStorage` del navegador:

- Cada visitante ve su propia copia de los datos, que no se comparten entre usuarios.
- Los adjuntos se guardan solo si pesan menos de 300 KB.
- El inicio de sesión es solo de demostración, no es seguridad real.

## Tecnologías

HTML5 · CSS3 · JavaScript · (original: PHP · MySQL)
