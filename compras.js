// compras.js
const modalCompra = document.getElementById('modal-compra');
const btnGuardarCompra = document.getElementById('btn-guardar-compra');
let itemsCompraTemporal = [];

window.renderizarCompras = function() {
    const tbody = document.getElementById('tabla-compras');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    // Llenar selectores del modal
    llenarSelect('select-producto-compra', productos);

    [...comprasRegistradas].reverse().forEach(compra => {
        const prov = proveedores.find(p => p.id === compra.proveedorId);
        const nombreProv = prov ? prov.nombre : 'Desconocido';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${compra.id.substring(0,8)}</strong></td>
            <td>${new Date(compra.fecha).toLocaleDateString('es-CO')}</td>
            <td>${nombreProv}</td>
            <td style="color: var(--success-green); font-weight: bold;">${formatearMoneda(compra.total)}</td>
            <td><button class="btn-icon" title="Ver Detalle" onclick="alert('Detalle:\\n${compra.items.map(i => i.cantidad + 'x ' + i.nombre).join('\\n')}')">📄</button></td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('btn-nueva-compra').addEventListener('click', () => {
    itemsCompraTemporal = [];
    actualizarTablaItemsCompra();
    document.getElementById('select-proveedor-compra').value = '';
    btnGuardarCompra.disabled = false;
    modalCompra.style.display = 'flex';
});

document.getElementById('btn-cancelar-compra').addEventListener('click', () => modalCompra.style.display = 'none');

document.getElementById('btn-add-item-compra').addEventListener('click', () => {
    const idProd = document.getElementById('select-producto-compra').value;
    if(!idProd) return alert("Seleccione un producto.");
    const prod = productos.find(p => p.id === idProd);
    
    const cantidadStr = prompt(`¿Cuántas unidades de ${prod.nombre} ingresan?`);
    const costoStr = prompt(`¿Cuál es el costo unitario (de compra) de ${prod.nombre}?`, prod.costo);
    
    const cantidad = parseInt(cantidadStr);
    const costo = parseFloat(costoStr);

    if(isNaN(cantidad) || cantidad <= 0 || isNaN(costo) || costo < 0) return alert("Valores inválidos.");

    itemsCompraTemporal.push({ productoId: prod.id, nombre: prod.nombre, cantidad, costo });
    actualizarTablaItemsCompra();
});

function actualizarTablaItemsCompra() {
    const tbody = document.getElementById('items-compra-tabla');
    tbody.innerHTML = '';
    let total = 0;
    itemsCompraTemporal.forEach((item, index) => {
        const subtotal = item.cantidad * item.costo;
        total += subtotal;
        tbody.innerHTML += `
            <tr>
                <td>${item.nombre}</td>
                <td>${formatearMoneda(item.costo)}</td>
                <td>${item.cantidad}</td>
                <td>${formatearMoneda(subtotal)}</td>
                <td><button class="btn-quitar" onclick="itemsCompraTemporal.splice(${index},1); actualizarTablaItemsCompra();">X</button></td>
            </tr>`;
    });
    document.getElementById('total-compra-val').innerText = formatearMoneda(total);
}

btnGuardarCompra.addEventListener('click', async () => {
    const proveedorId = document.getElementById('select-proveedor-compra').value;
    if(!proveedorId) return alert("Seleccione un proveedor.");
    if(itemsCompraTemporal.length === 0) return alert("La compra debe tener al menos un producto.");

    btnGuardarCompra.disabled = true;
    btnGuardarCompra.innerText = "Procesando...";
    document.getElementById('cargando-overlay').style.display = 'flex';

    const totalCompra = itemsCompraTemporal.reduce((sum, item) => sum + (item.cantidad * item.costo), 0);
    const nuevaCompra = {
        id: generarId(),
        fecha: new Date().toISOString(),
        proveedorId: proveedorId,
        total: totalCompra,
        itemsJson: JSON.stringify(itemsCompraTemporal)
    };

    try {
        // 1. Guardar la compra en Sheets
        await apiPost("compras", "create", nuevaCompra);
        nuevaCompra.items = itemsCompraTemporal;
        comprasRegistradas.push(nuevaCompra);

        // 2. Afectar Inventario y Costos de los productos comprados
        for (const item of itemsCompraTemporal) {
            const prodIndex = productos.findIndex(p => p.id === item.productoId);
            if (prodIndex > -1) {
                let prod = productos[prodIndex];
                prod.costo = item.costo; // Actualiza el costo
                if (prod.seguimientoInventario === 'true' || prod.seguimientoInventario === true) {
                    prod.stock = parseInt(prod.stock || 0) + item.cantidad; // Sube el stock
                }
                // Actualizar en Sheets individualmente
                await apiPost("productos", "update", prod);
            }
        }

        modalCompra.style.display = 'none';
        window.renderizarCompras();
        window.renderizarTablaProductos();
        if(typeof window.renderizarCatalogo === 'function') window.renderizarCatalogo(productos);
        alert("Compra registrada e inventario actualizado exitosamente.");
    } catch (error) {
        alert("Error al registrar la compra en la nube.");
    } finally {
        document.getElementById('cargando-overlay').style.display = 'none';
        btnGuardarCompra.disabled = false;
        btnGuardarCompra.innerText = "Guardar y Afectar Stock";
    }
});