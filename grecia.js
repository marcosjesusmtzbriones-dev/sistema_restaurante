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
    select, input { background-color: rgba(255,255,255,0.1) !important; color: white !important; border: 1px solid var(--gold) !important; }
    select option { background: #121212; color: white; }
    .historial-item { border-left: 4px solid var(--gold); background: rgba(255,255,255,0.08); margin-bottom: 12px; padding: 15px; border-radius: 0 8px 8px 0; }
    .status-vencida { color: #ff6b6b; font-weight: bold; }
    .status-finalizada { color: #51cf66; font-weight: bold; }
    .status-confirmada { color: var(--gold); font-weight: bold; }
    .text-gold { color: var(--gold) !important; }
    @media print { .no-print { display: none !important; } .modal-backdrop { display: none !important; } }
</style>`;

// --- NAVEGACIÓN ---
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
                <p class="lead">Tradición Griega en Ecatepec</p>
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

        <section id="promos-section" class="py-5 bg-greek-dark">
            <div class="container text-center">
                <h2 class="mb-5 text-gold">Promociones del Olimpo</h2>
                <div class="row g-4">
                    <div class="col-md-4"><div class="glass-card h-100 border-gold p-4"><h3>2x1</h3><h4>Gyros</h4><p>Martes y Jueves</p></div></div>
                    <div class="col-md-4"><div class="glass-card h-100 border-gold p-4"><h3>15%</h3><h4>Estudiantes</h4><p>Credencial vigente</p></div></div>
                    <div class="col-md-4"><div class="glass-card h-100 border-gold p-4"><h3>FREE</h3><h4>Baklava</h4><p>En tu primera reserva</p></div></div>
                </div>
            </div>
        </section>

        <section id="ubicacion-section" class="container my-5 text-center">
            <h2 class="mb-4 text-gold">Ubicación</h2>
            <p class="text-white-50">Encuéntranos en el corazón de Ecatepec</p>
            <div class="glass-card p-0 overflow-hidden" style="height: 400px;">
                <iframe width="100%" height="100%" style="border:0;" 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15040.673436035272!2d-99.0416954!3d19.534241!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1f00690022359%3A0x633d7b41943c7b20!2sEcatepec%20de%20Morelos%2C%20M%C3%A9x.!5e0!3m2!1ses-419!2smx!4v1713834567890!5m2!1ses-419!2smx" 
                    allowfullscreen="" loading="lazy"></iframe>
            </div>
        </section>`;
    await window.cargarMenuPrevio();
};

window.cargarMenuPrevio = async () => {
    const snap = await getDocs(collection(db, "menu"));
    const container = document.getElementById('menu-previo');
    if(!container) return;
    container.innerHTML = "";
    snap.forEach(doc => {
        const p = doc.data();
        container.innerHTML += `<div class="col-md-4"><div class="glass-card text-center h-100"><img src="${p.imagen}" class="img-fluid rounded mb-3" style="height:180px; width:100%; object-fit:cover;"><h4>${p.nombre}</h4><h5 class="text-gold">$${p.precio}</h5></div></div>`;
    });
};

// --- AUTH ---
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
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Error al entrar"); }
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

// --- CLIENTE ---
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
                        <h4 class="text-gold mb-3 text-center">Historial de Visitas</h4>
                        <div id="lista-historial"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="modalTicket" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content bg-white text-dark"><div class="modal-body text-center p-4">
            <h4 class="fw-bold">RESERVACIÓN CONFIRMADA</h4><hr>
            <div id="ticket-info"></div><hr>
            <p class="text-danger fw-bold small">¡TOMA CAPTURA DE PANTALLA!</p>
            <button class="btn btn-dark w-100 no-print" onclick="window.print()">IMPRIMIR</button>
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
                ${r.estado === "confirmada" ? `<button class="btn btn-sm btn-outline-danger w-100 mt-2" onclick="window.cancelarReserva('${d.id}', '${r.mesa}')">Cancelar</button>` : ""}
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
    await addDoc(collection(db, "historial_reservas"), data);
    
    document.getElementById('ticket-info').innerHTML = `<h3>MESA ${mesaActiva}</h3><p>${f} | ${h}</p><p>${p} Personas</p>`;
    new bootstrap.Modal('#modalTicket').show();
};

window.cancelarReserva = async (idH, idM) => {
    if(confirm("¿Deseas cancelar tu reservación?")) {
        await updateDoc(doc(db, "historial_reservas", idH), { estado: "vencida" });
        await deleteDoc(doc(db, "mesas_activas", idM));
    }
};

// --- STAFF ---
window.renderMesero = () => {
    document.getElementById('main-content').innerHTML = `
        <div id="inicio"></div>
        <div class="container my-5">
            <h2 class="text-center mb-4 text-gold">Gestión de Mesas</h2>
            <div class="row">
                <div class="col-md-4"><div class="glass-card"><h4>Mesas</h4><div id="grid-mesas-m" class="grid-mesas"></div></div></div>
                <div id="area-atencion" class="col-md-8 d-none">
                    <div class="glass-card">
                        <h3 class="text-center">Mesa: <span id="m-atend" class="text-gold">--</span></h3>
                        <p class="text-center text-white-50">Atiende: ${nombreUsuarioActual}</p>
                        <select id="select-platillo" class="form-select mb-3" onchange="window.abrirModalCantidad(this.value)"><option value="" disabled selected>Seleccionar Producto...</option></select>
                        <div id="lista-pedido" class="mb-4"></div>
                        <h4 class="text-end text-gold">Subtotal: $<span id="total-atencion">0</span></h4>
                        <button class="btn btn-primary w-100" onclick="window.generarTicketFinal()">CERRAR Y PAGAR</button>
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
        snap.forEach(d => { const p = d.data(); const opt = document.createElement('option'); opt.value = JSON.stringify({nombre: p.nombre, precio: p.precio}); opt.innerText = `${p.nombre} - $${p.precio}`; sel.appendChild(opt); });
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
        const pers = prompt(`Comensales Mesa ${id}:`, "2");
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
    new bootstrap.Modal('#modalCantidad').show();
};

window.modCant = (v) => { cantTemp = Math.max(1, cantTemp + v); document.getElementById('p-cant-modal').innerText = cantTemp; };

window.confirmarProducto = async () => {
    pedidoLocal.push({ nombre: prodTemp.nombre, cantidad: cantTemp, subtotal: prodTemp.precio * cantTemp });
    const total = pedidoLocal.reduce((acc, p) => acc + p.subtotal, 0);
    await updateDoc(doc(db, "mesas_activas", mesaActiva.toString()), { productos: pedidoLocal, total: total });
    bootstrap.Modal.getInstance('#modalCantidad').hide();
    window.renderListaPedido();
};

window.renderListaPedido = () => {
    const container = document.getElementById('lista-pedido');
    let total = 0; container.innerHTML = "";
    pedidoLocal.forEach(p => { total += p.subtotal; container.innerHTML += `<div class="d-flex justify-content-between border-bottom border-secondary py-2 small"><span>${p.cantidad}x ${p.nombre}</span><span>$${p.subtotal}</span></div>`; });
    document.getElementById('total-atencion').innerText = total;
};

window.generarTicketFinal = async () => {
    const total = document.getElementById('total-atencion').innerText;
    const snapM = await getDoc(doc(db, "mesas_activas", mesaActiva.toString()));
    const dataM = snapM.data();

    const qH = query(collection(db, "historial_reservas"), where("mesa", "==", mesaActiva), where("estado", "==", "confirmada"));
    const hSnap = await getDocs(qH);
    hSnap.forEach(async d => await updateDoc(doc(db, "historial_reservas", d.id), { estado: "finalizada" }));

    await addDoc(collection(db, "ventas_finalizadas"), { ...dataM, mesa: mesaActiva, total: parseInt(total), fecha_venta: new Date().toLocaleString() });

    document.getElementById('main-content').innerHTML = `
        <div class="p-4 bg-white text-dark mx-auto my-5 shadow-lg" style="font-family: monospace; max-width: 350px;">
            <h4 class="text-center fw-bold">EL ORÁCULO DEL SABOR</h4><hr>
            <p>MESA: ${mesaActiva}<br>ATENDIÓ: ${nombreUsuarioActual}</p><hr>
            <div id="items-ticket"></div><hr>
            <h4 class="d-flex justify-content-between"><span>TOTAL:</span> <span>$${total}</span></h4><hr>
            <button class="btn btn-dark w-100 no-print" onclick="window.finalizarCobro()">PAGADO</button>
        </div>`;
    pedidoLocal.forEach(p => { document.getElementById('items-ticket').innerHTML += `<div class="d-flex justify-content-between"><span>${p.cantidad} ${p.nombre}</span><span>$${p.subtotal}</span></div>`; });
};

window.finalizarCobro = async () => {
    await deleteDoc(doc(db, "mesas_activas", mesaActiva.toString()));
    window.renderMesero();
};

// --- OBSERVER ---
onAuthStateChanged(auth, async (u) => {
    if(u) {
        const d = await getDoc(doc(db, "usuarios", u.uid));
        const user = d.data();
        nombreUsuarioActual = user.nombre;
        document.getElementById('btn-logout').classList.remove('d-none');
        if(user.rol === 'gerente') {
            document.getElementById('main-content').innerHTML = `<div id="inicio"></div><div class="container my-5"><h2 class="text-gold text-center">Panel Gerencia</h2></div>`;
        }
        else if(user.rol === 'mesero') window.renderMesero();
        else window.renderReservaCliente();
    } else {
        document.getElementById('btn-logout').classList.add('d-none');
        window.renderLanding();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);
window.renderLanding();
