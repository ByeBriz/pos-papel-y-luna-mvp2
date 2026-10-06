// datos.js
let productos = [];
let ventasCerradas = [];
let comprasRegistradas = [];
let categorias = [];
let clientes = [];
let proveedores = [];

let carritoFactura = [];
const TASA_IVA = 0.19;
let totalVentaActual = 0;

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);
}


function generarId() {
    return (typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}


async function inicializarSistema() {
    const overlay = document.getElementById('cargando-overlay');
    if(overlay) overlay.style.display = 'flex'; 
    
    try {

        [productos, ventasCerradas, categorias, clientes, proveedores, comprasRegistradas] = await Promise.all([
            apiGet("productos"),
            apiGet("ventas"),
            apiGet("categorias"),
            apiGet("clientes"),
            apiGet("proveedores"),
            apiGet("compras")
        ]);
        

        ventasCerradas.forEach(v => { if (typeof v.itemsJson === 'string') v.items = JSON.parse(v.itemsJson); });
        comprasRegistradas.forEach(c => { if (typeof c.itemsJson === 'string') c.items = JSON.parse(c.itemsJson); });


        if (typeof renderizarCatalogo === 'function') renderizarCatalogo(productos);
        if (typeof renderizarHistorialVentas === 'function') window.renderizarHistorialVentas();
        
    } catch (error) {
        alert("Error crítico al sincronizar los datos con Google Sheets.");
    } finally {
        if(overlay) overlay.style.display = 'none';
    }
}


window.addEventListener('DOMContentLoaded', inicializarSistema);
