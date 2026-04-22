import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, onSnapshot, serverTimestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

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

document.getElementById('btn-login').onclick = async () => {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    try { await signInWithEmailAndPassword(auth, e, p); } catch { alert("Datos incorrectos"); }
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
    document.getElementById('panel-bienvenida').innerHTML = `<h2 style="color:#c5a059;">${user.nombre}</h2><p class="small">${user.rol.toUpperCase()}</p>`;
    if (user.rol === 'gerente') { renderGerente(); } else { renderMesero(); }
}

function renderGerente() {
    document.getElementById('render-area').innerHTML = `
        <div class="col-md-6"><div class="glass-card"><h4>Nuevo Platillo</h4>
            <input id="p-nom" class="form-control mb-2" placeholder="Nombre">
            <input id="p-pre" type="number" class="form-control mb-2" placeholder="Precio">
            <input id="p-des" class="form-control mb-2" placeholder="Descripción">
            <input id="p-img" class="form-control mb-2" placeholder="URL Imagen">
            <select id="p-tie" class="form-control mb-3"><option value="Entrada">Entrada</option><option value="Fuerte">Fuerte</option><option value="Postre">Postre</option></select>
            <button onclick="window.addP()" class="btn btn-primary w-100">Guardar</button>
        </div></div>`;
}

window.addP = async () => {
    const nombre = document.getElementById('p-nom').value;
    const precio = parseInt(document.getElementById('p-pre').value);
    const tiempo = document.getElementById('p-tie').value;
    const descripcion = document.getElementById('p-des').value;
    const imagen = document.getElementById('p-img').value;
    if(!nombre || !precio) return alert("Llena los campos");
    await addDoc(collection(db, "menu"), { nombre, precio, tiempo, descripcion, imagen });
    alert("Platillo Agregado");
};

async function renderMesero() {
    const menuSnap = await getDocs(collection(db, "menu"));
    let opts = "";
    menuSnap.forEach(d => { 
        const p = d.data();
        opts += `<option value="${p.nombre}" data-precio="${p.precio}" data-desc="${p.descripcion}" data-img="${p.imagen}">${p.nombre}</option>`; 
    });
    
    document.getElementById('render-area').innerHTML = `
        <div class="col-md-5"><div class="glass-card"><h4>Mesas</h4><div id="grid-mesas" class="grid-mesas"></div></div></div>
        <div class="col-md-7"><div class="glass-card">
            <h4>Mesa: <span id="m-val" style="color:#c5a059;">--</span></h4>
            <select id="s-it" class="form-control mb-3">${opts}</select>
            <button onclick="window.aI()" class="btn btn-primary w-100 mb-3">Agregar</button>
            <ul id="lista" class="list-group mb-3"></ul>
            <h5 class="d-flex justify-content-between">Total: <span>$<span id="tot">0</span></span></h5>
            <button onclick="window.cT()" class="btn btn-outline-gold w-100 mt-2">Ticket y Cerrar</button>
        </div></div>`;

    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-mesas');
        grid.innerHTML = "";
        const ocupadas = {};
        snap.forEach(doc => { ocupadas[doc.id] = doc.data(); });

        for(let i=1; i<=10; i++) {
            const dataMesa = ocupadas[i];
            const btn = document.createElement('button');
            btn.className = `btn m-btn ${dataMesa ? 'ocupada' : ''} ${mesaActiva == i ? 'seleccionada' : ''}`;
            btn.innerText = `M${i}`;
            btn.onclick = () => window.sM(i, dataMesa);
            grid.appendChild(btn);
        }
    });
}

window.sM = async (n, ocupada) => {
    if(ocupada && ocupada.mesero !== auth.currentUser.email) return alert("Mesa atendida por: " + ocupada.mesero);
    
    mesaActiva = n;
    document.getElementById('m-val').innerText = n;
    
    if(!ocupada) {
        await setDoc(doc(db, "mesas_activas", n.toString()), { 
            inicio: new Date().getTime(),
            mesero: auth.currentUser.email 
        });
        carrito = [];
        document.getElementById('lista').innerHTML = "";
        document.getElementById('tot').innerText = "0";
    }
};

window.aI = () => {
    const s = document.getElementById('s-it');
    if(!s.value || !mesaActiva) return alert("Selecciona una mesa");
    const opt = s.selectedOptions[0];
    tempItem = { n: opt.value, p: parseInt(opt.dataset.precio), d: opt.dataset.desc, i: opt.dataset.img };
    document.getElementById('cant-nombre-item').innerText = tempItem.n;
    document.getElementById('cant-desc-item').innerText = tempItem.d || "Delicioso platillo griego";
    document.getElementById('cant-img-item').src = tempItem.i || 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=400';
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
    document.getElementById('lista').innerHTML += `<li class="list-group-item d-flex justify-content-between small"><span>${cantidadTemp}x ${tempItem.n}</span><span>$${sub}</span></li>`;
    const t = document.getElementById('tot');
    t.innerText = parseInt(t.innerText) + sub;
    bootstrap.Modal.getInstance(document.getElementById('modalCantidad')).hide();
};

window.cT = async () => {
    if (!mesaActiva || carrito.length === 0) return alert("Agrega productos");
    const mesaDoc = await getDoc(doc(db, "mesas_activas", mesaActiva.toString()));
    const duracion = Math.floor((new Date().getTime() - mesaDoc.data().inicio) / 60000);
    const total = document.getElementById('tot').innerText;
    let det = `<p class="small">MESA: ${mesaActiva} | TIEMPO: ${duracion} min</p><hr>`;
    carrito.forEach(i => { det += `<div class="ticket-row small"><span>${i.c}x ${i.n}</span><span>$${i.p * i.c}</span></div>`; });
    det += `<hr><div class="ticket-row fw-bold"><span>TOTAL:</span><span>$${total}</span></div>`;
    document.getElementById('ticket-detalle').innerHTML = det;
    new bootstrap.Modal(document.getElementById('modalTicket')).show();
    await addDoc(collection(db, "ventas"), { mesa: mesaActiva, total: parseInt(total), duracion, fecha: serverTimestamp() });
};

window.limpiarTodo = async () => {
    if(!mesaActiva) return;
    await deleteDoc(doc(db, "mesas_activas", mesaActiva.toString()));
    carrito = []; mesaActiva = null;
    document.getElementById('lista').innerHTML = "";
    document.getElementById('tot').innerText = "0";
    document.getElementById('m-val').innerText = "--";
};
