#!/usr/bin/env bash
set -euo pipefail

EXPECTED_NODE_MAJOR="${EXPECTED_NODE_MAJOR:-20}"
EXPECTED_NPM_MAJOR="${EXPECTED_NPM_MAJOR:-10}"
NVM_TARGET="${NVM_TARGET:-20}"
NPM_TARGET="${NPM_TARGET:-10.9.4}"

runtime_exit() {
  local code="${1:-0}"
  if [[ "${BASH_SOURCE[0]}" != "$0" ]]; then
    return "$code"
  fi
  exit "$code"
}

read_major() {
  local version="$1"
  version="${version#v}"
  echo "${version%%.*}"
}

read_node_version() {
  if command -v node >/dev/null 2>&1; then
    node -v | tr -d '[:space:]'
  else
    echo ""
  fi
}

read_npm_version() {
  if command -v npm >/dev/null 2>&1; then
    npm -v | tr -d '[:space:]'
  else
    echo ""
  fi
}

node_version="$(read_node_version)"
npm_version="$(read_npm_version)"
node_major="$(read_major "${node_version:-0}")"
npm_major="$(read_major "${npm_version:-0}")"

if [[ "$node_major" == "$EXPECTED_NODE_MAJOR" && "$npm_major" == "$EXPECTED_NPM_MAJOR" ]]; then
  echo "[RUNTIME] OK: node=${node_version}, npm=${npm_version}"
  runtime_exit 0
fi

echo "[RUNTIME] Runtime mismatch detected: node=${node_version:-missing}, npm=${npm_version:-missing}"
echo "[RUNTIME] Switching to Node ${NVM_TARGET}.x and npm ${EXPECTED_NPM_MAJOR}.x..."

NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if ! command -v nvm >/dev/null 2>&1; then
  if [[ -s "${NVM_DIR}/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    . "${NVM_DIR}/nvm.sh"
  fi
fi

if ! command -v nvm >/dev/null 2>&1; then
  echo "[RUNTIME] ERROR: nvm is not available."
  echo "[RUNTIME] Install nvm, then retry."
  runtime_exit 1
fi

if ! nvm use "${NVM_TARGET}" >/dev/null 2>&1; then
  nvm install "${NVM_TARGET}" >/dev/null
  nvm use "${NVM_TARGET}" >/dev/null
fi

if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  corepack prepare "npm@${NPM_TARGET}" --activate >/dev/null 2>&1 || true
fi

node_version="$(read_node_version)"
npm_version="$(read_npm_version)"
node_major="$(read_major "${node_version:-0}")"
npm_major="$(read_major "${npm_version:-0}")"

if [[ "$node_major" != "$EXPECTED_NODE_MAJOR" || "$npm_major" != "$EXPECTED_NPM_MAJOR" ]]; then
  echo "[RUNTIME] ERROR: failed to activate required runtime."
  echo "[RUNTIME] Current: node=${node_version:-missing}, npm=${npm_version:-missing}"
  echo "[RUNTIME] Required: node=${EXPECTED_NODE_MAJOR}.x, npm=${EXPECTED_NPM_MAJOR}.x"
  runtime_exit 1
fi

echo "[RUNTIME] Active runtime: node=${node_version}, npm=${npm_version}"
runtime_exit 0
