###############################################################################
# 1) Etapa de build – instala deps y compila TypeScript a JavaScript
###############################################################################
FROM node:20-alpine AS builder

# Habilita pnpm si lo usas; si prefieres npm, elimina esas dos líneas
RUN corepack enable && corepack prepare pnpm@^9.0.0 --activate

WORKDIR /usr/src/app

# Copiamos primero los manifiestos para aprovechar la caché
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# ---- Instala dependencias de desarrollo ----
# Si usas pnpm
RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    else npm ci; fi

# Copiamos el resto del código fuente
COPY . .

# ---- Compila TypeScript -> dist/  ----
RUN pnpm run build          # o: pnpm run build  (ambos funcionan con npm/pnpm)

###############################################################################
# 2) Etapa de runtime – imagen mínima solo con código JS y deps de prod
###############################################################################
FROM node:20-alpine

# Ejecutar como usuario no root (UID 10001 viene en la imagen node:alpine)
USER 10001
WORKDIR /usr/src/app

# Copiamos artefactos de la etapa builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package.json . 

# Puerto que expondrá el contenedor
EXPOSE 4000

# Comando de arranque
CMD ["node", "dist/main.js"]
