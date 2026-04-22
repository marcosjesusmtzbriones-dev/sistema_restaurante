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
let tempItem = null;
let cantidadTemp = 1;
let tiemposMesas = {};

document.getElementById('btn-login').onclick = async () => {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Error de acceso."); }
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
    document.getElementById('panel-bienvenida').innerHTML = `<h2 style="color:#c5a059;">${user.nombre}</h2><span class="badge bg-outline-gold border-gold mb-4">${user.rol}</span>`;
    if (user.rol === 'gerente') { renderGerente(); } else { renderMesero(); }
}

function renderGerente() {
    document.getElementById('render-area').innerHTML = `
        <div class="col-md-6"><div class="glass-card p-4"><h4>Nuevo Platillo</h4>
            <input id="p-nom" class="form-control mb-2" placeholder="Nombre">
            <input id="p-pre" type="number" class="form-control mb-2" placeholder="Precio">
            <input id="p-des" class="form-control mb-2" placeholder="Descripción">
            <input id="p-img" class="form-control mb-2" placeholder="URL Imagen">
            <select id="p-tie" class="form-control mb-3">
                <option value="Entrada">Entrada</option>
                <option value="Fuerte">Fuerte</option>
                <option value="Postre">Postre</option>
            </select>
            <button onclick="window.addP()" class="btn btn-primary w-100">Guardar Platillo</button>
        </div></div>
        <div class="col-md-6"><div class="glass-card p-4"><h4>Nuevo Mesero</h4>
            <input id="m-em" class="form-control mb-2" placeholder="Email">
            <input id="m-ps" type="password" class="form-control mb-3" placeholder="Pass">
            <button onclick="window.regM()" class="btn btn-outline-gold w-100">Registrar</button>
        </div></div>`;
}

window.addP = async () => {
    const nombre = document.getElementById('p-nom').value;
    const precio = parseInt(document.getElementById('p-pre').value);
    const tiempo = document.getElementById('p-tie').value;
    const descripcion = document.getElementById('p-des').value;
    const imagen = document.getElementById('p-img').value;
    await addDoc(collection(db, "menu"), { nombre, precio, tiempo, descripcion, imagen });
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
    snap.forEach(d => { 
        const p = d.data();
        opts += `<option value="${p.nombre}" data-precio="${p.precio}" data-desc="${p.descripcion}" data-img="${p.imagen}">${p.nombre} ($${p.precio})</option>`; 
    });
    
    let btns = "";
    for(let i=1; i<=10; i++) { btns += `<button id="btn-m-${i}" class="btn m-btn" onclick="window.sM(${i}, this)">M${i}</button>`; }

    document.getElementById('render-area').innerHTML = `
        <div class="col-md-5"><div class="glass-card p-4"><h4>Mesas</h4><div class="grid-mesas">${btns}</div></div></div>
        <div class="col-md-7"><div class="glass-card p-4">
            <h4>Orden: <span id="m-val" style="color:#c5a059;">--</span></h4>
            <select id="s-it" class="form-control mb-3">${opts}</select>
            <button onclick="window.aI()" class="btn btn-primary w-100 mb-3">Agregar Platillo</button>
            <ul id="lista" class="list-group mb-3"></ul>
            <h5 class="d-flex justify-content-between">Total: <span>$<span id="tot">0</span></span></h5>
            <button onclick="window.cT()" class="btn btn-outline-gold w-100 mt-2">Cerrar Mesa</button>
        </div></div>`;
}

window.sM = (n, b) => {
    if(b.classList.contains('ocupada') && mesaActiva !== n) return alert("Mesa Ocupada");
    mesaActiva = n;
    document.getElementById('m-val').innerText = "Mesa " + n;
    if(!tiemposMesas[n]) tiemposMesas[n] = new Date();
    b.classList.add('ocupada');
};

window.aI = () => {
    const s = document.getElementById('s-it');
    if(!s.value || !mesaActiva) return alert("Selecciona Mesa");
    const opt = s.selectedOptions[0];
    tempItem = { n: opt.value, p: parseInt(opt.dataset.precio), d: opt.dataset.desc, i: opt.dataset.img };
    document.getElementById('cant-nombre-item').innerText = tempItem.n;
    document.getElementById('cant-desc-item').innerText = tempItem.d;
    document.getElementById('cant-img-item').src = tempItem.i || 'https://via.placeholder.com/150';
    document.getElementById('cant-num').innerText = "1";
    cantidadTemp = 1;
    new bootstrap.Modal(document.getElementById('modalCantidad')).show();
};

window.modCant = (v) => {
    cantidadTemp = Math.max(1, cantidadTemp + v);
    document.getElementById('cant-num').innerText = cantidadTemp;
};

window.confirmarAgregado = () => {
    const sub = tempItem.p * cantidadTemp;
    carrito.push({ n: tempItem.n, p: tempItem.p, c: cantidadTemp });
    document.getElementById('lista').innerHTML += `<li class="list-group-item d-flex justify-content-between"><span>${cantidadTemp}x ${tempItem.n}</span><span>$${sub}</span></li>`;
    const t = document.getElementById('tot');
    t.innerText = parseInt(t.innerText) + sub;
    bootstrap.Modal.getInstance(document.getElementById('modalCantidad')).hide();
};

window.cT = async () => {
    if (!mesaActiva || carrito.length === 0) return alert("Faltan datos");
    const duracion = Math.floor((new Date() - tiemposMesas[mesaActiva]) / 60000);
    const total = document.getElementById('tot').innerText;
    let det = `<p><b>MESA:</b> ${mesaActiva} | <b>TIEMPO:</b> ${duracion} min</p><hr>`;
    carrito.forEach(i => { det += `<div class="ticket-row"><span>${i.c}x ${i.n}</span><span>$${i.p * i.c}</span></div>`; });
    det += `<hr><div class="ticket-row fw-bold"><span>TOTAL:</span><span>$${total}</span></div>`;
    document.getElementById('ticket-detalle').innerHTML = det;
    new bootstrap.Modal(document.getElementById('modalTicket')).show();
    await addDoc(collection(db, "ventas"), { mesa: mesaActiva, total: parseInt(total), duracion, fecha: serverTimestamp() });
};

window.limpiarTodo = () => {
    delete tiemposMesas[mesaActiva];
    document.getElementById(`btn-m-${mesaActiva}`).classList.remove('ocupada');
    carrito = []; mesaActiva = null;
    document.getElementById('lista').innerHTML = "";
    document.getElementById('tot').innerText = "0";
    document.getElementById('m-val').innerText = "--";
};
