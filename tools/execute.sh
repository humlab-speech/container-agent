#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Load and export environment variables from .env
set -a
. "$ENV_FILE"
set +a

SCRIPTS_DIR="$(cd "$SCRIPT_DIR/../scripts" && pwd)"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <script-name.R> [extra args...]"
  echo ""
  echo "Available scripts:"
  for f in "$SCRIPTS_DIR"/*.R; do
    echo "  $(basename "$f")"
  done
  exit 1
fi

SCRIPT_NAME="$1"
shift

# Special command: show environment variables
if [ "$SCRIPT_NAME" = "env" ]; then
  echo "PROJECT_PATH=$PROJECT_PATH"
  echo "UPLOAD_PATH=$UPLOAD_PATH"
  echo "EMUDB_SESSIONS=$EMUDB_SESSIONS"
  echo "WRITE_META_JSON=$WRITE_META_JSON"
  echo "FILE_PATH=$FILE_PATH"
  exit 0
fi

# Resolve and validate the script path (prevent path traversal)
SCRIPT_PATH="$SCRIPTS_DIR/$SCRIPT_NAME"
REAL_SCRIPT="$(realpath -- "$SCRIPT_PATH" 2>/dev/null)" || { echo "Error: script '$SCRIPT_NAME' not found"; exit 1; }
REAL_SCRIPTS_DIR="$(realpath -- "$SCRIPTS_DIR")"
case "$REAL_SCRIPT" in
  "$REAL_SCRIPTS_DIR"/*) ;;
  *) echo "Error: invalid script path"; exit 1 ;;
esac

if [ ! -f "$REAL_SCRIPT" ]; then
  echo "Error: script '$SCRIPT_NAME' not found in $SCRIPTS_DIR"
  exit 1
fi

exec Rscript --no-environ "$REAL_SCRIPT" "$@"

