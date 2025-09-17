#!/bin/bash

# Jenkins Pipeline Monitor Setup Script
# This script helps set up the project environment

echo "🚀 Setting up Jenkins Pipeline Monitor..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20.x first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18.x or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Set up environment file
if [ ! -f .env ]; then
    echo "🔧 Creating environment file..."
    cp .env.example .env 2>/dev/null || {
        # If .env.example doesn't exist, create .env directly
        cat > .env << EOF
# Database Configuration
DATABASE_URL="file:./db/custom.db"

# Next.js Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Application Configuration
NODE_ENV=development
PORT=3000

# Jenkins Configuration (will be set through UI)
# JENKINS_URL=http://your-jenkins-server:8080
# JENKINS_USERNAME=your-username
# JENKINS_API_TOKEN=your-api-token
EOF
    }
fi

# Create db directory if it doesn't exist
mkdir -p db

# Initialize database
echo "🗄️ Initializing database..."
npm run db:push

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Configure your Jenkins connection in the settings"
echo ""
echo "📚 For more information, see README.md"