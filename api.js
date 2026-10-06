
const API_URL = "https://script.google.com/macros/s/AKfycbwWs1v958iL4q_R9YrcQ7a3oD3i9rnDhUNx1odJx5-3U-o2i6-FhdF8z2r-0pK5IB_b6Q/exec"; 
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