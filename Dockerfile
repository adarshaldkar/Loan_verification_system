# ── Multi-stage Dockerfile for Next.js Frontend ──
FROM node:20-bookworm-slim AS deps
WORKDIR /srv/lvms-web
COPY package.json ./
RUN npm install

FROM node:20-bookworm-slim AS builder
WORKDIR /srv/lvms-web
COPY --from=deps /srv/lvms-web/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /srv/lvms-web
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /srv/lvms-web/public ./public
COPY --from=builder /srv/lvms-web/.next ./.next
COPY --from=builder /srv/lvms-web/node_modules ./node_modules
COPY --from=builder /srv/lvms-web/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
