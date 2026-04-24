import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

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

window.renderMesero = () => {
    document.getElementById('main-content').innerHTML = `
        <div class="container my-5">
            <h2 class="text-center mb-4" style="color:#c5a059">Panel de Atención</h2>
            <div class="row">
                <div class="col-md-4">
                    <div class="glass-card">
                        <h4>Mesas</h4>
                        <div id="grid-mesas-m" class="grid-mesas"></div>
                    </div>
                </div>
                <div id="area-atencion" class="col-md-8 d-none">
                    <div class="glass-card">
                        <h3 class="text-center">Mesa: <span id="m-atend" style="color:#c5a059">--</span></h3>
                        <div class="mb-3">
                            <label class="form-label">Agregar Platillo:</label>
                            <select id="select-platillo" class="form-control" onchange="window.prepararPedido(this.value)">
                                <option value="">Selecciona un producto...</option>
                            </select>
                        </div>
                        <div id="lista-pedido" class="mb-3"></div>
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h4>Total:</h4>
                            <h4 style="color:#c5a059">$<span id="total-atencion">0</span></h4>
                        </div>
                        <button class="btn btn-primary w-100" onclick="window.generarTicket()">Ticket y Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="modal fade" id="modalCantidad" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark text-white border-gold">
                    <div class="modal-header border-0"><h5 id="p-nombre-modal"></h5></div>
                    <div class="modal-body text-center">
                        <div class="d-flex justify-content-center align-items-center gap-3">
                            <button class="btn btn-outline-gold" onclick="window.modCant(-1)">-</button>
                            <h2 id="p-cant-modal">1</h2>
                            <button class="btn btn-outline-gold" onclick="window.modCant(1)">+</button>
                        </div>
                        <button class="btn btn-primary w-100 mt-4" onclick="window.confirmarProducto()">Confirmar Pedido</button>
                    </div>
                </div>
            </div>
        </div>`;

    actualizarSelectProductos();

    onSnapshot(collection(db, "mesas_activas"), (snap) => {
        const grid = document.getElementById('grid-mesas-m');
        if(!grid) return; grid.innerHTML = "";
        const ocupadas = {}; snap.forEach(d => ocupadas[d.id] = d.data());
        
        for(let i=1; i<=12; i++){
            const btn = document.createElement('button');
            const dM = ocupadas[i];
            let cE = dM ? (dM.mesero_asignado ? "atendida" : "ocupada") : "";
            btn.className = `btn m-btn ${cE}`;
            btn.innerText = `M${i}`;
            btn.onclick = () => window.atenderMesa(i, dM);
            grid.appendChild(btn);
        }
    });
};

window.atenderMesa = async (id, data) => {
    const miEmail = auth.currentUser.email;
    mesaActiva = id;

    if (data && data.mesero_asignado && data.mesero_asignado !== miEmail) {
        alert(`Lo siento, la Mesa ${id} ya la está atendiendo: ${data.mesero_asignado}`);
        return;
    }

    if(!data) {
        if(!confirm(`¿Abrir Mesa ${id} para cliente presencial?`)) return;
        data = { cliente: "Presencial", mesero_asignado: miEmail, productos: [], total: 0 };
        await setDoc(doc(db, "mesas_activas", id.toString()), data);
    } else if(!data.mesero_asignado) {
        await updateDoc(doc(db, "mesas_activas", id.toString()), { mesero_asignado: miEmail });
    }

    pedidoLocal = data.productos || [];
    document.getElementById('area-atencion').classList.remove('d-none');
    document.getElementById('m-atend').innerText = id;
    window.renderListaPedido();
};

let prodTemp = null;
let cantTemp = 1;

async function actualizarSelectProductos() {
    const snap = await getDocs(collection(db, "menu"));
    const sel = document.getElementById('select-platillo');
    snap.forEach(d => {
        const p = d.data();
        const opt = document.createElement('option');
        opt.value = JSON.stringify({nombre: p.nombre, precio: p.precio});
        opt.innerText = `${p.nombre} - $${p.precio}`;
        sel.appendChild(opt);
    });
}

window.prepararPedido = (val) => {
    if(!val) return;
    prodTemp = JSON.parse(val);
    cantTemp = 1;
    document.getElementById('p-nombre-modal').innerText = prodTemp.nombre;
    document.getElementById('p-cant-modal').innerText = cantTemp;
    new bootstrap.Modal('#modalCantidad').show();
};

window.modCant = (v) => {
    cantTemp = Math.max(1, cantTemp + v);
    document.getElementById('p-cant-modal').innerText = cantTemp;
};

window.confirmarProducto = async () => {
    const subtotal = prodTemp.precio * cantTemp;
    pedidoLocal.push({ nombre: prodTemp.nombre, cantidad: cantTemp, subtotal: subtotal });
    
    const total = pedidoLocal.reduce((acc, p) => acc + p.subtotal, 0);
    await updateDoc(doc(db, "mesas_activas", mesaActiva.toString()), { 
        productos: pedidoLocal,
        total: total
    });
    
    bootstrap.Modal.getInstance('#modalCantidad').hide();
    window.renderListaPedido();
};

window.renderListaPedido = () => {
    const container = document.getElementById('lista-pedido');
    let total = 0;
    container.innerHTML = "";
    pedidoLocal.forEach(p => {
        total += p.subtotal;
        container.innerHTML += `<div class="d-flex justify-content-between border-bottom py-2"><span>${p.cantidad}x ${p.nombre}</span><span>$${p.subtotal}</span></div>`;
    });
    document.getElementById('total-atencion').innerText = total;
};

window.generarTicket = () => {
    const ticketHtml = `
        <div id="ticket-final" class="p-4 bg-white text-dark text-center" style="font-family: monospace; width: 300px; margin: auto;">
            <h3>EL ORÁCULO DEL SABOR</h3>
            <p>TICKET DE CONSUMO</p>
            <hr>
            <p>MESA: ${mesaActiva} | TIEMPO: 0 min</p>
            <hr>
            <div id="items-ticket"></div>
            <hr>
            <h4>TOTAL: $${document.getElementById('total-atencion').innerText}</h4>
            <button class="btn btn-dark w-100 mt-3" onclick="window.cerrarYLimpiar()">Cerrar y Limpiar Mesa</button>
        </div>`;
    
    document.getElementById('main-content').innerHTML = ticketHtml;
    const items = document.getElementById('items-ticket');
    pedidoLocal.forEach(p => {
        items.innerHTML += `<div class="d-flex justify-content-between"><span>${p.cantidad}x ${p.nombre}</span><span>$${p.subtotal}</span></div>`;
    });
};

window.cerrarYLimpiar = async () => {
    await deleteDoc(doc(db, "mesas_activas", mesaActiva.toString()));
    mesaActiva = null;
    pedidoLocal = [];
    window.renderMesero();
};
