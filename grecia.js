import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, onSnapshot, deleteDoc, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDPuAu5691El4Xbh-ap59FsRAgdNWRy5c0",
    authDomain: "restaurante-griego.firebaseapp.com",
    projectId: "restaurante-griego",
    storageBucket: "restaurante-griego.firebasestorage.app",
    messagingSenderId: "220205183184",
    appId: "1:220205183184:web:dea034bfaeddb947c6eed5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let mesaActiva = null;
let pedidoLocal = [];
let prodTemp = null;
let cantTemp = 1;
let nombreUsuarioActual = "";

const ESTILOS_GLOBALES = `
<style>
    :root { --gold: #c5a059; }
    select, input, textarea { background-color: rgba(255,255,255,0.1) !important; color: white !important; border: 1px solid var(--gold) !important; }
    select option { background: #121212; color: white; }
    .historial-item { border-left: 4px solid var(--gold); background: rgba(255,255,255,0.08); margin-bottom: 12px; padding: 15px; border-radius: 0 8px 8px 0; }
    .status-vencida { color: #ff6b6b; font-weight: bold; }
    .status-finalizada { color: #51cf66; font-weight: bold; }
    .status-confirmada { color: var(--gold); font-weight: bold; }
    .text-gold { color: var(--gold) !important; }
    .card-admin { background: rgba(255,255,255,0.05); border: 1px solid var(--gold); border-radius: 12px; padding: 20px; height: 100%; }
    .desc-platillo { font-size: 0.85rem; color: #bbb; font-style: italic; margin-top: 5px; }
    @media print { .no-print { display: none !important; } .modal-backdrop { display: none !important; } .modal-content { border: none !important; } }
</style>`;

window.scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else { window.location.href = "index.html#" + id; location.reload(); }
};

window.renderLanding = async () => {
    document.getElementById('main-content').innerHTML = ESTILOS_GLOBALES + `
        <div id="inicio"></div>
        <section class="hero-section text-center text-white d-flex align-items-center justify-content-center" style="min-height: 80vh;">
            <div>
                <h1 class="display-3 fw-bold">El Oráculo <span class="text-gold">del Sabor</span></h1>
                <p class="lead">Tradición Griega en Multiplaza Aragón</p>
                <div class="d-grid gap-2 d-sm-flex justify-content-sm-center mt-4">
                    <button class="btn btn-primary btn-lg px-5" onclick="window.showAuth()">RESERVAR MESA</button>
                    <button class="btn btn-outline-gold btn-lg px-5" onclick="window.verificarPersonal()">ACCESO PERSONAL</button>
                </div>
            </div>
        </section>
        <section id="menu-section" class="container my-5">
            <h2 class="text-center mb-5 text-gold">Nuestro Menú</h2>
            <div id="menu-previo" class="row g-4"></div>
        </section>
        <section id="ubicacion-section" class="container my-5 text-center">
            <h2 class="mb-4 text-gold">Ubicación</h2>
            <p class="text-white-50">Visítanos en Multiplaza Aragón, Ecatepec</p>
            <div class="glass-card p-0 overflow-hidden" style="height: 400px;">
                <iframe width="100%" height="100%" style="border:0;" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3760.3125!2d-99.0296!3d19.5348!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1f00000000000%3A0x0!2zMTnCsDMyJzA1LjIiTiA5OcKwMDEnNDYuNiJX!5e0!3m2!1ses-419!2smx!4v1710000000000" allowfullscreen="" loading="lazy"></iframe>
            </div>
        </section>`;
    await window.cargarMenuPrevio();
};

window.cargarMenuPrevio = async () => {
    const snap = await getDocs(collection(db, "menu"));
    const container = document.getElementById('menu-previo');
    if(!container) return; container.innerHTML = "";
    snap.forEach(doc => {
        const p = doc.data();
        container.innerHTML += `
            <div class="col-md-4">
                <div class="glass-card text-center h-100">
                    <img src="${p.imagen}" onerror="this.src='https://placehold.co/400x300?text=Griego'" class="img-fluid rounded mb-3" style="height:180px; width:100%; object-fit:cover;">
                    <h4 class="mb-0">${p.nombre}</h4>
                    <p class="desc-platillo">(${p.descripcion || 'Especialidad de la casa'})</p>
                    <h5 class="text-gold">$${p.precio}</h5>
                </div>
            </div>`;
    });
};

window.verificarPersonal = () => {
    const pass = prompt("Contraseña Staff:");
    if (pass === "Oraculo Del Sabor") window.showAuth(true);
    else alert("Contraseña incorrecta.");
};

window.showAuth = (esPersonal = false) => {
    document.getElementById('main-content').innerHTML = `
        <div id="inicio" class="container my-5 pt-5"><div class="row justify-content-center"><div class="col-md-5">
            <div class="glass-card" id="auth-box">
                <h3 class="text-center mb-4 text-gold">${esPersonal ? 'Acceso Staff' : 'Área Clientes'}</h3>
                <input id="auth-e" class="form-control mb-2" placeholder="Correo">
                <input id="auth-p" type="password" class="form-control mb-3" placeholder="Contraseña">
                <button onclick="window.handleLogin()" class="btn btn-primary w-100 mb-2">Entrar</button>
                ${!esPersonal ? '<button onclick="window.showRegister()" class="btn btn-outline-gold w-100 btn-sm">Nueva Cuenta</button>' : ''}
            </div>
        </div></div></div>`;
};

window.handleLogin = async () => {
    const e = document.getElementById('auth-e').value;
    const p = document.getElementById('auth-p').value;
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Credenciales incorrectas"); }
};

window.showRegister = () => {
    document.getElementById('auth-box').innerHTML = `
        <h3 class="text-center mb-4 text-gold">Registro</h3>
        <input id="reg-n" class="form-control mb-2" placeholder="Nombre Completo">
        <input id="reg-e" class="form-control mb-2" placeholder="Correo">
        <input id="reg-p" type="password" class="form-control mb-3" placeholder="Contraseña">
        <button onclick="window.handleRegister()" class="btn btn-primary w-100">Crear Cuenta</button>`;
};

window.handleRegister = async () => {
    const n = document.getElementById('reg-n').value;
    const e = document.getElementById('reg-e').value;
    const p = document.getElementById('reg-p').value;
    try {
        const res = await createUserWithEmailAndPassword(auth, e, p);
        await setDoc(doc(db, "usuarios", res.user.uid), { nombre: n, correo: e, rol: "cliente" });
    } catch (err) { alert(err.message); }
};

window.renderReservaCliente = async () => {
    document.getElementById('main-content').innerHTML = ESTILOS_GLOBALES + `
        <div id="inicio"></div>
        <div class="container my-5">
            <div class="row g-4">
                <div class="col-lg-7">
                    <div class="glass-card text-center">
                        <h2 class="mb-4 text-gold">Haz tu Reserva</h2>
                        <input id="res-f" type="date" class="form-control mb-3" min="${new Date().toISOString().split('T')[0]}">
                        <select id="res-h" class="form-select mb-3"><option>14:00</option><option>17:00</option><option>20:00</option></select>
                        <input id="res-p" type="number" class="form-control mb-4" placeholder="Personas" value="2">
                        <div id="grid-reserva" class="grid-mesas mb-4"></div>
                        <button id="btn-confirmar-res" class="btn btn-primary w-100 d-none" onclick="window.saveReserva()">RESERVAR AHORA</button>
                    </div>
                </div>
                <div class="col-lg-5">
                    <div class="glass-card">
                        <h4 class="text-gold mb-3 text-center">Mis Reservaciones</h4>
                        <div id="lista-historial"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="modalTicket" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content bg-white text-dark"><div class="modal-body text-center p-4">
            <h4 class="fw-bold">RESERVACIÓN CONFIRMADA</h4><hr>
            <div id="ticket-info"></div><hr>
            <p class="text-danger fw-bold small">¡TOMA CAPTURA DE PANTALLA O IMPRIME!</p>
            <button class="btn btn-dark w-100 no-print" onclick="window.print()">IMPRIMIR TICKET</button>
        </div></div></div></div>`;

    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-reserva');
        if(!grid) return; grid.innerHTML = "";
        const ocupadas = {}; snap.forEach(d => ocupadas[d.id] = true);
        for(let i=1; i<=12; i++){
            const btn = document.createElement('button');
            btn.className = `btn m-btn ${ocupadas[i] ? 'ocupada' : ''} ${mesaActiva == i ? 'seleccionada' : ''}`;
            btn.innerText = `M${i}`; btn.disabled = ocupadas[i];
            btn.onclick = () => { mesaActiva = i; document.querySelectorAll('.m-btn').forEach(b => b.classList.remove('seleccionada')); btn.classList.add('seleccionada'); document.getElementById('btn-confirmar-res').classList.remove('d-none'); };
            grid.appendChild(btn);
        }
    });

    const q = query(collection(db, "historial_reservas"), where("cliente", "==", auth.currentUser.email), orderBy("fecha", "desc"));
    onSnapshot(q, (snap) => {
        const container = document.getElementById('lista-historial');
        if(!container) return; container.innerHTML = "";
        snap.forEach(d => {
            const r = d.data();
            container.innerHTML += `<div class="historial-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div><b>Mesa ${r.mesa}</b><br><small class="text-white-50">${r.fecha} | ${r.hora}</small></div>
                    <span class="status-${r.estado}">${r.estado.toUpperCase()}</span>
                </div>
                ${r.estado === "confirmada" ? `<button class="btn btn-sm btn-outline-danger w-100 mt-2" onclick="window.cancelarReserva('${d.id}', '${r.mesa}')">Cancelar Reservación</button>` : ""}
            </div>`;
        });
    });
};

window.saveReserva = async () => {
    const f = document.getElementById('res-f').value;
    const h = document.getElementById('res-h').value;
    const p = document.getElementById('res-p').value;
    if(!f) return alert("Selecciona una fecha");
    const data = { cliente: auth.currentUser.email, fecha: f, hora: h, personas: p, mesa: mesaActiva, estado: "confirmada", productos: [], total: 0 };
    await setDoc(doc(db, "mesas_activas", mesaActiva.toString()), data);
    const docRef = await addDoc(collection(db, "historial_reservas"), data);
    
    document.getElementById('ticket-info').innerHTML = `<h3>MESA ${mesaActiva}</h3><p><b>Fecha:</b> ${f}<br><b>Hora:</b> ${h}</p><p>${p} Personas</p><small>ID: ${docRef.id}</small>`;
    new bootstrap.Modal('#modalTicket').show();
};

window.cancelarReserva = async (idH, idM) => {
    if(confirm("¿Estás seguro de que deseas cancelar esta reservación?")) {
        await updateDoc(doc(db, "historial_reservas", idH), { estado: "vencida" });
        await deleteDoc(doc(db, "mesas_activas", idM));
    }
};

window.renderGerente = () => {
    document.getElementById('main-content').innerHTML = ESTILOS_GLOBALES + `
        <div id="inicio"></div>
        <div class="container my-5">
            <h2 class="text-gold text-center mb-5">Panel Administrativo</h2>
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="card-admin">
                        <h4 class="text-gold mb-3">Gestión de Menú</h4>
                        <select id="p-categoria" class="form-select mb-2">
                            <option value="entrada">Entrada</option>
                            <option value="plato_fuerte">Plato Fuerte</option>
                            <option value="postre">Postre</option>
                            <option value="bebida">Bebida</option>
                        </select>
                        <input id="p-nombre" class="form-control mb-2" placeholder="Nombre del platillo">
                        <textarea id="p-desc" class="form-control mb-2" placeholder="Descripción breve..."></textarea>
                        <input id="p-precio" type="number" class="form-control mb-2" placeholder="Precio ($)">
                        <input id="p-img" class="form-control mb-3" placeholder="URL de la imagen">
                        <button onclick="window.guardarProducto()" class="btn btn-primary w-100">Actualizar Menú</button>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card-admin">
                        <h4 class="text-gold mb-3">Registrar Mesero</h4>
                        <input id="m-nombre" class="form-control mb-2" placeholder="Nombre Completo">
                        <input id="m-email" class="form-control mb-2" placeholder="Correo">
                        <input id="m-pass" type="password" class="form-control mb-3" placeholder="Password Temporal">
                        <button onclick="window.crearMesero()" class="btn btn-outline-gold w-100">Dar de Alta</button>
                    </div>
                </div>
                <div class="col-md-4 text-center">
                    <div class="card-admin">
                        <h4 class="text-gold mb-4">Total en Caja</h4>
                        <h2 id="total-caja" class="display-6 mb-4 text-white">$0</h2>
                        <button class="btn btn-gold w-100 mb-2" onclick="window.scrollToSection('seccion-ventas')">Ver Reporte</button>
                    </div>
                </div>
            </div>
            <div id="seccion-ventas" class="mt-5">
                <h4 class="text-gold mb-3">Historial Detallado de Ventas</h4>
                <div class="glass-card table-responsive">
                    <table class="table table-dark table-hover align-middle">
                        <thead><tr><th>Fecha / Hora</th><th>Mesa</th><th>Mesero Encargado</th><th>Total</th></tr></thead>
                        <tbody id="lista-ventas-body"></tbody>
                    </table>
                </div>
            </div>
        </div>`;
    window.cargarHistorialVentas();
};

window.crearMesero = async () => {
    const n = document.getElementById('m-nombre').value;
    const e = document.getElementById('m-email').value;
    const p = document.getElementById('m-pass').value;
    if(!n || !e || !p) return alert("Faltan datos");
    try {
        const res = await createUserWithEmailAndPassword(auth, e, p);
        await setDoc(doc(db, "usuarios", res.user.uid), { nombre: n, correo: e, rol: "mesero" });
        alert("Mesero registrado correctamente");
    } catch (err) { alert(err.message); }
};

window.guardarProducto = async () => {
    const cat = document.getElementById('p-categoria').value;
    const nom = document.getElementById('p-nombre').value;
    const des = document.getElementById('p-desc').value;
    const pre = document.getElementById('p-precio').value;
    const img = document.getElementById('p-img').value;
    if (!nom || !pre || !img) return alert("Nombre, Precio e Imagen son obligatorios");
    await addDoc(collection(db, "menu"), { nombre: nom, descripcion: des, precio: parseInt(pre), categoria: cat, imagen: img });
    alert("Platillo agregado al sistema");
};

window.cargarHistorialVentas = async () => {
    const snap = await getDocs(collection(db, "ventas_finalizadas"));
    const container = document.getElementById('lista-ventas-body');
    let totalCaja = 0;
    if(!container) return; container.innerHTML = "";
    snap.forEach(doc => {
        const v = doc.data();
        totalCaja += v.total;
        container.innerHTML += `<tr>
            <td>${v.fecha_venta}</td>
            <td>Mesa ${v.mesa}</td>
            <td>${v.mesero_nombre || 'Autoservicio'}</td>
            <td class="text-gold fw-bold">$${v.total}</td>
        </tr>`;
    });
    document.getElementById('total-caja').innerText = `$${totalCaja}`;
};

window.renderMesero = () => {
    document.getElementById('main-content').innerHTML = `
        <div id="inicio"></div>
        <div class="container my-5">
            <h2 class="text-center mb-4 text-gold">Terminal de Meseros</h2>
            <div class="row">
                <div class="col-md-4"><div class="glass-card"><h4>Mesas</h4><div id="grid-mesas-m" class="grid-mesas"></div></div></div>
                <div id="area-atencion" class="col-md-8 d-none">
                    <div class="glass-card">
                        <h3 class="text-center">Mesa: <span id="m-atend" class="text-gold">--</span></h3>
                        <p class="text-center text-white-50">Atendido por: ${nombreUsuarioActual}</p>
                        <select id="select-platillo" class="form-select mb-3" onchange="window.abrirModalCantidad(this.value)"><option value="" disabled selected>Agregar a la orden...</option></select>
                        <div id="lista-pedido" class="mb-4"></div>
                        <h4 class="text-end text-gold">Subtotal: $<span id="total-atencion">0</span></h4>
                        <button class="btn btn-primary w-100" onclick="window.generarTicketFinal()">CERRAR CUENTA Y COBRAR</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="modalCantidad" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content bg-dark text-white border-gold"><div class="modal-body text-center">
            <h5 id="p-nombre-modal" class="text-gold mb-4"></h5>
            <div class="d-flex justify-content-center align-items-center gap-4 mb-4">
                <button class="btn btn-outline-gold" onclick="window.modCant(-1)">-</button>
                <h2 id="p-cant-modal">1</h2>
                <button class="btn btn-outline-gold" onclick="window.modCant(1)">+</button>
            </div>
            <button class="btn btn-primary w-100" onclick="window.confirmarProducto()">AÑADIR</button>
        </div></div></div></div>`;
    getDocs(collection(db, "menu")).then(snap => {
        const sel = document.getElementById('select-platillo');
        snap.forEach(d => { const p = d.data(); const opt = document.createElement('option'); opt.value = JSON.stringify({nombre: p.nombre, precio: p.precio}); opt.innerText = `${p.nombre} ($${p.precio})`; sel.appendChild(opt); });
    });
    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-mesas-m');
        if(!grid) return; grid.innerHTML = "";
        const ocupadas = {}; snap.forEach(d => ocupadas[d.id] = d.data());
        for(let i=1; i<=12; i++){
            const btn = document.createElement('button');
            const dM = ocupadas[i];
            let cE = dM ? (dM.mesero_asignado ? "atendida" : "ocupada") : "";
            btn.className = `btn m-btn ${cE}`; btn.innerText = `M${i}`;
            btn.onclick = () => window.atenderMesa(i, dM); grid.appendChild(btn);
        }
    });
};

window.atenderMesa = async (id, data) => {
    mesaActiva = id;
    if(!data) {
        const pers = prompt(`Comensales en Mesa ${id}:`, "2");
        if(!pers) return;
        data = { cliente: "Presencial", mesero_asignado: auth.currentUser.email, mesero_nombre: nombreUsuarioActual, personas: pers, productos: [], total: 0 };
        await setDoc(doc(db, "mesas_activas", id.toString()), data);
    }
    pedidoLocal = data.productos || [];
    document.getElementById('area-atencion').classList.remove('d-none');
    document.getElementById('m-atend').innerText = id;
    window.renderListaPedido();
};

window.abrirModalCantidad = (val) => {
    if(!val) return; prodTemp = JSON.parse(val); cantTemp = 1;
    document.getElementById('p-nombre-modal').innerText = prodTemp.nombre;
    document.getElementById('p-cant-modal').innerText = cantTemp;
    new bootstrap.Modal('#modalCantidad
