# Consumer Labs — Setup & Run Guide

## Requisitos

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| Node.js     | 18+           | https://nodejs.org |
| Ollama      | cualquiera    | https://ollama.com |

---

## 1. Instalar Node.js

Descarga el instalador LTS de https://nodejs.org/es y sigue los pasos.
Verifica la instalación abriendo una terminal nueva y ejecutando:
```
node --version
npm --version
```

---

## 2. Instalar Ollama y descargar Phi-3 Mini

```bash
# Instalar Ollama (Windows): descargar en https://ollama.com/download
# Luego en terminal:
ollama pull phi3:mini
```

Mantén Ollama corriendo en segundo plano (se inicia automáticamente en Windows).

---

## 3. Configurar el proyecto

```bash
cd "C:\Users\ALEJANDRO\Documents\CONSUMER LABS"
npm install
```

---

## 4. (Opcional) Configurar ElevenLabs para voces naturales

1. Crea una cuenta gratis en https://elevenlabs.io
2. Copia tu API Key
3. Crea el archivo `.env.local` en la raíz del proyecto:

```
VITE_ELEVENLABS_API_KEY=tu_clave_aqui
```

O bien puedes ingresarla dentro de la app en **Configuración ⚙️**.

Si no tienes clave, el sistema usará automáticamente la Web Speech API del navegador.

---

## 5. Iniciar la aplicación

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

---

## 6. Agregar consumidores desde documentos

1. Haz clic en **"+ Nuevo Perfil"** en la barra lateral.
2. Arrastra o selecciona archivos PDF, Word (.docx) o Excel (.xlsx) con entrevistas o encuestas.
3. Haz clic en **"Generar Perfil"** — Phi-3 Mini analizará el texto y creará el consumidor.

Formatos soportados: `.pdf`, `.docx`, `.doc`, `.xlsx`, `.xls`, `.csv`

---

## Arquitectura

```
Consumer Labs/
├── src/
│   ├── App.jsx              # App principal
│   ├── WiiAvatar.jsx        # Avatar SVG animado estilo Mii/Wii
│   ├── ConsumerCreator.jsx  # Modal para crear consumidores desde docs
│   ├── SettingsPanel.jsx    # Configuración Ollama + ElevenLabs
│   ├── consumers.js         # Datos de consumidores + generador
│   ├── documentParser.js    # Parser PDF/DOCX/XLSX
│   ├── ttsService.js        # TTS ElevenLabs + Web Speech fallback
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```
