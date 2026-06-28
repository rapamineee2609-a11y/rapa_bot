#!/bin/bash

# WhatsApp Bot AI Professional Installer
# Supports Ubuntu, Debian, Termux, and Pterodactyl

set -e

echo "╔══════════════════════════════════════════════╗"
echo "║   WhatsApp Bot AI Professional Installer    ║"
echo "║           v3.0.0                            ║"
echo "╚══════════════════════════════════════════════╝"

# Check Node.js version
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️ Node.js version $NODE_VERSION detected. Recommended version 20+."
    echo "Upgrading Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
echo "🔍 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Installing..."
    sudo apt-get install -y npm
fi
echo "✅ npm $(npm -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create required directories
echo "📁 Creating directories..."
mkdir -p data
mkdir -p logs
mkdir -p sessions
mkdir -p backups
mkdir -p src/assets

# Copy .env example if not exists
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    cp .env.example .env
    echo "⚠️ Please edit .env file with your configuration"
fi

# Build project
echo "🔨 Building project..."
npm run build

echo "╔══════════════════════════════════════════════╗"
echo "║   ✅ Installation complete!                  ║"
echo "║   🚀 Run: npm start                         ║"
echo "╚══════════════════════════════════════════════╝"
