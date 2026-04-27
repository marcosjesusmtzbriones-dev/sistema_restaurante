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
    :root { --gold: #c5a059; --dark-blue: #0a1118; }
    body { background: var(--dark-blue); }
    .text-gold { color: var(--gold) !important; }
    .btn-primary { background-color: var(--gold); border: none; color: black; font-weight: bold; }
    .btn-primary:hover { background-color: #b08d4a; color: white; }
    .btn-outline-gold { border: 2px solid var(--gold); color: var(--gold); background: transparent; }
    .btn-outline-gold:hover { background: var(--gold); color: black; }

    .glass-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(197, 160, 89, 0.3);
        border-radius: 15px;
        padding: 25px;
        transition: 0.3s;
    }

    .promo-card {
        border-radius: 20px;
        padding: 40px 20px;
        transition: 0.3s;
        border: 1px solid rgba(197,160,89,0.4);
    }

    .promo-card:hover {
        transform: translateY(-10px) scale(1.02);
        box-shadow: 0 10px 30px rgba(197,160,89,0.2);
    }
</style>`;

window.renderPromociones = () => {
    document.getElementById('main-content').innerHTML = ESTILOS_GLOBALES + `
    <div class="container py-5 text-center">
        <h2 class="text-gold display-4 mb-5">Promociones del Olimpo</h2>
        <div class="row g-4 justify-content-center">

            <div class="col-md-4">
                <div class="glass-card promo-card">
                    <h1 class="fw-bold text-white">2x1</h1>
                    <h4 class="text-gold">Gyros</h4>
                    <p class="text-white-50">Martes y Jueves</p>
                </div>
            </div>

            <div class="col-md-4">
                <div class="glass-card promo-card">
                    <h1 class="fw-bold text-white">15%</h1>
                    <h4 class="text-gold">Estudiantes</h4>
                    <p class="text-white-50">Credencial vigente</p>
                </div>
            </div>

            <div class="col-md-4">
                <div class="glass-card promo-card">
                    <h1 class="fw-bold text-white">FREE</h1>
                    <h4 class="text-gold">Baklava</h4>
                    <p class="text-white-50">En tu primera reserva</p>
                </div>
            </div>

        </div>

        <button class="btn btn-outline-gold mt-5" onclick="window.renderLanding()">Volver al inicio</button>
    </div>`;
};

onAuthStateChanged(auth, async (u) => {
    if(u) {
        const d = await getDoc(doc(db, "usuarios", u.uid));
        const user = d.data();
        nombreUsuarioActual = user.nombre;
        document.getElementById('btn-logout').classList.remove('d-none');
        window.renderPromociones();
    } else {
        document.getElementById('btn-logout').classList.add('d-none');
        window.renderPromociones();
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);
window.renderPromociones();
