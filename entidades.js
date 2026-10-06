
const modalEntidad = document.getElementById('modal-entidad');
const btnGuardarEntidad = document.getElementById('btn-guardar-entidad');


window.renderizarEntidades = function() {
    renderizarTabla('categorias', categorias, ['id', 'nombre'], 'tabla-categorias');
    renderizarTabla('clientes', clientes, ['id', 'nombre', 'telefono', 'correo'], 'tabla-clientes');
    renderizarTabla('proveedores', proveedores, ['id', 'nombre', 'telefono', 'correo'], 'tabla-proveedores');
    
    llenarSelect('prod-categoria', categorias);
    llenarSelect('select-cliente-venta', clientes, "Seleccione un cliente (Opcional)");
    llenarSelect('select-proveedor-compra', proveedores);
}

function renderizarTabla(tipo, datos, columnas, idTabla) {
    const tbody = document.getElementById(idTabla);
    if(!tbody) return;
    tbody.innerHTML = '';
    datos.forEach(item => {
        const tr = document.createElement('tr');
        let html = '';
        columnas.forEach(col => {
            html += `<td>${item[col] || ''}</td>`;
        });
        html += `<td>
                    <button class="btn-icon btn-editar-entidad" data-tipo="${tipo}" data-id="${item.id}" title="Editar">✏️</button>
                    <button class="btn-icon btn-eliminar-entidad" data-tipo="${tipo}" data-id="${item.id}" title="Eliminar">🗑️</button>
                 </td>`;
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

function llenarSelect(idSelect, datos, opcionPorDefecto = "Seleccione una opción") {
    const select = document.getElementById(idSelect);
    if(!select) return;
    select.innerHTML = `<option value="">${opcionPorDefecto}</option>`;
    datos.forEach(item => {
        select.innerHTML += `<option value="${item.id}">${item.nombre}</option>`;
    });
}

// Delegación de eventos para abrir modales o eliminar
document.getElementById('vista-entidades').addEventListener('click', (evento) => {
    const btnNueva = evento.target.closest('.btn-nueva-entidad');
    const btnEditar = evento.target.closest('.btn-editar-entidad');
    const btnEliminar = evento.target.closest('.btn-eliminar-entidad');

    if (btnNueva) abrirModalEntidad(btnNueva.getAttribute('data-tipo'));
    if (btnEditar) abrirModalEntidad(btnEditar.getAttribute('data-tipo'), btnEditar.getAttribute('data-id'));
    if (btnEliminar) eliminarEntidad(btnEliminar.getAttribute('data-tipo'), btnEliminar.getAttribute('data-id'));
});

function abrirModalEntidad(tipo, id = null) {
    document.getElementById('entidad-tipo').value = tipo;
    document.getElementById('entidad-id').value = id || '';
    document.getElementById('titulo-modal-entidad').innerText = id ? `Editar ${tipo}` : `Nuevo ${tipo}`;
    
    // Mostrar u ocultar campos extras (clientes y proveedores tienen teléfono/correo)
    const camposExtra = document.querySelectorAll('.extra-entidad');
    camposExtra.forEach(c => c.style.display = (tipo === 'categorias') ? 'none' : 'block');

    if (id) {
        let coleccion = tipo === 'categorias' ? categorias : (tipo === 'clientes' ? clientes : proveedores);
        const item = coleccion.find(i => i.id === id);
        document.getElementById('entidad-nombre').value = item.nombre;
        document.getElementById('entidad-telefono').value = item.telefono || '';
        document.getElementById('entidad-correo').value = item.correo || '';
    } else {
        document.getElementById('entidad-nombre').value = '';
        document.getElementById('entidad-telefono').value = '';
        document.getElementById('entidad-correo').value = '';
    }
    
    btnGuardarEntidad.disabled = false;
    modalEntidad.style.display = 'flex';
}

document.getElementById('btn-cancelar-entidad').addEventListener('click', () => modalEntidad.style.display = 'none');

btnGuardarEntidad.addEventListener('click', async () => {
    const tipo = document.getElementById('entidad-tipo').value;
    const id = document.getElementById('entidad-id').value;
    const nombre = document.getElementById('entidad-nombre').value.trim();
    const telefono = document.getElementById('entidad-telefono').value.trim();
    const correo = document.getElementById('entidad-correo').value.trim();

    if (!nombre) return alert("El nombre es obligatorio.");

    btnGuardarEntidad.disabled = true;
    btnGuardarEntidad.innerText = "Guardando...";

    const datos = { nombre };
    if (tipo !== 'categorias') {
        datos.telefono = telefono;
        datos.correo = correo;
    }

    try {
        if (id) {
            datos.id = id;
            await apiPost(tipo, "update", datos);
            let coleccion = tipo === 'categorias' ? categorias : (tipo === 'clientes' ? clientes : proveedores);
            const index = coleccion.findIndex(i => i.id === id);
            coleccion[index] = { ...coleccion[index], ...datos };
        } else {
            datos.id = generarId();
            await apiPost(tipo, "create", datos);
            if(tipo === 'categorias') categorias.push(datos);
            if(tipo === 'clientes') clientes.push(datos);
            if(tipo === 'proveedores') proveedores.push(datos);
        }
        modalEntidad.style.display = 'none';
        window.renderizarEntidades();
    } catch (error) {
        alert("Error al guardar en Google Sheets.");
    } finally {
        btnGuardarEntidad.disabled = false;
        btnGuardarEntidad.innerText = "Guardar";
    }
});

async function eliminarEntidad(tipo, id) {
    // Validaciones estrictas del MVP 2
    if (tipo === 'categorias' && productos.some(p => p.categoriaId === id)) {
        return alert("No puedes eliminar esta categoría porque hay productos usándola.");
    }
    if (tipo === 'clientes' && ventasCerradas.some(v => v.clienteId === id)) {
        return alert("No puedes eliminar este cliente porque tiene ventas asociadas.");
    }
    if (tipo === 'proveedores' && comprasRegistradas.some(c => c.proveedorId === id)) {
        return alert("No puedes eliminar este proveedor porque tiene compras asociadas.");
    }

    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;

    try {
        document.getElementById('cargando-overlay').style.display = 'flex';
        await apiPost(tipo, "delete", { id });
        
        if (tipo === 'categorias') categorias = categorias.filter(c => c.id !== id);
        if (tipo === 'clientes') clientes = clientes.filter(c => c.id !== id);
        if (tipo === 'proveedores') proveedores = proveedores.filter(p => p.id !== id);
        
        window.renderizarEntidades();
    } catch (error) {
        alert("Error al eliminar en Google Sheets.");
    } finally {
        document.getElementById('cargando-overlay').style.display = 'none';
    }
}