/* =====================================================
   Seguros Zurbano - versión demo (sin PHP ni MySQL)
   Los datos se guardan en el localStorage del navegador.
   ===================================================== */

const K = {
    usuarios: 'zurbano_usuarios',
    clientes: 'zurbano_clientes',
    solicitudes: 'zurbano_solicitudes',
    comentarios: 'zurbano_comentarios',
    sesion: 'zurbano_sesion'
};

/* ---------- Utilidades ---------- */

function leer(clave, porDefecto) {
    try {
        const v = localStorage.getItem(clave);
        return v ? JSON.parse(v) : porDefecto;
    } catch (e) { return porDefecto; }
}

function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); return true; }
    catch (e) { alert('No se pudo guardar: el almacenamiento del navegador está lleno.'); return false; }
}

function escapar(t) {
    return String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function conSaltos(t) { return escapar(t).replace(/\n/g, '<br>'); }

function fecha(iso, conHora) {
    const d = new Date(iso);
    const p = n => String(n).padStart(2, '0');
    const f = p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
    return conHora ? f + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) : f;
}

function siguienteId(lista) { return lista.reduce((m, x) => Math.max(m, x.id), 0) + 1; }
function ir(url) { window.location.href = url; }
function idDeUrl() { return Number(new URLSearchParams(window.location.search).get('id')); }

function mostrar(id, texto) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = texto;
    el.style.display = texto ? 'block' : 'none';
}

/* ---------- Datos de ejemplo (ficticios) ---------- */

function sembrar() {
    if (leer(K.usuarios, null)) return;
    const hace = d => new Date(Date.now() - d * 86400000).toISOString();
    guardar(K.usuarios, [
        { id: 1, nombre: 'Agente Demo', email: 'demo@zurbano.es', password: 'demo1234' },
        { id: 2, nombre: 'Laura Gómez', email: 'laura@zurbano.es', password: 'laura1234' }
    ]);
    guardar(K.clientes, [
        { id: 1, nombre: 'Carlos Ruiz Martín', email: 'carlos.ruiz@example.com', movil: '600 11 22 33' },
        { id: 2, nombre: 'Marta Sánchez Pérez', email: 'marta.sanchez@example.com', movil: '611 22 33 44' },
        { id: 3, nombre: 'Empresas Chamberí S.L.', email: 'info@empresaschamberi.example', movil: '912 34 56 78' }
    ]);
    guardar(K.solicitudes, [
        { id: 1, fecha: hace(1), estado: 'Pendiente', cliente_id: 1, archivo: null, archivo_data: null,
          mensaje: 'Hola, quisiera un presupuesto para el seguro de mi coche. Es un turismo de 2019.' },
        { id: 2, fecha: hace(3), estado: 'En proceso', cliente_id: 2, archivo: null, archivo_data: null,
          mensaje: 'Me interesa un seguro de hogar para un piso en Chamberí.' },
        { id: 3, fecha: hace(7), estado: 'Gestionada', cliente_id: 3, archivo: null, archivo_data: null,
          mensaje: 'Necesitamos un seguro multirriesgo para nuestra oficina y dos vehículos de empresa.' }
    ]);
    guardar(K.comentarios, [
        { id: 1, anotacion: 'Llamada realizada. Pendiente de enviar la oferta por correo.', tipo: 'interno', sol_id: 2, user_id: 1, fecha: hace(2) },
        { id: 2, anotacion: 'Póliza emitida y documentación enviada al cliente.', tipo: 'interno', sol_id: 3, user_id: 1, fecha: hace(5) }
    ]);
}

/* ---------- Sesión ---------- */

function sesion() {
    try { return JSON.parse(sessionStorage.getItem(K.sesion)); } catch (e) { return null; }
}

function exigirSesion() {
    const s = sesion();
    if (!s) { ir('login.html'); return null; }
    return s;
}

function enlazarSalir() {
    document.querySelectorAll('[data-salir]').forEach(a => a.addEventListener('click', e => {
        e.preventDefault();
        sessionStorage.removeItem(K.sesion);
        ir('login.html');
    }));
}

/* ---------- Formulario público de solicitud (index y contacto) ---------- */

function leerArchivo(archivo) {
    return new Promise(resolver => {
        if (!archivo || !archivo.name) return resolver({ nombre: null, datos: null });
        // En la demo solo se guardan adjuntos pequeños
        if (archivo.size > 300 * 1024) return resolver({ nombre: archivo.name, datos: null });
        const r = new FileReader();
        r.onload = () => resolver({ nombre: archivo.name, datos: r.result });
        r.onerror = () => resolver({ nombre: archivo.name, datos: null });
        r.readAsDataURL(archivo);
    });
}

function iniciarSolicitud() {
    const form = document.getElementById('form-solicitud');
    if (!form) return;
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const d = new FormData(form);
        const email = d.get('email').trim();
        const adjunto = await leerArchivo(d.get('documento'));

        const clientes = leer(K.clientes, []);
        let cliente = clientes.find(c => c.email === email);
        if (!cliente) {
            cliente = { id: siguienteId(clientes), nombre: d.get('nombre'), email: email, movil: d.get('telefono') };
            clientes.push(cliente);
            guardar(K.clientes, clientes);
        }
        const solicitudes = leer(K.solicitudes, []);
        solicitudes.push({
            id: siguienteId(solicitudes), fecha: new Date().toISOString(), estado: 'Pendiente',
            mensaje: d.get('mensaje'), cliente_id: cliente.id,
            archivo: adjunto.nombre, archivo_data: adjunto.datos
        });
        if (!guardar(K.solicitudes, solicitudes)) return;

        form.reset();
        const aviso = document.createElement('div');
        aviso.textContent = '✔ Consulta enviada. Puedes verla en el panel de agentes (acceso demo).';
        aviso.style.cssText = 'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#2e7d32;color:#fff;padding:14px 24px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:9999;font-weight:700;max-width:90%;text-align:center;';
        document.body.appendChild(aviso);
        setTimeout(() => aviso.remove(), 4500);
    });
}

/* ---------- Login ---------- */

function iniciarLogin() {
    document.getElementById('form-login').addEventListener('submit', e => {
        e.preventDefault();
        const d = new FormData(e.target);
        const u = leer(K.usuarios, []).find(x => x.email === d.get('email').trim() && x.password === d.get('password'));
        if (!u) return mostrar('error', 'Usuario o clave incorrectos.');
        sessionStorage.setItem(K.sesion, JSON.stringify({ id: u.id, nombre: u.nombre }));
        ir('solicitudes.html');
    });
}

/* ---------- Bandeja de solicitudes ---------- */

function iniciarSolicitudes() {
    const s = exigirSesion(); if (!s) return;
    document.getElementById('nombre-usuario').textContent = s.nombre;
    const clientes = leer(K.clientes, []);
    const lista = leer(K.solicitudes, []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const badge = { 'Pendiente': 'badge-pendiente', 'En proceso': 'badge-proceso' };
    const tbody = document.getElementById('tbody');

    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px;">No hay solicitudes pendientes en la bandeja.</td></tr>';
        return;
    }
    tbody.innerHTML = lista.map(x => {
        const c = clientes.find(c => c.id === x.cliente_id) || { nombre: '—', email: '—' };
        const est = x.estado || 'Pendiente';
        return `<tr>
            <td>${x.id}</td>
            <td>${fecha(x.fecha, true)}</td>
            <td>${escapar(c.nombre)}</td>
            <td>${escapar(c.email)}</td>
            <td><span class="badge-estado ${badge[est] || 'badge-gestionada'}">${escapar(est)}</span></td>
            <td><a href="verSolicitud.html?id=${x.id}" class="btn-ver">Ver detalle</a></td>
        </tr>`;
    }).join('');
}

/* ---------- Detalle de solicitud ---------- */

function iniciarVerSolicitud() {
    const s = exigirSesion(); if (!s) return;
    const id = idDeUrl();
    const cont = document.getElementById('detalle');

    function pintar() {
        const sol = leer(K.solicitudes, []).find(x => x.id === id);
        if (!sol) {
            cont.innerHTML = `<div style="text-align: center; padding: 50px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 50px; color: #D32F2F; margin-bottom: 20px;"></i>
                <h2>Solicitud no encontrada.</h2></div>`;
            return;
        }
        const c = leer(K.clientes, []).find(x => x.id === sol.cliente_id) || { id: 0, nombre: '', email: '', movil: '' };
        const coms = leer(K.comentarios, []).filter(x => x.sol_id === id).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        const est = sol.estado || 'Pendiente';
        const inp = 'style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #ccc; margin-top: 5px; font-family: \'Inter\', sans-serif;"';
        const lab = 'style="font-size: 13px; font-weight: bold; color: #D32F2F;"';

        cont.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid rgba(211,47,47,0.1); padding-bottom: 15px;">
            <h2 style="color: #D32F2F; font-size: 28px;">Solicitud #${sol.id} <span style="font-size: 14px; color: #666; font-weight: normal; margin-left: 10px;"><i class="fa-solid fa-calendar-days"></i> Recibida el ${fecha(sol.fecha)}</span></h2>
        </div>

        <form data-accion="cliente" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 25px; background: rgba(0,0,0,0.03); padding: 20px; border-radius: 15px; align-items: end;">
            <div><label ${lab}><i class="fa-solid fa-user"></i> Nombre y Apellidos:</label>
                <input type="text" name="nombre" value="${escapar(c.nombre)}" ${inp} required></div>
            <div><label ${lab}><i class="fa-solid fa-envelope"></i> Email:</label>
                <input type="email" name="email" value="${escapar(c.email)}" ${inp} required></div>
            <div><label ${lab}><i class="fa-solid fa-phone"></i> Teléfono:</label>
                <input type="tel" name="movil" value="${escapar(c.movil || '')}" ${inp}></div>
            <div><button type="submit" class="btn-actualizar-ios" style="width: 100%; padding: 10px; font-size: 13px;"><i class="fa-solid fa-floppy-disk"></i> Guardar Cambios</button></div>
        </form>

        <div class="contenedor-estado-glass" style="margin-bottom: 30px;">
            <form data-accion="estado" class="form-estado">
                <div class="etiqueta-estado"><i class="fa-solid fa-circle-dot"></i><span>Estado de la gestión</span></div>
                <select name="estado" class="select-ios">
                    <option value="Pendiente" ${est === 'Pendiente' ? 'selected' : ''}>🟡 Pendiente</option>
                    <option value="En proceso" ${est === 'En proceso' ? 'selected' : ''}>🔵 En proceso</option>
                    <option value="Gestionada" ${est === 'Gestionada' ? 'selected' : ''}>🟢 Gestionada</option>
                </select>
                <button type="submit" class="btn-actualizar-ios"><i class="fa-solid fa-arrows-rotate"></i> Actualizar Estado</button>
            </form>
        </div>

        <div style="margin: 30px 0; padding: 25px; background: white; border-left: 5px solid #D32F2F; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <h3 style="margin-bottom: 15px; color: #333;"><i class="fa-solid fa-comment-dots" style="color:#D32F2F;"></i> Mensaje del Cliente:</h3>
            <p style="font-size: 16px; line-height: 1.6; color: #555; font-style: italic;">"${conSaltos(sol.mensaje)}"</p>
            ${sol.archivo ? `<div style="margin-top: 25px;">
                ${sol.archivo_data
                    ? `<a href="#" data-abrir class="btn-accion" style="background: #2196F3 !important; border-color: #2196F3 !important;"><i class="fa-solid fa-paperclip"></i> Ver Documento Adjunto</a>`
                    : `<span style="color:#666;"><i class="fa-solid fa-paperclip"></i> Adjunto: ${escapar(sol.archivo)} <em>(en la demo solo se guardan adjuntos de hasta 300 KB)</em></span>`}
            </div>` : ''}
        </div>

        <h3 style="margin-top: 40px; margin-bottom: 20px; color: #D32F2F;"><i class="fa-solid fa-clipboard-list"></i> Anotaciones Internas</h3>
        <div style="margin-bottom: 30px;">
            ${coms.length ? coms.map(x => `
                <div style="background: #fdfdfd; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #eee; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                    <p style="font-size: 12px; color: #888; margin-bottom: 8px; font-weight: bold;"><i class="fa-solid fa-clock"></i> ${fecha(x.fecha, true)}</p>
                    <p style="color: #444; line-height: 1.5; font-size: 15px;">${conSaltos(x.anotacion)}</p>
                </div>`).join('')
              : '<p style="color: #888; font-style: italic; background: rgba(0,0,0,0.02); padding: 15px; border-radius: 10px;">No hay anotaciones en esta solicitud.</p>'}
        </div>

        <form data-accion="comentario" class="formulario" style="margin-bottom: 40px;">
            <textarea name="anotacion" rows="3" placeholder="Escribe una anotación interna aquí..." required style="width: 100%; border-radius: 15px; padding: 15px; border: 1px solid #ddd;"></textarea>
            <div style="text-align: left; margin-top: 15px;"><button type="submit" name="nuevo_comentario"><i class="fa-solid fa-plus"></i> Añadir Anotación</button></div>
        </form>

        <hr style="border: 0; border-top: 1px solid #ddd; margin: 40px 0;">

        <form data-accion="eliminar" style="text-align: right;">
            <button type="submit" class="btn-eliminar" style="background: #D32F2F !important; border-color: #D32F2F !important;"><i class="fa-solid fa-trash"></i> Eliminar Solicitud</button>
        </form>`;
    }

    cont.addEventListener('submit', e => {
        const form = e.target.closest('form[data-accion]'); if (!form) return;
        e.preventDefault();
        const d = new FormData(form);
        const accion = form.dataset.accion;
        const sols = leer(K.solicitudes, []);
        const sol = sols.find(x => x.id === id);
        if (!sol) return;

        if (accion === 'estado') {
            sol.estado = d.get('estado'); guardar(K.solicitudes, sols);
        } else if (accion === 'cliente') {
            const clientes = leer(K.clientes, []);
            const c = clientes.find(x => x.id === sol.cliente_id);
            if (c) { c.nombre = d.get('nombre'); c.email = d.get('email'); c.movil = d.get('movil'); guardar(K.clientes, clientes); }
        } else if (accion === 'comentario') {
            const coms = leer(K.comentarios, []);
            coms.push({ id: siguienteId(coms), anotacion: d.get('anotacion'), tipo: 'interno', sol_id: id, user_id: s.id, fecha: new Date().toISOString() });
            guardar(K.comentarios, coms);
        } else if (accion === 'eliminar') {
            if (!confirm('¿Estás seguro de eliminar esta solicitud completa? Esta acción no se puede deshacer.')) return;
            guardar(K.solicitudes, sols.filter(x => x.id !== id));
            guardar(K.comentarios, leer(K.comentarios, []).filter(x => x.sol_id !== id));
            return ir('solicitudes.html');
        }
        pintar();
    });

    cont.addEventListener('click', e => {
        if (!e.target.closest('[data-abrir]')) return;
        e.preventDefault();
        const sol = leer(K.solicitudes, []).find(x => x.id === id);
        fetch(sol.archivo_data).then(r => r.blob()).then(b => window.open(URL.createObjectURL(b), '_blank'));
    });

    pintar();
}

/* ---------- Clientes ---------- */

function iniciarClientes() {
    if (!exigirSesion()) return;
    const tbody = document.getElementById('tbody');

    function pintar() {
        const lista = leer(K.clientes, []).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        tbody.innerHTML = lista.map(c => `<tr>
            <td><strong>${escapar(c.nombre)}</strong></td>
            <td>${escapar(c.email)}</td>
            <td>${escapar(c.movil || '---')}</td>
            <td><div style="display: flex; gap: 5px; justify-content: center; align-items: center;">
                <a href="editarCliente.html?id=${c.id}" class="btn-ver" style="padding: 8px 12px; font-size: 12px; background: #555; text-decoration: none; color: white;"><i class="fa-solid fa-pen"></i></a>
                <button type="button" data-eliminar="${c.id}" class="btn-eliminar" style="padding: 8px 15px !important; font-size: 12px !important;"><i class="fa-solid fa-trash"></i></button>
            </div></td></tr>`).join('');
    }

    tbody.addEventListener('click', e => {
        const b = e.target.closest('[data-eliminar]'); if (!b) return;
        if (!confirm('¿Borrar este cliente? Se eliminarán todas sus solicitudes.')) return;
        const id = Number(b.dataset.eliminar);
        const idsSol = leer(K.solicitudes, []).filter(x => x.cliente_id === id).map(x => x.id);
        guardar(K.clientes, leer(K.clientes, []).filter(x => x.id !== id));
        guardar(K.solicitudes, leer(K.solicitudes, []).filter(x => x.cliente_id !== id));
        guardar(K.comentarios, leer(K.comentarios, []).filter(x => !idsSol.includes(x.sol_id)));
        mostrar('exito', '<i class="fa-solid fa-check"></i> Cliente y sus datos eliminados del sistema.');
        pintar();
    });
    pintar();
}

function iniciarNuevoCliente() {
    if (!exigirSesion()) return;
    document.getElementById('form').addEventListener('submit', e => {
        e.preventDefault();
        const d = new FormData(e.target);
        const clientes = leer(K.clientes, []);
        if (clientes.some(c => c.email === d.get('email').trim())) return mostrar('error', 'Ese correo ya está registrado en la base de datos de clientes.');
        clientes.push({ id: siguienteId(clientes), nombre: d.get('nombre'), email: d.get('email').trim(), movil: d.get('movil') });
        if (guardar(K.clientes, clientes)) ir('solicitudes.html');
    });
}

function iniciarEditarCliente() {
    if (!exigirSesion()) return;
    const clientes = leer(K.clientes, []);
    const c = clientes.find(x => x.id === idDeUrl());
    if (!c) return ir('clientes.html');
    const form = document.getElementById('form');
    form.nombre.value = c.nombre; form.email.value = c.email; form.movil.value = c.movil || '';
    form.addEventListener('submit', e => {
        e.preventDefault();
        c.nombre = form.nombre.value; c.email = form.email.value; c.movil = form.movil.value;
        if (guardar(K.clientes, clientes)) ir('clientes.html');
    });
}

/* ---------- Equipo ---------- */

function iniciarUsuarios() {
    const s = exigirSesion(); if (!s) return;
    const tbody = document.getElementById('tbody');

    function pintar() {
        tbody.innerHTML = leer(K.usuarios, []).sort((a, b) => a.id - b.id).map(t => `<tr>
            <td><strong>${escapar(t.nombre)}</strong></td>
            <td>${escapar(t.email)}</td>
            <td><span style="background: #eee; padding: 5px 10px; border-radius: 5px; font-family: monospace;">${escapar(t.password)}</span></td>
            <td><div style="display: flex; gap: 5px; justify-content: center; align-items: center;">
                <a href="editarUsuario.html?id=${t.id}" class="btn-ver" style="padding: 8px 12px; font-size: 12px; background: #555; text-decoration: none; color: white;"><i class="fa-solid fa-pen"></i></a>
                ${t.id !== s.id
                    ? `<button type="button" data-eliminar="${t.id}" class="btn-eliminar" style="padding: 8px 15px !important; font-size: 12px !important;"><i class="fa-solid fa-trash"></i></button>`
                    : '<span style="font-size: 12px; color: #888; font-weight: bold;">(Tú)</span>'}
            </div></td></tr>`).join('');
    }

    tbody.addEventListener('click', e => {
        const b = e.target.closest('[data-eliminar]'); if (!b) return;
        if (!confirm('¿Seguro que quieres borrar a este empleado?')) return;
        const id = Number(b.dataset.eliminar);
        if (id === s.id) return mostrar('error', 'No puedes eliminar tu propia cuenta mientras estás conectado.');
        guardar(K.usuarios, leer(K.usuarios, []).filter(x => x.id !== id));
        mostrar('exito', '<i class="fa-solid fa-check"></i> Acceso revocado al trabajador.');
        pintar();
    });
    pintar();
}

function iniciarNuevoTrabajador() {
    if (!exigirSesion()) return;
    document.getElementById('form').addEventListener('submit', e => {
        e.preventDefault();
        const d = new FormData(e.target);
        const usuarios = leer(K.usuarios, []);
        if (usuarios.some(u => u.email === d.get('email').trim())) return mostrar('error', 'Ese correo ya está registrado para otro trabajador.');
        usuarios.push({ id: siguienteId(usuarios), nombre: d.get('nombre'), email: d.get('email').trim(), password: d.get('password') });
        if (guardar(K.usuarios, usuarios)) ir('usuarios.html');
    });
}

function iniciarEditarUsuario() {
    const s = exigirSesion(); if (!s) return;
    const usuarios = leer(K.usuarios, []);
    const u = usuarios.find(x => x.id === idDeUrl());
    if (!u) return ir('usuarios.html');
    const form = document.getElementById('form');
    form.nombre.value = u.nombre; form.email.value = u.email; form.password.value = u.password;
    form.addEventListener('submit', e => {
        e.preventDefault();
        u.nombre = form.nombre.value; u.email = form.email.value; u.password = form.password.value;
        if (!guardar(K.usuarios, usuarios)) return;
        if (u.id === s.id) sessionStorage.setItem(K.sesion, JSON.stringify({ id: u.id, nombre: u.nombre }));
        ir('usuarios.html');
    });
}

/* ---------- Arranque ---------- */

document.addEventListener('DOMContentLoaded', () => {
    sembrar();
    enlazarSalir();
    const paginas = {
        index: iniciarSolicitud, contacto: iniciarSolicitud,
        login: iniciarLogin, solicitudes: iniciarSolicitudes, verSolicitud: iniciarVerSolicitud,
        clientes: iniciarClientes, nuevoCliente: iniciarNuevoCliente, editarCliente: iniciarEditarCliente,
        usuarios: iniciarUsuarios, nuevoTrabajador: iniciarNuevoTrabajador, editarUsuario: iniciarEditarUsuario
    };
    const f = paginas[document.body.dataset.pagina];
    if (f) f();
});
