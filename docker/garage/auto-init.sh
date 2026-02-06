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
LAYOUT_ASSIGNED=$(/garage layout show 2>/dev/null | grep -c "ASSIGNED" || true)
STAGED_CHANGES=$(/garage layout show 2>/dev/null | grep -c "staged" || true)

if [ "$LAYOUT_ASSIGNED" -eq "0" ]; then
  echo "📝 Configuring cluster layout..."
  
  # Assign role to node
  /garage layout assign "$NODE_ID" -c ${GARAGE_CAPACITY:-10G} -z ${GARAGE_ZONE:-local}
  
  # Get current layout version and increment
  CURRENT_VERSION=$(/garage layout show 2>/dev/null | grep "Current cluster layout version" | awk '{print $NF}' || echo "0")
  NEXT_VERSION=$((CURRENT_VERSION + 1))
  
  echo "📊 Applying layout version $NEXT_VERSION..."
  /garage layout apply --version "$NEXT_VERSION"
  
  echo "✅ Cluster initialized successfully"
elif [ "$STAGED_CHANGES" -gt "0" ]; then
  echo "📝 Applying staged layout changes..."
  
  # Get current layout version and increment
  CURRENT_VERSION=$(/garage layout show 2>/dev/null | grep "Current cluster layout version" | awk '{print $NF}' || echo "0")
  NEXT_VERSION=$((CURRENT_VERSION + 1))
  
  /garage layout apply --version "$NEXT_VERSION"
  echo "✅ Staged changes applied"
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
