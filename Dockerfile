# syntax=docker/dockerfile:1
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
      echo "VITE_FIREBASE_EMULATOR_HOST=localhost:9099" >> .env && \
      echo "VITE_FIREBASE_API_KEY=emulator" >> .env && \
      echo "VITE_FIREBASE_PROJECT_ID=stream-watcher-dev" >> .env && \
      echo "VITE_FIREBASE_AUTH_DOMAIN=stream-watcher.firebaseapp.com" >> .env && \
      echo "VITE_FIREBASE_STORAGE_BUCKET=stream-watcher.appspot.com" >> .env && \
      echo "VITE_FIREBASE_MESSAGING_SENDER_ID=fake-sender-id" >> .env && \
      echo "VITE_FIREBASE_APP_ID=fake-app-id" >> .env; \
    fi

# Copy package files first for better caching
COPY package*.json ./
COPY packages/proxy/package*.json ./packages/proxy/

# Install dependencies with cache mount for faster builds
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps --ignore-scripts

# Copy source code after dependencies are installed
COPY src ./src
COPY public ./public
COPY index.html .
COPY vite.config.frontend.js ./
COPY vite.config.proxy.js ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./

# Build UI with optimized settings
RUN NODE_ENV=production npm run build:ui

# Stage 2: Build the proxy (reuse node_modules from stage 1)
FROM ui-builder AS proxy-builder
WORKDIR /app

# Copy proxy source
COPY packages/proxy/src ./packages/proxy/src
COPY packages/proxy/tsconfig.json ./packages/proxy/

# Dependencies already installed in previous stage
RUN npm run build:proxy

# Stage 3: Install production dependencies only
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/proxy/package*.json ./packages/proxy/

# Install only production dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm install --production --legacy-peer-deps --ignore-scripts

# Stage 4: Final runtime image
FROM node:20-alpine
WORKDIR /app

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built artifacts
COPY --from=ui-builder /app/dist ./dist
COPY --from=proxy-builder /app/packages/proxy/dist ./packages/proxy/dist
COPY --from=deps /app/node_modules ./node_modules

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8080
CMD ["node", "packages/proxy/dist/index.js"] 