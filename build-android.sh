#!/bin/bash
# Build Android APK using Capacitor and Gradle

echo "🖤 Building Android APK for Nightmare Designs SVG Forge"
echo ""

# Check if Capacitor Android app exists
if [ ! -d "android" ]; then
    echo "❌ Android platform not found!"
    echo "Run: npx cap add android"
    exit 1
fi

# Sync Capacitor
echo "📱 Syncing Capacitor..."
npx cap sync android

# Navigate to Android directory
cd android

# Build APK
echo "🔨 Building APK..."
./gradlew assembleDebug

# Check if build successful
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo ""
    echo "✅ APK Built Successfully!"
    echo "📱 Location: android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "📤 To install on device:"
    echo "   adb install android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo "❌ APK build failed"
    exit 1
fi
