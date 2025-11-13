# -------- STAGE 1: Builder --------
FROM node:lts-alpine AS builder

WORKDIR /app

# Copia apenas os arquivos de dependências
COPY package*.json ./

# Instala todas as dependências (dev + prod) para o build
RUN npm ci

# Copia o restante da aplicação
COPY . .

# Gera a versão buildada da aplicação
RUN npm run build


# -------- STAGE 2: Pre-Prod --------
FROM node:lts-alpine AS pre-prod

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm ci --omit=dev


# -------- STAGE 3: Production (Final) --------
FROM node:lts-alpine AS prod

WORKDIR /usr/src/app

# Copia apenas dependências de produção
COPY --from=pre-prod /app/node_modules ./node_modules

# Copia app buildado e package
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/.env ./.env

EXPOSE 1809

CMD ["npm", "run", "start:prod"]
