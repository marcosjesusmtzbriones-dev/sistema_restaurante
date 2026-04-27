import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, onSnapshot, deleteDoc, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// Librería para PDF
const scriptPdf = document.createElement('script');
scriptPdf.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
document.head.appendChild(scriptPdf);

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
    :root { --gold: #c5a059; --dark-blue: #0a1118; }
    .hero-section {
        background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), 
                    url('https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=2000&auto=format&fit=crop');
        background-size: cover; background-position: center; height: 90vh; display: flex; align-items: center; justify-content: center; color: white;
    }
    .text-gold { color: var(--gold) !important; }
    .btn-primary { background-color: var(--gold); border: none; color: black; font-weight: bold; }
    .btn-primary:hover { background-color: #b08d4a; color: white; }
    .btn-outline-gold { border: 2px solid var(--gold); color: var(--gold); background: transparent; }
    .btn-outline-gold:hover { background: var(--gold); color: black; }
    .glass-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(197, 160, 89, 0.3); border-radius: 15px; padding: 25px; transition: 0.3s; }
    
    input, select, textarea { 
        background: rgba(10, 17, 24, 0.9) !important; 
        color: white !important; 
        border: 1px solid var(--gold) !important; 
    }
    select option { background-color: #0a1118 !important; color: white !important; }
    
    .historial-item { border-left: 4px solid var(--gold); background: rgba(255,255,255,0.08); margin-bottom: 12px; padding: 15px; }
    .status-confirmada { color: var(--gold); }
    .status-vencida { color: #ff6b6b; }
    .status-finalizada { color: #51cf66; }
    .grid-mesas { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px; }
    .m-btn { aspect-ratio: 1; border: 1px solid var(--gold); color: white; transition: 0.3s; }
    .m-btn.ocupada { background: #ff6b6b; border: none; opacity: 0.6; }
    .m-btn.seleccionada { background: var(--gold); color: black; }
    .m-btn.atendida { background: #51cf66; border: none; }
    
    #ticket-descarga { padding: 30px; background: white; color: black; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    @media print { .no-print { display: none !important; } }
</style>`;

window.scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
};

window.descargarTicket = () => {
    // Clonamos el elemento para evitar problemas de renderizado en modales
    const original = document.getElementById('ticket-descarga');
    const clon = original.cloneNode(true);
    
    // Lo hacemos visible pero fuera de la pantalla para la captura
    clon.style.position = 'fixed';
    clon.style.left = '-9999px';
    clon.style.top = '0';
    clon.style.width = '500px'; // Ancho fijo para asegurar el diseño
    document.body.appendChild(clon);

    const opt = {
        margin: 0.5,
        filename: 'Ticket-Reserva-Oraculo.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(clon).save().then(() => {
        document.body.removeChild(clon);
    });
};

window.renderLanding = async () => {
    document.getElementById('main-content').innerHTML = ESTILOS_GLOBALES + `
        <section id="inicio" class="hero-section text-center">
            <div class="container">
                <h1 class="display-2 fw-bold mb-3">El Oráculo <span class="text-gold">del Sabor</span></h1>
                <p class="lead mb-5 fs-3">Auténtica Gastronomía Griega en Ecatepec</p>
                <div class="d-flex justify-content-center gap-3">
                    <button class="btn btn-primary btn-lg px-5" onclick="window.showAuth()">RESERVAR AHORA</button>
                    <button class="btn btn-outline-gold btn-lg px-5" onclick="window.verificarPersonal()">ACCESO STAFF</button>
                </div>
            </div>
        </section>
        <section id="menu-section" class="container py-5"><h2 class="text-center mb-5 text-gold display-4">Nuestro Menú</h2><div id="menu-previo" class="row g-4"></div></section>
        <section id="promos-section" class="container py-5">
            <h2 class="text-center mb-5 text-gold display-4">Promociones del Olimpo</h2>
            <div class="row g-4">
                <div class="col-md-6"><div class="glass-card"><h3 class="text-gold">2x1 en Gyros</h3><p>Todos los jueves en Multiplaza Aragón.</p><span class="badge bg-primary">Jueves Heroicos</span></div></div>
                <div class="col-md-6"><div class="glass-card"><h3 class="text-gold">Postre Gratis</h3><p>Baklava cortesía en tu primera reservación web.</p><span class="badge bg-primary">Exclusivo Web</span></div></div>
            </div>
        </section>
        <section id="ubicacion-section" class="container py-5 text-center">
            <h2 class="mb-4 text-gold">Encuéntranos</h2><p class="text-white-50">Multiplaza Aragón, Ecatepec</p>
            <div class="glass-card p-0 overflow-hidden" style="height: 400px;"><iframe width="100%" height="100%" style="border:0;" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m18!1m12!1m3!1d3760.354670072124!2d-99.0305!3d19.534!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1fb1776595555%3A0x889816911c76a9a0!2sMultiplaza%20Arag%C3%B3n!5e0!3m2!1ses-419!2smx!4v1714200000000" allowfullscreen="" loading="lazy"></iframe></div>
        </section>`;
    await window.cargarMenuPrevio();
};

window.cargarMenuPrevio = async () => {
    const snap = await getDocs(collection(db, "menu"));
    const container = document.getElementById('menu-previo');
    if(!container) return; container.innerHTML = "";
    snap.forEach(doc => {
        const p = doc.data();
        container.innerHTML += `<div class="col-md-4"><div class="glass-card text-center h-100"><img src="${p.imagen}" onerror="this.src='https://placehold.co/400x300'" class="img-fluid rounded mb-3" style="height:200px; width:100%; object-fit:cover;"><h4 class="text-gold">${p.nombre}</h4><p class="small text-white-50"><i>${p.descripcion}</i></p><h5 class="fw-bold">$${p.precio}</h5></div></div>`;
    });
};

window.verificarPersonal = () => {
    const pass = prompt("Contraseña Staff:");
    if (pass === "Oraculo Del Sabor") window.showAuth(true);
    else alert("Acceso denegado");
};

window.showAuth = (esPersonal = false) => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5 pt-5"><div class="row justify-content-center"><div class="col-md-5"><div class="glass-card" id="auth-box">
            <h3 class="text-center mb-4 text-gold">${esPersonal ? 'Acceso Staff' : 'Bienvenido'}</h3>
            <input id="auth-e" class="form-control mb-2" placeholder="Correo"><input id="auth-p" type="password" class="form-control mb-3" placeholder="Contraseña">
            <button onclick="window.handleLogin()" class="btn btn-primary w-100 mb-2">Entrar</button>
            ${!esPersonal ? '<button onclick="window.showRegister()" class="btn btn-outline-gold w-100 btn-sm">Crear Cuenta</button>' : ''}
            <button onclick="window.renderLanding()" class="btn btn-link w-100 text-white mt-3">Volver al Inicio</button>
        </div></div></div></div>`;
};

window.handleLogin = async () => {
    const e = document.getElementById('auth-e').value;
    const p = document.getElementById('auth-p').value;
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Error de acceso"); }
};

window.showRegister = () => {
    document.getElementById('auth-box').innerHTML = `
        <h3 class="text-center mb-4 text-gold">Nuevo Cliente</h3>
        <input id="reg-n" class="form-control mb-2" placeholder="Nombre"><input id="reg-e" class="form-control mb-2" placeholder="Email"><input id="reg-p" type="password" class="form-control mb-3" placeholder="Password">
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
                        <h2 class="mb-4 text-gold">Reserva tu Mesa</h2>
                        <div class="row mb-3">
                            <div class="col-md-6"><input id="res-f" type="date" class="form-control" min="${new Date().toISOString().split('T')[0]}"></div>
                            <div class="col-md-6"><select id="res-h" class="form-select"><option value="" disabled selected>Elegir hora</option><option>14:00</option><option>17:00</option><option>20:00</option></select></div>
                        </div>
                        <input id="res-p" type="number" class="form-control mb-4" placeholder="Personas" value="2">
                        <div id="grid-reserva" class="grid-mesas mb-4"></div>
                        <button id="btn-confirmar-res" class="btn btn-primary w-100 d-none" onclick="window.saveReserva()">RESERVAR</button>
                    </div>
                </div>
                <div class="col-lg-5"><div class="glass-card"><h4 class="text-gold mb-3 text-center">Mi Historial</h4><div id="lista-historial"></div></div></div>
            </div>
        </div>
        <div class="modal fade" id="modalTicket" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-white text-dark p-0 border-0 shadow-lg">
                    <div id="ticket-descarga">
                        <div class="text-center" style="padding: 20px;">
                            <h5 class="fw-bold mb-1" style="color: #c5a059;">EL ORÁCULO DEL SABOR</h5>
                            <small class="text-muted">Multiplaza Aragón, Ecatepec</small>
                            <h4 class="fw-bold my-3" style="color: black; border-top: 2px solid #eee; border-bottom: 2px solid #eee; padding: 10px 0;">TICKET DE RESERVA</h4>
                            <div id="ticket-info" class="py-2"></div>
                            <hr style="border-top: 1px dashed #999; opacity: 1;">
                            <h6 class="fw-bold mt-3" style="color: #dc3545;">¡PRESENTA ESTE TICKET AL LLEGAR!</h6>
                            <p class="small text-muted mt-2">Valido solo para la fecha y hora indicada.</p>
                        </div>
                    </div>
                    <div class="p-3 bg-light d-flex gap-2">
                        <button class="btn btn-primary w-100" onclick="window.descargarTicket()">DESCARGAR PDF</button>
                        <button class="btn btn-dark w-100" data-bs-dismiss="modal">CERRAR</button>
                    </div>
                </div>
            </div>
        </div>`;

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
            container.innerHTML += `<div class="historial-item"><div class="d-flex justify-content-between"><div><b>Mesa ${r.mesa}-${r.fecha} | ${r.hora}</b><br><small>${r.personas} personas</small></div><span class="status-${r.estado}">${r.estado}</span></div>${r.estado === "confirmada" ? `<button class="btn btn-sm btn-outline-danger w-100 mt-2" onclick="window.cancelarReserva('${d.id}', '${r.mesa}')">Cancelar</button>` : ""}</div>`;
        });
    });
};

window.saveReserva = async () => {
    const f = document.getElementById('res-f').value;
    const h = document.getElementById('res-h').value;
    const p = document.getElementById('res-p').value;
    if(!f || !h) return alert("Selecciona fecha y hora");
    const data = { cliente: auth.currentUser.email, fecha: f, hora: h, personas: p, mesa: mesaActiva, estado: "confirmada", productos: [], total: 0 };
    await setDoc(doc(db, "mesas_activas", mesaActiva.toString()), data);
    await addDoc(collection(db, "historial_reservas"), data);
    
    document.getElementById('ticket-info').innerHTML = `
        <h3 class="fw-bold mt-3 mb-2" style="color: black;">Mesa ${mesaActiva}</h3>
        <p class="mb-2" style="color: black; font-size: 18px;"><b>Fecha:</b> ${f}</p>
        <p class="mb-2" style="color: black; font-size: 18px;"><b>Hora:</b> ${h}</p>
        <p class="mb-3" style="color: black; font-size: 16px;"><b>Invitados:</b> ${p}</p>
    `;
    new bootstrap.Modal('#modalTicket').show();
};

window.cancelarReserva = async (idH, idM) => {
    if(confirm("¿Cancelar reservación?")) {
        await updateDoc(doc(db, "historial_reservas", idH), { estado: "vencida" });
        await deleteDoc(doc(db, "mesas_activas", idM));
    }
};

window.renderGerente = () => {
    document.getElementById('main-content').innerHTML = ESTILOS_GLOBALES + `
        <div class="container my-5"><h2 class="text-gold text-center mb-5">Panel de Gerencia</h2>
            <div class="row g-4">
                <div class="col-md-4"><div class="glass-card"><h4 class="text-gold mb-3">Nuevo Platillo</h4><select id="p-categoria" class="form-select mb-2"><option value="entrada">Entrada</option><option value="plato_fuerte">Plato Fuerte</option><option value="postre">Postre</option><option value="bebida">Bebida</option></select><input id="p-nombre" class="form-control mb-2" placeholder="Nombre"><textarea id="p-desc" class="form-control mb-2" placeholder="Descripción..."></textarea><input id="p-precio" type="number" class="form-control mb-2" placeholder="Precio"><input id="p-img" class="form-control mb-3" placeholder="URL Imagen"><button onclick="window.guardarProducto()" class="btn btn-primary w-100">Añadir</button></div></div>
                <div class="col-md-4"><div class="glass-card"><h4 class="text-gold mb-3">Alta de Mesero</h4><input id="m-nombre" class="form-control mb-2" placeholder="Nombre"><input id="m-email" class="form-control mb-2" placeholder="Correo"><input id="m-pass" type="password" class="form-control mb-3" placeholder="Contraseña"><button onclick="window.crearMesero()" class="btn btn-outline-gold w-100">Registrar</button></div></div>
                <div class="col-md-4 text-center"><div class="glass-card"><h4 class="text-gold mb-4">Ventas del Día</h4><h2 id="total-caja" class="display-6 text-white">$0</h2></div></div>
            </div>
            <div class="mt-5"><h4 class="text-gold mb-3">Ventas Recientes</h4><div class="glass-card table-responsive"><table class="table table-dark"><thead><tr><th>Fecha</th><th>Mesa</th><th>Mesero</th><th>Total</th></tr></thead><tbody id="lista-ventas-body"></tbody></table></div></div>
        </div>`;
    window.cargarHistorialVentas();
};

window.crearMesero = async () => {
    const n = document.getElementById('m-nombre').value;
    const e = document.getElementById('m-email').value;
    const p = document.getElementById('m-pass').value;
    try {
        const res = await createUserWithEmailAndPassword(auth, e, p);
        await setDoc(doc(db, "usuarios", res.user.uid), { nombre: n, correo: e, rol: "mesero" });
        alert("Mesero registrado");
    } catch (err) { alert(err.message); }
};

window.guardarProducto = async () => {
    const p = { nombre: document.getElementById('p-nombre').value, descripcion: document.getElementById('p-desc').value, precio: parseInt(document.getElementById('p-precio').value), categoria: document.getElementById('p-categoria').value, imagen: document.getElementById('p-img').value };
    await addDoc(collection(db, "menu"), p); alert("Menú actualizado");
};

window.cargarHistorialVentas = async () => {
    const snap = await getDocs(collection(db, "ventas_finalizadas"));
    const container = document.getElementById('lista-ventas-body');
    let total = 0; container.innerHTML = "";
    snap.forEach(doc => { const v = doc.data(); total += v.total; container.innerHTML += `<tr><td>${v.fecha_venta}</td><td>Mesa ${v.mesa}</td><td>${v.mesero_nombre}</td><td>$${v.total}</td></tr>`; });
    document.getElementById('total-caja').innerText = `$${total}`;
};

window.renderMesero = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><h2 class="text-center mb-4 text-gold">Terminal de Atención</h2>
            <div class="row">
                <div class="col-md-4"><div class="glass-card"><h4>Mesas</h4><div id="grid-mesas-m" class="grid-mesas"></div></div></div>
                <div id="area-atencion" class="col-md-8 d-none"><div class="glass-card"><h3 class="text-center">Mesa: <span id="m-atend" class="text-gold">--</span></h3><select id="select-platillo" class="form-select mb-3" onchange="window.abrirModalCantidad(this.value)"><option value="" disabled selected>Agregar producto...</option></select><div id="lista-pedido" class="mb-4"></div><h4 class="text-end text-gold">Total: $<span id="total-atencion">0</span></h4><button class="btn btn-primary w-100" onclick="window.generarTicketFinal()">CERRAR CUENTA</button></div></div>
            </div>
        </div>
        <div class="modal fade" id="modalCantidad" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content bg-dark text-white p-4 text-center">
            <h5 id="p-nombre-modal"></h5><div class="d-flex justify-content-center align-items-center gap-3 my-3"><button class="btn btn-outline-gold" onclick="window.modCant(-1)">-</button><h3 id="p-cant-modal">1</h3><button class="btn btn-outline-gold" onclick="window.modCant(1)">+</button></div>
            <button class="btn btn-primary w-100" onclick="window.confirmarProducto()">Añadir</button>
        </div></div></div>`;

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
            btn.className = `btn m-btn ${dM ? (dM.mesero_asignado ? 'atendida' : 'ocupada') : ''}`;
            btn.innerText = `M${i}`; btn.onclick = () => window.atenderMesa(i, dM); grid.appendChild(btn);
        }
    });
};

window.atenderMesa = async (id, data) => {
    mesaActiva = id;
    if(!data) {
        const p = prompt("Personas:"); if(!p) return;
        data = { cliente: "Presencial", mesero_asignado: auth.currentUser.email, mesero_nombre: nombreUsuarioActual, personas: p, productos: [], total: 0 };
        await setDoc(doc(db, "mesas_activas", id.toString()), data);
    }
    pedidoLocal = data.productos || [];
    document.getElementById('area-atencion').classList.remove('d-none');
    document.getElementById('m-atend').innerText = id;
    window.renderListaPedido();
};

window.abrirModalCantidad = (val) => {
    prodTemp = JSON.parse(val); cantTemp = 1;
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
    pedidoLocal.forEach(p => { total += p.subtotal; container.innerHTML += `<div class="d-flex justify-content-between small border-bottom py-1"><span>${p.cantidad}x ${p.nombre}</span><span>$${p.subtotal}</span></div>`; });
    document.getElementById('total-atencion').innerText = total;
};

window.generarTicketFinal = async () => {
    const total = document.getElementById('total-atencion').innerText;
    const snapM = await getDoc(doc(db, "mesas_activas", mesaActiva.toString()));
    const dataM = snapM.data();
    await addDoc(collection(db, "ventas_finalizadas"), { ...dataM, mesa: mesaActiva, total: parseInt(total), fecha_venta: new Date().toLocaleString(), mesero_nombre: nombreUsuarioActual });
    
    document.getElementById('main-content').innerHTML = `
        <div class="p-4 bg-white text-dark mx-auto my-5 shadow-lg text-center" style="max-width: 350px; font-family: monospace;">
            <h4>EL ORÁCULO DEL SABOR</h4><hr>
            <p>Mesa: ${mesaActiva}<br>Comensales: ${dataM.personas}<br>Atendió: ${nombreUsuarioActual}</p><hr>
            <div id="items-ticket"></div><hr>
            <h5>TOTAL: $${total}</h5><hr>
            <button class="btn btn-dark w-100 no-print" onclick="window.finalizarCobro()">PAGADO</button>
        </div>`;
    pedidoLocal.forEach(p => { document.getElementById('items-ticket').innerHTML += `<div class="d-flex justify-content-between"><span>${p.cantidad} ${p.nombre}</span><span>$${p.subtotal}</span></div>`; });
};

window.finalizarCobro = async () => { await deleteDoc(doc(db, "mesas_activas", mesaActiva.toString())); window.renderMesero(); };

onAuthStateChanged(auth, async (u) => {
    if(u) {
        const d = await getDoc(doc(db, "usuarios", u.uid));
        if (d.exists()) {
            const user = d.data(); nombreUsuarioActual = user.nombre;
            document.getElementById('btn-logout').classList.remove('d-none');
            if(user.rol === 'gerente') window.renderGerente(); else if(user.rol === 'mesero') window.renderMesero(); else window.renderReservaCliente();
        }
    } else {
        document.getElementById('btn-logout').classList.add('d-none');
        window.renderLanding();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);
