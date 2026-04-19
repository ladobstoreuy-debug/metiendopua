# Metiendo Púa — Sitio Web

Canal de YouTube especializado en Rock y Pop de los 70s, 80s y 90s en vinilo.

## Estructura del proyecto

```
metiendo-pua-vercel/         ← root del repo en GitHub
├── public/
│   ├── index.html           ← Página principal
│   └── coleccion.html       ← Colección Discogs
├── api/
│   ├── chat.js              ← Proxy seguro Claude AI
│   └── discogs.js           ← Proxy seguro Discogs API
├── vercel.json              ← Configuración Vercel
└── README.md
```

## Deploy en Vercel (100% gratis, sin tarjeta)

### 1. Subir a GitHub
- Crear repositorio nuevo en github.com
- Subir TODOS los archivos manteniendo la estructura exacta

### 2. Conectar con Vercel
- Ir a vercel.com → "Sign up" con tu cuenta de GitHub (gratis)
- "Add New Project" → Import desde GitHub → seleccionar el repo
- Framework Preset: Other
- Output Directory: public
- Clic en "Deploy"

### 3. Configurar variables de entorno (GRATIS en Vercel)
En Vercel: Project Settings → Environment Variables

| Variable            | Valor                              |
|---------------------|------------------------------------|
| ANTHROPIC_API_KEY   | Tu key de console.anthropic.com    |
| DISCOGS_TOKEN       | Tu token de discogs.com/settings/developers |

Después: Deployments → Redeploy

## URLs del sitio
- /              → Página principal
- /coleccion     → Colección de vinilos Discogs

## Dominio propio (opcional)
Vercel: Project Settings → Domains → Add domain
