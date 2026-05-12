# --- ETAPA 1: Dependencias ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
COPY /src/prisma ./prisma/
# Reducir max-old-space-size a 500MB (suficiente para npm ci en GitHub Actions)
RUN NODE_OPTIONS="--max-old-space-size=500" npm ci

# --- ETAPA 2: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma/
COPY . .
RUN npx prisma generate

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build
# Limpiar dependencias de desarrollo
RUN npm prune --production

# --- ETAPA 3: Runner (imagen final pequeña) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Copiamos solo lo necesario para producción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/prisma ./src/prisma
# Asumiendo que tienes un prisma.config.ts en raíz
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# Copiamos el script de arranque
COPY docker-bootstrap.sh ./docker-bootstrap.sh

# Dar permisos de ejecución al script
RUN chmod +x ./docker-bootstrap.sh

# Creamos el grupo y el usuario de seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Le damos permiso al usuario nestjs para que pueda escribir el schema.gql
RUN chown -R nestjs:nodejs /app/src

# Nos cambiamos al usuario nestjs
USER nestjs

EXPOSE 3000

# Usamos el script como punto de entrada
ENTRYPOINT ["./docker-bootstrap.sh"]