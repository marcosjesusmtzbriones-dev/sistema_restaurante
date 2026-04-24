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

window.showAuth = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5"><div class="row justify-content-center"><div class="col-md-5">
            <div class="glass-card" id="auth-box">
                <h3 class="text-center mb-4" style="color:#c5a059">Iniciar Sesión</h3>
                <input id="auth-e" class="form-control mb-2" placeholder="Correo">
                <input id="auth-p" type="password" class="form-control mb-3" placeholder="Contraseña">
                <button onclick="window.handleLogin()" class="btn btn-primary w-100 mb-2">Entrar</button>
                <hr>
                <p class="text-center small">¿No tienes cuenta?</p>
                <button onclick="window.showRegister()" class="btn btn-outline-gold w-100">Crear Cuenta de Cliente</button>
            </div>
        </div></div></div>`;
};

window.showRegister = () => {
    document.getElementById('auth-box').innerHTML = `
        <h3 class="text-center mb-4" style="color:#c5a059">Registro Cliente</h3>
        <input id="reg-n" class="form-control mb-2" placeholder="Nombre completo">
        <input id="reg-e" class="form-control mb-2" placeholder="Correo electrónico">
        <input id="reg-p" type="password" class="form-control mb-3" placeholder="Contraseña (mínimo 6)">
        <button onclick="window.handleRegister()" class="btn btn-primary w-100 mb-2">Registrarme</button>
        <button onclick="window.showAuth()" class="btn btn-link w-100 text-gold text-decoration-none">Volver al Login</button>`;
};

window.handleRegister = async () => {
    const n = document.getElementById('reg-n').value;
    const e = document.getElementById('reg-e').value;
    const p = document.getElementById('reg-p').value;
    if(!n || !e || p.length < 6) return alert("Datos incompletos.");
    try {
        const res = await createUserWithEmailAndPassword(auth, e, p);
        await setDoc(doc(db, "usuarios", res.user.uid), { nombre: n, correo: e, rol: "cliente" });
        alert("¡Cuenta creada! Bienvenido.");
    } catch (err) { alert("Error: " + err.message); }
};

window.compartirTicket = () => {
    const ticket = document.getElementById('ticket-captura');
    html2canvas(ticket).then(canvas => {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'Ticket_Oraculo.png', { type: 'image/png' });
            if (navigator.share) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Ticket El Oráculo del Sabor',
                        text: 'Aquí tienes tu ticket de consumo.'
                    });
                } catch (err) { console.error("Error al compartir", err); }
            } else {
                const link = document.createElement('a');
                link.download = 'Ticket_Oraculo.png';
                link.href = URL.createObjectURL(blob);
                link.click();
            }
        });
    });
};

// ... Resto de funciones (handleLogin, renderMesero, etc) iguales ...
