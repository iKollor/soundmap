#!/bin/bash
set -e

echo "🚀 Garage Auto-Init Script"

# Wait for Garage to start
sleep 5

# Get node ID
NODE_ID=$(garage status 2>/dev/null | grep '127.0.0.1:3901' | awk '{print $1}')

if [ -z "$NODE_ID" ]; then
  echo "❌ Could not get node ID"
  exit 1
fi

echo "✓ Node ID: $NODE_ID"

# Check if layout is already configured
LAYOUT_VERSION=$(garage layout show 2>/dev/null | grep -c "ASSIGNED" || true)

if [ "$LAYOUT_VERSION" -eq "0" ]; then
  echo "📝 Configuring cluster layout..."
  
  # Assign role to node
  garage layout assign "$NODE_ID" -c ${GARAGE_CAPACITY:-10G} -z ${GARAGE_ZONE:-local}
  
  # Apply layout
  garage layout apply --version 1
  
  echo "✅ Cluster initialized successfully"
else
  echo "✓ Cluster already configured"
fi

echo "✅ Garage is ready!"
