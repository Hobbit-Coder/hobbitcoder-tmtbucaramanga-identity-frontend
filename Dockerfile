# Imagen de producción del frontend de Identity.
# nginx sin privilegios sirve la SPA por HTTP en el puerto 8080: el HTTPS lo termina Traefik (Dokploy),
# que envía /api/... y /.well-known/... a la API de Identity y el resto de
# https://identity.tmtbucaramanga.com aquí.

FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable

# Primero solo las dependencias: la instalación queda en caché mientras no cambien.
# --ignore-scripts: pnpm 12 rechaza por defecto los scripts de instalación de esbuild, lmdb,
# msgpackr-extract y @parcel/watcher. El build no los necesita (esbuild trae su binario como
# dependencia opcional; los demás son aceleradores con alternativa).
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm ng build --configuration production

FROM nginxinc/nginx-unprivileged:1.29-alpine AS final

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist/hobbitcoder-tmtbucaramanga-identity/browser /usr/share/nginx/html

EXPOSE 8080
