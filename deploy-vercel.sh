#!/bin/bash
# Vercel Deployment Script for ClawDuck UI

echo "🚀 Deploying ClawDuck UI to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to UI directory
cd ui

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy
echo "🚀 Deploying..."
vercel --prod --yes

echo "✅ Deployment complete!"