#!/bin/bash

# Configuration
HASURA_URL="http://localhost:8082/v1/metadata"
ADMIN_SECRET="myadminsecretkey"

echo "🚀 Starting Hasura Metadata Recovery..."

# 1. Clear existing metadata (to fix desync)
echo "🧹 Clearing existing metadata..."
curl -s -X POST "$HASURA_URL" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: $ADMIN_SECRET" \
  -d '{
    "type": "replace_metadata",
    "args": {
      "version": 3,
      "sources": []
    }
  }' > /dev/null

# 2. Re-run seeding (which tracks tables and relationships)
echo "🌱 Re-running seeding to re-track tables..."
# This will be triggered by npm run dev.

echo "✅ Metadata cleared."
echo "👉 NEXT STEP: Run 'npm run dev' to re-track all tables and relationships automatically."
echo "👉 NOTE: Ensure Docker is running before starting the server."
