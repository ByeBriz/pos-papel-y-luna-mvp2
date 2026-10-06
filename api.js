
const API_URL = "https://script.google.com/macros/s/AKfycbyKcIG_ptEgGWDkGbHa0zXjBNMKDQkXjbYL4rnrtlG7z6vehaBJe9-qYoonQTLSt-OC3A/exec"; 
async function apiGet(resource) {
    try {
        const res = await fetch(`${API_URL}?resource=${resource}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        return json.data;
    } catch (error) {
        console.error(`Error leyendo ${resource}:`, error);
        alert(`Error de conexión al cargar la base de datos de ${resource}.`);
        return [];
    }
}

async function apiPost(resource, action, data) {
    try {
        const res = await fetch(`${API_URL}?resource=${resource}`, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action, data })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        return json.data;
    } catch (error) {
        console.error(`Error en ${action} para ${resource}:`, error);
        throw error;
    }
}