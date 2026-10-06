# Papelería Papel y Luna - Sistema POS (MVP 2)

## Descripción del Proyecto
Segunda versión del Producto Mínimo Viable (MVP 2) para el sistema de Punto de Venta (POS) de la Papelería Papel y Luna. Este sistema ha evolucionado de un almacenamiento local a una arquitectura conectada mediante peticiones asíncronas (`fetch`, `async/await`) a una API construida sobre Google Sheets usando Google Apps Script.

## Funcionalidades Principales
* **Gestión de Ventas:** Flujo de ventas con soporte para estados "abierta" y "cerrada", cálculos automáticos de totales, y cobros por Efectivo, Nequi o Debe.
* **Inventario Dinámico:** Las ventas descuentan stock automáticamente (bloqueando saldos negativos) y las compras incrementan stock y actualizan el costo del producto.
* **Integración API (Google Sheets):** Operaciones CRUD completas enviadas a la nube en tiempo real.
* **Gestión de Entidades:** Administración relacional estricta de Productos, Categorías, Clientes y Proveedores.
* **Responsive Design:** Interfaz "Modo Oscuro Premium" adaptable a dispositivos móviles.

## Tecnologías y Recursos Utilizados
* HTML5 / CSS3 (Grid & Flexbox)
* JavaScript Vanilla (ES6+, Promises, Async/Await, Template Literals)
* Google Apps Script (Backend API)
* Google Sheets (Base de datos relacional simulada)

## Instrucciones de Ejecución
Al estar desplegado completamente en frontend con consumo de API, no requiere instalación de dependencias ni servidores locales (Node.js).
1. Descargar y descomprimir el código fuente.
2. Abrir el archivo `index.html` en cualquier navegador web moderno (Google Chrome, Firefox, Safari).
3. **Alternativa recomendada:** Acceder directamente a la versión desplegada en producción a través de GitHub Pages.