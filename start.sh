#!/bin/bash

# WhatsApp Bot AI Professional Starter

echo "🚀 Starting WhatsApp Bot AI Professional..."
echo "📱 Version: 3.0.0"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "⚠️ Please edit .env file with your configuration"
    exit 1
fi

# Check if built
if [ ! -d "dist" ]; then
    echo "🔨 Building project..."
    npm run build
fi

# Start the bot
npm start
