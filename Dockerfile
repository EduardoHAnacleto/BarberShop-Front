# Multi-stage build for the Nuxt 3 frontend.
# Stage 1: install dependencies and build the app.
# Stage 2: lightweight runtime image with only the .output folder.

# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

ARG NUXT_PUBLIC_API_BASE=http://api:8080
ARG NUXT_PUBLIC_GOOGLE_CLIENT_ID=

ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_GOOGLE_CLIENT_ID=$NUXT_PUBLIC_GOOGLE_CLIENT_ID

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
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
