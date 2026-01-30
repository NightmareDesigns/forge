const fs = require('fs');
const path = require('path');

/**
 * Build script for Android mobile app using Capacitor
 * Usage: npm run build-mobile
 */

async function buildMobileApp() {
  console.log('🖤 Building Nightmare Designs SVG Forge - Mobile App\n');

  try {
    // 1. Copy mobile files to dist-mobile
    console.log('📦 Preparing mobile distribution...');
    const distMobilePath = path.join(__dirname, 'dist-mobile');
    
    if (!fs.existsSync(distMobilePath)) {
      fs.mkdirSync(distMobilePath, { recursive: true });
    }

    // Copy HTML
    fs.copyFileSync(
      path.join(__dirname, 'src/mobile/index.html'),
      path.join(distMobilePath, 'index.html')
    );

    // Copy CSS
    fs.copyFileSync(
      path.join(__dirname, 'src/mobile/mobile.css'),
      path.join(distMobilePath, 'mobile.css')
    );

    // Copy JS
    fs.copyFileSync(
      path.join(__dirname, 'src/mobile/mobile-app.js'),
      path.join(distMobilePath, 'mobile-app.js')
    );

    // Copy assets
    const assetsSource = path.join(__dirname, 'assets');
    const assetsTarget = path.join(distMobilePath, 'assets');
    if (fs.existsSync(assetsSource)) {
      copyDirSync(assetsSource, assetsTarget);
    }

    // Copy renderer resources (fonts, etc)
    const rendererAssets = path.join(__dirname, 'src/renderer');
    const stylesPath = path.join(rendererAssets, 'styles.css');
    if (fs.existsSync(stylesPath)) {
      fs.copyFileSync(stylesPath, path.join(distMobilePath, 'shared-styles.css'));
    }

    console.log('✅ Mobile files prepared to dist-mobile/\n');

    // 2. Check for Capacitor
    console.log('📱 Checking Capacitor installation...');
    try {
      require.resolve('@capacitor/core');
      console.log('✅ Capacitor is installed\n');
    } catch (e) {
      console.log('⚠️  Capacitor not installed. Install with:');
      console.log('   npm install @capacitor/core @capacitor/cli');
      console.log('   npm install @capacitor/status-bar @capacitor/app\n');
    }

    // 3. Build instructions
    console.log('📋 Next Steps to Build Android App:\n');
    console.log('1. Install Capacitor globally:');
    console.log('   npm install -g @capacitor/cli\n');
    
    console.log('2. Add Android platform:');
    console.log('   npx cap add android\n');
    
    console.log('3. Build and sync:');
    console.log('   npm run build-mobile');
    console.log('   npx cap sync\n');
    
    console.log('4. Open in Android Studio:');
    console.log('   npx cap open android\n');
    
    console.log('5. Build APK/AAB:');
    console.log('   - In Android Studio: Build > Build Bundle(s) / APK(s)\n');

    console.log('📦 Distribution Package Created!\n');
    console.log('   Location: ' + distMobilePath);
    console.log('   Files Ready for: iOS & Android via Capacitor\n');

  } catch (error) {
    console.error('❌ Build Error:', error);
    process.exit(1);
  }
}

/**
 * Recursive directory copy
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  fs.readdirSync(src).forEach(file => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    
    if (fs.statSync(srcFile).isDirectory()) {
      copyDirSync(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

buildMobileApp().catch(console.error);
