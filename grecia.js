import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, onSnapshot, serverTimestamp, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

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

// --- INICIO COMPLETO (LANDING PAGE) ---
window.renderLanding = async () => {
    // 1. Banner e Interacción inicial
    let html = `
        <section class="hero-section text-center text-white d-flex align-items-center justify-content-center">
            <div>
                <h1 class="display-3 fw-bold">El Oráculo <span style="color:#c5a059">del Sabor</span></h1>
                <p class="lead">La mejor experiencia gastronómica de Grecia en Ecatepec</p>
                <div class="d-grid gap-2 d-sm-flex justify-content-sm-center mt-4">
                    <button class="btn btn-primary btn-lg px-5" onclick="window.showAuth()">RESERVAR AHORA</button>
                    <button class="btn btn-outline-gold btn-lg px-5" onclick="window.verificarPersonal()">SOY PERSONAL</button>
                </div>
            </div>
        </section>

        <section class="container my-5">
            <h2 class="text-center mb-4" style="color:#c5a059">Promociones del Mes</h2>
            <div class="row g-4 text-center">
                <div class="col-md-6">
                    <div class="glass-card promo-card h-100">
                        <h3 style="color:#c5a059">Gyros 2x1</h3>
                        <p>Aprovecha todos los martes y jueves en nuestra sucursal.</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="glass-card promo-card h-100">
                        <h3 style="color:#c5a059">Ouzo de Bienvenida</h3>
                        <p>En tu primera reservación, la casa invita el primer trago tradicional.</p>
                    </div>
                </div>
            </div>
        </section>`;

    // 2. Sección de Menú (Vista rápida)
    html += `<section class="container my-5">
                <h2 class="text-center mb-4" style="color:#c5a059">Explora nuestro Menú</h2>
                <div id="menu-previo" class="row g-4"></div>
            </section>`;

    // 3. Sección de Ubicación
    html += `
        <section class="container my-5 text-center">
            <h2 class="mb-4" style="color:#c5a059">Nuestra Ubicación</h2>
            <div class="glass-card p-0 overflow-hidden mb-3">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15038.972352877524!2d-99.0306351!3d19.5419!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1f06f5223079f%3A0x6b2454a8b79b8830!2sEcatepec%20de%20Morelos%2C%20M%C3%A9x.!5e0!3m2!1ses-419!2smx!4v1713900000000" width="100%" height="350" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
            </div>
            <p class="lead">Av. Central s/n, Ecatepec de Morelos, Edo. Méx.</p>
        </section>`;

    document.getElementById('main-content').innerHTML = html;
    window.cargarMenuPrevio();
};

window.cargarMenuPrevio = async () => {
    const snap = await getDocs(collection(db, "menu"));
    const container = document.getElementById('menu-previo');
    if(!container) return;
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

// --- SEGURIDAD Y AUTH ---
window.verificarPersonal = () => {
    const pass = prompt("Ingrese la contraseña de acceso:");
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
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Datos incorrectos"); }
};

window.showRegister = () => {
    document.getElementById('auth-box').innerHTML = `
        <h3 class="text-center mb-4" style="color:#c5a059">Nuevo Cliente</h3>
        <input id="reg-n" class="form-control mb-2" placeholder="Nombre completo">
        <input id="reg-e" class="form-control mb-2" placeholder="Correo electrónico">
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

// --- PERFILES ---
window.renderGerente = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5">
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="glass-card">
                        <h4 style="color:#c5a059">Registrar Mesero</h4>
                        <input id="m-nom" class="form-control mb-2" placeholder="Nombre">
                        <input id="m-ema" class="form-control mb-2" placeholder="Correo">
                        <input id="m-pas" type="password" class="form-control mb-3" placeholder="Contraseña">
                        <button onclick="window.registrarMesero()" class="btn btn-primary w-100">DAR DE ALTA</button>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="glass-card">
                        <h4 style="color:#c5a059">Agregar al Menú</h4>
                        <input id="p-nom" class="form-control mb-2" placeholder="Platillo">
                        <input id="p-pre" type="number" class="form-control mb-2" placeholder="Precio">
                        <input id="p-img" class="form-control mb-3" placeholder="URL Imagen">
                        <button onclick="window.agregarPlatillo()" class="btn btn-primary w-100">GUARDAR</button>
                    </div>
                </div>
            </div>
        </div>`;
};

window.registrarMesero = async () => {
    const n = document.getElementById('m-nom').value;
    const e = document.getElementById('m-ema').value;
    const p = document.getElementById('m-pas').value;
    try {
        const tempApp = initializeApp(firebaseConfig, "temp");
        const res = await createUserWithEmailAndPassword(getAuth(tempApp), e, p);
        await setDoc(doc(db, "usuarios", res.user.uid), { nombre: n, correo: e, rol: "mesero" });
        alert("Mesero registrado con éxito");
        location.reload();
    } catch (err) { alert(err.message); }
};

window.agregarPlatillo = async () => {
    const n = document.getElementById('p-nom').value;
    const p = document.getElementById('p-pre').value;
    const i = document.getElementById('p-img').value;
    await addDoc(collection(db, "menu"), { nombre: n, precio: p, imagen: i });
    alert("Platillo agregado al menú");
};

window.renderReservaCliente = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="glass-card">
            <h2 class="text-center mb-4" style="color:#c5a059">Reserva tu Mesa</h2>
            <div class="row">
                <div class="col-md-5">
                    <input id="res-f" type="date" class="form-control mb-3" min="${new Date().toISOString().split('T')[0]}">
                    <select id="res-h" class="form-control mb-4"><option>14:00</option><option>16:00</option><option>18:00</option><option>20:00</option></select>
                </div>
                <div class="col-md-7 text-center">
                    <div id="grid-reserva" class="grid-mesas"></div>
                    <button id="btn-confirmar-res" class="btn btn-primary w-100 mt-4 d-none" onclick="window.saveReserva()">CONFIRMAR Y OBTENER TICKET</button>
                </div>
            </div>
        </div></div>`;
    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-reserva');
        if(!grid) return; grid.innerHTML = "";
        const ocupadas = {}; snap.forEach(d => ocupadas[d.id] = true);
        for(let i=1; i<=12; i++){
            const btn = document.createElement('button');
            btn.className = `btn m-btn ${ocupadas[i] ? 'ocupada' : ''}`;
            btn.innerText = `M${i}`;
            btn.disabled = ocupadas[i];
            btn.onclick = () => { mesaActiva = i; document.getElementById('btn-confirmar-res').classList.remove('d-none'); };
            grid.appendChild(btn);
        }
    });
};

window.saveReserva = async () => {
    const f = document.getElementById('res-f').value;
    const h = document.getElementById('res-h').value;
    const user = auth.currentUser.email;
    await setDoc(doc(db, "mesas_activas", mesaActiva.toString()), { cliente: user, fecha: f, hora: h, estado: "reservada" });
    document.getElementById('ticket-detalle').innerHTML = `<p><b>Mesa:</b> ${mesaActiva}</p><p><b>Fecha:</b> ${f}</p><p><b>Hora:</b> ${h}</p>`;
    new bootstrap.Modal('#modalTicket').show();
};

window.renderMesero = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5">
            <h2 class="text-center" style="color:#c5a059">Atención de Mesas</h2>
            <div class="row">
                <div class="col-md-4"><div class="glass-card"><h4>Mesas</h4><div id="grid-mesas-m" class="grid-mesas"></div></div></div>
                <div id="area-atencion" class="col-md-8 d-none">
                    <div class="glass-card text-center">
                        <h3>Mesa <span id="m-atend"></span></h3>
                        <p id="info-cliente"></p>
                        <button class="btn btn-primary w-100" onclick="window.compartirTicket()">CERRAR Y ENVIAR TICKET</button>
                    </div>
                </div>
            </div>
        </div>`;
    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-mesas-m');
        if(!grid) return; grid.innerHTML = "";
        snap.forEach(d => {
            const m = d.data();
            const soyYo = m.mesero_asignado === auth.currentUser.email;
            const btn = document.createElement('button');
            btn.className = `btn m-btn ${soyYo ? 'atendida' : 'ocupada'}`;
            btn.innerText = `M${d.id}`;
            btn.onclick = () => window.atenderMesa(d.id, m);
            grid.appendChild(btn);
        });
    });
};

window.atenderMesa = async (id, data) => {
    if(!data.mesero_asignado) await updateDoc(doc(db, "mesas_activas", id), { mesero_asignado: auth.currentUser.email, estado: 'atendiendo' });
    else if(data.mesero_asignado !== auth.currentUser.email) return alert("Mesa de otro mesero");
    mesaActiva = id;
    document.getElementById('area-atencion').classList.remove('d-none');
    document.getElementById('m-atend').innerText = id;
    document.getElementById('info-cliente').innerText = "Atendiendo a: " + data.cliente;
};

window.compartirTicket = () => {
    const ticket = document.getElementById('ticket-captura');
    html2canvas(ticket).then(canvas => {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'Ticket_Oraculo.png', { type: 'image/png' });
            if (navigator.share) await navigator.share({ files: [file], title: 'Ticket Oráculo' });
            else {
                const link = document.createElement('a');
                link.download = 'Ticket_Oraculo.png';
                link.href = URL.createObjectURL(blob);
                link.click();
            }
        });
    });
};

onAuthStateChanged(auth, async (u) => {
    if(u) {
        const d = await getDoc(doc(db, "usuarios", u.uid));
        const user = d.data();
        document.getElementById('btn-logout').classList.remove('d-none');
        document.getElementById('nav-public').classList.add('d-none');
        if(user.rol === 'gerente') renderGerente();
        else if(user.rol === 'mesero') renderMesero();
        else renderReservaCliente();
    } else {
        document.getElementById('btn-logout').classList.add('d-none');
        document.getElementById('nav-public').classList.remove('d-none');
        window.renderLanding();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);
window.renderLanding();
