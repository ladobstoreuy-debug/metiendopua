# Metiendo Púa — Sitio Web

Canal de YouTube especializado en Rock y Pop de los 70s, 80s y 90s en vinilo.

## Estructura del proyecto

```
metiendo-pua-netlify/
├── public/
│   ├── index.html              ← Página principal
│   └── coleccion.html          ← Colección Discogs
├── netlify/
│   └── functions/
│       ├── chat.js             ← Proxy seguro Claude AI
│       └── discogs.js          ← Proxy seguro Discogs API
├── netlify.toml                ← Configuración Netlify
└── README.md
```

## Deploy en Netlify

### 1. Subir a GitHub
- Crear repositorio en github.com
- Subir TODOS los archivos manteniendo la estructura de carpetas exacta

### 2. Conectar con Netlify
- netlify.com → "Add new site" → "Import from Git"
- Seleccionar el repositorio
- Publish directory: `public`
- Clic en "Deploy"

### 3. Configurar variables de entorno (OBLIGATORIO)

En Netlify: **Site settings → Environment variables → Add variable**

| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | API Key de console.anthropic.com |
| `DISCOGS_TOKEN` | Token de discogs.com/settings/developers |

Después de agregar las variables: **Deploys → Trigger deploy**

## Obtener tokens

**Anthropic (Claude AI):**
1. console.anthropic.com → crear cuenta
2. API Keys → Create Key

**Discogs:**
1. discogs.com → Settings → Developers
2. Generate new token
3. ⚠️ NUNCA expongas el token en el código fuente

## Páginas
- `/` → Inicio con videos de YouTube y chat IA
- `/coleccion` → Colección completa de Discogs con búsqueda y filtros

