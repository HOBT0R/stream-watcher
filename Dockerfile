# Stage 1: Build the UI
FROM node:20-alpine AS ui-builder
WORKDIR /app
COPY package*.json ./
COPY src ./src
COPY public ./public
COPY index.html .
COPY vite.config.frontend.js ./
COPY vite.config.proxy.js ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./

# Set all build-time environment variables in a single block
# This ensures they are all available for the Vite build process.
ENV VITE_USE_AUTH_EMULATOR="true" \
    VITE_FIREBASE_EMULATOR_HOST="127.0.0.1:9099" \
    VITE_FIREBASE_API_KEY="emulator" \
    VITE_FIREBASE_PROJECT_ID="stream-watcher-dev" \
    VITE_FIREBASE_AUTH_DOMAIN="stream-watcher.firebaseapp.com" \
    VITE_FIREBASE_STORAGE_BUCKET="stream-watcher.appspot.com" \
    VITE_FIREBASE_MESSAGING_SENDER_ID="fake-sender-id" \
    VITE_FIREBASE_APP_ID="fake-app-id"

RUN npm install --legacy-peer-deps --ignore-scripts
RUN npm run build:ui:force

# Stage 2: Build the proxy
FROM node:20-alpine AS proxy-builder
WORKDIR /app
COPY package*.json ./
COPY packages/proxy/package*.json ./packages/proxy/
COPY packages/proxy/src ./packages/proxy/src
COPY packages/proxy/tsconfig.json ./packages/proxy/
RUN npm install --legacy-peer-deps --ignore-scripts -w packages/proxy
RUN npm run build:proxy

# Stage 3: Install production dependencies for the proxy only
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY packages/proxy/package*.json ./packages/proxy/
RUN npm install --production --legacy-peer-deps --ignore-scripts


# Stage 4: Final runtime image
FROM node:20-alpine
WORKDIR /app
COPY --from=ui-builder /app/dist ./dist
COPY --from=proxy-builder /app/packages/proxy/dist ./packages/proxy/dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 8080
CMD ["node", "packages/proxy/dist/index.js"] 