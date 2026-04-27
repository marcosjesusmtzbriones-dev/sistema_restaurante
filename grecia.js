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

const ESTILOS_GLOBALES = `
<style>
    select, input { background-color: rgba(255,255,255,0.1) !important; color: white !important; border: 1px solid #c5a059 !important; }
    select option { background: #121212; color: white; }
    .historial-item { border-left: 4px solid #c5a059; background: rgba(255,255,255,0.05); margin-bottom: 10px; padding: 10px; border-radius: 0 8px 8px 0; }
    .status-vencida { color: #ff4444; font-size: 0.8rem; }
    .status-finalizada { color: #00ff88; font-size: 0.8rem; }
    .status-pendiente { color: #c5a059; font-size: 0.8rem; }
    @media print { .no-print { display: none !important; } }
</style>`;

window.scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
};

window.renderLanding = async () => {
    let html = ESTILOS_GLOBALES + `
        <section id="inicio" class="hero-section text-center text-white d-flex align-items-center justify-content-center">
            <div>
                <h1 class="display-3 fw-bold">El Oráculo <span style="color:#c5a059">del Sabor</span></h1>
                <p class="lead">Tradición Griega en Ecatepec</p>
                <div class="d-grid gap-2 d-sm-flex justify-content-sm-center mt-4">
                    <button class="btn btn-primary btn-lg px-5" onclick="window.showAuth()">RESERVAR MESA</button>
                    <button class="btn btn-outline-gold btn-lg px-5" onclick="window.verificarPersonal()">SOY PERSONAL</button>
                </div>
            </div>
        </section>

        <section id="menu-section" class="container my-5">
            <h2 class="text-center mb-5" style="color:#c5a059">Nuestro Menú</h2>
            <div id="menu-previo" class="row g-4"></div>
        </section>

        <section id="promos-section" class="py-5 bg-greek-dark">
            <div class="container text-center">
                <h2 class="mb-5" style="color:#c5a059">Promociones del Olimpo</h2>
                <div class="row g-4">
                    <div class="col-md-4"><div class="glass-card h-100 border-gold p-4"><h3>2x1</h3><h4>Gyros Clásicos</h4><p>Martes y Jueves</p></div></div>
                    <div class="col-md-4"><div class="glass-card h-100 border-gold p-4"><h3>15%</h3><h4>Estudiantes</h4><p>Con credencial vigente</p></div></div>
                    <div class="col-md-4"><div class="glass-card h-100 border-gold p-4"><h3>FREE</h3><h4>Baklava</h4><p>En tu primera reserva online</p></div></div>
                </div>
            </div>
        </section>

        <section id="ubicacion-section" class="container my-5 text-center">
            <h2 class="mb-4" style="color:#c5a059">Ubicación</h2>
            <p class="text-white-50">Multiplaza Aragón: Av. Central 120, Ecatepec de Morelos, Méx.</p>
            <div class="glass-card p-0 overflow-hidden mb-3" style="height: 450px;">
                <iframe width="100%" height="100%" style="border:0;" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3760.3601550993074!2d-99.0294711242371!3d19.52608463704383!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1fba7a7b74071%3A0x799549ceba20d28d!2sMultiplaza%20Arag%C3%B3n!5e0!3m2!1ses-419!2smx!4v1714150000000!5m2!1ses-419!2smx" allowfullscreen="" loading="lazy"></iframe>
            </div>
        </section>`;
    document.getElementById('main-content').innerHTML = html;
    await window.cargarMenuPrevio();
};

window.cargarMenuPrevio = async () => {
    const snap = await getDocs(collection(db, "menu"));
    const container = document.getElementById('menu-previo');
    if(!container) return;
    container.innerHTML = "";
    snap.forEach(doc => {
        const p = doc.data();
        container.innerHTML += `<div class="col-md-4"><div class="glass-card text-center h-100"><img src="${p.imagen}" class="img-fluid rounded mb-3" style="height:180px; width:100%; object-fit:cover;"><h4>${p.nombre}</h4><h5 style="color:#c5a059">$${p.precio}</h5></div></div>`;
    });
};

window.verificarPersonal = () => {
    const pass = prompt("Contraseña de Personal:");
    if (pass === "Oraculo Del Sabor") window.showAuth(true);
    else alert("Acceso denegado");
};

window.showAuth = (esPersonal = false) => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5 pt-5"><div class="row justify-content-center"><div class="col-md-5">
            <div class="glass-card" id="auth-box">
                <h3 class="text-center mb-4" style="color:#c5a059">${esPersonal ? 'Acceso Personal' : 'Acceso Clientes'}</h3>
                <input id="auth-e" class="form-control mb-2" placeholder="Correo">
                <input id="auth-p" type="password" class="form-control mb-3" placeholder="Contraseña">
                <button onclick="window.handleLogin()" class="btn btn-primary w-100 mb-2">Entrar</button>
                ${!esPersonal ? '<button onclick="window.showRegister()" class="btn btn-outline-gold w-100 btn-sm">Crear Cuenta</button>' : ''}
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
        <h3 class="text-center mb-4" style="color:#c5a059">Registro</h3>
        <input id="reg-n" class="form-control mb-2" placeholder="Nombre Completo">
        <input id="reg-e" class="form-control mb-2" placeholder="Correo Electrónico">
        <input id="reg-p" type="password" class="form-control mb-3" placeholder="Contraseña">
        <button onclick="window.handleRegister()" class="btn btn-primary w-100">Registrarme</button>`;
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
        <div class="container my-5">
            <div class="row g-4">
                <div class="col-lg-7">
                    <div class="glass-card text-center">
                        <h2 class="mb-4" style="color:#c5a059">Nueva Reservación</h2>
                        <div class="row text-start">
                            <div class="col-md-6 mb-3">
                                <label class="small text-white-50">Fecha:</label>
                                <input id="res-f" type="date" class="form-control" min="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="small text-white-50">Hora:</label>
                                <select id="res-h" class="form-select">
                                    <option value="14:00">14:00 PM</option><option value="17:00">17:00 PM</option><option value="20:00">20:00 PM</option>
                                </select>
                            </div>
                            <div class="col-12 mb-4">
                                <label class="small text-white-50">Personas:</label>
                                <input id="res-p" type="number" class="form-control" min="1" value="2">
                            </div>
                        </div>
                        <div id="grid-reserva" class="grid-mesas mb-4"></div>
                        <button id="btn-confirmar-res" class="btn btn-primary w-100 d-none" onclick="window.saveReserva()">CONFIRMAR RESERVACIÓN</button>
                    </div>
                </div>
                <div class="col-lg-5">
                    <div class="glass-card">
                        <h4 style="color:#c5a059" class="mb-3">Mi Historial de Reservas</h4>
                        <div id="lista-historial"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="modalTicket" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content bg-white text-dark"><div class="modal-body text-center" id="ticket-area">
            <h4 class="fw-bold">RESERVACIÓN EXITOSA</h4><hr>
            <div id="ticket-info"></div><hr>
            <p class="text-danger fw-bold small">¡TOMA CAPTURA DE PANTALLA DE TU TICKET!</p>
            <button class="btn btn-dark w-100 no-print" onclick="window.print()">IMPRIMIR / GUARDAR</button>
        </div></div></div></div>`;

    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-reserva');
        if(!grid) return; grid.innerHTML = "";
        const ocupadas = {}; snap.forEach(d => ocupadas[d.id] = true);
        for(let i=1; i<=12; i++){
            const btn = document.createElement('button');
            btn.className = `btn m-btn ${ocupadas[i] ? 'ocupada' : ''} ${mesaActiva == i ? 'seleccionada' : ''}`;
            btn.innerText = `M${i}`; btn.disabled = ocupadas[i];
            btn.onclick = () => { 
                mesaActiva = i; 
                document.querySelectorAll('.m-btn').forEach(b => b.classList.remove('seleccionada')); 
                btn.classList.add('seleccionada'); 
                document.getElementById('btn-confirmar-res').classList.remove('d-none'); 
            };
            grid.appendChild(btn);
        }
    });

    const q = query(collection(db, "historial_reservas"), where("cliente", "==", auth.currentUser.email));
    onSnapshot(q, (snap) => {
        const container = document.getElementById('lista-historial');
        if(!container) return; container.innerHTML = "";
        if(snap.empty) container.innerHTML = "<p class='text-white-50 small'>No tienes movimientos.</p>";
        snap.forEach(d => {
            const r = d.data();
            const idDoc = d.id;
            let btnCancelar = (r.estado === "confirmada") ? `<button class="btn btn-sm btn-outline-danger mt-2" onclick="window.cancelarReserva('${idDoc}', '${r.mesa}')">Cancelar</button>` : "";
            let colorClase = r.estado === "vencida" ? "status-vencida" : (r.estado === "finalizada" ? "status-finalizada" : "status-pendiente");
            
            container.innerHTML += `<div class="historial-item">
                <div class="d-flex justify-content-between">
                    <b>Mesa ${r.mesa}</b>
                    <span class="${colorClase}">${r.estado.toUpperCase()}</span>
                </div>
                <small class="text-white-50">${r.fecha} | ${r.hora} | ${r.personas} pers.</small><br>
                ${btnCancelar}
            </div>`;
        });
    });
};

window.saveReserva = async () => {
    const f = document.getElementById('res-f').value;
    const h = document.getElementById('res-h').value;
    const p = document.getElementById('res-p').value;
    if(!f) return alert("Selecciona fecha");
    const data = { cliente: auth.currentUser.email, fecha: f, hora: h, personas: p, mesa: mesaActiva, estado: "confirmada", productos: [], total: 0 };
    await setDoc(doc(db, "mesas_activas", mesaActiva.toString()), data);
    await addDoc(collection(db, "historial_reservas"), data);
    document.getElementById('ticket-info').innerHTML = `<h3>MESA ${mesaActiva}</h3><p>${f} - ${h}</p><p>${p} Comensales</p><p class="small">Cliente: ${auth.currentUser.email}</p>`;
    new bootstrap.Modal('#modalTicket').show();
    mesaActiva = null;
};

window.cancelarReserva = async (idHistorial, idMesa) => {
    if(confirm("¿Seguro que deseas cancelar tu reserva?")) {
        await updateDoc(doc(db, "historial_reservas", idHistorial), { estado: "vencida" });
        await deleteDoc(doc(db, "mesas_activas", idMesa));
        alert("Reserva cancelada.");
    }
};

window.renderGerente = async () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5">
            <h2 class="mb-4" style="color:#c5a059">Panel de Control Gerencial</h2>
            <div class="row g-4 mb-5">
                <div class="col-md-4"><div class="glass-card text-center"><h5>Ventas Totales</h5><h2 id="total-ventas" class="text-gold">$0</h2></div></div>
                <div class="col-md-8"><div class="glass-card"><h5>Historial de Ventas y Meseros</h5><div id="reporte-ventas" style="max-height:300px; overflow-y:auto;"></div></div></div>
            </div>
            <div class="row g-4">
                <div class="col-md-6"><div class="glass-card"><h4>Registrar Mesero</h4><input id="m-nom" class="form-control mb-2" placeholder="Nombre"><input id="m-ema" class="form-control mb-2" placeholder="Correo"><input id="m-pas" type="password" class="form-control mb-3" placeholder="Contraseña"><button onclick="window.registrarMesero()" class="btn btn-primary w-100">DAR DE ALTA</button></div></div>
                <div class="col-md-6"><div class="glass-card"><h4>Nuevo Platillo al Menú</h4><input id="p-nom" class="form-control mb-2" placeholder="Nombre"><input id="p-pre" type="number" class="form-control mb-2" placeholder="Precio"><input id="p-img" class="form-control mb-3" placeholder="URL Imagen"><button onclick="window.agregarPlatillo()" class="btn btn-primary w-100">AGREGAR AL SISTEMA</button></div></div>
            </div>
        </div>`;
    
    const snap = await getDocs(collection(db, "ventas_finalizadas"));
    let sum = 0;
    const container = document.getElementById('reporte-ventas');
    snap.forEach(d => {
        const v = d.data(); sum += v.total;
        container.innerHTML += `<div class="border-bottom border-secondary py-2 small">
            <b>Mesa ${v.mesa}</b> - <span class="text-gold">$${v.total}</span><br>
            Atendió: ${v.mesero_asignado} | Fecha: ${v.fecha_venta}
        </div>`;
    });
    document.getElementById('total-ventas').innerText = `$${sum}`;
};

window.registrarMesero = async () => {
    const n = document.getElementById('m-nom').value;
    const e = document.getElementById('m-ema').value;
    const p = document.getElementById('m-pas').value;
    try {
        const tApp = initializeApp(firebaseConfig, "temp");
        const res = await createUserWithEmailAndPassword(getAuth(tApp), e, p);
        await setDoc(doc(db, "usuarios", res.user.uid), { nombre: n, correo: e, rol: "mesero" });
        alert("Mesero registrado con éxito");
    } catch (err) { alert(err.message); }
};

window.agregarPlatillo = async () => {
    const n = document.getElementById('p-nom').value;
    const p = parseInt(document.getElementById('p-pre').value);
    const i = document.getElementById('p-img').value;
    await addDoc(collection(db, "menu"), { nombre: n, precio: p, imagen: i });
    alert("Menú actualizado");
};

window.renderMesero = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5">
            <h2 class="text-center mb-4" style="color:#c5a059">Atención de Mesas</h2>
            <div class="row">
                <div class="col-md-4"><div class="glass-card"><h4>Mapa de Mesas</h4><div id="grid-mesas-m" class="grid-mesas"></div></div></div>
                <div id="area-atencion" class="col-md-8 d-none">
                    <div class="glass-card">
                        <h3 class="text-center">Mesa: <span id="m-atend" style="color:#c5a059">--</span></h3>
                        <p class="text-center text-white-50 mb-4">Comensales: <span id="m-pers-atend">0</span></p>
                        <select id="select-platillo" class="form-select mb-3" onchange="window.abrirModalCantidad(this.value)">
                            <option value="" selected disabled>Añadir producto...</option>
                        </select>
                        <div id="lista-pedido" class="mb-4"></div>
                        <div class="d-flex justify-content-between text-gold"><h4>Total a Cobrar:</h4><h4>$<span id="total-atencion">0</span></h4></div>
                        <button class="btn btn-primary w-100" onclick="window.generarTicketFinal()">CERRAR MESA Y GENERAR TICKET</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="modalCantidad" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content bg-dark text-white border-gold"><div class="modal-body text-center">
            <h5 id="p-nombre-modal" class="mb-4 text-gold"></h5>
            <div class="d-flex justify-content-center align-items-center gap-4 mb-4">
                <button class="btn btn-outline-gold" onclick="window.modCant(-1)">-</button>
                <h2 id="p-cant-modal">1</h2>
                <button class="btn btn-outline-gold" onclick="window.modCant(1)">+</button>
            </div>
            <button class="btn btn-primary w-100" onclick="window.confirmarProducto()">AGREGAR AL PEDIDO</button>
        </div></div></div></div>`;
    
    const cargarOpts = async () => {
        const snap = await getDocs(collection(db, "menu"));
        const sel = document.getElementById('select-platillo');
        snap.forEach(d => {
            const p = d.data();
            const opt = document.createElement('option');
            opt.value = JSON.stringify({nombre: p.nombre, precio: p.precio});
            opt.innerText = `${p.nombre} - $${p.precio}`;
            sel.appendChild(opt);
        });
    };
    cargarOpts();

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
        const pers = prompt(`Abrir Mesa ${id} presencial. ¿Cuántas personas?`, "2");
        if(!pers) return;
        data = { cliente: "Presencial", mesero_asignado: auth.currentUser.email, personas: pers, productos: [], total: 0 };
        await setDoc(doc(db, "mesas_activas", id.toString()), data);
    }
    pedidoLocal = data.productos || [];
    document.getElementById('area-atencion').classList.remove('d-none');
    document.getElementById('m-atend').innerText = id;
    document.getElementById('m-pers-atend').innerText = data.personas;
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
    const snap = await getDoc(doc(db, "mesas_activas", mesaActiva.toString()));
    const data = snap.data();
    
    // Marcar en historial como finalizada si era reserva
    const qH = query(collection(db, "historial_reservas"), where("mesa", "==", mesaActiva), where("estado", "==", "confirmada"));
    const hSnap = await getDocs(qH);
    hSnap.forEach(async d => await updateDoc(doc(db, "historial_reservas", d.id), { estado: "finalizada" }));

    await addDoc(collection(db, "ventas_finalizadas"), { ...data, mesa: mesaActiva, total: parseInt(total), fecha_venta: new Date().toLocaleString() });
    
    document.getElementById('main-content').innerHTML = `
        <div class="p-4 bg-white text-dark mx-auto my-5 shadow-lg" style="font-family: monospace; max-width: 350px;">
            <h4 class="text-center fw-bold">EL ORÁCULO DEL SABOR</h4><hr>
            <p>MESA: ${mesaActiva} | ATENDIÓ: ${auth.currentUser.email}</p><hr>
            <div id="items-ticket"></div><hr>
            <h4 class="d-flex justify-content-between"><span>TOTAL:</span> <span>$${total}</span></h4><hr>
            <p class="text-center text-danger fw-bold">¡TOMA CAPTURA DE TU TICKET DE PAGO!</p>
            <button class="btn btn-dark w-100 no-print mt-3" onclick="window.finalizarCobro()">PAGO RECIBIDO</button>
        </div>`;
    const container = document.getElementById('items-ticket');
    pedidoLocal.forEach(p => { container.innerHTML += `<div class="d-flex justify-content-between"><span>${p.cantidad} ${p.nombre}</span><span>$${p.subtotal}</span></div>`; });
};

window.finalizarCobro = async () => {
    await deleteDoc(doc(db, "mesas_activas", mesaActiva.toString()));
    window.renderMesero();
};

onAuthStateChanged(auth, async (u) => {
    if(u) {
        const d = await getDoc(doc(db, "usuarios", u.uid));
        const user = d.data();
        document.getElementById('btn-logout').classList.remove('d-none');
        if(user.rol === 'gerente') window.renderGerente();
        else if(user.rol === 'mesero') window.renderMesero();
        else window.renderReservaCliente();
    } else {
        document.getElementById('btn-logout').classList.add('d-none');
        window.renderLanding();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);
window.renderLanding();
