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
    .m-btn.seleccionada { border: 2px solid white !important; transform: scale(1.1); box-shadow: 0 0 10px var(--gold); }
    @media print { .no-print { display: none !important; } .modal-backdrop { display: none !important; } }
</style>`;

window.scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else { window.location.href = "index.html#" + id; location.reload(); }
};

window.inicializarMenu = async () => {
    const platillos = [
        { nombre: "Ensalada Horiatiki", categoria: "entrada", precio: 120, descripcion: "Tomate, pepino, cebolla roja, aceitunas y queso feta.", imagen: "http://googleusercontent.com/image_collection/image_retrieval/7342629402792999705_0" },
        { nombre: "Tzatziki con Pita", categoria: "entrada", precio: 85, descripcion: "Yogur griego con pepino y ajo.", imagen: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=400" },
        { nombre: "Moussaka Tradicional", categoria: "plato_fuerte", precio: 240, descripcion: "Capas de berenjena, carne picada y bechamel.", imagen: "http://googleusercontent.com/image_collection/image_retrieval/4720271214853107674_0" },
        { nombre: "Souvlaki de Pollo", categoria: "plato_fuerte", precio: 195, descripcion: "Brochetas marinadas con papas fritas.", imagen: "http://googleusercontent.com/image_collection/image_retrieval/7737612532605836714_0" },
        { nombre: "Baklava de Nuez", categoria: "postre", precio: 95, descripcion: "Pasta filo con nueces y miel.", imagen: "http://googleusercontent.com/image_collection/image_retrieval/5644320103838060804_0" },
        { nombre: "Yogur con Miel", categoria: "postre", precio: 75, descripcion: "Yogur griego con miel y nuez.", imagen: "http://googleusercontent.com/image_collection/image_retrieval/175977556715656420_0" },
        { nombre: "Café Frappé", categoria: "bebida", precio: 65, descripcion: "Clásico café helado batido.", imagen: "http://googleusercontent.com/image_collection/image_retrieval/192654733561497997_0" },
        { nombre: "Ouzo (Copa)", categoria: "bebida", precio: 110, descripcion: "Licor tradicional de anís.", imagen: "https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?auto=format&fit=crop&q=80&w=400" },
        { nombre: "Refresco", categoria: "bebida", precio: 45, descripcion: "Coca-Cola, Sprite o Fanta.", imagen: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400" }
    ];
    for (const p of platillos) { await addDoc(collection(db, "menu"), p); }
    alert("Menú cargado");
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
                    <button class="btn btn-outline-gold btn-lg px-5" onclick="window.verificarPersonal()">ACCESO STAFF</button>
                </div>
            </div>
        </section>
        <section id="menu-section" class="container my-5">
            <h2 class="text-center mb-4 text-gold">Nuestra Carta</h2>
            <div class="d-flex justify-content-center flex-wrap gap-2 mb-5">
                <button class="btn btn-outline-gold" onclick="window.cargarMenuFiltrado('entrada')">Entradas</button>
                <button class="btn btn-outline-gold" onclick="window.cargarMenuFiltrado('plato_fuerte')">Platos Fuertes</button>
                <button class="btn btn-outline-gold" onclick="window.cargarMenuFiltrado('postre')">Postres</button>
                <button class="btn btn-outline-gold" onclick="window.cargarMenuFiltrado('bebida')">Bebidas</button>
            </div>
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
            <p class="text-white-50">Multiplaza Aragón, Ecatepec</p>
            <div class="glass-card p-0 overflow-hidden" style="height: 400px;">
                <iframe width="100%" height="100%" style="border:0;" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3760.367175249411!2d-99.0270054!3d19.5258384!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1fb19623e6187%3A0x8686e00f9a2e6f4a!2sMultiplaza%20Arag%C3%B3n!5e0!3m2!1ses-419!2smx!4v1714500000000!5m2!1ses-419!2smx" allowfullscreen="" loading="lazy"></iframe>
            </div>
        </section>`;
    await window.cargarMenuFiltrado('entrada');
};

window.cargarMenuFiltrado = async (cat) => {
    const container = document.getElementById('menu-previo');
    container.innerHTML = `<div class="col-12 text-center text-white-50"><p>Cargando sabores...</p></div>`;
    const q = query(collection(db, "menu"), where("categoria", "==", cat));
    const snap = await getDocs(q);
    container.innerHTML = "";
    if(snap.empty) { container.innerHTML = `<p class="text-center w-100">Próximamente...</p>`; return; }
    snap.forEach(doc => {
        const p = doc.data();
        container.innerHTML += `<div class="col-md-4 mb-4"><div class="glass-card text-center h-100 p-0 overflow-hidden border-gold-soft"><img src="${p.imagen}" class="img-fluid" style="height:200px; width:100%; object-fit:cover;"><div class="p-3"><h4 class="h5 text-gold">${p.nombre}</h4><p class="small">${p.descripcion}</p><h5>$${p.precio}</h5></div></div></div>`;
    });
};

window.verificarPersonal = () => {
    const pass = prompt("Contraseña Staff:");
    if (pass === "Oraculo Del Sabor") window.showAuth(true);
    else alert("Incorrecto");
};

window.showAuth = (esPersonal = false) => {
    document.getElementById('main-content').innerHTML = `<div class="container my-5 pt-5"><div class="row justify-content-center"><div class="col-md-5"><div class="glass-card" id="auth-box"><h3 class="text-center mb-4 text-gold">${esPersonal ? 'Staff' : 'Clientes'}</h3><input id="auth-e" class="form-control mb-2" placeholder="Correo"><input id="auth-p" type="password" class="form-control mb-3" placeholder="Contraseña"><button onclick="window.handleLogin()" class="btn btn-primary w-100 mb-2">Entrar</button>${!esPersonal ? '<button onclick="window.showRegister()" class="btn btn-outline-gold w-100 btn-sm">Registro</button>' : ''}</div></div></div></div>`;
};

window.handleLogin = async () => {
    const e = document.getElementById('auth-e').value;
    const p = document.getElementById('auth-p').value;
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Error"); }
};

window.showRegister = () => {
    document.getElementById('auth-box').innerHTML = `<h3 class="text-center mb-4 text-gold">Registro</h3><input id="reg-n" class="form-control mb-2" placeholder="Nombre"><input id="reg-e" class="form-control mb-2" placeholder="Correo"><input id="reg-p" type="password" class="form-control mb-3" placeholder="Contraseña"><button onclick="window.handleRegister()" class="btn btn-primary w-100">Crear</button>`;
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
    document.getElementById('main-content').innerHTML = ESTILOS_GLOBALES + `<div class="container my-5"><div class="row g-4"><div class="col-lg-7"><div class="glass-card text-center"><h2 class="mb-4 text-gold">Reserva</h2><input id="res-f" type="date" class="form-control mb-3" min="${new Date().toISOString().split('T')[0]}"><select id="res-h" class="form-select mb-3"><option>14:00</option><option>17:00</option><option>20:00</option></select><input id="res-p" type="number" class="form-control mb-4" value="2"><div id="grid-reserva" class="grid-mesas mb-4"></div><button id="btn-confirmar-res" class="btn btn-primary w-100 d-none" onclick="window.saveReserva()">CONFIRMAR</button></div></div><div class="col-lg-5"><div class="glass-card"><h4 class="text-gold mb-3 text-center">Historial</h4><div id="lista-historial"></div></div></div></div></div><div class="modal fade" id="modalTicket" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content bg-white text-dark"><div class="modal-body text-center p-4"><h4>RESERVA EXITOSA</h4><hr><div id="ticket-info"></div><hr><p class="text-danger small fw-bold">CAPTURAR PANTALLA</p><button class="btn btn-dark w-100 no-print" onclick="window.print()">IMPRIMIR</button></div></div></div></div>`;
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
            container.innerHTML += `<div class="historial-item"><div class="d-flex justify-content-between"><div><b>Mesa ${r.mesa}</b><br><small>${r.fecha}</small></div><span class="status-${r.estado}">${r.estado}</span></div>${r.estado === "confirmada" ? `<button class="btn btn-sm btn-outline-danger w-100 mt-2" onclick="window.cancelarReserva('${d.id}', '${r.mesa}')">Cancelar</button>` : ""}</div>`;
        });
    });
};

window.saveReserva = async () => {
    const f = document.getElementById('res-f').value;
    const h = document.getElementById('res-h').value;
    const p = document.getElementById('res-p').value;
    const data = { cliente: auth.currentUser.email, fecha: f, hora: h, personas: p, mesa: mesaActiva, estado: "confirmada", productos: [], total: 0 };
    await setDoc(doc(db, "mesas_activas", mesaActiva.toString()), data);
    await addDoc(collection(db, "historial_reservas"), data);
    document.getElementById('ticket-info').innerHTML = `<h3>MESA ${mesaActiva}</h3><p>${f} | ${h}</p>`;
    new bootstrap.Modal('#modalTicket').show();
};

window.cancelarReserva = async (idH, idM) => {
    if(confirm("¿Cancelar?")) {
        await updateDoc(doc(db, "historial_reservas", idH), { estado: "vencida" });
        await deleteDoc(doc(db, "mesas_activas", idM));
    }
};

window.renderMesero = () => {
    document.getElementById('main-content').innerHTML = `<div class="container my-5"><h2 class="text-center mb-4 text-gold">Mesas</h2><div class="row"><div class="col-md-4"><div class="glass-card"><div id="grid-mesas-m" class="grid-mesas"></div></div></div><div id="area-atencion" class="col-md-8 d-none"><div class="glass-card"><h3 id="m-atend">--</h3><select id="select-platillo" class="form-select mb-3" onchange="window.abrirModalCantidad(this.value)"><option value="" disabled selected>Producto...</option></select><div id="lista-pedido"></div><h4 class="text-end text-gold">$<span id="total-atencion">0</span></h4><button class="btn btn-primary w-100" onclick="window.generarTicketFinal()">COBRAR</button></div></div></div></div><div class="modal fade" id="modalCantidad" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content bg-dark text-white"><div class="modal-body text-center"><h5 id="p-nombre-modal"></h5><div class="d-flex justify-content-center gap-3"><button class="btn btn-outline-gold" onclick="window.modCant(-1)">-</button><h2 id="p-cant-modal">1</h2><button class="btn btn-outline-gold" onclick="window.modCant(1)">+</button></div><button class="btn btn-primary w-100 mt-3" onclick="window.confirmarProducto()">AÑADIR</button></div></div></div></div>`;
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
            btn.className = `btn m-btn ${dM ? (dM.mesero_asignado ? 'atendida' : 'ocupada') : ''}`;
            btn.innerText = `M${i}`;
            btn.onclick = () => window.atenderMesa(i, dM); grid.appendChild(btn);
        }
    });
};

window.atenderMesa = async (id, data) => {
    mesaActiva = id;
    if(!data) {
        const p = prompt("Personas:", "2"); if(!p) return;
        data = { cliente: "Presencial", mesero_asignado: auth.currentUser.email, productos: [], total: 0 };
        await setDoc(doc(db, "mesas_activas", id.toString()), data);
    }
    pedidoLocal = data.productos || [];
    document.getElementById('area-atencion').classList.remove('d-none');
    document.getElementById('m-atend').innerText = `MESA ${id}`;
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
    let t = 0; container.innerHTML = "";
    pedidoLocal.forEach(p => { t += p.subtotal; container.innerHTML += `<div class="d-flex justify-content-between border-bottom py-1"><span>${p.cantidad}x ${p.nombre}</span><span>$${p.subtotal}</span></div>`; });
    document.getElementById('total-atencion').innerText = t;
};

window.generarTicketFinal = async () => {
    const t = document.getElementById('total-atencion').innerText;
    const snapM = await getDoc(doc(db, "mesas_activas", mesaActiva.toString()));
    await addDoc(collection(db, "ventas"), { ...snapM.data(), total: parseInt(t), fecha: new Date().toLocaleString() });
    document.getElementById('main-content').innerHTML = `<div class="p-4 bg-white text-dark mx-auto my-5 shadow" style="max-width:300px; font-family:monospace;"><h4 class="text-center">ORÁCULO GRIEGO</h4><hr><p>MESA: ${mesaActiva}</p><div id="it"></div><hr><h4>TOTAL: $${t}</h4><button class="btn btn-dark w-100 no-print mt-3" onclick="window.finalizar()">PAGADO</button></div>`;
    pedidoLocal.forEach(p => document.getElementById('it').innerHTML += `<div>${p.cantidad} ${p.nombre} $${p.subtotal}</div>`);
};

window.finalizar = async () => {
    await deleteDoc(doc(db, "mesas_activas", mesaActiva.toString()));
    window.renderMesero();
};

onAuthStateChanged(auth, async (u) => {
    if(u) {
        const d = await getDoc(doc(db, "usuarios", u.uid));
        const user = d.data();
        document.getElementById('btn-logout').classList.remove('d-none');
        if(user.rol === 'mesero') window.renderMesero();
        else if(user.rol === 'gerente') document.getElementById('main-content').innerHTML = `<h2 class="text-center text-gold my-5">Panel Gerente</h2>`;
        else window.renderReservaCliente();
    } else {
        document.getElementById('btn-logout').classList.add('d-none');
        window.renderLanding();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);
window.renderLanding();
