# ---------- Etapa 1: dependencias + build ----------
#
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependencias (usa el lockfile para builds reproducibles)
COPY package.json package-lock.json ./
RUN npm ci

# Copia el resto del código y compila
#
COPY . .
RUN npm run build

# Poda devDependencies para dejar solo lo necesario en runtime
RUN npm prune --omit=dev

# ---------- Etapa 2: imagen final de runtime ----------
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Usuario no-root
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

USER nestjs

EXPOSE 3030

CMD ["node", "dist/main"]
