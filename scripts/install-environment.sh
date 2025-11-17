#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() {
  echo "[install] $1"
}

ensure_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[install] Error: Required command '$1' not found. Please install it before continuing." >&2
    exit 1
  fi
}

log "Checking prerequisites"
ensure_command node
ensure_command npm

# Python is optional for users who only need the web app, so only warn when missing.
if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  PYTHON_BIN=""
  log "Warning: Python is not installed. Streamlit features will be unavailable until Python is installed."
fi

if command -v pip3 >/dev/null 2>&1; then
  PIP_BIN="pip3"
elif command -v pip >/dev/null 2>&1; then
  PIP_BIN="pip"
else
  PIP_BIN=""
  if [ -n "$PYTHON_BIN" ]; then
    log "Warning: pip is not installed. Install pip to set up the Streamlit dependencies."
  fi
fi

log "Installing Node.js dependencies"
npm install

if [ -f requirements.txt ] && [ -n "$PYTHON_BIN" ] && [ -n "$PIP_BIN" ]; then
  log "Installing Streamlit (Python) dependencies"
  "$PYTHON_BIN" -m "$PIP_BIN" install --upgrade pip >/dev/null 2>&1 || true
  "$PYTHON_BIN" -m pip install -r requirements.txt
else
  if [ -f requirements.txt ]; then
    log "Skipping Streamlit dependencies because Python or pip is missing."
  fi
fi

log "Environment installation complete!"
