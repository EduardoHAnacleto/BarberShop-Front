# Multi-stage build for the Nuxt 3 frontend.
# Stage 1: install dependencies and build the app.
# Stage 2: lightweight runtime image with only the .output folder.

# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

ARG NUXT_PUBLIC_API_BASE=http://api:8080
ARG NUXT_PUBLIC_GOOGLE_CLIENT_ID=
# White-label identity + default locale (sprint12072026license §4) — the
# manifest name and the i18n route strategy are baked at build time, so each
# rented client instance builds its own frontend image with these args.
ARG NUXT_PUBLIC_SHOP_NAME=BarberShop
ARG DEFAULT_LOCALE=en
ARG NUXT_PUBLIC_SHOP_ADDRESS=
ARG NUXT_PUBLIC_SHOP_PHONE=
ARG NUXT_PUBLIC_SHOP_EMAIL=
ARG NUXT_PUBLIC_SHOP_LAT=
ARG NUXT_PUBLIC_SHOP_LNG=
ARG NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=

ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_GOOGLE_CLIENT_ID=$NUXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NUXT_PUBLIC_SHOP_NAME=$NUXT_PUBLIC_SHOP_NAME
ENV DEFAULT_LOCALE=$DEFAULT_LOCALE
ENV NUXT_PUBLIC_SHOP_ADDRESS=$NUXT_PUBLIC_SHOP_ADDRESS
ENV NUXT_PUBLIC_SHOP_PHONE=$NUXT_PUBLIC_SHOP_PHONE
ENV NUXT_PUBLIC_SHOP_EMAIL=$NUXT_PUBLIC_SHOP_EMAIL
ENV NUXT_PUBLIC_SHOP_LAT=$NUXT_PUBLIC_SHOP_LAT
ENV NUXT_PUBLIC_SHOP_LNG=$NUXT_PUBLIC_SHOP_LNG
ENV NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NUXT_PUBLIC_GOOGLE_MAPS_API_KEY

COPY . .
RUN npm run build

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=build /app/.output ./.output

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
