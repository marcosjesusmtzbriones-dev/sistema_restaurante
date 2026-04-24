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
                <button class="btn btn-primary btn-lg px-5 mt-3" onclick="window.showAuth()">INGRESAR AL SISTEMA</button>
            </div>
        </section>`;
};

window.showAuth = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="row justify-content-center"><div class="col-md-5">
            <div class="glass-card" id="auth-box">
                <h3 class="text-center mb-4" style="color:#c5a059">Iniciar Sesión</h3>
                <input id="auth-e" class="form-control mb-2" placeholder="Correo (Mesero o Cliente)">
                <input id="auth-p" type="password" class="form-control mb-3" placeholder="Contraseña">
                <button onclick="window.handleLogin()" class="btn btn-primary w-100 mb-3">ENTRAR</button>
                <hr style="border-color: #c5a059">
                <button onclick="window.showRegister()" class="btn btn-outline-gold w-100 btn-sm">¿Eres cliente nuevo? Regístrate</button>
            </div>
        </div></div></div>`;
};

window.handleLogin = async () => {
    const e = document.getElementById('auth-e').value;
    const p = document.getElementById('auth-p').value;
    try { 
        await signInWithEmailAndPassword(auth, e, p); 
        // No redirigimos manualmente, onAuthStateChanged lo hará por nosotros
    } catch { 
        alert("Correo o contraseña incorrectos"); 
    }
};

window.renderMesero = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5">
            <div class="row">
                <div class="col-md-12 mb-4 text-center">
                    <h2 style="color:#c5a059">Panel de Meseros - Turno Activo</h2>
                    <p>Selecciona una mesa para gestionar el pedido o cerrar la cuenta.</p>
                </div>
                <div class="col-md-4">
                    <div class="glass-card">
                        <h4>Mapa de Mesas</h4>
                        <div id="grid-mesas-m" class="grid-mesas"></div>
                    </div>
                </div>
                <div id="area-atencion" class="col-md-8 d-none">
                    <div class="glass-card h-100">
                        <h3>Gestión Mesa <span id="m-atend" style="color:#c5a059"></span></h3>
                        <div id="detalle-orden" class="my-4 py-3 border-top border-bottom">
                            <p class="text-center text-muted">Cargando detalles del pedido...</p>
                        </div>
                        <button class="btn btn-primary w-100" onclick="window.compartirTicket()">GENERAR Y ENVIAR TICKET</button>
                    </div>
                </div>
            </div>
        </div>`;

    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-mesas-m');
        if(!grid) return;
        grid.innerHTML = "";
        snap.forEach(d => {
            const m = d.data();
            const btn = document.createElement('button');
            btn.className = `btn m-btn ocupada`; // En este caso todas las que están en la DB están ocupadas/reservadas
            btn.innerText = `M${d.id}`;
            btn.onclick = () => { 
                mesaActiva = d.id; 
                document.getElementById('area-atencion').classList.remove('d-none'); 
                document.getElementById('m-atend').innerText = d.id;
            };
            grid.appendChild(btn);
        });
    });
};

onAuthStateChanged(auth, async (u) => {
    if(u) {
        const d = await getDoc(doc(db, "usuarios", u.uid));
        const user = d.data();
        document.getElementById('btn-logout').classList.remove('d-none');
        document.getElementById('nav-public').classList.add('d-none');
        
        // Aquí es donde sucede la magia del inicio de turno
        if(user.rol === 'gerente') window.renderGerente();
        else if(user.rol === 'mesero') window.renderMesero();
        else window.renderReservaCliente();
    } else {
        document.getElementById('btn-logout').classList.add('d-none');
        document.getElementById('nav-public').classList.remove('d-none');
        window.renderLanding();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);
window.renderLanding();
