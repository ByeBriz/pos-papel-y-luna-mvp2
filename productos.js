// productos.js
const tablaProductos = document.getElementById('tabla-productos');
const modalProducto = document.getElementById('modal-producto');
const btnGuardarProducto = document.getElementById('btn-guardar-producto');

window.renderizarTablaProductos = function() {
    tablaProductos.innerHTML = '';
    productos.forEach(prod => {
        const tr = document.createElement('tr');
        const txtStock = (prod.seguimientoInventario === 'true' || prod.seguimientoInventario === true) ? prod.stock : 'N/A';
        const categoriaObj = categorias.find(c => c.id === prod.categoriaId);
        const nombreCat = categoriaObj ? categoriaObj.nombre : 'Sin categoría';

        tr.innerHTML = `
            <td>${prod.codigo}</td>
            <td>${prod.nombre}</td>
            <td>${nombreCat}</td>
            <td>${formatearMoneda(prod.precio)}</td>
            <td>${formatearMoneda(prod.costo)}</td>
            <td>${txtStock}</td>
            <td>
                <button class="btn-icon btn-editar" data-id="${prod.id}" title="Editar">✏️</button>
                <button class="btn-icon btn-eliminar" data-id="${prod.id}" title="Eliminar">🗑️</button>
            </td>
        `;
        tablaProductos.appendChild(tr);
    });
}

tablaProductos.addEventListener('click', (evento) => {
    const btn = evento.target.closest('.btn-icon');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (btn.classList.contains('btn-editar')) abrirModalProducto(id);
    else if (btn.classList.contains('btn-eliminar')) eliminarProducto(id);
});

function abrirModalProducto(id = null) {
    document.getElementById('prod-id').value = id || '';
    if (id) {
        document.getElementById('titulo-modal-producto').innerText = "Editar Producto";
        const prod = productos.find(p => p.id === id);
        document.getElementById('prod-codigo').value = prod.codigo;
        document.getElementById('prod-nombre').value = prod.nombre;
        document.getElementById('prod-categoria').value = prod.categoriaId || '';
        document.getElementById('prod-costo').value = prod.costo;
        document.getElementById('prod-precio').value = prod.precio;
        document.getElementById('prod-seguimiento').value = String(prod.seguimientoInventario);
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
    btnGuardarProducto.disabled = false;
    modalProducto.style.display = 'flex';
}

function alternarCampoStock() {
    const seguimiento = document.getElementById('prod-seguimiento').value === 'true';
    document.getElementById('prod-stock').disabled = !seguimiento;
}
document.getElementById('prod-seguimiento').addEventListener('change', alternarCampoStock);
document.getElementById('btn-nuevo-producto').addEventListener('click', () => abrirModalProducto());
document.getElementById('btn-cancelar-producto').addEventListener('click', () => modalProducto.style.display = 'none');

btnGuardarProducto.addEventListener('click', async () => {
    const id = document.getElementById('prod-id').value;
    const codigo = document.getElementById('prod-codigo').value.trim();
    const nombre = document.getElementById('prod-nombre').value.trim();
    const categoriaId = document.getElementById('prod-categoria').value;
    const costo = parseFloat(document.getElementById('prod-costo').value);
    const precio = parseFloat(document.getElementById('prod-precio').value);
    const seguimientoInventario = document.getElementById('prod-seguimiento').value === 'true';
    const stock = seguimientoInventario ? parseInt(document.getElementById('prod-stock').value) : 0;

    if (!nombre || !codigo || !categoriaId) return alert("Nombre, Código y Categoría son obligatorios.");
    if (isNaN(costo) || costo < 0 || isNaN(precio) || precio < 0) return alert("Los valores numéricos no pueden ser negativos.");

    btnGuardarProducto.disabled = true;
    btnGuardarProducto.innerText = "Sincronizando...";

    const datos = { codigo, nombre, categoriaId, costo, precio, seguimientoInventario, stock };

    try {
        if (id) {
            datos.id = id;
            await apiPost("productos", "update", datos);
            const index = productos.findIndex(p => p.id === id);
            productos[index] = { ...productos[index], ...datos };
        } else {
            datos.id = generarId();
            await apiPost("productos", "create", datos);
            productos.push(datos);
        }

        modalProducto.style.display = 'none';
        window.renderizarTablaProductos();
        if(typeof window.renderizarCatalogo === 'function') window.renderizarCatalogo(productos);
    } catch (error) {
        alert("Error al sincronizar producto en Sheets.");
    } finally {
        btnGuardarProducto.disabled = false;
        btnGuardarProducto.innerText = "Guardar";
    }
});

async function eliminarProducto(id) {
    if (comprasRegistradas.some(c => c.items.some(i => i.productoId === id))) {
        return alert("No puedes eliminar un producto que ya tiene historial de compras.");
    }
    if (!confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer en la nube.")) return;

    try {
        document.getElementById('cargando-overlay').style.display = 'flex';
        await apiPost("productos", "delete", { id });
        productos = productos.filter(p => p.id !== id);
        
        window.renderizarTablaProductos();
        if(typeof window.renderizarCatalogo === 'function') window.renderizarCatalogo(productos);
    } catch (error) {
        alert("Error al eliminar en Sheets.");
    } finally {
        document.getElementById('cargando-overlay').style.display = 'none';
    }
}
