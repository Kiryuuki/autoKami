# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (adjust paths for root context)
COPY app/package*.json ./
COPY app/frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install

# Copy source code
# Copy app folder contents to /app
COPY app/ .
# Copy abi and ids folders from root to /app/abi and /app/ids
COPY abi/ ./abi
COPY ids/ ./ids
COPY mapping/ ./mapping

# Build args for frontend
ARG VITE_PRIVY_APP_ID
ARG VITE_API_URL
ARG VITE_KAMI_IMAGE_BASE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set as env vars for build
ENV VITE_PRIVY_APP_ID=$VITE_PRIVY_APP_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KAMI_IMAGE_BASE_URL=$VITE_KAMI_IMAGE_BASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build frontend
RUN cd frontend && npm run build

# Build backend
RUN npm run build
RUN echo "Listing dist folder:" && ls -R dist
RUN echo "Listing abi folder:" && ls -R abi

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY app/package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/abi ./abi
COPY --from=builder /app/ids ./ids
COPY --from=builder /app/mapping ./mapping

# Copy env file from app/ folder
COPY app/.env .env

# Expose port
EXPOSE 3000

# Env vars (default)
ENV PORT=3000
ENV NODE_ENV=production

# Start server
CMD ["node", "dist/src/index.js"]
