# Stage 1: Build the UI
FROM node:20-alpine AS ui-builder
WORKDIR /app

# Accept the environment file content from a secret for production builds.
ARG FIREBASE_BUILD_ENV
# Accept the Project ID from the Cloud Build environment. This is used for the UI build
# to ensure the client-side code knows which Firebase project to connect to.
ARG VITE_FIREBASE_PROJECT_ID

# Check if FIREBASE_BUILD_ENV is provided. If so, use it to create .env.
# Otherwise, create a fallback .env file for local Docker development.
RUN if [ -n "$FIREBASE_BUILD_ENV" ]; then \
      echo "Using FIREBASE_BUILD_ENV from build-arg" && \
      echo "$FIREBASE_BUILD_ENV" > .env && \
      echo "VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID" >> .env; \
    else \
      echo "FIREBASE_BUILD_ENV not provided, creating default .env for local Docker" && \
      echo "VITE_USE_AUTH_EMULATOR=true" > .env && \
      echo "VITE_FIREBASE_EMULATOR_HOST=auth-emulator:9099" >> .env && \
      echo "VITE_FIREBASE_API_KEY=emulator" >> .env && \
      echo "VITE_FIREBASE_PROJECT_ID=stream-watcher-dev" >> .env && \
      echo "VITE_FIREBASE_AUTH_DOMAIN=stream-watcher.firebaseapp.com" >> .env && \
      echo "VITE_FIREBASE_STORAGE_BUCKET=stream-watcher.appspot.com" >> .env && \
      echo "VITE_FIREBASE_MESSAGING_SENDER_ID=fake-sender-id" >> .env && \
      echo "VITE_FIREBASE_APP_ID=fake-app-id" >> .env; \
    fi

COPY package*.json ./
COPY src ./src
COPY public ./public
COPY index.html .
COPY vite.config.frontend.js ./
COPY vite.config.proxy.js ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./

# The hardcoded ENV block is no longer needed, as variables are now in .env
# RUN npm install ... (this is now run after creating .env)
RUN npm install --legacy-peer-deps --ignore-scripts
RUN npm run build:ui

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