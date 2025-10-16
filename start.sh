#!/bin/bash

# Quick start script for the Crypto Sentiment Dashboard

echo "🚀 Starting Crypto Sentiment Dashboard"
echo "======================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Check if .env exists, if not create from example
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "✅ .env file created (you can edit it to configure your API)"
    echo ""
fi

echo "🎨 Starting development server..."
echo ""
echo "Dashboard will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

npm run dev

