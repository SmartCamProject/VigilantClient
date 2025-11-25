const tableContainer = document.getElementById("tableContainer");
const filterLabel = document.getElementById("filterLabel");
const filterCamera = document.getElementById("filterCamera");
const btnRefresh = document.getElementById("btnRefresh");

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

async function loadDetections() {
    const params = new URLSearchParams();
    if (filterLabel.value.trim()) params.set("label", filterLabel.value.trim());
    if (filterCamera.value.trim()) params.set("camera", filterCamera.value.trim());

    const res = await fetch(`/api/detections?${params.toString()}`);
    const rows = await res.json();

    renderTable(rows);
}

function renderTable(rows) {
    if (rows.length === 0) {
        tableContainer.innerHTML = `<div class="empty">No hay detecciones.</div>`;
        return;
    }

    const tr = rows.map(r => `
        <tr>
            <td>
                ${r.imageUrl ? `<img class="thumb" src="${r.imageUrl}" />` : ""}
            </td>
            <td>
                <b>${escapeHtml(r.label)}</b><br/>
                <small>Score: ${r.score.toFixed(2)}</small><br/>
                <small>Cámara: ${escapeHtml(r.camera_id)}</small>
            </td>
            <td>
                ${new Date(r.timestamp).toLocaleString()}
            </td>
            <td>
                ${r.imageUrl ? `<a href="${r.imageUrl}" target="_blank">Ver</a>` : ""}
            </td>
        </tr>
    `).join("");

    tableContainer.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Imagen</th>
                    <th>Detección</th>
                    <th>Fecha / Hora</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>${tr}</tbody>
        </table>
    `;
}

btnRefresh.addEventListener("click", loadDetections);
setInterval(loadDetections, 2000);
loadDetections();
