FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build
FROM node:22-bookworm-slim AS application
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY app ./app
COPY public ./public
RUN npm run build:app
FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=application /build/dist ./dist
COPY public ./public
COPY --from=frontend /build/dist ./frontend/dist
COPY frontend/public/writeupData.json ./frontend/public/writeupData.json
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "dist/app/server.js"]
