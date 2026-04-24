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

window.renderLanding = () => {
    document.getElementById('main-content').innerHTML = `
        <section class="hero-section text-center text-white d-flex align-items-center justify-content-center">
            <div>
                <h1 class="display-3 fw-bold">El Oráculo <span style="color:#c5a059">del Sabor</span></h1>
                <p class="lead">Tradición Griega en Ecatepec</p>
                <div class="d-grid gap-2 d-sm-flex justify-content-sm-center">
                    <button class="btn btn-primary btn-lg px-5" onclick="window.showAuth()">RESERVAR MESA</button>
                    <button class="btn btn-outline-gold btn-lg px-5" onclick="window.verificarPersonal()">SOY PERSONAL</button>
                </div>
            </div>
        </section>`;
};

window.verificarPersonal = () => {
    const pass = prompt("Ingrese la contraseña de acceso al personal:");
    if (pass === "Oraculo Del Sabor") {
        window.showAuth(true);
    } else {
        alert("Contraseña incorrecta");
    }
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

window.showRegister = () => {
    document.getElementById('auth-box').innerHTML = `
        <h3 class="text-center mb-4" style="color:#c5a059">Registro</h3>
        <input id="reg-n" class="form-control mb-2" placeholder="Nombre completo">
        <input id="reg-e" class="form-control mb-2" placeholder="Correo electrónico">
        <input id="reg-p" type="password" class="form-control mb-3" placeholder="Contraseña (mín. 6)">
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

window.handleLogin = async () => {
    const e = document.getElementById('auth-e').value;
    const p = document.getElementById('auth-p').value;
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Credenciales incorrectas"); }
};

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
                        <input id="p-nom" class="form-control mb-2" placeholder="Nombre Platillo">
                        <input id="p-pre" type="number" class="form-control mb-2" placeholder="Precio">
                        <input id="p-img" class="form-control mb-3" placeholder="URL Imagen">
                        <button onclick="window.agregarPlatillo()" class="btn btn-primary w-100">GUARDAR PLATILLO</button>
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
        alert("Mesero registrado");
        location.reload();
    } catch (err) { alert(err.message); }
};

window.agregarPlatillo = async () => {
    const n = document.getElementById('p-nom').value;
    const p = document.getElementById('p-pre').value;
    const i = document.getElementById('p-img').value;
    await addDoc(collection(db, "menu"), { nombre: n, precio: p, imagen: i });
    alert("Platillo agregado");
};

window.renderReservaCliente = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="glass-card">
            <h2 class="text-center mb-4" style="color:#c5a059">Tu Reservación</h2>
            <div class="row">
                <div class="col-md-5">
                    <input id="res-f" type="date" class="form-control mb-3" min="${new Date().toISOString().split('T')[0]}">
                    <select id="res-h" class="form-control mb-4"><option>14:00</option><option>18:00</option><option>21:00</option></select>
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
    await setDoc(doc(db, "mesas_activas", mesaActiva.toString()), { 
        cliente: user, fecha: f, hora: h, estado: "reservada" 
    });
    
    document.getElementById('ticket-detalle').innerHTML = `
        <p><b>Cliente:</b> ${user}</p>
        <p><b>Mesa:</b> ${mesaActiva}</p>
        <p><b>Fecha:</b> ${f}</p>
        <p><b>Hora:</b> ${h}</p>
        <p class="small text-center mt-3">Muestre este ticket al llegar.</p>`;
    
    new bootstrap.Modal('#modalTicket').show();
};

window.renderMesero = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5">
            <h2 class="text-center" style="color:#c5a059">Turno de Atención</h2>
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
            const btn = document.createElement('button');
            const soyYo = m.mesero_asignado === auth.currentUser.email;
            btn.className = `btn m-btn ${soyYo ? 'atendida' : 'ocupada'}`;
            btn.innerText = `M${d.id}`;
            btn.onclick = () => window.atenderMesa(d.id, m);
            grid.appendChild(btn);
        });
    });
};

window.atenderMesa = async (id, data) => {
    if(!data.mesero_asignado) {
        await updateDoc(doc(db, "mesas_activas", id), { mesero_asignado: auth.currentUser.email, estado: 'atendiendo' });
    } else if(data.mesero_asignado !== auth.currentUser.email) {
        return alert("Esta mesa ya la atiende otro mesero");
    }
    mesaActiva = id;
    document.getElementById('area-atencion').classList.remove('d-none');
    document.getElementById('m-atend').innerText = id;
    document.getElementById('info-cliente').innerText = "Cliente: " + data.cliente;
};

window.compartirTicket = () => {
    const ticket = document.getElementById('ticket-captura');
    html2canvas(ticket).then(canvas => {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'Comprobante.png', { type: 'image/png' });
            if (navigator.share) {
                await navigator.share({ files: [file], title: 'El Oráculo del Sabor' });
            } else {
                const link = document.createElement('a');
                link.download = 'Comprobante_Oraculo.png';
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
