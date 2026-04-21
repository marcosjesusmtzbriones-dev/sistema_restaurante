import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

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

let carrito = [];
let mesaActiva = null;

document.getElementById('btn-login').onclick = async () => {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try { await signInWithEmailAndPassword(auth, email, pass); } catch (e) { alert(e.message); }
};

document.getElementById('btn-logout').onclick = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docSnap = await getDoc(doc(db, "usuarios", user.uid));
        if (docSnap.exists()) { renderInterfaz(docSnap.data()); }
    } else {
        document.getElementById('section-auth').classList.remove('d-none');
        document.getElementById('section-app').classList.add('d-none');
        document.getElementById('btn-logout').classList.add('d-none');
    }
});

function renderInterfaz(user) {
    document.getElementById('section-auth').classList.add('d-none');
    document.getElementById('section-app').classList.remove('d-none');
    document.getElementById('btn-logout').classList.remove('d-none');
    document.getElementById('panel-bienvenida').innerHTML = `<h2>${user.nombre}</h2><span class="badge bg-info text-dark">${user.rol}</span>`;
    if (user.rol === 'gerente') { renderGerente(); } else { renderMesero(); }
}

function renderGerente() {
    document.getElementById('render-area').innerHTML = `
        <div class="col-md-6"><div class="glass-card"><h4>Nuevo Platillo</h4>
            <input id="p-nom" class="form-control mb-2" placeholder="Nombre">
            <input id="p-pre" type="number" class="form-control mb-2" placeholder="Precio">
            <select id="p-tie" class="form-control mb-2">
                <option value="Entrada">Entrada</option>
                <option value="Fuerte">Fuerte</option>
                <option value="Postre">Postre</option>
            </select>
            <button onclick="window.addP()" class="btn btn-primary w-100">Guardar</button>
        </div></div>
        <div class="col-md-6"><div class="glass-card"><h4>Nuevo Mesero</h4>
            <input id="m-em" class="form-control mb-2" placeholder="Email">
            <input id="m-ps" type="password" class="form-control mb-2" placeholder="Pass">
            <button onclick="window.regM()" class="btn btn-info w-100 text-white">Registrar</button>
        </div></div>`;
}

window.addP = async () => {
    const nombre = document.getElementById('p-nom').value;
    const precio = parseInt(document.getElementById('p-pre').value);
    const tiempo = document.getElementById('p-tie').value;
    await addDoc(collection(db, "menu"), { nombre, precio, tiempo });
    alert("Guardado");
};

window.regM = async () => {
    const email = document.getElementById('m-em').value;
    const pass = document.getElementById('m-ps').value;
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, "usuarios", res.user.uid), { nombre: "Mesero", correo: email, rol: "mesero" });
    alert("Registrado");
};

async function renderMesero() {
    const snap = await getDocs(collection(db, "menu"));
    let opts = "";
    snap.forEach(d => { opts += `<option value="${d.data().nombre}" data-precio="${d.data().precio}">${d.data().nombre} ($${d.data().precio})</option>`; });
    
    let botonesMesas = "";
    for(let i=1; i<=10; i++) {
        botonesMesas += `<button class="btn btn-outline-info m-btn" onclick="window.sM(${i}, this)">Mesa ${i}</button>`;
    }

    document.getElementById('render-area').innerHTML = `
        <div class="col-md-5"><div class="glass-card"><h4>Mesas</h4>
            <div class="grid-mesas">${botonesMesas}</div>
        </div></div>
        <div class="col-md-7"><div class="glass-card"><h4>Orden: <span id="m-val">--</span></h4>
            <select id="s-it" class="form-control mb-2">${opts}</select>
            <button onclick="window.aI()" class="btn btn-info w-100 mb-3 text-white">Agregar</button>
            <ul id="lista" class="list-group mb-3"></ul>
            <h5>Total: $<span id="tot">0</span></h5>
            <button onclick="window.cT()" class="btn btn-primary w-100">Cerrar y Ver Ticket</button>
        </div></div>`;
}

window.sM = (n, b) => {
    mesaActiva = n;
    document.getElementById('m-val').innerText = "Mesa " + n;
    document.querySelectorAll('.m-btn').forEach(btn => btn.classList.replace('btn-info', 'btn-outline-info'));
    b.classList.replace('btn-outline-info', 'btn-info');
};

window.aI = () => {
    const s = document.getElementById('s-it');
    if(!s.value) return;
    const n = s.value;
    const p = parseInt(s.selectedOptions[0].dataset.precio);
    carrito.push({ n, p });
    document.getElementById('lista').innerHTML += `<li class="list-group-item d-flex justify-content-between"><span>${n}</span><span>$${p}</span></li>`;
    const t = document.getElementById('tot');
    t.innerText = parseInt(t.innerText) + p;
};

window.cT = async () => {
    if (!mesaActiva || carrito.length === 0) return alert("Faltan datos");
    const total = document.getElementById('tot').innerText;
    let det = `<p><b>Fecha:</b> ${new Date().toLocaleDateString()}</p><p><b>Mesa:</b> ${mesaActiva}</p><hr>`;
    carrito.forEach(i => { det += `<div class="ticket-row"><span>${i.n}</span><span>$${i.p}</span></div>`; });
    det += `<hr><div class="ticket-row fw-bold"><span>TOTAL:</span><span>$${total}</span></div>`;
    document.getElementById('ticket-detalle').innerHTML = det;
    new bootstrap.Modal(document.getElementById('modalTicket')).show();
    await addDoc(collection(db, "ventas"), { mesa: mesaActiva, total: parseInt(total), mesero: auth.currentUser.email, fecha: serverTimestamp() });
};

window.limpiarTodo = () => {
    carrito = [];
    mesaActiva = null;
    document.getElementById('lista').innerHTML = "";
    document.getElementById('tot').innerText = "0";
    document.getElementById('m-val').innerText = "--";
    document.querySelectorAll('.m-btn').forEach(btn => btn.classList.replace('btn-info', 'btn-outline-info'));
};