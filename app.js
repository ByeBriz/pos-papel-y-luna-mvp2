window.llenarSelect = function(idSelect, arreglo, textoDefault = "Seleccione...") {
    const select = document.getElementById(idSelect);
    if (!select) return;
    select.innerHTML = `<option value="">${textoDefault}</option>` + 
        arreglo.map(item => `<option value="${item.id}">${item.nombre}</option>`).join('');
};

const productosPorDefecto = [
    { id: 1, codigo: "PAP-001", nombre: "Cuaderno Argollado", categoria: "Papelería", precio: 15000, costo: 9000, seguimiento: true, stock: 50, imagen: "Imagenes/cuadernoc.jpeg" },
    { id: 2, codigo: "ESC-001", nombre: "Lápiz Mirado 2 HB", categoria: "Escritura", precio: 1200, costo: 600, seguimiento: true, stock: 100, imagen: "Imagenes/lapizhb.jpg" },
    { id: 3, codigo: "ESC-002", nombre: "Esfero Bic Negro", categoria: "Escritura", precio: 1500, costo: 800, seguimiento: true, stock: 80, imagen: "Imagenes/esferobic.webp" },
    { id: 4, codigo: "PAP-002", nombre: "Borrador de Nata", categoria: "Papelería", precio: 800, costo: 300, seguimiento: true, stock: 40, imagen: "Imagenes/borrador.jpeg" },
    { id: 5, codigo: "MAR-001", nombre: "Resaltador Pelikan", categoria: "Marcadores", precio: 3500, costo: 1800, seguimiento: true, stock: 30, imagen: "Imagenes/resaltadorp.jpeg" },
    { id: 6, codigo: "MAR-002", nombre: "Marcador Borrable", categoria: "Marcadores", precio: 4000, costo: 2000, seguimiento: true, stock: 25, imagen: "Imagenes/marcadorb.jpeg" },
    { id: 7, codigo: "ART-001", nombre: "Caja de Colores x12", categoria: "Arte", precio: 18000, costo: 11000, seguimiento: true, stock: 15, imagen: "Imagenes/colores.png" },
    { id: 8, codigo: "MAN-001", nombre: "Pegante en Barra", categoria: "Manualidades", precio: 2500, costo: 1200, seguimiento: true, stock: 35, imagen: "Imagenes/pegante.jpeg" },
    { id: 9, codigo: "MAN-002", nombre: "Tijeras Punta Roma", categoria: "Manualidades", precio: 4500, costo: 2500, seguimiento: true, stock: 20, imagen: "Imagenes/tijeras.jpeg" },
    { id: 10, codigo: "GEO-001", nombre: "Regla 30cm", categoria: "Geometría", precio: 1000, costo: 500, seguimiento: true, stock: 60, imagen: "Imagenes/regla.jpeg" }
];

let productos = JSON.parse(localStorage.getItem('pos_productos'));
if (!productos) {
    productos = productosPorDefecto;
    localStorage.setItem('pos_productos', JSON.stringify(productos));
}

let ventasCerradas = JSON.parse(localStorage.getItem('pos_ventas')) || [];
let carritoFactura = [];
const TASA_IVA = 0.19;
let totalVentaActual = 0;

// --- 2. REFERENCIAS DOM ---
const cuadriculaProductos = document.getElementById('product-grid');
const tablaHistorial = document.getElementById('tabla-historial');
const modalProducto = document.getElementById('modal-producto');

// --- 3. MÓDULO DE VENTAS ---
function renderizarCatalogo(catalogoAMostrar) {
    cuadriculaProductos.innerHTML = '';
    catalogoAMostrar.forEach(producto => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'product-card';
        const imgSrc = producto.imagen || 'https://via.placeholder.com/100?text=Papeleria';
        tarjeta.innerHTML = `
            <img src="${imgSrc}" alt="${producto.nombre}" class="product-img">
            <p class="product-category">${producto.categoria}</p>
            <h3 class="product-name">${producto.nombre}</h3>
            <p class="product-price">${formatearMoneda(producto.precio)}</p>
            <div class="add-controls">
                <input type="number" id="cant-${producto.id}" class="qty-input" value="1" min="1">
                <button class="btn" onclick="agregarAFactura(${producto.id})">Agregar</button>
            </div>
        `;
        cuadriculaProductos.appendChild(tarjeta);
    });
}

document.getElementById('search-input').addEventListener('input', (evento) => {
    const termino = evento.target.value.toLowerCase();
    const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(termino));
    renderizarCatalogo(filtrados);
});

window.agregarAFactura = function(idProducto) {
    const entrada = document.getElementById(`cant-${idProducto}`);
    const cantidad = parseInt(entrada.value);
    if (cantidad <= 0 || isNaN(cantidad)) { alert("Cantidad inválida"); return; }

    const producto = productos.find(p => p.id === idProducto);
    
    if (producto.seguimiento && producto.stock < cantidad) {
        alert(`No hay stock suficiente. Stock actual: ${producto.stock}`);
        return;
    }

    const indice = carritoFactura.findIndex(item => item.id === idProducto);
    if (indice > -1) {
        carritoFactura[indice].cantidad += cantidad;
    } else {
        carritoFactura.push({ id: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: cantidad });
    }
    entrada.value = 1;
    actualizarInterfazFactura();
}

window.actualizarCantidad = function(idProducto, nuevaCantidad) {
    if (nuevaCantidad <= 0 || isNaN(nuevaCantidad)) return;
    const item = carritoFactura.find(i => i.id === idProducto);
    if (item) {
        item.cantidad = nuevaCantidad;
        actualizarInterfazFactura();
    }
}

window.eliminarDeFactura = function(idProducto) {
    carritoFactura = carritoFactura.filter(item => item.id !== idProducto);
    actualizarInterfazFactura();
}

function actualizarInterfazFactura() {
    const contenedor = document.getElementById('invoice-items');
    const vacio = document.getElementById('empty-state');
    const resumen = document.getElementById('invoice-summary');
    
    if (carritoFactura.length === 0) {
        vacio.style.display = 'block'; resumen.style.display = 'none'; contenedor.innerHTML = ''; return;
    }

    vacio.style.display = 'none'; resumen.style.display = 'block'; contenedor.innerHTML = '';
    carritoFactura.forEach(item => {
        const div = document.createElement('div');
        div.className = 'invoice-item';
        div.innerHTML = `
            <div class="item-info">
                <p class="item-name">${item.nombre}</p>
                <p class="item-subtotal">${formatearMoneda(item.precio)} c/u</p>
            </div>
            <div class="item-controls">
                <input type="number" class="qty-input" value="${item.cantidad}" min="1" onchange="actualizarCantidad(${item.id}, parseInt(this.value))">
                <p class="item-name" style="width: 80px; text-align: right;">${formatearMoneda(item.precio * item.cantidad)}</p>
                <button class="btn-remove" onclick="eliminarDeFactura(${item.id})">X</button>
            </div>
        `;
        contenedor.appendChild(div);
    });
    calcularTotales();
}

function calcularTotales() {
    const subtotal = carritoFactura.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
    const iva = subtotal * TASA_IVA;
    totalVentaActual = subtotal + iva;
    document.getElementById('subtotal-val').innerText = formatearMoneda(subtotal);
    document.getElementById('iva-val').innerText = formatearMoneda(iva);
    document.getElementById('total-val').innerText = formatearMoneda(totalVentaActual);
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);
}

// --- 4. MÓDULO DE INVENTARIO (CRUD) ---

function renderizarTablaProductos() {
    tablaProductos.innerHTML = '';
    productos.forEach(prod => {
        const tr = document.createElement('tr');
        const txtStock = prod.seguimiento ? prod.stock : 'N/A';
        tr.innerHTML = `
            <td>${prod.codigo}</td>
            <td>${prod.nombre}</td>
            <td>${prod.categoria}</td>
            <td>${formatearMoneda(prod.precio)}</td>
            <td>${formatearMoneda(prod.costo)}</td>
            <td>${txtStock}</td>
            <td>
                <button class="btn-icon" title="Editar" onclick="abrirModalProducto(${prod.id})">✏️</button>
                <button class="btn-icon" title="Eliminar" onclick="eliminarProducto(${prod.id})">🗑️</button>
            </td>
        `;
        tablaProductos.appendChild(tr);
    });
}

window.abrirModalProducto = function(id = null) {
    document.getElementById('prod-id').value = id || '';
    if (id) {
        document.getElementById('titulo-modal-producto').innerText = "Editar Producto";
        const prod = productos.find(p => p.id === id);
        document.getElementById('prod-codigo').value = prod.codigo;
        document.getElementById('prod-nombre').value = prod.nombre;
        document.getElementById('prod-categoria').value = prod.categoria;
        document.getElementById('prod-costo').value = prod.costo;
        document.getElementById('prod-precio').value = prod.precio;
        document.getElementById('prod-seguimiento').value = prod.seguimiento.toString();
        document.getElementById('prod-stock').value = prod.stock || 0;
    } else {
        document.getElementById('titulo-modal-producto').innerText = "Nuevo Producto";
        document.getElementById('prod-codigo').value = "PROD-" + Date.now().toString().slice(-4);
        document.getElementById('prod-nombre').value = '';
        document.getElementById('prod-categoria').value = '';
        document.getElementById('prod-costo').value = '';
        document.getElementById('prod-precio').value = '';
        document.getElementById('prod-seguimiento').value = 'true';
        document.getElementById('prod-stock').value = 0;
    }
    alternarCampoStock();
    modalProducto.style.display = 'flex';
}

window.cerrarModalProducto = function() { modalProducto.style.display = 'none'; }

window.alternarCampoStock = function() {
    const seguimiento = document.getElementById('prod-seguimiento').value === 'true';
    document.getElementById('prod-stock').disabled = !seguimiento;
}

window.guardarProducto = function() {
    const id = document.getElementById('prod-id').value;
    const codigo = document.getElementById('prod-codigo').value.trim();
    const nombre = document.getElementById('prod-nombre').value.trim();
    const categoria = document.getElementById('prod-categoria').value.trim();
    const costo = parseFloat(document.getElementById('prod-costo').value);
    const precio = parseFloat(document.getElementById('prod-precio').value);
    const seguimiento = document.getElementById('prod-seguimiento').value === 'true';
    const stock = seguimiento ? parseInt(document.getElementById('prod-stock').value) : 0;

    if (!nombre || !codigo) { alert("Nombre y Código son obligatorios."); return; }
    if (isNaN(costo) || costo < 0 || isNaN(precio) || precio < 0) { alert("Los valores numéricos no pueden ser negativos."); return; }
    if (seguimiento && (isNaN(stock) || stock < 0)) { alert("El stock no puede ser negativo."); return; }

    if (id) {
        const index = productos.findIndex(p => p.id == id);
        productos[index] = { ...productos[index], codigo, nombre, categoria, costo, precio, seguimiento, stock };
    } else {
        const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
        productos.push({ id: nuevoId, codigo, nombre, categoria, costo, precio, seguimiento, stock, imagen: "" });
    }

    localStorage.setItem('pos_productos', JSON.stringify(productos));
    cerrarModalProducto();
    renderizarTablaProductos();
    renderizarCatalogo(productos); 
}

window.eliminarProducto = function(id) {
    if (confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.")) {
        productos = productos.filter(p => p.id !== id);
        localStorage.setItem('pos_productos', JSON.stringify(productos));
        renderizarTablaProductos();
        renderizarCatalogo(productos);
    }
}

// --- 5. FLUJO DE PAGO Y FACTURACIÓN ---
window.abrirModalPago = function() {
    if (carritoFactura.length === 0) return;
    document.getElementById('modal-total-pagar').innerText = formatearMoneda(totalVentaActual);
    document.getElementById('metodo-pago').value = 'Efectivo';
    document.getElementById('valor-recibido').value = '';
    document.getElementById('valor-cambio').innerText = '$0';
    cambiarMetodoPago();
    document.getElementById('modal-pago').style.display = 'flex';
}
window.cerrarModalPago = function() { document.getElementById('modal-pago').style.display = 'none'; }
window.cambiarMetodoPago = function() {
    const metodo = document.getElementById('metodo-pago').value;
    document.getElementById('grupo-efectivo').style.display = metodo === 'Efectivo' ? 'block' : 'none';
}
window.calcularCambio = function() {
    const valorRecibido = parseFloat(document.getElementById('valor-recibido').value) || 0;
    const cambio = valorRecibido - totalVentaActual;
    const divCambio = document.getElementById('valor-cambio');
    if (cambio < 0) { divCambio.innerText = "Fondos insuficientes"; divCambio.style.color = "#d63031"; }
    else { divCambio.innerText = formatearMoneda(cambio); divCambio.style.color = "#27ae60"; }
}

window.confirmarVenta = function() {
    const metodo = document.getElementById('metodo-pago').value;
    if (metodo === 'Efectivo') {
        const recibido = parseFloat(document.getElementById('valor-recibido').value) || 0;
        if (recibido < totalVentaActual) { alert("Valor recibido insuficiente."); return; }
    }

    const subtotal = carritoFactura.reduce((s, i) => s + (i.precio * i.cantidad), 0);
    const nuevaVenta = {
        id: "FAC-" + Date.now().toString().slice(-6),
        fecha: new Date().toLocaleString('es-CO'),
        items: [...carritoFactura], 
        subtotal: subtotal, 
        iva: subtotal * TASA_IVA,
        total: totalVentaActual, 
        metodoPago: metodo
    };

    ventasCerradas.push(nuevaVenta);
    localStorage.setItem('pos_ventas', JSON.stringify(ventasCerradas));

    cerrarModalPago();
    mostrarFactura(nuevaVenta);
    renderizarHistorialVentas(); // Actualizar historial
    carritoFactura = [];
    actualizarInterfazFactura();
}

function mostrarFactura(venta) {
    document.getElementById('factura-id').innerText = venta.id;
    document.getElementById('factura-fecha').innerText = venta.fecha;
    const contenedor = document.getElementById('factura-items');
    contenedor.innerHTML = '';
    venta.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'ticket-item';
        div.innerHTML = `<span>${item.cantidad}x ${item.nombre}</span><span>${formatearMoneda(item.cantidad * item.precio)}</span>`;
        contenedor.appendChild(div);
    });
    document.getElementById('factura-subtotal').innerText = formatearMoneda(venta.subtotal);
    document.getElementById('factura-iva').innerText = formatearMoneda(venta.iva);
    document.getElementById('factura-total').innerText = formatearMoneda(venta.total);
    document.getElementById('factura-metodo').innerText = `Pagado con: ${venta.metodoPago}`;
    document.getElementById('modal-factura').style.display = 'flex';
}
window.cerrarModalFactura = function() { document.getElementById('modal-factura').style.display = 'none'; }
window.imprimirFactura = function() { window.print(); }

// --- 6. MÓDULO DE HISTORIAL DE VENTAS ---
function renderizarHistorialVentas() {
    tablaHistorial.innerHTML = '';
    
    if (ventasCerradas.length === 0) {
        tablaHistorial.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #999;">No hay ventas registradas aún.</td></tr>';
        return;
    }

    // Invertimos el arreglo para mostrar la venta más reciente primero
    [...ventasCerradas].reverse().forEach(venta => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${venta.id}</strong></td>
            <td>${venta.fecha}</td>
            <td>${venta.metodoPago}</td>
            <td style="font-weight: bold; color: var(--vivid-blue);">${formatearMoneda(venta.total)}</td>
            <td>
                <button class="btn-icon" title="Ver Factura" onclick="verFacturaHistorial('${venta.id}')">🧾</button>
            </td>
        `;
        tablaHistorial.appendChild(tr);
    });
}

window.verFacturaHistorial = function(idFactura) {
    const venta = ventasCerradas.find(v => v.id === idFactura);
    if (venta) {
        mostrarFactura(venta);
    }
}

// --- 7. NAVEGACIÓN ---
window.cambiarVista = function(nombreVista) {
    ['ventas', 'productos', 'historial'].forEach(v => {
        document.getElementById(`vista-${v}`).style.display = 'none';
        document.getElementById(`btn-vista-${v}`).classList.remove('activo');
    });
    if (nombreVista === 'ventas') {
        document.getElementById('vista-ventas').style.display = 'flex'; 
    } else {
        document.getElementById(`vista-${nombreVista}`).style.display = 'block';
    }
    document.getElementById(`btn-vista-${nombreVista}`).classList.add('activo');
}

// INICIALIZACIÓN GENERAL
renderizarCatalogo(productos);
renderizarTablaProductos();
renderizarHistorialVentas();