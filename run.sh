#!/bin/bash

# Move to the script's directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "Starting Database (PocketBase)..."
cd backend
./pocketbase.exe serve --dir ../../pb_data &
PB_PID=$!

# Move back to the webpage directory
cd ..

# Trap Ctrl+C (SIGINT) and script exit to terminate PocketBase gracefully
trap "echo -e '\nStopping PocketBase...'; kill $PB_PID; exit 0" SIGINT SIGTERM EXIT

echo "Starting Webpage (Next.js)..."
npm run dev
