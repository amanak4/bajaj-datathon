#!/bin/bash
# Build script for Render deployment
set -e

echo "Installing system dependencies..."
apt-get update
apt-get install -y poppler-utils

echo "Installing Node.js dependencies..."
npm install

echo "Build complete!"

