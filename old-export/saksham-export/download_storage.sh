#!/usr/bin/env bash
# Download every file listed in storage_manifest.csv into ./storage/<bucket>/<path>
set -euo pipefail
BASE="https://wfwimdmeovowqhqjduop.supabase.co/storage/v1/object/public"
mkdir -p storage
tail -n +2 storage_manifest.csv | while IFS=',' read -r bucket name rest; do
  bucket=${bucket//\"/}; name=${name//\"/}
  out="storage/$bucket/$name"
  mkdir -p "$(dirname "$out")"
  echo "→ $bucket/$name"
  curl -sfL "$BASE/$bucket/$name" -o "$out" || echo "  ! failed"
done
