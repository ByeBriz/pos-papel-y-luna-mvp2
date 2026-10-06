// historial.js
const tablaHistorial = document.getElementById('tabla-historial');

window.renderizarHistorialVentas = function() {
    tablaHistorial.innerHTML = '';
    if (ventasCerradas.length === 0) return;
    
    [...ventasCerradas].reverse().forEach(venta => {
        const cliente = clientes.find(c => c.id === venta.clienteId);
        const nombreCli = cliente ? cliente.nombre : 'Público General';
        const colorEstado = venta.estado === 'cerrada' ? 'var(--success-green)' : 'var(--action-blue)';
        
        let htmlBtn = `<button class="btn-icon" title="Ver Detalle" onclick="alert('Detalle:\\n${venta.items.map(i => i.cantidad + 'x ' + i.nombre).join('\\n')}')">📄</button>`;
        if (venta.estado === 'abierta') {
            htmlBtn += `<button class="btn-icon" title="Retomar Venta" onclick="window.retomarVentaAbierta('${venta.id}')">🛒</button>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${venta.id.substring(0,8)}</strong></td>
            <td>${new Date(venta.fecha).toLocaleDateString('es-CO')}</td>
            <td>${nombreCli}</td>
            <td style="color: ${colorEstado}; text-transform: uppercase; font-weight: bold; font-size: 11px;">${venta.estado}</td>
            <td>${venta.metodoPago || '-'}</td>
            <td style="font-weight: bold;">${formatearMoneda(venta.total)}</td>
            <td>${htmlBtn}</td>
        `;
        tablaHistorial.appendChild(tr);
    });
}