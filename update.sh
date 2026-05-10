#!/bin/sh
cd /app
git fetch origin main

# Check if there are updates on the remote branch
if [ "$(git rev-parse HEAD)" != "$(git rev-parse @{u})" ]; then
    echo "$(date): Updates found. Pulling latest code..."
    
    # Store current package.json hash to see if we need to npm install
    OLD_PKG_HASH=$(shasum package.json | awk '{ print $1 }')
    
    git pull origin main
    
    NEW_PKG_HASH=$(shasum package.json | awk '{ print $1 }')
    
    # Run npm install if package.json has changed
    if [ "$OLD_PKG_HASH" != "$NEW_PKG_HASH" ]; then
        echo "package.json changed, running npm install..."
        npm install
    fi
    
    echo "Running npm run build..."
    npm run build
    
    echo "Restarting application..."
    pm2 reload nextjs
else
    echo "$(date): No updates found."
fi

# ==========================================
# Task 2: Auto Backup Contents
# ==========================================
echo "$(date): Starting Contents backup..."
cd /app

# Set git identity just for this container
git config --global user.name "Docker Auto Backup"
git config --global user.email "docker@physicallab.com"

# Add trusting directory inside docker
git config --global --add safe.directory /app/Contents

git add Contents/ pb_data/data.db
# Check if there are changes to commit
if ! git diff-index --quiet HEAD; then
    git commit -m "Auto backup: $(date)"
    
    # Bypass StrictHostKeyChecking since container doesn't have known_hosts
    GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new" git push origin main
    
    echo "$(date): Contents backup pushed successfully."
else
    echo "$(date): No changes in Contents to backup."
fi
