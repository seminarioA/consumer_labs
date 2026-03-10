# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# install deps first (cache layer)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# copy source
COPY . .

# ElevenLabs key is optional — baked at build time if provided
ARG VITE_ELEVENLABS_API_KEY=""
ENV VITE_ELEVENLABS_API_KEY=$VITE_ELEVENLABS_API_KEY

RUN npm run build

# ─── Stage 2: Serve with nginx ────────────────────────────────────────────────
FROM nginx:1.27-alpine

# SPA config with reverse proxy to Ollama
COPY nginx.conf /etc/nginx/conf.d/default.conf

# built static assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
