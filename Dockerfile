FROM node:22-alpine

# Install git, cron, rm, pm2, and wget/unzip for PocketBase
RUN apk update && \
    apk add --no-cache git dcron tzdata wget unzip && \
    npm install -g pm2

# Setup working directory
WORKDIR /app/code

# Download and install PocketBase Linux binary (auto-detects ARM64 or AMD64)
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ]; then PB_ARCH="arm64"; else PB_ARCH="amd64"; fi && \
    wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.12/pocketbase_0.22.12_linux_${PB_ARCH}.zip -O /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /tmp/pb_temp && \
    mv /tmp/pb_temp/pocketbase /usr/local/bin/pocketbase && \
    chmod +x /usr/local/bin/pocketbase && \
    rm -rf /tmp/pb.zip /tmp/pb_temp

# Copy the application source code (excluding Contents via .dockerignore)
COPY . .

# Set permissions for update script
RUN chmod +x update.sh

# Setup cron job to run daily at midnight (adjust the timing if needed)
RUN echo "0 0 * * * /app/update.sh >> /var/log/cron.log 2>&1" > /etc/crontabs/root

# Set environment to production and point to internal PocketBase
ENV NODE_ENV=production
ENV NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090

# Install dependencies first
RUN npm install --include=dev

# Start local PocketBase DB in background, run Next.js build, and stop it
RUN pocketbase serve --dir /app/pb_data & \
    PB_PID=$! && \
    sleep 3 && \
    npm run build; BUILD_EXIT=$?; \
    kill $PB_PID || true; \
    exit $BUILD_EXIT

# Expose Next.js and PocketBase ports
EXPOSE 3000
EXPOSE 8090

# Start cron daemon, Pocketbase, and the PM2 Next.js server
CMD crond -b && pocketbase serve --dir /app/pb_data --http="0.0.0.0:8090" & pm2-runtime start npm --name "nextjs" -- run start
