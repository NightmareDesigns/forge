#!/bin/bash
# CraftForge Admin License System - Quick Start

echo "🔐 Starting CraftForge Admin License System..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for express and cors (required for admin server)
if ! npm list express > /dev/null 2>&1; then
    echo "📦 Installing required packages..."
    npm install express cors
fi

# Start the admin server
echo "🚀 Starting Admin Server on http://localhost:5000"
echo "📊 Dashboard: http://localhost:5000/dashboard.html"
echo ""
echo "Admin Token: admin-master-key-2026"
echo "(Change this in production!)"
echo ""

node src/admin/AdminServer.js
