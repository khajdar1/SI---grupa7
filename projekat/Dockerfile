# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV DATABASE_URL=mysql://service_app:service_app@localhost:3306/service_interventions

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY backend/prisma backend/prisma
COPY backend/prisma.config.ts backend/prisma.config.ts

RUN npm ci
RUN npm run prisma:generate --workspace backend

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

FROM base AS backend-runtime
WORKDIR /app/backend
ENV NODE_ENV=production

COPY --from=backend-build /app/backend/dist dist

EXPOSE 4000
CMD ["npm", "run", "start"]

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