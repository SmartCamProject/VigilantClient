# Cliente Vigilante - Sistema de Monitoreo de Detecciones

Servidor Node.js que recibe detecciones del servidor de testeo y las muestra en una interfaz web.

## Requisitos

- Node.js (v14 o superior)
- npm

## Instalación

```bash
npm install express sqlite3
```

## Configuración

El servidor usa las siguientes variables de entorno (opcionales):

```bash
TV_PORT=9000      # Puerto para recibir detecciones (default: 9000)
UI_PORT=3000      # Puerto del servidor web (default: 3000)
```

## Ejecución

```bash
node app.js
```

Verás:

```
[TCP] Servidor escuchando en puerto 9000
[TCP] Esperando conexión del server.py...
[UI] Disponible en http://localhost:3000
```

## Acceso a la Interfaz Web

Abre tu navegador en:

```
http://localhost:3000
```

## Puertos Utilizados

| Puerto | Uso |
|--------|-----|
| 9000 | Recibe detecciones del servidor de testeo (Socket TCP) |
| 3000 | Interfaz web y API REST (HTTP) |

## Endpoints API

### GET /api/detections

Obtiene las detecciones almacenadas.

**Parámetros opcionales:**

- `label` - Filtrar por etiqueta (ej: `?label=person`)
- `camera` - Filtrar por cámara (ej: `?camera=WEBCAM_PC`)

**Ejemplo:**

```bash
curl http://localhost:3000/api/detections?label=apple
```

### GET /api/stats

Obtiene estadísticas de detecciones.

## Archivos Generados

- `data.db` - Base de datos SQLite con las detecciones
- `images/` - Carpeta con las imágenes de las detecciones

## Flujo de Datos

```
server.py → [detecciones JSON] → app.js:9000
                                          ↓
                                    [SQLite DB]
                                          ↓
                                  Navegador:3000
```

## Detener el Servidor

Presiona `Ctrl+C` en la terminal. Las detecciones se guardarán automáticamente.

## Notas

- Las detecciones se persisten en `data.db`
- Las imágenes se guardan en formato JPEG en `images/`
- El servidor se actualiza automáticamente cada 2 segundos en el navegador
- Máximo de 1000 detecciones en memoria (configurable en el código)
