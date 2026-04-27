import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, onSnapshot, deleteDoc, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const scriptPdf = document.createElement('script');
scriptPdf.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
document.head.appendChild(scriptPdf);

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
    .hero-section {
        background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), 
                    url('https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=2000&auto=format&fit=crop');
        background-size: cover; background-position: center; height: 90vh; display: flex; align-items: center; justify-content: center; color: white;
    }
    .text-gold { color: var(--gold) !important; }
    .btn-primary { background-color: var(--gold); border: none; color: black; font-weight: bold; }
    .btn-primary:hover { background-color: #b08d4a; color: white; }
    .btn-outline-gold { border: 2px solid var(--gold); color: var(--gold); background: transparent; }
    .btn-outline-gold:hover { background: var(--gold); color: black; }
    .glass-card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(197, 160, 89, 0.3); border-radius: 15px; padding: 25px; transition: 0.3s; }
    
    input, select, textarea { 
        background: rgba(10, 17, 24, 0.9) !important; 
        color: white !important; 
        border: 1px solid var(--gold) !important; 
    }
    
    #ticket-descarga { padding: 30px; background: white; color: black; font-family: 'Segoe UI', sans-serif; }
    .m-btn { aspect-ratio: 1; border: 1px solid var(--gold); color: white; transition: 0.3s; }
    .m-btn.ocupada { background: #ff6b6b; border: none; opacity: 0.6; }
    .m-btn.seleccionada { background: var(--gold); color: black; }
    .m-btn.atendida { background: #51cf66; border: none; }
    .grid-mesas { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px; }
</style>`;

window.descargarTicket = () => {
    const elemento = document.getElementById('ticket-descarga');
    const opt = {
        margin: 0.5,
        filename: 'Ticket-Reserva-Oraculo.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(elemento).save();
};

window.renderLanding = async () => {
    document.getElementById('main-content').innerHTML = ESTILOS_GLOBALES + `
        <section id="inicio" class="hero-section text-center">
            <div class="container">
                <h1 class="display-2 fw-bold mb-3">El Oráculo <span class="text-gold">del Sabor</span></h1>
                <p class="lead mb-5 fs-3">Auténtica Gastronomía Griega en Ecatepec</p>
                <div class="d-flex justify-content-center gap-3">
                    <button class="btn btn-primary btn-lg px-5" onclick="window.showAuth()">RESERVAR AHORA</button>
                    <button class="btn btn-outline-gold btn-lg px-5" onclick="window.verificarPersonal()">ACCESO STAFF</button>
                </div>
            </div>
        </section>

        <section id="menu-section" class="container py-5">
            <h2 class="text-center mb-5 text-gold display-4">Nuestro Menú</h2>
            <div id="menu-previo" class="row g-4"></div>
        </section>

        <section id="ubicacion-section" class="container py-5 text-center">
            <h2 class="mb-4 text-gold">Encuéntranos</h2>
            <p class="text-white-50">Multiplaza Aragón, Ecatepec de Morelos [cite: 16]</p>
            <div class="glass-card p-0 overflow-hidden" style="height: 450px;">
                <iframe 
                    width="100%" height="100%" style="border:0;" 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3760.373373268393!2d-99.03058862425032!3d19.52554768177437!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1fb17765103a7%3A0x67399f0e1f729221!2sMultiplaza%20Arag%C3%B3n!5e0!3m2!1ses-419!2smx!4v1714180000000!5m2!1ses-419!2smx" 
                    allowfullscreen="" loading="lazy">
                </iframe>
            </div>
        </section>`;
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
                    <img src="${p.imagen}" onerror="this.src='https://placehold.co/400x300/0a1118/c5a059?text=Menu'" class="img-fluid rounded mb-3" style="height:200px; width:100%; object-fit:cover;">
                    <h4 class="text-gold">${p.nombre}</h4>
                    <p class="small text-white-50"><i>${p.descripcion}</i></p>
                    <h5 class="fw-bold">$${p.precio}</h5>
                </div>
            </div>`;
    });
};

// ... (Las funciones de Auth, Mesero y Gerente se mantienen iguales a la versión anterior)

window.renderReservaCliente = async () => {
    document.getElementById('main-content').innerHTML = ESTILOS_GLOBALES + `
        <div class="container my-5">
            <div class="row g-4">
                <div class="col-lg-7">
                    <div class="glass-card text-center">
                        <h2 class="mb-4 text-gold">Reserva tu Mesa</h2>
                        <div class="row mb-3">
                            <div class="col-md-6"><input id="res-f" type="date" class="form-control" min="${new Date().toISOString().split('T')[0]}"></div>
                            <div class="col-md-6"><select id="res-h" class="form-select"><option value="" disabled selected>Hora</option><option>14:00</option><option>17:00</option><option>20:00</option></select></div>
                        </div>
                        <input id="res-p" type="number" class="form-control mb-4" placeholder="Personas" value="2">
                        <div id="grid-reserva" class="grid-mesas mb-4"></div>
                        <button id="btn-confirmar-res" class="btn btn-primary w-100 d-none" onclick="window.saveReserva()">CONFIRMAR RESERVA</button>
                    </div>
                </div>
                <div class="col-lg-5"><div class="glass-card"><h4 class="text-gold mb-3 text-center">Mi Historial [cite: 13]</h4><div id="lista-historial"></div></div></div>
            </div>
        </div>
        <div class="modal fade" id="modalTicket" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-white text-dark p-0">
                    <div id="ticket-descarga">
                        <div class="text-center">
                            <h5 class="fw-bold mb-1">El Oráculo del Sabor [cite: 2, 6]</h5>
                            <h3 class="fw-bold mb-3">TICKET DE RESERVA [cite: 8]</h3>
                            <div id="ticket-info"></div>
                            <h6 class="fw-bold mt-4" style="color: #d9534f;">¡TOMA CAPTURA DE PANTALLA! [cite: 12]</h6>
                            <p class="small mt-4 mb-0 text-muted">2026 El Oráculo del Sabor - Ecatepec, MX [cite: 16]</p>
                        </div>
                    </div>
                    <div class="p-3 bg-light d-flex gap-2">
                        <button class="btn btn-primary w-100" onclick="window.descargarTicket()">DESCARGAR PDF</button>
                        <button class="btn btn-dark w-100" data-bs-dismiss="modal">CERRAR</button>
                    </div>
                </div>
            </div>
        </div>`;

    // Lógica de mesas e historial...
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

    const q = query(collection(db, "historial_reservas"), where("cliente", "==", auth.currentUser.email), orderBy("fecha", "desc"));
    onSnapshot(q, (snap) => {
        const container = document.getElementById('lista-historial');
        if(!container) return; container.innerHTML = "";
        snap.forEach(d => {
            const r = d.data();
            container.innerHTML += `<div class="historial-item"><div class="d-flex justify-content-between"><div><b>Mesa ${r.mesa}-${r.fecha} | ${r.hora} [cite: 9, 10]</b><br><small>${r.personas} Personas [cite: 11]</small></div><span class="status-${r.estado}">${r.estado} [cite: 15]</span></div></div>`;
        });
    });
};

window.saveReserva = async () => {
    const f = document.getElementById('res-f').value;
    const h = document.getElementById('res-h').value;
    const p = document.getElementById('res-p').value;
    const data = { cliente: auth.currentUser.email, fecha: f, hora: h, personas: p, mesa: mesaActiva, estado: "confirmada", productos: [], total: 0 };
    await setDoc(doc(db, "mesas_activas", mesaActiva.toString()), data);
    await addDoc(collection(db, "historial_reservas"), data);
    
    document.getElementById('ticket-info').innerHTML = `
        <h2 class="fw-bold">Mesa ${mesaActiva} [cite: 9]</h2>
        <h4 class="mb-1">${f} - ${h} [cite: 10]</h4>
        <h5 class="fw-bold">${p} Personas [cite: 11]</h5>
    `;
    new bootstrap.Modal('#modalTicket').show();
};

// ... (Resto del código: Login, Staff, Mesero con comensales)
