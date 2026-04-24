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

window.renderLanding = () => {
    document.getElementById('main-content').innerHTML = `
        <section class="hero-section">
            <div class="container text-center text-white">
                <h1 class="display-3 fw-bold">El Oráculo <span style="color:#c5a059">del Sabor</span></h1>
                <p class="lead">Tradición Griega en Ecatepec</p>
                <button class="btn btn-primary btn-lg px-5 mt-3" onclick="window.showAuth()">RESERVAR MESA</button>
            </div>
        </section>
        <section class="container my-5">
            <div class="row g-4">
                <div class="col-md-6"><div class="glass-card"><h3>Gyros 2x1</h3><p>Martes y Jueves.</p></div></div>
                <div class="col-md-6"><div class="glass-card"><h3>Cortesía</h3><p>Ouzo de bienvenida en tu primera reserva.</p></div></div>
            </div>
        </section>`;
};

window.renderUbicacion = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5 text-center">
            <h2 class="mb-4" style="color:#c5a059">Ubicación</h2>
            <div class="glass-card p-0 overflow-hidden mb-3">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3759.123456789!2d-99.0333!3d19.5333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDMyJzE5LjgiTiA5OcKwMDInMDAuMCJX!5e0!3m2!1ses!2smx!4v1620000000000" width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
            </div>
            <p>Av. Central, Ecatepec de Morelos, Edo. Méx.</p>
        </div>`;
};

window.renderMenuPublico = async () => {
    const snap = await getDocs(collection(db, "menu"));
    let html = '<div class="container my-5"><h2 class="text-center mb-4" style="color:#c5a059">Menú</h2><div class="row g-4">';
    snap.forEach(doc => {
        const p = doc.data();
        html += `
            <div class="col-md-4">
                <div class="glass-card text-center">
                    <img src="${p.imagen}" class="img-fluid rounded mb-3" style="height:200px; width:100%; object-fit:cover;">
                    <h4>${p.nombre}</h4>
                    <h5 style="color:#c5a059">$${p.precio}</h5>
                </div>
            </div>`;
    });
    html += '</div></div>';
    document.getElementById('main-content').innerHTML = html;
};

window.showAuth = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="row justify-content-center"><div class="col-md-5">
            <div class="glass-card" id="auth-box">
                <h3 class="text-center mb-4" style="color:#c5a059">Acceso</h3>
                <input id="auth-e" class="form-control mb-2" placeholder="Correo">
                <input id="auth-p" type="password" class="form-control mb-3" placeholder="Contraseña">
                <button onclick="window.handleLogin()" class="btn btn-primary w-100 mb-2">Entrar</button>
                <button onclick="window.showRegister()" class="btn btn-outline-gold w-100 btn-sm">Crear Cuenta de Cliente</button>
            </div>
        </div></div></div>`;
};

window.showRegister = () => {
    document.getElementById('auth-box').innerHTML = `
        <h3 class="text-center mb-4" style="color:#c5a059">Nuevo Cliente</h3>
        <input id="reg-n" class="form-control mb-2" placeholder="Nombre completo">
        <input id="reg-e" class="form-control mb-2" placeholder="Correo electrónico">
        <input id="reg-p" type="password" class="form-control mb-3" placeholder="Contraseña (mín. 6)">
        <button onclick="window.handleRegister()" class="btn btn-primary w-100 mb-2">Registrarme</button>
        <button onclick="window.showAuth()" class="btn btn-link w-100 text-white text-decoration-none small">Ya tengo cuenta</button>`;
};

window.handleRegister = async () => {
    const n = document.getElementById('reg-n').value;
    const e = document.getElementById('reg-e').value;
    const p = document.getElementById('reg-p').value;
    if(!n || !e || p.length < 6) return alert("Datos incompletos");
    try {
        const res = await createUserWithEmailAndPassword(auth, e, p);
        await setDoc(doc(db, "usuarios", res.user.uid), { nombre: n, correo: e, rol: "cliente" });
    } catch (err) { alert(err.message); }
};

window.handleLogin = async () => {
    const e = document.getElementById('auth-e').value;
    const p = document.getElementById('auth-p').value;
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Error de acceso"); }
};

window.renderReservaCliente = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="glass-card">
            <h2 class="text-center mb-4" style="color:#c5a059">Reservar Mesa</h2>
            <div class="row">
                <div class="col-md-5 mb-4">
                    <label>Fecha:</label><input id="res-f" type="date" class="form-control mb-3" min="${new Date().toISOString().split('T')[0]}">
                    <label>Hora:</label><select id="res-h" class="form-control mb-4">
                        <option>14:00</option><option>16:00</option><option>18:00</option><option>20:00</option>
                    </select>
                </div>
                <div class="col-md-7">
                    <div id="grid-reserva" class="grid-mesas p-3 border-gold rounded"></div>
                    <button id="btn-confirmar-res" class="btn btn-primary w-100 mt-4 d-none" onclick="window.saveReserva()">CONFIRMAR RESERVA</button>
                </div>
            </div>
        </div></div>`;

    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-reserva');
        if(!grid) return;
        grid.innerHTML = "";
        const ocupadas = {};
        snap.forEach(d => ocupadas[d.id] = d.data());
        for(let i=1; i<=12; i++) {
            const btn = document.createElement('button');
            btn.className = `btn m-btn ${ocupadas[i] ? 'ocupada' : ''} ${mesaActiva == i ? 'seleccionada' : ''}`;
            btn.innerText = `M${i}`;
            btn.disabled = !!ocupadas[i];
            btn.onclick = () => {
                mesaActiva = i;
                document.querySelectorAll('.m-btn').forEach(b => b.classList.remove('seleccionada'));
                btn.classList.add('seleccionada');
                document.getElementById('btn-confirmar-res').classList.remove('d-none');
            };
            grid.appendChild(btn);
        }
    });
};

window.saveReserva = async () => {
    const f = document.getElementById('res-f').value;
    const h = document.getElementById('res-h').value;
    if(!f || !mesaActiva) return alert("Selecciona fecha y mesa");
    await setDoc(doc(db, "mesas_activas", mesaActiva.toString()), {
        cliente: auth.currentUser.email,
        fecha: f,
        hora: h,
        estado: "reservada",
        inicio: new Date().getTime()
    });
    alert("Reserva guardada correctamente");
    location.reload();
};

window.renderMesero = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="row">
            <div class="col-md-4"><div class="glass-card"><h4>Mesas</h4><div id="grid-mesas-m" class="grid-mesas"></div></div></div>
            <div id="area-atencion" class="col-md-8 d-none">
                <div class="glass-card">
                    <h4>Atendiendo Mesa <span id="m-atend"></span></h4>
                    <ul id="lista-p" class="list-group mb-3 text-white"></ul>
                    <button class="btn btn-primary w-100" onclick="window.cT()">Cerrar y Compartir Ticket</button>
                </div>
            </div>
        </div></div>`;

    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-mesas-m');
        if(!grid) return;
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
};

window.atenderMesa = async (id, data) => {
    if(data.mesero_asignado && data.mesero_asignado !== auth.currentUser.email) return alert("Mesa ocupada");
    mesaActiva = id;
    await updateDoc(doc(db, "mesas_activas", id), { mesero_asignado: auth.currentUser.email, estado: 'atendiendo' });
    document.getElementById('area-atencion').classList.remove('d-none');
    document.getElementById('m-atend').innerText = id;
};

window.compartirTicket = () => {
    const ticket = document.getElementById('ticket-captura');
    html2canvas(ticket).then(canvas => {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'Ticket_Oraculo.png', { type: 'image/png' });
            if (navigator.share) {
                try {
                    await navigator.share({ files: [file], title: 'Ticket El Oráculo' });
                } catch (e) { console.log(e); }
            } else {
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
        if(user.rol === 'cliente') window.renderReservaCliente();
        else window.renderMesero();
    } else {
        document.getElementById('btn-logout').classList.add('d-none');
        document.getElementById('nav-public').classList.remove('d-none');
        window.renderLanding();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);
window.renderLanding();
