#!/bin/bash
set -e

echo "🚀 Garage Auto-Init Script"

# Wait for Garage to start
sleep 5

# Get node ID
NODE_ID=$(/garage status 2>/dev/null | grep '127.0.0.1:3901' | awk '{print $1}')

if [ -z "$NODE_ID" ]; then
  echo "❌ Could not get node ID"
  exit 1
fi

echo "✓ Node ID: $NODE_ID"

# Check if layout is already configured
LAYOUT_VERSION=$(/garage layout show 2>/dev/null | grep -c "ASSIGNED" || true)

if [ "$LAYOUT_VERSION" -eq "0" ]; then
  echo "📝 Configuring cluster layout..."
  
  # Assign role to node
  /garage layout assign "$NODE_ID" -c ${GARAGE_CAPACITY:-10G} -z ${GARAGE_ZONE:-local}
  
  # Apply layout
  /garage layout apply --version 1
  
  echo "✅ Cluster initialized successfully"
else
  echo "✓ Cluster already configured"
fi

# Create S3 key if it doesn't exist
KEY_NAME="soundmap-app"
EXISTING_KEY=$(/garage key list 2>/dev/null | grep -c "$KEY_NAME" || true)

if [ "$EXISTING_KEY" -eq "0" ]; then
  echo "🔑 Creating S3 access key..."
  /garage key create "$KEY_NAME"
  
  echo ""
  echo "=========================================="
  echo "🔐 S3 CREDENTIALS (save these!):"
  echo "=========================================="
  /garage key info "$KEY_NAME"
  echo "=========================================="
  echo ""
else
  echo "✓ S3 key already exists"
  /garage key info "$KEY_NAME"
fi

# Create buckets if they don't exist
for BUCKET in sounds waveforms; do
  BUCKET_EXISTS=$(/garage bucket list 2>/dev/null | grep -c "$BUCKET" || true)
  if [ "$BUCKET_EXISTS" -eq "0" ]; then
    echo "📦 Creating bucket: $BUCKET"
    /garage bucket create "$BUCKET"
    /garage bucket allow "$BUCKET" --read --write --key "$KEY_NAME"
  else
    echo "✓ Bucket $BUCKET already exists"
  fi
done

echo "✅ Garage is ready!"
