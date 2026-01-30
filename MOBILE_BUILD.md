# Nightmare Designs SVG Forge - Mobile (Android/iOS)

## Overview

Full-featured mobile version of Nightmare Designs SVG Forge optimized for phones and tablets using **Capacitor** - a native wrapper for your web app.

## Features

✅ **Responsive UI** - Optimized for phones (320px+) and tablets (768px+)  
✅ **Touch Gestures** - Single touch drawing, two-finger pinch zoom, long-press select  
✅ **Full Toolset** - All design tools available on mobile  
✅ **Property Panel** - Customize colors, strokes, brushes on-the-fly  
✅ **Native Features** - Camera access, file storage, notifications  
✅ **Cross-Platform** - Build for both Android and iOS from same codebase  

## Project Structure

```
src/mobile/
├── index.html          # Mobile HTML layout
├── mobile.css          # Touch-optimized styles
└── mobile-app.js       # Mobile app logic & Capacitor integration

dist-mobile/           # Built mobile distribution
capacitor.config.json  # Capacitor configuration
build-mobile.js        # Build script
build-android.sh       # Android build helper
```

## Quick Start

### 1. Install Capacitor

```bash
npm install
npm install -g @capacitor/cli
```

### 2. Build Mobile Web Files

```bash
npm run build-mobile
```

This creates `dist-mobile/` with all necessary web assets.

### 3. Add Android Platform

```bash
npx cap add android
```

This creates the `android/` folder with native Android project.

### 4. Sync & Build

```bash
npx cap sync android
npx cap open android
```

In Android Studio:
- Build > Build Bundle(s) / APK(s) > Build APK(s)

APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Installation Methods

### Option A: Android Studio
1. Run `npx cap open android` to open in Android Studio
2. Connect device (USB debugging enabled) or use emulator
3. Click "Run" button
4. APK will build and deploy to device

### Option B: Command Line
```bash
npm run build-android
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Option C: Direct APK Install
1. Enable "Unknown Sources" in device settings
2. Transfer APK file to device
3. Open file manager, tap APK to install

## iOS Build

```bash
npx cap add ios
npm run build-ios
npx cap open ios
```

Then use Xcode to build and deploy.

## Development

### Local Testing (Web)
```bash
# Serve web version with live reload
python -m http.server 8000
# Visit: http://localhost:8000/dist-mobile/
```

### Android Emulator
```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd <emulator_name>

# Deploy to emulator
npm run build-android
```

## UI Components

### Bottom Tool Panel
- Selection, drawing, text, shapes, image import
- Scrollable horizontal layout
- Touch-optimized buttons (40px minimum tap area)

### Properties Panel (Right Side)
- Fill & stroke colors
- Brush size & opacity
- Font settings (text tool)
- Swipeable drawer for touch

### Zoom Controls (Floating)
- Zoom in/out buttons
- Zoom percentage display
- Fit to screen button
- Fixed position (top-right)

### Mobile Menu
- File operations (new, open, save)
- Export formats (SVG, PNG, PDF)
- Settings
- Help & About
- Slide-out drawer from left

## Touch Interactions

| Gesture | Action |
|---------|--------|
| Single tap | Draw with selected tool |
| Double tap | Center view / Deselect |
| Pinch (2 fingers) | Zoom in/out |
| Drag (2 fingers) | Pan canvas |
| Long press | Select object |
| Swipe (edge) | Open menu |

## Responsive Breakpoints

```css
Phone (< 768px)
- Single column layout
- Full-width canvas
- Bottom toolbar
- Stacked properties panel

Tablet (≥ 768px)
- Larger touch targets
- Enhanced spacing
- Optional side panels
- Landscape support
```

## Performance Optimization

- Canvas rendering optimized for mobile
- Touch event debouncing
- Lazy loading of tools
- Efficient redraws only when needed
- Low memory footprint

## Capacitor Plugins Used

```json
{
  "@capacitor/app": "App lifecycle management",
  "@capacitor/status-bar": "Status bar styling",
  "@capacitor/screen-orientation": "Lock/unlock orientation",
  "@capacitor/camera": "Take photos (optional)",
  "@capacitor/filesystem": "File operations (optional)"
}
```

## Build Output

### Android
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk` (6-8 MB)
- **Release AAB**: `android/app/build/outputs/bundle/release/app-release.aab` (for Play Store)

### iOS
- **IPA**: Built through Xcode
- **App Store**: Upload AAB/IPA to respective stores

## Branding

All mobile UI uses Nightmare Designs branding:
- Primary color: `#ff4444` (red)
- Dark background: `#0d0000` (black)
- Grim reaper logo in assets
- Professional dark theme throughout

## Device Compatibility

| Category | Requirement |
|----------|-------------|
| Android | API 21+ (Android 5.0+) |
| iOS | iOS 12+ |
| Display | 320px+ width (phones) |
| RAM | 2GB minimum |
| Storage | 100MB for app + files |

## Production Deployment

### Android Play Store
1. Build release APK/AAB
2. Sign with keystore
3. Upload to Google Play Console
4. Configure store listing & screenshots

### iOS App Store
1. Build release IPA in Xcode
2. Code sign with Apple certificate
3. Upload with Transporter
4. Configure App Store listing

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
rm -rf android
npx cap add android
npm run build-mobile
npx cap sync
```

### App Crashes on Start
- Check `adb logcat` for errors
- Ensure Capacitor.isNativeAndroid is handled
- Verify all assets paths are correct

### Canvas Not Rendering
- Check device orientation/permissions
- Verify canvas container has size
- Test with simpler drawing first

### Touch Events Not Working
- Ensure `preventDefault()` is called appropriately
- Check CSS `touch-action` property
- Test with different Android versions

## Files Modified/Created

**New Files:**
- `src/mobile/index.html` - Mobile UI (550 lines)
- `src/mobile/mobile.css` - Responsive styles (550 lines)
- `src/mobile/mobile-app.js` - App logic (850 lines)
- `capacitor.config.json` - Capacitor config
- `build-mobile.js` - Build script
- `build-android.sh` - Android build helper

**Modified Files:**
- `package.json` - Added mobile scripts & Capacitor deps

## Next Steps

1. ✅ Install Capacitor packages: `npm install`
2. ✅ Create Android project: `npx cap add android`
3. ✅ Build and test on emulator: `npm run build-android`
4. ✅ Deploy to real device via Android Studio
5. Sign and release to Play Store

## Support

For issues or questions:
- Check device console: `adb logcat`
- Review Capacitor docs: https://capacitorjs.com
- Test on multiple devices for compatibility

---

**Version:** 0.1.0  
**Build Date:** 2026-01-30  
**Platform:** Android 5.0+, iOS 12+  
**© 2026 Nightmare Designs. SVG Forge™ - All rights reserved**
