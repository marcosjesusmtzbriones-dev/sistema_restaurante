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

window.renderLanding = async () => {
    let html = `
        <section class="hero-section text-center text-white d-flex align-items-center justify-content-center">
            <div>
                <h1 class="display-3 fw-bold">El Oráculo <span style="color:#c5a059">del Sabor</span></h1>
                <p class="lead">Tradición Griega en Ecatepec</p>
                <div class="d-grid gap-2 d-sm-flex justify-content-sm-center mt-4">
                    <button class="btn btn-primary btn-lg px-5" onclick="window.showAuth()">RESERVAR MESA</button>
                    <button class="btn btn-outline-gold btn-lg px-5" onclick="window.verificarPersonal()">SOY PERSONAL</button>
                </div>
            </div>
        </section>
        <section class="container my-5">
            <h2 class="text-center mb-4" style="color:#c5a059">Promociones</h2>
            <div class="row g-4 text-center">
                <div class="col-md-6"><div class="glass-card promo-card h-100"><h3>Gyros 2x1</h3><p>Martes y Jueves.</p></div></div>
                <div class="col-md-6"><div class="glass-card promo-card h-100"><h3>Ouzo de Bienvenida</h3><p>En tu primera reserva.</p></div></div>
            </div>
        </section>
        <section class="container my-5"><h2 class="text-center mb-4" style="color:#c5a059">Menú</h2><div id="menu-previo" class="row g-4"></div></section>
        <section class="container my-5 text-center">
            <h2 class="mb-4" style="color:#c5a059">Ubicación</h2>
            <div class="glass-card p-0 overflow-hidden mb-3">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d585.34!2d-99.026!3d19.538" width="100%" height="350" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
            </div>
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

window.renderMenuPublico = async () => {
    document.getElementById('main-content').innerHTML = `<div class="container my-5"><h2 class="text-center mb-4" style="color:#c5a059">Nuestra Carta</h2><div id="menu-full" class="row g-4"></div></div>`;
    const snap = await getDocs(collection(db, "menu"));
    const container = document.getElementById('menu-full');
    snap.forEach(doc => {
        const p = doc.data();
        container.innerHTML += `<div class="col-md-4"><div class="glass-card text-center"><img src="${p.imagen}" class="img-fluid rounded mb-3" style="height:200px; width:100%; object-fit:cover;"><h4>${p.nombre}</h4><h5 style="color:#c5a059">$${p.precio}</h5></div></div>`;
    });
};

window.renderUbicacion = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5 text-center">
            <h2 class="mb-4" style="color:#c5a059">Ubicación</h2>
            <div class="glass-card p-0 overflow-hidden mb-3">
                <iframe src="
