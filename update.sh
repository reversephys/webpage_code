#!/bin/sh
# Daily maintenance, run from cron inside the container (see Dockerfile crontab):
#   1. pull the data repo (/app) AND the code sub-repo (/app/code) from GitHub
#   2. rebuild + reload the Next.js app if either changed
#   3. back up Contents/ and the PocketBase DB to the data repo
#
# Notes:
# - The build must run in /app/code (that is where package.json lives); the data
#   repo root /app has no package.json.
# - /app and /app/code are owned by the host user, not the container's root, so
#   they must be whitelisted as safe.directory or every git command fails with
#   "dubious ownership".
# - The remotes are git@github.com:... (SSH), so the image needs openssh-client.

# Route all git network operations through ssh with host-key auto-accept.
export GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=accept-new"

git config --global user.name "Docker Auto Backup"
git config --global user.email "docker@physicallab.com"
git config --global --add safe.directory /app
git config --global --add safe.directory /app/code
git config --global --add safe.directory /app/Contents

NEED_BUILD=0

# ==========================================
# Task 1a: Update data repo (/app)
# ==========================================
cd /app
git fetch origin main
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "$(date): Data repo updates found. Pulling..."
    if git pull origin main; then
        NEED_BUILD=1
    fi
fi

# ==========================================
# Task 1b: Update code sub-repo (/app/code)
# ==========================================
cd /app/code
OLD_PKG_HASH=$(shasum package.json | awk '{ print $1 }')
git fetch origin main
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "$(date): Code repo updates found. Resetting to origin/main..."
    # This is a deploy target: mirror origin exactly. reset --hard (rather than
    # pull) avoids merge failures from any local drift, e.g. file-mode changes.
    git reset --hard origin/main
    NEW_PKG_HASH=$(shasum package.json | awk '{ print $1 }')
    if [ "$OLD_PKG_HASH" != "$NEW_PKG_HASH" ]; then
        echo "package.json changed, running npm install..."
        npm install
    fi
    NEED_BUILD=1
fi

# ==========================================
# Rebuild + reload if either repo changed
# ==========================================
if [ "$NEED_BUILD" = "1" ]; then
    cd /app/code
    echo "$(date): Running npm run build..."
    npm run build
    echo "$(date): Reloading app (pm2)..."
    pm2 reload nextjs
else
    echo "$(date): No updates found."
fi

# ==========================================
# Task 2: Auto Backup Contents + PocketBase DB
# ==========================================
echo "$(date): Starting Contents backup..."
cd /app

git add Contents/ pb_data/data.db
# Only commit when Contents/ or data.db were actually staged (--cached ignores the
# unstaged code/ submodule-pointer drift left by Task 1b's reset).
if ! git diff-index --cached --quiet HEAD; then
    git commit -m "Auto backup: $(date)"
    git push origin main
    echo "$(date): Contents backup pushed successfully."
else
    echo "$(date): No changes in Contents to backup."
fi
