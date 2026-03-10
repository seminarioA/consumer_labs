#!/bin/sh
# Inicia el servidor Ollama en segundo plano,
# espera que esté listo, descarga phi3:mini si no existe,
# y luego bloquea en el proceso principal.

set -e

echo "[ollama] Iniciando servidor..."
ollama serve &
SERVER_PID=$!

# Esperar a que el servidor responda en el puerto 11434
echo "[ollama] Esperando a que el servidor esté listo..."
until curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 1
done

echo "[ollama] Servidor listo. Verificando modelo phi3:mini..."

# Descarga el modelo solo si no existe ya en el volumen
if ! ollama list | grep -q "phi3:mini"; then
  echo "[ollama] Descargando phi3:mini (~2.2 GB, primera vez)..."
  ollama pull phi3:mini
  echo "[ollama] Descarga completada."
else
  echo "[ollama] phi3:mini ya está disponible."
fi

echo "[ollama] Listo para recibir solicitudes."

# Mantener el proceso del servidor en primer plano
wait $SERVER_PID
