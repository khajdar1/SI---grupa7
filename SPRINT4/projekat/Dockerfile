# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci

FROM base AS backend-build
COPY backend/ backend/
RUN npm run build --workspace backend

FROM base AS frontend-build
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}

COPY frontend/ frontend/
RUN npm run build --workspace frontend

FROM node:20-bookworm-slim AS backend-runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/package.json /app/package.json
COPY --from=base /app/package-lock.json /app/package-lock.json
COPY backend/package.json backend/package.json
COPY --from=backend-build /app/backend/dist backend/dist

EXPOSE 4000
CMD ["npm", "run", "start", "--workspace", "backend"]

FROM node:20-bookworm-slim AS frontend-runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/package.json /app/package.json
COPY --from=base /app/package-lock.json /app/package-lock.json
COPY frontend/package.json frontend/package.json
COPY frontend/next.config.mjs frontend/next.config.mjs
COPY --from=frontend-build /app/frontend/.next frontend/.next

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "frontend"]