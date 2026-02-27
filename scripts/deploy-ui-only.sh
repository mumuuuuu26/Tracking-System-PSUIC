#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-psuic@10.135.2.226}"
REMOTE_DIR="${2:-/C:/xampp/htdocs/app/server}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

. "${SCRIPT_DIR}/ensure-runtime.sh"

echo "[INFO] Root: ${ROOT_DIR}"
echo "[INFO] Host: ${HOST}"
echo "[INFO] Remote dir: ${REMOTE_DIR}"

if [[ ! -f "${ROOT_DIR}/client/package.json" ]]; then
  echo "[ERROR] client/package.json not found. Run this script from the project repo."
  exit 1
fi

echo "[1/4] Building frontend dist..."
(
  cd "${ROOT_DIR}/client"
  npm run build
)

if [[ ! -f "${ROOT_DIR}/client/dist/index.html" ]]; then
  echo "[ERROR] client/dist/index.html was not generated."
  exit 1
fi

if [[ ! -d "${ROOT_DIR}/client/dist/assets" ]]; then
  echo "[ERROR] client/dist/assets was not generated."
  exit 1
fi

echo "[2/4] Preparing SFTP batch..."
BATCH_FILE="$(mktemp /tmp/deploy-ui-only.XXXXXX.sftp)"
cat >"${BATCH_FILE}" <<EOF
-mkdir /C:/xampp
-mkdir /C:/xampp/htdocs
-mkdir /C:/xampp/htdocs/app
-mkdir /C:/xampp/htdocs/app/server
cd ${REMOTE_DIR}
lcd ${ROOT_DIR}
-mkdir client
put windows-deploy.bat
put windows-runtime-check.bat
put windows-recover-runtime.bat
put windows-enable-pm2-startup.bat
put windows-enable-pm2-startup.ps1
put -r client/dist client
bye
EOF

echo "[3/4] Uploading files with SFTP..."
sftp -b "${BATCH_FILE}" "${HOST}"
rm -f "${BATCH_FILE}"

echo "[4/4] Upload completed."
echo "[NEXT] On Windows server, run:"
echo "  cd /d C:\\xampp\\htdocs\\app\\server"
echo "  .\\windows-recover-runtime.bat"
