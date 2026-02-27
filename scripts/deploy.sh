#!/bin/bash
set -euo pipefail

# Deploy Script for Unix-based systems (Linux/Mac/Git Bash)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

echo "🚀 Starting Deployment..."

echo "🧩 Ensuring runtime (Node 20 / npm 10)..."
. "${SCRIPT_DIR}/ensure-runtime.sh"

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull

# 2. Install Backend Dependencies
echo "📦 Installing backend dependencies..."
npm ci

# 2.5 Validate production environment and DB readiness
echo "🩺 Running production preflight checks..."
npm run preflight:prod

# 3. Build Frontend
echo "🎨 Building Frontend..."
cd client
echo "   - Installing client dependencies..."
npm ci
echo "   - Building React app..."
npm run build
cd ..

# 3. Database Migration
echo "🗄️ Running database migrations..."
npm run prisma:migrate:prod

# 4. Generate Prisma Client
echo "🔄 Generating Prisma Client..."
npm run prisma:generate:prod

# 5. Restart Application
echo "🔄 Restarting application with PM2..."
pm2 restart ecosystem.config.js --env production

echo "✅ Deployment Successful!"
