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
                <p class="lead">Tradición Griega en el corazón de Ecatepec</p>
                <button class="btn btn-primary btn-lg px-5 mt-3" onclick="window.showAuth()">HAZ UNA RESERVACIÓN</button>
            </div>
        </section>
        <section class="container my-5">
            <h2 class="text-center mb-4" style="color:#c5a059">Promociones Exclusivas</h2>
            <div class="row g-4">
                <div class="col-md-6"><div class="glass-card"><h3>Gyros 2x1</h3><p>Todos los martes en consumo local.</p></div></div>
                <div class="col-md-6"><div class="glass-card"><h3>Copa de Ouzo</h3><p>Cortesía al registrar tu primera reservación.</p></div></div>
            </div>
        </section>`;
};

window.renderUbicacion = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5 text-center">
            <h2 class="mb-4" style="color:#c5a059">Nuestra Ubicación</h2>
            <div class="glass-card p-0 overflow-hidden mb-3">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3759.123!2d-99.041!3d19.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDM2JzAwLjAiTiA5OcKwMDInMjcuNiJX!5e0!3m2!1ses!2smx!4v1650000000000" width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
            </div>
            <p>Av. Central s/n, Ecatepec de Morelos, Edo. Méx.</p>
        </div>`;
};

window.renderMenuPublico = async () => {
    const snap = await getDocs(collection(db, "menu"));
    let html = '<div class="container my-5"><h2 class="text-center mb-4" style="color:#c5a059">Nuestro Menú</h2><div class="row g-4">';
    snap.forEach(doc => {
        const p = doc.data();
        html += `
            <div class="col-md-4">
                <div class="glass-card text-center">
                    <img src="${p.imagen}" class="img-fluid rounded mb-3" style="height:200px; width:100%; object-fit:cover;">
                    <h4>${p.nombre}</h4>
                    <p class="small">${p.descripcion}</p>
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
                <h3 class="text-center mb-4" style="color:#c5a059">Acceso Clientes</h3>
                <input id="auth-e" class="form-control mb-2" placeholder="Correo">
                <input id="auth-p" type="password" class="form-control mb-3" placeholder="Contraseña">
                <button onclick="window.handleLogin()" class="btn btn-primary w-100 mb-2">Entrar</button>
                <button onclick="window.showRegister()" class="btn btn-outline-gold w-100 btn-sm">No tengo cuenta, registrarme</button>
            </div>
        </div></div></div>`;
};

window.showRegister = () => {
    document.getElementById('auth-box').innerHTML = `
        <h3 class="text-center mb-4" style="color:#c5a059">Nuevo Cliente</h3>
        <input id="reg-n" class="form-control mb-2" placeholder="Nombre completo">
        <input id="reg-e" class="form-control mb-2" placeholder="Correo electrónico">
        <input id="reg-p" type="password" class="form-control mb-3" placeholder="Contraseña (mín. 6)">
        <button onclick="window.handleRegister()" class="btn btn-primary w-100 mb-2">Crear Cuenta</button>
        <button onclick="window.showAuth()" class="btn btn-link w-100 text-white text-decoration-none small">Volver al Login</button>`;
};

window.handleRegister = async () => {
    const n = document.getElementById('reg-n').value;
    const e = document.getElementById('reg-e').value;
    const p = document.getElementById('reg-p').value;
    if(!n || !e || p.length < 6) return alert("Verifica los datos");
    try {
        const res = await createUserWithEmailAndPassword(auth, e, p);
        await setDoc(doc(db, "usuarios", res.user.uid), { nombre: n, correo: e, rol: "cliente" });
    } catch (err) { alert("Error: " + err.message); }
};

window.handleLogin = async () => {
    const e = document.getElementById('auth-e').value;
    const p = document.getElementById('auth-p').value;
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Error al entrar"); }
};

window.compartirTicket = () => {
    const ticket = document.getElementById('ticket-captura');
    html2canvas(ticket).then(canvas => {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'Ticket_Oraculo.png', { type: 'image/png' });
            if (navigator.share) {
                try {
                    await navigator.share({ files: [file], title: 'Tu Ticket del Oráculo' });
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
        if(user.rol === 'cliente') renderReservaCliente();
        else renderMesero();
    } else {
        document.getElementById('btn-logout').classList.add('d-none');
        document.getElementById('nav-public').classList.remove('d-none');
        window.renderLanding();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);
window.renderLanding();
