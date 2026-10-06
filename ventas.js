// ventas.js
const cuadriculaProductos = document.getElementById('cuadricula-productos');
const contenedorItemsFactura = document.getElementById('items-factura');
let idVentaAbiertaActual = null; 

window.renderizarCatalogo = function(catalogoAMostrar) {
    cuadriculaProductos.innerHTML = '';
    catalogoAMostrar.forEach(producto => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-producto';
        const txtStock = (producto.seguimientoInventario === 'true' || producto.seguimientoInventario === true) ? `Stock: ${producto.stock}` : 'Sin seg. inventario';
        const cat = categorias.find(c => c.id === producto.categoriaId);
        
        const rutaImagen = producto.imagen ? producto.imagen : 'Imagenes/placeholder.png';
        
        tarjeta.innerHTML = `
            <img src="${rutaImagen}" alt="${producto.nombre}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px 8px 0 0; border-bottom: 1px solid var(--border-color);">
            <div style="padding: 10px;">
                <div class="texto-info">
                    <p class="categoria-producto">${cat ? cat.nombre : 'Sin Cat'}</p>
                    <h3 class="nombre-producto">${producto.nombre}</h3>
                </div>
                <p class="precio-producto">${formatearMoneda(producto.precio)}</p>
                <p style="font-size:11px; text-align:center; color:var(--text-muted); margin-bottom:10px;">${txtStock}</p>
                <div class="controles-agregar">
                    <button class="btn btn-naranja" onclick="abrirModalProducto('${producto.id}')" title="Editar en caliente">✏️</button>
                    <input type="number" id="cant-${producto.id}" class="entrada-cantidad" value="1" min="1">
                    <button class="btn btn-verde btn-agregar" data-id="${producto.id}">Add</button>
                </div>
            </div>
        `;
        cuadriculaProductos.appendChild(tarjeta);
    });
}

cuadriculaProductos.addEventListener('click', (evento) => {
    if (evento.target.classList.contains('btn-agregar')) agregarAFactura(evento.target.getAttribute('data-id'));
});

document.getElementById('entrada-busqueda').addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    window.renderizarCatalogo(productos.filter(p => p.nombre.toLowerCase().includes(termino)));
});

function agregarAFactura(idProducto) {
    const cantidad = parseInt(document.getElementById(`cant-${idProducto}`).value);
    if (isNaN(cantidad) || cantidad <= 0) return alert("Cantidad inválida");

    const producto = productos.find(p => p.id === idProducto);
    const indice = carritoFactura.findIndex(item => item.productoId === idProducto);
    
    let cantidadTotalDeseada = cantidad;
    if(indice > -1) cantidadTotalDeseada += carritoFactura[indice].cantidad;

    if ((producto.seguimientoInventario === 'true' || producto.seguimientoInventario === true) && producto.stock < cantidadTotalDeseada) { 
        return alert(`STOCK INSUFICIENTE. Solo quedan ${producto.stock} unidades de ${producto.nombre}.`); 
    }

    if (indice > -1) { carritoFactura[indice].cantidad += cantidad; } 
    else { carritoFactura.push({ productoId: producto.id, nombre: producto.nombre, precio: producto.precio, costo: producto.costo, cantidad: cantidad }); }
    
    document.getElementById(`cant-${idProducto}`).value = 1;
    actualizarInterfazFactura();
}

function actualizarInterfazFactura() {
    if (carritoFactura.length === 0) {
        document.getElementById('estado-vacio').style.display = 'block'; 
        document.getElementById('resumen-factura').style.display = 'none'; 
        contenedorItemsFactura.innerHTML = ''; return;
    }
    document.getElementById('estado-vacio').style.display = 'none'; 
    document.getElementById('resumen-factura').style.display = 'block'; 
    contenedorItemsFactura.innerHTML = '';
    
    let subtotal = 0;
    carritoFactura.forEach((item, index) => {
        const linea = item.precio * item.cantidad;
        subtotal += linea;
        contenedorItemsFactura.innerHTML += `
            <div class="item-factura">
                <div class="info-item">
                    <p class="nombre-item">${item.nombre}</p>
                    <p class="subtotal-item">${formatearMoneda(item.precio)} c/u</p>
                </div>
                <div class="controles-item">
                    <span style="font-weight:bold;">${item.cantidad}</span>
                    <p class="nombre-item" style="width: 80px; text-align: right; color: var(--action-blue);">${formatearMoneda(linea)}</p>
                    <button class="btn-quitar" onclick="carritoFactura.splice(${index},1); actualizarInterfazFactura();">X</button>
                </div>
            </div>`;
    });
    
    const iva = subtotal * TASA_IVA;
    totalVentaActual = subtotal + iva;
    document.getElementById('subtotal-val').innerText = formatearMoneda(subtotal);
    document.getElementById('iva-val').innerText = formatearMoneda(iva);
    document.getElementById('total-val').innerText = formatearMoneda(totalVentaActual);
}

document.getElementById('btn-guardar-abierta').addEventListener('click', async () => {
    if (carritoFactura.length === 0) return;
    document.getElementById('cargando-overlay').style.display = 'flex';
    
    const ventaObj = {
        id: idVentaAbiertaActual || generarId(),
        fecha: new Date().toISOString(),
        estado: "abierta",
        clienteId: "",
        metodoPago: "",
        subtotal: totalVentaActual - (totalVentaActual * TASA_IVA),
        total: totalVentaActual,
        valorRecibido: 0,
        cambio: 0,
        itemsJson: JSON.stringify(carritoFactura),
        actualizadoEn: new Date().toISOString()
    };

    try {
        if(idVentaAbiertaActual) {
            await apiPost("ventas", "update", ventaObj);
            const idx = ventasCerradas.findIndex(v => v.id === idVentaAbiertaActual);
            ventaObj.items = carritoFactura;
            ventasCerradas[idx] = ventaObj;
        } else {
            await apiPost("ventas", "create", ventaObj);
            ventaObj.items = carritoFactura;
            ventasCerradas.push(ventaObj);
        }
        
        alert("Venta guardada en estado ABIERTO.");
        limpiarCaja();
        if(typeof window.renderizarHistorialVentas === 'function') window.renderizarHistorialVentas();
    } catch (e) { alert("Error guardando venta abierta."); }
    finally { document.getElementById('cargando-overlay').style.display = 'none'; }
});

document.getElementById('btn-cobrar').addEventListener('click', () => {
    if (carritoFactura.length === 0) return;
    document.getElementById('modal-total-pagar').innerText = formatearMoneda(totalVentaActual);
    document.getElementById('modal-pago').style.display = 'flex';
});

document.getElementById('btn-cancelar-pago').addEventListener('click', () => document.getElementById('modal-pago').style.display = 'none');

document.getElementById('metodo-pago').addEventListener('change', (e) => {
    document.getElementById('grupo-efectivo').style.display = e.target.value === 'Efectivo' ? 'block' : 'none';
});

document.getElementById('valor-recibido').addEventListener('input', (e) => {
    const cambio = (parseFloat(e.target.value) || 0) - totalVentaActual;
    const divCambio = document.getElementById('valor-cambio');
    divCambio.innerText = cambio < 0 ? "Faltan fondos" : formatearMoneda(cambio);
    divCambio.style.color = cambio < 0 ? "var(--danger-red)" : "var(--success-green)";
});

document.getElementById('btn-confirmar-venta').addEventListener('click', async () => {
    const metodo = document.getElementById('metodo-pago').value;
    const clienteId = document.getElementById('select-cliente-venta').value;
    const valRecibido = parseFloat(document.getElementById('valor-recibido').value) || 0;

    if (metodo === 'Efectivo' && valRecibido < totalVentaActual) return alert("Valor recibido insuficiente.");
    if (metodo === 'Debe' && !clienteId) return alert("Debe seleccionar un Cliente obligatorio para cobros fiados (Debe).");

    for (let item of carritoFactura) {
        const p = productos.find(prod => prod.id === item.productoId);
        if ((p.seguimientoInventario === 'true' || p.seguimientoInventario === true) && p.stock < item.cantidad) {
            return alert(`Error crítico: Stock negativo detectado. ${p.nombre} no tiene suficientes unidades.`);
        }
    }

    document.getElementById('cargando-overlay').style.display = 'flex';
    document.getElementById('btn-confirmar-venta').disabled = true;

    const ventaFinal = {
        id: idVentaAbiertaActual || generarId(),
        fecha: new Date().toISOString(),
        estado: "cerrada",
        clienteId: clienteId,
        metodoPago: metodo,
        subtotal: totalVentaActual - (totalVentaActual * TASA_IVA),
        total: totalVentaActual,
        valorRecibido: metodo === 'Efectivo' ? valRecibido : 0,
        cambio: metodo === 'Efectivo' ? (valRecibido - totalVentaActual) : 0,
        itemsJson: JSON.stringify(carritoFactura),
        actualizadoEn: new Date().toISOString()
    };

    try {
        for (let item of carritoFactura) {
            let pIndex = productos.findIndex(prod => prod.id === item.productoId);
            let prod = productos[pIndex];
            if (prod.seguimientoInventario === 'true' || prod.seguimientoInventario === true) {
                prod.stock = parseInt(prod.stock) - item.cantidad;
                await apiPost("productos", "update", prod);
            }
        }

        if(idVentaAbiertaActual) {
            await apiPost("ventas", "update", ventaFinal);
            const idx = ventasCerradas.findIndex(v => v.id === idVentaAbiertaActual);
            ventaFinal.items = carritoFactura;
            ventasCerradas[idx] = ventaFinal;
        } else {
            await apiPost("ventas", "create", ventaFinal);
            ventaFinal.items = carritoFactura;
            ventasCerradas.push(ventaFinal);
        }

        document.getElementById('modal-pago').style.display = 'none';
        alert("Venta CERRADA exitosamente.");
        limpiarCaja();
        window.renderizarTablaProductos();
        window.renderizarCatalogo(productos);
        if(typeof window.renderizarHistorialVentas === 'function') window.renderizarHistorialVentas();

    } catch (error) {
        alert("Error de red al procesar el cierre de venta.");
    } finally {
        document.getElementById('cargando-overlay').style.display = 'none';
        document.getElementById('btn-confirmar-venta').disabled = false;
    }
});

function limpiarCaja() {
    carritoFactura = [];
    idVentaAbiertaActual = null;
    actualizarInterfazFactura();
}

window.retomarVentaAbierta = function(idVenta) {
    const venta = ventasCerradas.find(v => v.id === idVenta);
    if(!venta || venta.estado !== 'abierta') return;
    carritoFactura = [...venta.items];
    idVentaAbiertaActual = venta.id;
    actualizarInterfazFactura();
    document.querySelector('[data-vista="ventas"]').click(); 
}