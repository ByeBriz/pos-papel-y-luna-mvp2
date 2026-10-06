// navegacion.js
document.getElementById('nav-principal').addEventListener('click', (evento) => {
    if (evento.target.classList.contains('btn-nav')) {
        const nombreVista = evento.target.getAttribute('data-vista');
        
        ['ventas', 'productos', 'compras', 'entidades', 'historial'].forEach(v => {
            const vista = document.getElementById(`vista-${v}`);
            if(vista) vista.style.display = 'none';
        });
        document.querySelectorAll('.btn-nav').forEach(btn => btn.classList.remove('activo'));

        // Cargar datos "frescos" al entrar a cada módulo si es necesario
        if(nombreVista === 'entidades') window.renderizarEntidades();
        if(nombreVista === 'productos') window.renderizarTablaProductos();
        if(nombreVista === 'compras') window.renderizarCompras();
        if(nombreVista === 'historial') window.renderizarHistorialVentas();

        if (nombreVista === 'ventas') {
            document.getElementById('vista-ventas').style.display = 'flex'; 
        } else {
            document.getElementById(`vista-${nombreVista}`).style.display = 'flex';
        }
        
        evento.target.classList.add('activo');
    }
});