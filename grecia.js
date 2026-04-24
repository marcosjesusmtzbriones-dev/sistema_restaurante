import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, onSnapshot, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

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

window.scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.renderLanding().then(() => {
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            }, 150);
        });
    }
};

window.renderLanding = async () => {
    let html = `
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
            <h2 class="text-center mb-4" style="color:#c5a059">Nuestro Menú</h2>
            <div id="menu-previo" class="row g-4"></div>
        </section>
        <section id="ubicacion-section" class="container my-5 text-center">
            <h2 class="mb-4" style="color:#c5a059">Ubicación</h2>
            <p class="text-white-50 mb-4">Multiplaza Aragón: Av. Carlos Hank González 120, Ecatepec de Morelos, Méx.</p>
            <div class="glass-card p-0 overflow-hidden mb-3">
                <iframe 
                    width="100%" 
                    height="450" 
                    style="border:0" 
                    loading="lazy" 
                    allowfullscreen 
                    src="https://maps.google.com/maps?q=Multiplaza%20Aragon%20Ecatepec&t=&z=15&ie=UTF8&iwloc=&output=embed">
                </iframe>
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
        container.innerHTML += `
            <div class="col-md-4">
                <div class="glass-card text-center h-100">
                    <img src="${p.imagen}" class="img-fluid rounded mb-3" style="height:180px; width:100%; object-fit:cover;">
                    <h4>${p.nombre}</h4>
                    <h5 style="color:#c5a059">$${p.precio}</h5>
                </div>
            </div>`;
    });
};

window.verificarPersonal = () => {
    const pass = prompt("Contraseña de Personal:");
    if (pass === "Oraculo Del Sabor") window.showAuth(true);
    else alert("Acceso denegado");
};

window.showAuth = (esPersonal = false) => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="row justify-content-center"><div class="col-md-5">
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
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Error de acceso"); }
};

window.showRegister = () => {
    document.getElementById('auth-box').innerHTML = `
        <h3 class="text-center mb-4" style="color:#c5a059">Registro</h3>
        <input id="reg-n" class="form-control mb-2" placeholder="Nombre">
        <input id="reg-e" class="form-control mb-2" placeholder="Correo">
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

window.renderGerente = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="row g-4">
            <div class="col-md-6"><div class="glass-card"><h4>Nuevo Mesero</h4><input id="m-nom" class="form-control mb-2" placeholder="Nombre"><input id="m-ema" class="form-control mb-2" placeholder="Correo"><input id="m-pas" type="password" class="form-control mb-3" placeholder="Contraseña"><button onclick="window.registrarMesero()" class="btn btn-primary w-100">REGISTRAR</button></div></div>
            <div class="col-md-6"><div class="glass-card"><h4>Nuevo Platillo</h4><input id="p-nom" class="form-control mb-2" placeholder="Nombre"><input id="p-pre" type="number" class="form-control mb-2" placeholder="Precio"><input id="p-img" class="form-control mb-3" placeholder="URL Imagen"><button onclick="window.agregarPlatillo()" class="btn btn-primary w-100">GUARDAR</button></div></div>
        </div></div>`;
};

window.registrarMesero = async () => {
    const n = document.getElementById('m-nom').value;
    const e = document.getElementById('m-ema').value;
    const p = document.getElementById('m-pas').value;
    try {
        const tApp = initializeApp(firebaseConfig, "temp");
        const res = await createUserWithEmailAndPassword(getAuth(tApp), e, p);
        await setDoc(doc(db, "usuarios", res.user.uid), { nombre: n, correo: e, rol: "mesero" });
        alert("Mesero registrado");
    } catch (err) { alert(err.message); }
};

window.agregarPlatillo = async () => {
    const n = document.getElementById('p-nom').value;
    const p = document.getElementById('p-pre').value;
    const i = document.getElementById('p-img').value;
    await addDoc(collection(db, "menu"), { nombre: n, precio: p, imagen: i });
    alert("Platillo guardado");
};

window.renderReservaCliente = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="glass-card text-center">
            <h2 class="mb-4" style="color:#c5a059">Reserva tu Mesa</h2>
            <div class="row">
                <div class="col-md-5"><input id="res-f" type="date" class="form-control mb-3" min="${new Date().toISOString().split('T')[0]}"><select id="res-h" class="form-control mb-4"><option>14:00</option><option>17:00</option><option>20:00</option></select></div>
                <div class="col-md-7"><div id="grid-reserva" class="grid-mesas"></div><button id="btn-confirmar-res" class="btn btn-primary w-100 mt-4 d-none" onclick="window.saveReserva()">CONFIRMAR RESERVA</button></div>
            </div>
        </div></div>`;
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
};

window.saveReserva = async () => {
    const f = document.getElementById('res-f').value;
    const h = document.getElementById('res-h').value;
    const ticketDetalle = document.getElementById('ticket-detalle');
    ticketDetalle.innerHTML = `<p><b>Mesa:</b> ${mesaActiva}</p><p><b>Fecha:</b> ${f}</p><p><b>Hora:</b> ${h}</p>`;
    await setDoc(doc(db, "mesas_activas", mesaActiva.toString()), { cliente: auth.currentUser.email, fecha: f, hora: h, estado: "reservada", productos: [], total: 0 });
    new bootstrap.Modal('#modalTicket').show();
};

window.compartirTicket = () => {
    html2canvas(document.querySelector("#ticket-captura")).then(canvas => {
        const link = document.createElement('a');
        link.download = 'Reserva_Oraculo.png';
        link.href = canvas.toDataURL();
        link.click();
    });
};

window.renderMesero = () => {
    document.getElementById('main-content').innerHTML = `
        <style>
            select option { background-color: #1a1a1a !important; color: white !important; }
            #select-platillo { background-color: rgba(255,255,255,0.1); color: white !important; border: 1px solid #c5a059; }
        </style>
        <div class="container my-5">
            <h2 class="text-center mb-4" style="color:#c5a059">Panel de Atención</h2>
            <div class="row">
                <div class="col-md-4"><div class="glass-card"><h4>Mesas</h4><div id="grid-mesas-m" class="grid-mesas"></div></div></div>
                <div id="area-atencion" class="col-md-8 d-none">
                    <div class="glass-card">
                        <h3 class="text-center">Mesa: <span id="m-atend" style="color:#c5a059">--</span></h3>
                        <div class="mb-3">
                            <label class="form-label">Agregar Platillo:</label>
                            <select id="select-platillo" class="form-select" onchange="window.prepararPedido(this.value)">
                                <option value="" selected disabled>Selecciona...</option>
                            </select>
                        </div>
                        <div id="lista-pedido" class="mb-3"></div>
                        <div class="d-flex justify-content-between mb-3"><h4>Total:</h4><h4 style="color:#c5a059">$<span id="total-atencion">0</span></h4></div>
                        <button class="btn btn-primary w-100" onclick="window.generarTicket()">Ticket y Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="modalCantidad" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content bg-dark text-white border-gold"><div class="modal-header border-0"><h5 id="p-nombre-modal"></h5></div><div class="modal-body text-center"><div class="d-flex justify-content-center align-items-center gap-3"><button class="btn btn-outline-gold" onclick="window.modCant(-1)">-</button><h2 id="p-cant-modal">1</h2><button class="btn btn-outline-gold" onclick="window.modCant(1)">+</button></div><button class="btn btn-primary w-100 mt-4" onclick="window.confirmarProducto()">Confirmar Pedido</button></div></div></div></div>`;
    actualizarSelectProductos();
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

async function actualizarSelectProductos() {
    const snap = await getDocs(collection(db, "menu"));
    const sel = document.getElementById('select-platillo');
    if(!sel) return;
    snap.forEach(d => {
        const p = d.data();
        const opt = document.createElement('option');
        opt.value = JSON.stringify({nombre: p.nombre, precio: p.precio});
        opt.innerText = `${p.nombre} - $${p.precio}`;
        sel.appendChild(opt);
    });
}

window.atenderMesa = async (id, data) => {
    const miEmail = auth.currentUser.email;
    mesaActiva = id;
    if (data && data.mesero_asignado && data.mesero_asignado !== miEmail) {
        alert(`Mesa ocupada por: ${data.mesero_asignado}`);
        return;
    }
    if(!data) {
        if(!confirm(`¿Abrir Mesa ${id} presencial?`)) return;
        data = { cliente: "Presencial", mesero_asignado: miEmail, productos: [], total: 0 };
        await setDoc(doc(db, "mesas_activas", id.toString()), data);
    } else if(!data.mesero_asignado) {
        await updateDoc(doc(db, "mesas_activas", id.toString()), { mesero_asignado: miEmail });
    }
    pedidoLocal = data.productos || [];
    document.getElementById('area-atencion').classList.remove('d-none');
    document.getElementById('m-atend').innerText = id;
    window.renderListaPedido();
};

window.prepararPedido = (val) => {
    if(!val) return;
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
    document.getElementById('select-platillo').value = "";
};

window.renderListaPedido = () => {
    const container = document.getElementById('lista-pedido');
    let total = 0; container.innerHTML = "";
    pedidoLocal.forEach(p => { total += p.subtotal; container.innerHTML += `<div class="d-flex justify-content-between border-bottom py-2"><span>${p.cantidad}x ${p.nombre}</span><span>$${p.subtotal}</span></div>`; });
    document.getElementById('total-atencion').innerText = total;
};

window.generarTicket = () => {
    const total = document.getElementById('total-atencion').innerText;
    document.getElementById('main-content').innerHTML = `
        <div class="p-4 bg-white text-dark text-center" style="font-family: monospace; width: 320px; margin: 50px auto; border: 1px solid #ccc;">
            <h3>EL ORÁCULO DEL SABOR</h3><p>TICKET DE CONSUMO</p><hr>
            <p>MESA: ${mesaActiva}</p><hr>
            <div id="items-ticket"></div><hr>
            <h4>TOTAL: $${total}</h4>
            <button class="btn btn-dark w-100 mt-3" onclick="window.cerrarYLimpiar()">Cerrar y Limpiar Mesa</button>
        </div>`;
    const items = document.getElementById('items-ticket');
    pedidoLocal.forEach(p => { items.innerHTML += `<div class="d-flex justify-content-between"><span>${p.cantidad}x ${p.nombre}</span><span>$${p.subtotal}</span></div>`; });
};

window.cerrarYLimpiar = async () => {
    await deleteDoc(doc(db, "mesas_activas", mesaActiva.toString()));
    mesaActiva = null; pedidoLocal = [];
    window.renderMesero();
};

onAuthStateChanged(auth, async (u) => {
    if(u) {
        const d = await getDoc(doc(db, "usuarios", u.uid));
        const user = d.data();
        document.getElementById('btn-logout').classList.remove('d-none');
        if(user.rol === 'gerente') renderGerente();
        else if(user.rol === 'mesero') renderMesero();
        else renderReservaCliente();
    } else {
        document.getElementById('btn-logout').classList.add('d-none');
        window.renderLanding();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);
window.renderLanding();
