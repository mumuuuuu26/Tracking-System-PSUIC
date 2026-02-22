#!/bin/bash

# Deploy Script for Unix-based systems (Linux/Mac/Git Bash)

echo "🚀 Starting Deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull
if [ $? -ne 0 ]; then
    echo "❌ Git pull failed! Please check for conflicts."
    exit 1
fi

# 2. Install Backend Dependencies
echo "📦 Installing backend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi

# 2.5 Validate production environment and DB readiness
echo "🩺 Running production preflight checks..."
npm run preflight:prod
if [ $? -ne 0 ]; then
    echo "❌ Production preflight failed! Check .env.production and database availability."
    exit 1
fi

# 3. Build Frontend
echo "🎨 Building Frontend..."
cd client
echo "   - Installing client dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Client npm install failed!"
    exit 1
fi
echo "   - Building React app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Client build failed!"
    exit 1
fi
cd ..

# 3. Database Migration
echo "🗄️ Running database migrations..."
npm run prisma:migrate:prod
if [ $? -ne 0 ]; then
    echo "❌ Database migration failed!"
    exit 1
fi

# 4. Generate Prisma Client
echo "🔄 Generating Prisma Client..."
npm run prisma:generate:prod

# 5. Restart Application
echo "🔄 Restarting application with PM2..."
pm2 restart ecosystem.config.js --env production
if [ $? -ne 0 ]; then
    echo "❌ PM2 restart failed!"
    exit 1
fi

echo "✅ Deployment Successful!"
