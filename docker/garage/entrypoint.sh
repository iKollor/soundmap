#!/bin/bash
set -e

# Start Garage in background
/garage server &
GARAGE_PID=$!

# Wait for Garage API to be ready
echo "⏳ Waiting for Garage to start..."
for i in {1..30}; do
  if curl -s http://localhost:3902/health >/dev/null 2>&1; then
    echo "✓ Garage is up"
    break
  fi
  sleep 2
done

# Run auto-init script
/usr/local/bin/auto-init.sh

# Keep Garage running
wait $GARAGE_PID
