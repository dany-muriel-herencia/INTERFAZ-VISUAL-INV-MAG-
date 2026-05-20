const APP_MODULES = [
    'compras',
    'caja',
    'usuario',
    'categorias',
    'producto',
    'cliente',
    'ventas',
    'movimientos',
    'reportes',
    'alertas'
];

const SIVMAG_DB_KEY = "sivmag_db";
const SIVMAG_SESSION_KEY = "sivmag_session";
const SIVMAG_DEFAULT_DB = {
    credenciales: [
        { usuario: "admin", clave: "1234", nombre: "Admin Principal", rol: "Administrador General" },
        { usuario: "vendedor", clave: "ventas123", nombre: "Juan Sanchez", rol: "Vendedor" }
    ],
    usuarios: [
        { id: "USR-001", nombre: "Admin Principal", email: "admin@bodega.com", rol: "Admin", estado: "ACTIVO" },
        { id: "USR-002", nombre: "Juan Sanchez", email: "juan.s@bodega.com", rol: "Vendedor", estado: "ACTIVO" },
        { id: "USR-003", nombre: "Maria Alva", email: "maria.a@bodega.com", rol: "Vendedor", estado: "INACTIVO" }
    ],
    productos: [
        { sku: "775012345", nombre: "Arroz Costeño Extra 5kg", precio: 18.5, stock: 20 },
        { sku: "775098765", nombre: "Aceite Primor Premium 1L", precio: 11.2, stock: 12 },
        { sku: "775044332", nombre: "Leche Gloria Azul 400g", precio: 4.5, stock: 48 }
    ],
    ventas: []
};

document.addEventListener('DOMContentLoaded', iniciarApp);

async function iniciarApp() {
    await inicializarBaseDatos();
    await cargarModulos();
    restaurarSesion();
}

function clonarJSON(data) {
    return JSON.parse(JSON.stringify(data));
}

async function inicializarBaseDatos() {
    if (localStorage.getItem(SIVMAG_DB_KEY)) return;

    try {
        const response = await fetch('data/db.json');
        if (!response.ok) throw new Error('No se pudo cargar data/db.json');
        const db = await response.json();
        guardarDB(db);
    } catch (error) {
        guardarDB(clonarJSON(SIVMAG_DEFAULT_DB));
    }
}

function obtenerDB() {
    try {
        return JSON.parse(localStorage.getItem(SIVMAG_DB_KEY)) || clonarJSON(SIVMAG_DEFAULT_DB);
    } catch (error) {
        return clonarJSON(SIVMAG_DEFAULT_DB);
    }
}

function guardarDB(db) {
    localStorage.setItem(SIVMAG_DB_KEY, JSON.stringify(db, null, 2));
}

async function cargarModulos() {
    const container = document.getElementById('sectionsContainer');
    if (!container) return;

    try {
        const modules = await Promise.all(
            APP_MODULES.map(async moduleName => {
                const response = await fetch(`modules/${moduleName}.html`);
                if (!response.ok) {
                    throw new Error(`No se pudo cargar modules/${moduleName}.html`);
                }
                return response.text();
            })
        );

        container.innerHTML = modules.join('\n\n');
        showSection('compras');
    } catch (error) {
        container.innerHTML = `
            <div class="main-content-padding">
                <div class="card">
                    <h3>Error al cargar módulos</h3>
                    <p class="text-gray-500 mt-2">${error.message}. Abra este proyecto con un servidor local para permitir la carga de archivos HTML.</p>
                </div>
            </div>
        `;
        console.error(error);
    }
}
function login(event) {
    event.preventDefault();
    
    const user = document.getElementById("user").value.trim();
    const pass = document.getElementById("pass").value.trim();
    const remember = document.getElementById("rememberUser");
    const userError = document.getElementById("userError");
    const passError = document.getElementById("passError");
    
    userError.style.display = "none";
    passError.style.display = "none";
    
    let valido = true;
    
    if (user === "") {
        userError.innerHTML = "El usuario es requerido";
        userError.style.display = "block";
        document.getElementById("user").classList.add("error-input");
        valido = false;
    } else {
        document.getElementById("user").classList.remove("error-input");
    }
    
    if (pass === "") {
        passError.innerHTML = "La contraseña es requerida";
        passError.style.display = "block";
        document.getElementById("pass").classList.add("error-input");
        valido = false;
    } else {
        document.getElementById("pass").classList.remove("error-input");
    }
    
    if (valido) {
        const db = obtenerDB();
        const credencial = db.credenciales.find(item => item.usuario === user && item.clave === pass);

        if (credencial) {
            document.getElementById("loginPage").classList.add("hidden");
            document.getElementById("dashboard").classList.add("visible");
            if (remember && remember.checked) {
                localStorage.setItem(SIVMAG_SESSION_KEY, JSON.stringify({
                    usuario: credencial.usuario,
                    nombre: credencial.nombre,
                    rol: credencial.rol
                }));
            } else {
                localStorage.removeItem(SIVMAG_SESSION_KEY);
            }
            document.getElementById("loginForm").reset();
            mostrarAlerta("Bienvenido", `Has iniciado sesión como ${credencial.nombre}`);
        } else {
            alert("❌ Usuario o contraseña incorrectos. Use admin / 1234");
        }
    }
}

function logout() {
    if (confirm("¿Deseas cerrar sesión?")) {
        localStorage.removeItem(SIVMAG_SESSION_KEY);
        document.getElementById("loginPage").classList.remove("hidden");
        document.getElementById("dashboard").classList.remove("visible");
        document.getElementById("loginForm").reset();
    }
}

function restaurarSesion() {
    const session = localStorage.getItem(SIVMAG_SESSION_KEY);
    if (!session) return;

    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("dashboard").classList.add("visible");
}

function guardarCompra() {
    const fecha = document.getElementById("fecha");
    const proveedor = document.getElementById("proveedor");
    const numero = document.getElementById("numero");
    
    let ok = true;
    
    fecha.classList.remove("error");
    proveedor.classList.remove("error");
    numero.classList.remove("error");
    
    if (fecha.value === "") {
        fecha.classList.add("error");
        ok = false;
    }
    
    if (proveedor.value === "") {
        proveedor.classList.add("error");
        ok = false;
    }
    
    if (numero.value.trim() === "") {
        numero.classList.add("error");
        ok = false;
    }
    
    if (ok) {
        mostrarAlerta("Éxito", "Compra registrada correctamente");
    } else {
        alert("❌ Complete correctamente los campos");
    }
}

function mostrarAlerta(titulo, mensaje) {
    const alertBox = document.getElementById("alertBox");
    const alertSection = alertBox ? alertBox.closest('.section-content') : null;
    const alertVisible = !alertSection || alertSection.classList.contains('active');

    if (alertBox && alertVisible) {
        document.getElementById("alertTitle").innerHTML = titulo;
        document.getElementById("alertMsg").innerHTML = mensaje;
        alertBox.style.display = "flex";
        
        setTimeout(() => {
            alertBox.style.display = "none";
        }, 4000);
    } else {
        alert(titulo + ": " + mensaje);
    }
}

let turnoAbierto = true;

function showSection(sectionId, event) {
    // Hide all section contents
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Deactivate all menu items
    const menuItems = document.querySelectorAll('.sidebar .menu li');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Show active section
    const activeSec = document.getElementById('section-' + sectionId);
    if (activeSec) {
        activeSec.classList.add('active');
    }
    
    // Add active class to clicked menu item
    if (event) {
        const li = event.currentTarget || event.target.closest('li');
        if (li) {
            li.classList.add('active');
        }
    } else {
        const li = Array.from(menuItems).find(item => item.getAttribute('onclick')?.includes(`'${sectionId}'`));
        if (li) {
            li.classList.add('active');
        }
    }

    if (sectionId === 'ventas') {
        actualizarTotalesVenta();
    }
}

function nuevaVenta() {
    showSection('ventas');
    mostrarAlerta("Nueva Venta", "Se abrió el módulo de ventas.");
}

function abrirNuevoTurno() {
    const statusText = document.getElementById("turnoStatusText");
    const statusDot = document.getElementById("turnoStatusDot");
    const statusContainer = document.getElementById("turnoStatusContainer");
    const abrirBtn = document.getElementById("abrirTurnoBtn");
    
    turnoAbierto = true;
    statusText.innerText = "Turno Abierto";
    statusContainer.className = "flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-semibold border border-yellow-200";
    statusDot.className = "w-2 h-2 rounded-full bg-yellow-500 mr-2";
    abrirBtn.disabled = true;
    abrirBtn.innerText = "Turno Abierto";
    abrirBtn.className = "w-full bg-gray-300 text-gray-500 rounded-lg py-3 font-semibold text-sm cursor-not-allowed flex items-center justify-center transition";
    
    mostrarAlerta("Turno Abierto", "Se ha abierto el turno de caja exitosamente.");
}

function cerrarTurnoActual() {
    const statusText = document.getElementById("turnoStatusText");
    const statusDot = document.getElementById("turnoStatusDot");
    const statusContainer = document.getElementById("turnoStatusContainer");
    const abrirBtn = document.getElementById("abrirTurnoBtn");
    
    const montoReal = document.getElementById("montoRealInput").value.trim();
    if (montoReal === "") {
        alert("Por favor, ingrese el Monto Real en Caja antes de cerrar.");
        return;
    }
    
    if (confirm("¿Está seguro de que desea realizar el cierre de caja?")) {
        turnoAbierto = false;
        statusText.innerText = "Turno Cerrado";
        statusContainer.className = "flex items-center px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold border border-red-200";
        statusDot.className = "w-2 h-2 rounded-full bg-red-500 mr-2";
        abrirBtn.disabled = false;
        abrirBtn.innerText = "Abrir Turno";
        abrirBtn.className = "w-full bg-emerald-600 text-white rounded-lg py-3 font-semibold text-sm hover:bg-emerald-700 transition flex items-center justify-center cursor-pointer";
        
        mostrarAlerta("Caja Cerrada", "El arqueo de caja se ha registrado. Turno cerrado.");
        document.getElementById("montoRealInput").value = "";
    }
}

function filtrarVentas() {
    const input = document.getElementById("buscarVentaInput");
    const filter = input.value.toLowerCase();
    const table = document.querySelector("#section-caja table");
    const trs = table.getElementsByTagName("tr");
    
    for (let i = 1; i < trs.length; i++) {
        const tr = trs[i];
        const cells = tr.getElementsByTagName("td");
        let matches = false;
        
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].innerText.toLowerCase().includes(filter)) {
                matches = true;
                break;
            }
        }
        
        tr.style.display = matches ? "" : "none";
    }
}

function calcularMargenGanancia() {
    const compraVal = parseFloat(document.getElementById('productoPrecioCompra').value) || 0;
    const ventaVal = parseFloat(document.getElementById('productoPrecioVenta').value) || 0;
    const margenText = document.getElementById('productoMargenGanancia');
    
    if (compraVal > 0 && ventaVal > 0) {
        const margen = ((ventaVal - compraVal) / compraVal) * 100;
        margenText.innerText = margen.toFixed(1) + "%";
        if (margen >= 20) {
            margenText.className = "text-sm font-bold text-emerald-600";
        } else if (margen > 0) {
            margenText.className = "text-sm font-bold text-yellow-600";
        } else {
            margenText.className = "text-sm font-bold text-red-600";
        }
    } else {
        margenText.innerText = "--%";
        margenText.className = "text-sm font-bold text-gray-400";
    }
}

function registrarNuevoProducto() {
    const nombre = document.getElementById('productoNombre').value.trim();
    const stock = document.getElementById('productoStock').value.trim();
    const precioVenta = document.getElementById('productoPrecioVenta').value.trim();
    
    if (nombre === "" || stock === "" || precioVenta === "") {
        alert("Por favor complete los campos obligatorios: Nombre, Stock y Precio de Venta.");
        return;
    }
    
    mostrarAlerta("Producto Registrado", `El producto "${nombre}" ha sido catalogado exitosamente.`);
    
    // Clear inputs
    document.getElementById('productoNombre').value = "";
    document.getElementById('productoStock').value = "";
    document.getElementById('productoStockMinimo').value = "";
    document.getElementById('productoPrecioCompra').value = "";
    document.getElementById('productoPrecioVenta').value = "";
    document.getElementById('productoMargenGanancia').innerText = "--%";
    document.getElementById('productoMargenGanancia').className = "text-sm font-bold text-gray-400";
}

function limpiarCategoria() {
    const nombre = document.getElementById('category-name');
    const descripcion = document.getElementById('category-desc');

    if (nombre) {
        nombre.value = "";
        nombre.classList.remove("error");
    }

    if (descripcion) {
        descripcion.value = "";
        descripcion.classList.remove("error");
    }
}

function registrarCategoria() {
    const nombre = document.getElementById('category-name');
    const descripcion = document.getElementById('category-desc');

    if (!nombre || !descripcion) return;

    nombre.classList.remove("error");
    descripcion.classList.remove("error");

    let valido = true;

    if (nombre.value.trim() === "") {
        nombre.classList.add("error");
        valido = false;
    }

    if (descripcion.value.trim() === "") {
        descripcion.classList.add("error");
        valido = false;
    }

    if (!valido) {
        alert("Complete el nombre y la descripción de la categoría.");
        return;
    }

    mostrarAlerta("Categoría Registrada", `La categoría "${nombre.value.trim()}" ha sido registrada correctamente.`);
    limpiarCategoria();
}

function actualizarPreviewCliente() {
    const nombre = document.getElementById('cliente-fullname');
    const telefono = document.getElementById('cliente-phone');
    const previewNombre = document.getElementById('cliente-preview-name');
    const previewTelefono = document.getElementById('cliente-preview-phone');

    if (!previewNombre || !previewTelefono) return;

    const nombreValor = nombre ? nombre.value.trim() : "";
    const telefonoValor = telefono ? telefono.value.trim() : "";

    previewNombre.innerText = nombreValor || "Nombre del cliente";
    previewTelefono.innerText = telefonoValor || "Teléfono";

    previewNombre.classList.toggle("clientes-preview-muted", nombreValor === "");
    previewTelefono.classList.toggle("clientes-preview-muted", telefonoValor === "");
}

function limpiarCliente() {
    const campos = [
        document.getElementById('cliente-fullname'),
        document.getElementById('cliente-phone'),
        document.getElementById('cliente-address')
    ];
    const estado = document.getElementById('cliente-status');

    campos.forEach(campo => {
        if (!campo) return;
        campo.value = "";
        campo.classList.remove("error");
    });

    if (estado) {
        estado.value = "activo";
        estado.classList.remove("error");
    }

    actualizarPreviewCliente();
}

function registrarCliente() {
    const nombre = document.getElementById('cliente-fullname');
    const telefono = document.getElementById('cliente-phone');
    const direccion = document.getElementById('cliente-address');
    const estado = document.getElementById('cliente-status');

    if (!nombre || !telefono || !direccion || !estado) return;

    const campos = [nombre, telefono, direccion];
    campos.forEach(campo => campo.classList.remove("error"));

    let valido = true;
    campos.forEach(campo => {
        if (campo.value.trim() === "") {
            campo.classList.add("error");
            valido = false;
        }
    });

    if (!valido) {
        alert("Complete nombre, teléfono y dirección del cliente.");
        return;
    }

    mostrarAlerta("Cliente Registrado", `El cliente "${nombre.value.trim()}" fue registrado como ${estado.value}.`);
    limpiarCliente();
}

function formatearSoles(monto) {
    return "S/ " + monto.toFixed(2);
}

function actualizarTotalesVenta() {
    const filas = document.querySelectorAll('#section-ventas .ventas-product-row');
    let total = 0;

    filas.forEach(fila => {
        const precio = parseFloat(fila.dataset.price) || 0;
        const cantidadInput = fila.querySelector('.ventas-qty-val');
        const subtotalEl = fila.querySelector('.ventas-price-subtotal');
        const cantidad = parseInt(cantidadInput ? cantidadInput.value : "0") || 0;
        const subtotal = precio * cantidad;

        if (subtotalEl) {
            subtotalEl.innerText = formatearSoles(subtotal);
        }

        total += subtotal;
    });

    const subtotal = total / 1.18;
    const igv = total - subtotal;
    const subtotalEl = document.getElementById('ventasSubtotal');
    const igvEl = document.getElementById('ventasIgv');
    const totalEl = document.getElementById('ventasTotal');

    if (subtotalEl) subtotalEl.innerText = formatearSoles(subtotal);
    if (igvEl) igvEl.innerText = formatearSoles(igv);
    if (totalEl) totalEl.innerText = formatearSoles(total);
}

function cambiarCantidadVenta(btn, delta) {
    const fila = btn.closest('.ventas-product-row');
    if (!fila) return;

    const input = fila.querySelector('.ventas-qty-val');
    if (!input) return;

    let cantidad = parseInt(input.value) || 1;
    cantidad += delta;
    if (cantidad < 1) cantidad = 1;

    input.value = cantidad;
    actualizarTotalesVenta();
}

function eliminarProductoVenta(btn) {
    const fila = btn.closest('.ventas-product-row');
    if (!fila) return;

    fila.remove();
    actualizarTotalesVenta();
}

function seleccionarMetodoPagoVenta(elemento) {
    const opciones = document.querySelectorAll('#section-ventas .ventas-payment-method');
    opciones.forEach(opcion => opcion.classList.remove('selected'));
    elemento.classList.add('selected');
}

function registrarVenta() {
    const filas = document.querySelectorAll('#section-ventas .ventas-product-row');
    if (filas.length === 0) {
        alert("Agregue al menos un producto para registrar la venta.");
        return;
    }

    const metodo = document.querySelector('#section-ventas .ventas-payment-method.selected .ventas-method-info');
    const metodoTexto = metodo ? metodo.innerText.trim() : "Efectivo";
    const items = Array.from(filas).map(fila => {
        const nombre = fila.querySelector('.ventas-name')?.innerText.trim() || "Producto";
        const skuText = fila.querySelector('.ventas-sku')?.innerText.trim() || "";
        const sku = skuText.replace("SKU:", "").trim();
        const precio = parseFloat(fila.dataset.price) || 0;
        const cantidad = parseInt(fila.querySelector('.ventas-qty-val')?.value || "0") || 0;

        return {
            sku,
            nombre,
            precio,
            cantidad,
            subtotal: precio * cantidad
        };
    });
    const totalNumero = items.reduce((sum, item) => sum + item.subtotal, 0);
    const subtotalNumero = totalNumero / 1.18;
    const igvNumero = totalNumero - subtotalNumero;
    const venta = {
        id: "VTA-" + Date.now(),
        fecha: new Date().toISOString(),
        metodoPago: metodoTexto,
        subtotal: Number(subtotalNumero.toFixed(2)),
        igv: Number(igvNumero.toFixed(2)),
        descuento: 0,
        total: Number(totalNumero.toFixed(2)),
        items
    };

    const db = obtenerDB();
    db.ventas = Array.isArray(db.ventas) ? db.ventas : [];
    db.ventas.push(venta);
    guardarDB(db);

    mostrarAlerta("Venta Registrada", `Venta ${venta.id} por ${formatearSoles(venta.total)} registrada con método ${metodoTexto}.`);
}

let usuarioSeleccionado = {
    rowId: "usuario-row-ap",
    nombre: "Admin Principal",
    estado: "ACTIVO",
    esCuentaPropia: true
};

function filtrarUsuarios() {
    const input = document.getElementById('usuariosBuscarInput');
    const footer = document.getElementById('usuariosTableFooter');
    if (!input) return;

    const filtro = input.value.toLowerCase();
    const filas = document.querySelectorAll('#section-usuario .usuarios-user-row');
    let visibles = 0;

    filas.forEach(fila => {
        const coincide = fila.innerText.toLowerCase().includes(filtro);
        fila.style.display = coincide ? "" : "none";
        if (coincide) visibles++;
    });

    if (footer) {
        footer.innerText = `Mostrando ${visibles} usuario${visibles === 1 ? "" : "s"} registrados en el sistema`;
    }
}

function seleccionarUsuario(rowId, nombre, rol, id, ingreso, ventas, estado, avatar, esCuentaPropia) {
    const avatarEl = document.getElementById('usuarioDetalleAvatar');
    const nombreEl = document.getElementById('usuarioDetalleNombre');
    const rolEl = document.getElementById('usuarioDetalleRol');
    const idEl = document.getElementById('usuarioDetalleId');
    const ingresoEl = document.getElementById('usuarioDetalleIngreso');
    const ventasEl = document.getElementById('usuarioDetalleVentas');
    const estadoEl = document.getElementById('usuarioDetalleEstado');
    const alertaEl = document.getElementById('usuarioDetalleAlerta');

    if (!nombreEl) return;

    document.querySelectorAll('#section-usuario .usuarios-user-row').forEach(fila => {
        fila.classList.toggle('selected', fila.id === rowId);
    });

    usuarioSeleccionado = { rowId, nombre, estado, esCuentaPropia };

    avatarEl.src = avatar;
    avatarEl.alt = nombre;
    nombreEl.innerText = nombre;
    rolEl.innerText = rol;
    idEl.innerText = id;
    ingresoEl.innerText = ingreso;
    ventasEl.innerText = ventas;
    estadoEl.innerText = estado;
    estadoEl.className = estado === "ACTIVO"
        ? "usuarios-badge-status-active"
        : "usuarios-badge-status-active inactive";

    if (alertaEl) {
        alertaEl.style.display = esCuentaPropia ? "flex" : "none";
    }
}

function actualizarEstadoFilaUsuario(rowId, estado) {
    const fila = document.getElementById(rowId);
    if (!fila) return;

    const estadoEl = fila.querySelector('.usuarios-status-indicator');
    if (!estadoEl) return;

    estadoEl.innerText = estado === "ACTIVO" ? "Activo" : "Inactivo";
    estadoEl.className = estado === "ACTIVO"
        ? "usuarios-status-indicator usuarios-status-active"
        : "usuarios-status-indicator usuarios-status-inactive";
}

function cambiarEstadoUsuario() {
    if (!usuarioSeleccionado) return;

    if (usuarioSeleccionado.esCuentaPropia) {
        mostrarAlerta("Acción no permitida", "No puede inactivar su propia cuenta.");
        return;
    }

    const nuevoEstado = usuarioSeleccionado.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    usuarioSeleccionado.estado = nuevoEstado;

    const estadoEl = document.getElementById('usuarioDetalleEstado');
    if (estadoEl) {
        estadoEl.innerText = nuevoEstado;
        estadoEl.className = nuevoEstado === "ACTIVO"
            ? "usuarios-badge-status-active"
            : "usuarios-badge-status-active inactive";
    }

    actualizarEstadoFilaUsuario(usuarioSeleccionado.rowId, nuevoEstado);
    mostrarAlerta("Estado actualizado", `${usuarioSeleccionado.nombre} ahora está ${nuevoEstado === "ACTIVO" ? "activo" : "inactivo"}.`);
}

function editarUsuarioSeleccionado() {
    if (!usuarioSeleccionado) return;
    mostrarAlerta("Editar Usuario", `Edición de ${usuarioSeleccionado.nombre} en desarrollo.`);
}

function registrarUsuarioDemo() {
    const tbody = document.querySelector('#section-usuario .usuarios-data-table tbody');
    if (!tbody || document.getElementById('usuario-row-lr')) {
        mostrarAlerta("Nuevo Usuario", "Formulario de nuevo usuario en desarrollo.");
        return;
    }

    const fila = document.createElement('tr');
    fila.id = "usuario-row-lr";
    fila.className = "usuarios-user-row";
    fila.setAttribute(
        "onclick",
        "seleccionarUsuario('usuario-row-lr','Luis Ramos','Vendedor','USR-004','Sin ingresos','S/ 0.00','ACTIVO','https://ui-avatars.com/api/?name=Luis+Ramos&background=166534&color=fff&size=150', false)"
    );
    fila.innerHTML = `
        <td>
            <div class="usuarios-user-meta">
                <div class="usuarios-avatar-initials usuarios-avatar-demo">LR</div>
                <div class="usuarios-user-name-email">
                    <div class="usuarios-name">Luis Ramos</div>
                    <div class="usuarios-email">luis.r@bodega.com</div>
                </div>
            </div>
        </td>
        <td><span class="usuarios-badge usuarios-badge-vendedor">Vendedor</span></td>
        <td><div class="usuarios-status-indicator usuarios-status-active">Activo</div></td>
        <td><span class="usuarios-link-details">Detalles</span></td>
    `;

    tbody.appendChild(fila);
    filtrarUsuarios();
    mostrarAlerta("Usuario Registrado", "Luis Ramos fue agregado al listado de personal.");
}

function filtrarUsuariosReporte() {
    const input = document.getElementById('reportesBuscarUsuario');
    const footer = document.getElementById('reportesUsuariosFooter');
    if (!input) return;

    const filtro = input.value.toLowerCase();
    const filas = document.querySelectorAll('#section-reportes .reportes-user-row');
    let visibles = 0;

    filas.forEach(fila => {
        const coincide = fila.innerText.toLowerCase().includes(filtro);
        fila.style.display = coincide ? "" : "none";
        if (coincide) visibles++;
    });

    if (footer) {
        footer.innerText = `Mostrando ${visibles} usuario${visibles === 1 ? "" : "s"} registrados en el sistema`;
    }
}

function seleccionarUsuarioReporte(nombre, rol, id, ingreso, ventas, estado, avatar, esCuentaPropia) {
    const avatarEl = document.getElementById('reporteDetalleAvatar');
    const nombreEl = document.getElementById('reporteDetalleNombre');
    const rolEl = document.getElementById('reporteDetalleRol');
    const idEl = document.getElementById('reporteDetalleId');
    const ingresoEl = document.getElementById('reporteDetalleIngreso');
    const ventasEl = document.getElementById('reporteDetalleVentas');
    const estadoEl = document.getElementById('reporteDetalleEstado');
    const alertaEl = document.getElementById('reporteDetalleAlerta');

    if (!nombreEl) return;

    avatarEl.src = avatar;
    avatarEl.alt = nombre;
    nombreEl.innerText = nombre;
    rolEl.innerText = rol;
    idEl.innerText = id;
    ingresoEl.innerText = ingreso;
    ventasEl.innerText = ventas;
    estadoEl.innerText = estado;
    estadoEl.className = estado === 'ACTIVO'
        ? 'reportes-badge-status-active'
        : 'reportes-badge-status-active inactive';

    if (alertaEl) {
        alertaEl.style.display = esCuentaPropia ? "flex" : "none";
    }
}

function filtrarAlertas(btn, tipo) {
    const botones = document.querySelectorAll('#section-alertas .alertas-tab-btn');
    const tarjetas = document.querySelectorAll('#section-alertas .alertas-card');

    botones.forEach(boton => boton.classList.remove('active'));
    btn.classList.add('active');

    tarjetas.forEach(tarjeta => {
        const coincide = tipo === 'todas' || tarjeta.dataset.alertType === tipo;
        tarjeta.style.display = coincide ? "flex" : "none";
    });
}

function seleccionarTipoMovimiento(btn, tipo) {
    const parent = btn.parentElement;
    const buttons = parent.querySelectorAll('button');
    buttons.forEach(b => {
        b.className = "flex-1 py-2 btn-segment text-gray-600 hover:bg-gray-50 border-l border-gray-200 transition";
    });
    btn.className = "flex-1 py-2 btn-segment active bg-blue-700 text-white transition";
    
    const projectionIcon = document.getElementById('projectionIcon');
    const proyStockVal = document.getElementById('proyStockVal');
    
    const val = parseInt(document.getElementById('cantidadMoverInput').value) || 0;
    
    if (tipo === 'INGRESO') {
        projectionIcon.className = "fa-solid fa-arrow-trend-up text-emerald-600";
        proyStockVal.innerText = 50 + val;
        proyStockVal.className = "text-emerald-600 font-bold";
    } else if (tipo === 'SALIDA') {
        projectionIcon.className = "fa-solid fa-arrow-trend-down text-red-600";
        proyStockVal.innerText = Math.max(0, 50 - val);
        proyStockVal.className = "text-red-600 font-bold";
    } else { // AJUSTE
        projectionIcon.className = "fa-solid fa-arrows-left-right text-yellow-600";
        proyStockVal.innerText = val;
        proyStockVal.className = "text-yellow-600 font-bold";
    }
}

function cambiarCantidadMover(delta) {
    const input = document.getElementById('cantidadMoverInput');
    let val = parseInt(input.value) || 0;
    val += delta;
    if (val < 1) val = 1;
    input.value = val;
    
    const activeBtn = document.querySelector('#section-movimientos .btn-segment.active');
    const tipo = activeBtn ? activeBtn.innerText.trim() : 'INGRESO';
    
    const proyStockVal = document.getElementById('proyStockVal');
    const proyValorEstimado = document.getElementById('proyValorEstimado');
    
    let proy = 50;
    if (tipo === 'INGRESO') {
        proy = 50 + val;
    } else if (tipo === 'SALIDA') {
        proy = Math.max(0, 50 - val);
    } else {
        proy = val;
    }
    
    proyStockVal.innerText = proy;
    proyValorEstimado.innerText = "S/ " + (val * 8.40).toFixed(2);
}

function registrarMovimientoInventario() {
    const inputObs = document.getElementById('movimientoObservacion');
    const cantInput = document.getElementById('cantidadMoverInput');
    const obs = inputObs.value.trim() || "Ajuste general de stock";
    const cant = parseInt(cantInput.value) || 10;
    
    const activeBtn = document.querySelector('#section-movimientos .btn-segment.active');
    const tipo = activeBtn ? activeBtn.innerText.trim() : 'INGRESO';
    
    const historyContainer = document.getElementById('historialRecienteContainer');
    
    const now = new Date();
    const timeStr = "Hoy, " + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const badgeClass = tipo === 'INGRESO' ? 'bg-blue-50 text-blue-600' : (tipo === 'SALIDA' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700');
    const cantSign = tipo === 'INGRESO' ? '+' : (tipo === 'SALIDA' ? '-' : '±');
    
    const valTotal = (cant * 8.40).toFixed(2);
    
    const newRow = document.createElement('div');
    newRow.className = "p-5 border-b border-gray-50 hover:bg-gray-50 transition";
    newRow.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <span class="${badgeClass} text-[10px] font-bold px-2 py-0.5 rounded">${tipo}</span>
            <span class="text-xs text-gray-400 font-medium">${timeStr}</span>
        </div>
        <h5 class="font-bold text-gray-800 text-sm mb-1">Arroz Costeño Extra 1kg</h5>
        <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">${cantSign}${cant} Unidades</span>
            <span class="text-sm font-bold text-gray-700">S/ ${valTotal}</span>
        </div>
    `;
    
    historyContainer.insertBefore(newRow, historyContainer.firstChild);
    
    inputObs.value = "";
    cantInput.value = "10";
    cambiarCantidadMover(0);
    
    mostrarAlerta("Éxito", `Movimiento de ${tipo} por ${cant} unidades registrado correctamente.`);
}

