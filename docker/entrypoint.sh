#!/bin/sh
set -e

echo "Starting AIPLC..."

# Start nginx in background
nginx &

# Start FastAPI backend
echo "Starting backend on :8001..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 1
