const net = require('net');
const fs = require('fs');
const path = require('path');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

// Configuración inicial
const TV_HOST = process.env.TV_HOST || '127.0.0.1';
const TV_PORT = parseInt(process.env.TV_PORT || '9000', 10);
const UI_PORT = parseInt(process.env.UI_PORT || '3000', 10);
const IMAGES_DIR = path.resolve(__dirname, 'images');
const DB_PATH = path.resolve(__dirname, 'data.db');

// Asegurar carpeta
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// DB SQLite
const db = new sqlite3.Database(DB_PATH);
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            camera_id TEXT,
            label TEXT,
            score REAL,
            timestamp TEXT,
            image_path TEXT
        )
    `);
});

// Guardar imagen desde base64
function saveImage(base64, filename) {
    const match = base64.match(/^data:.*;base64,(.*)$/);
    const raw = match ? match[1] : base64;
    const buffer = Buffer.from(raw, 'base64');

    const outPath = path.join(IMAGES_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    return outPath;
}

// Procesar detección
function handleDetection(msg) {
    const camera = msg.cameraId || "unknown";
    const label = msg.label || "unknown";
    const score = Number(msg.score || 0);
    const timestamp = msg.timestamp || new Date().toISOString();

    let filename = null;
    if (msg.image_b64) {
        const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, "_");
        filename = `${camera}_${safeLabel}_${Date.now()}.jpg`;
        saveImage(msg.image_b64, filename);
    }

    db.run(
        `INSERT INTO detections(camera_id,label,score,timestamp,image_path)
         VALUES (?,?,?,?,?)`,
        [camera, label, score, timestamp, filename],
        err => err && console.error("[DB] Error:", err.message)
    );
}

// Servidor TCP (recibe detecciones del server.py)
function startTcpServer() {
    const server = net.createServer((socket) => {
        console.log(`[TCP] Cliente conectado: ${socket.remoteAddress}:${socket.remotePort}`);

        let buffer = "";

        socket.on('data', chunk => {
            buffer += chunk.toString();
            let idx;

            while ((idx = buffer.indexOf("\n")) >= 0) {
                const line = buffer.slice(0, idx).trim();
                buffer = buffer.slice(idx + 1);

                if (line) {
                    try {
                        const json = JSON.parse(line);
                        console.log(`[TCP] Detección recibida: ${json.label} (${json.score}) - ${json.cameraId}`);
                        handleDetection(json);
                    } catch (err) {
                        console.error("[TCP] JSON inválido:", line);
                    }
                }
            }
        });

        socket.on('close', () => {
            console.log("[TCP] Cliente desconectado");
        });

        socket.on('error', (err) => {
            console.error("[TCP] Error:", err.message);
        });
    });

    server.listen(TV_PORT, '0.0.0.0', () => {
        console.log(`[TCP] Servidor escuchando en puerto ${TV_PORT}`);
        console.log(`[TCP] Esperando conexión del server.py...`);
    });
}

startTcpServer();

// EXPRESS
const app = express();

app.use("/images", express.static(IMAGES_DIR));
app.use(express.static(path.join(__dirname, "public")));

// API detecciones
app.get("/api/detections", (req, res) => {
    const { camera, label } = req.query;

    let sql = `SELECT * FROM detections`;
    const params = [];
    const where = [];

    if (camera) { where.push("camera_id = ?"); params.push(camera); }
    if (label) { where.push("label = ?"); params.push(label); }

    if (where.length) sql += " WHERE " + where.join(" AND ");
    sql += " ORDER BY id DESC LIMIT 200";

    db.all(sql, params, (err, rows) => {
        if (err) return res.json([]);
        rows = rows.map(r => ({
            ...r,
            imageUrl: r.image_path ? `/images/${r.image_path}` : null
        }));
        res.json(rows);
    });
});

app.listen(UI_PORT, () =>
    console.log(`[UI] Disponible en http://localhost:${UI_PORT}`)
);