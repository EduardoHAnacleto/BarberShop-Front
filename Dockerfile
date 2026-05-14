# Multi-stage build for the Nuxt 3 frontend.
# Stage 1: install dependencies and build the app.
# Stage 2: lightweight runtime image with only the .output folder.

# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy manifest files first so npm install is cached when only source changes.
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and build args passed at compose time.
ARG NUXT_PUBLIC_API_BASE=http://api:8080
ARG NUXT_PUBLIC_GOOGLE_CLIENT_ID=

ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_GOOGLE_CLIENT_ID=$NUXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NODE_ENV=production

COPY . .
RUN npm run build

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Only the compiled output is needed at runtime.
COPY --from=builder /app/.output ./.output

EXPOSE 3001

CMD ["node", ".output/server/index.mjs"]
