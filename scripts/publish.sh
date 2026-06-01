#!/usr/bin/env bash

set -euo pipefail

CURRENT_VER=$(jq -r .version package.json)
PKG_NAME=$(jq -r .name package.json)
PUBLISHED_VER=$(npm --no-workspaces view "$PKG_NAME" version 2>/dev/null || echo "")

if [[ "$PUBLISHED_VER" == "$CURRENT_VER" ]]; then
  exit 0
fi

ARCHIVE="${PWD}/archive.tgz"
bun pm pack --filename "$ARCHIVE"
npm --no-workspaces publish "$ARCHIVE" --access public "$@"
rm -rf "$ARCHIVE"
