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
let carrito = [];

// --- VISTAS PÚBLICAS ---
window.renderLanding = () => {
    document.getElementById('main-content').innerHTML = `
        <section class="hero-section text-white">
            <div>
                <h1 class="display-3 fw-bold">Sabores del <span style="color:var(--accent-gold)">Olimpo</span></h1>
                <p class="lead">La experiencia griega más auténtica de Ecatepec</p>
                <button class="btn btn-primary btn-lg mt-3" onclick="window.showAuth()">RESERVAR AHORA</button>
            </div>
        </section>
        <section class="container my-5">
            <div class="row g-4">
                <div class="col-md-6">
                    <div class="glass-card promo-card">
                        <h3 style="color:var(--accent-gold)">Promoción del Mes</h3>
                        <p>2x1 en Gyros clásicos todos los martes y jueves.</p>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="glass-card promo-card">
                        <h3 style="color:var(--accent-gold)">Noche de Meze</h3>
                        <p>Vino griego de cortesía en reservaciones de más de 4 personas.</p>
                    </div>
                </div>
            </div>
        </section>`;
};

window.renderUbicacion = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5 text-center">
            <h2 class="mb-4" style="color:var(--accent-gold)">Encuéntranos</h2>
            <div class="glass-card p-0 overflow-hidden">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5423.82!2d-99.03!3d19.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDM2JzAwLjAiTiA5OcKwMDEnNDguMCJX!5e0!3m2!1ses!2smx!4v1700000000000!5m2!1ses!2smx" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
            </div>
            <p class="mt-3">Av. Central, Ecatepec de Morelos, Edo. Méx.</p>
        </div>`;
};

// --- AUTENTICACIÓN ---
window.showAuth = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="row justify-content-center"><div class="col-md-5">
            <div class="glass-card">
                <h3 class="text-center mb-4" style="color:var(--accent-gold)">Bienvenido</h3>
                <input id="auth-e" class="form-control mb-2" placeholder="Correo">
                <input id="auth-p" type="password" class="form-control mb-3" placeholder="Contraseña">
                <button onclick="window.handleLogin()" class="btn btn-primary w-100 mb-2">Entrar</button>
                <button onclick="window.showRegister()" class="btn btn-outline-gold w-100 btn-sm">Registrarme</button>
            </div>
        </div></div></div>`;
};

window.handleLogin = async () => {
    const e = document.getElementById('auth-e').value;
    const p = document.getElementById('auth-p').value;
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Credenciales inválidas"); }
};

// --- SISTEMA DE RESERVAS (CLIENTE) ---
async function renderCliente() {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="glass-card">
            <h3 style="color:var(--accent-gold)">Realizar Reservación</h3>
            <div class="row mt-4">
                <div class="col-md-4">
                    <label>Fecha:</label><input id="res-f" type="date" class="form-control mb-3">
                    <label>Hora:</label><select id="res-h" class="form-control mb-4">
                        <option>14:00</option><option>16:00</option><option>20:00</option>
                    </select>
                </div>
                <div class="col-md-8">
                    <label>Selecciona tu Mesa:</label>
                    <div id="grid-reserva" class="grid-mesas mt-2"></div>
                </div>
            </div>
            <button id="btn-confirmar-res" class="btn btn-primary w-100 mt-4 d-none" onclick="window.saveReserva()">Confirmar Reservación</button>
        </div></div>`;

    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-reserva');
        grid.innerHTML = "";
        const ocupadas = {}; snap.forEach(d => ocupadas[d.id] = true);
        for(let i=1; i<=10; i++) {
            const btn = document.createElement('button');
            btn.className = `btn m-btn ${ocupadas[i] ? 'ocupada' : ''}`;
            btn.innerText = `M${i}`;
            btn.disabled = ocupadas[i];
            btn.onclick = () => { mesaActiva = i; document.getElementById('btn-confirmar-res').classList.remove('d-none'); };
            grid.appendChild(btn);
        }
    });
}

window.saveReserva = async () => {
    const f = document.getElementById('res-f').value;
    const h = document.getElementById('res-h').value;
    if(!f || !mesaActiva) return alert("Completa los datos");
    await setDoc(doc(db, "mesas_activas", mesaActiva.toString()), {
        cliente: auth.currentUser.email,
        fecha: f,
        hora: h,
        estado: "reservada",
        inicio: new Date().getTime()
    });
    alert("Reservación confirmada. Te esperamos.");
    location.reload();
};

// --- SISTEMA DE TRABAJO (MESERO) ---
async function renderMesero() {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="row">
            <div class="col-md-4"><div class="glass-card"><h4>Mesas</h4><div id="grid-mesas-m" class="grid-mesas"></div></div></div>
            <div id="area-atencion" class="col-md-8 d-none">
                <div class="glass-card">
                    <h4>Mesa <span id="m-atend"></span></h4>
                    <ul id="lista-p" class="list-group mb-3"></ul>
                    <button class="btn btn-primary w-100" onclick="window.cT()">Generar Ticket</button>
                </div>
            </div>
        </div></div>`;

    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-mesas-m');
        grid.innerHTML = "";
        snap.forEach(d => {
            const m = d.data();
            const btn = document.createElement('button');
            const soyYo = m.mesero_asignado === auth.currentUser.email;
            btn.className = `btn m-btn ${m.estado === 'atendiendo' && !soyYo ? 'atendida' : 'ocupada'}`;
            btn.innerText = `M${d.id}`;
            btn.onclick = () => window.atenderMesa(d.id, m);
            grid.appendChild(btn);
        });
    });
}

window.atenderMesa = async (id, data) => {
    if(data.mesero_asignado && data.mesero_asignado !== auth.currentUser.email) return alert("Mesa asignada a otro mesero.");
    mesaActiva = id;
    await updateDoc(doc(db, "mesas_activas", id), { mesero_asignado: auth.currentUser.email, estado: 'atendiendo' });
    document.getElementById('area-atencion').classList.remove('d-none');
    document.getElementById('m-atend').innerText = id;
};

onAuthStateChanged(auth, async (u) => {
    if(u) {
        const d = await getDoc(doc(db, "usuarios", u.uid));
        const user = d.data();
        document.getElementById('btn-logout').classList.remove('d-none');
        if(user.rol === 'cliente') renderCliente();
        else if(user.rol === 'mesero') renderMesero();
        else renderGerente();
    } else { renderLanding(); }
});

window.renderLanding();
