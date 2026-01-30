const { build } = require('electron-builder');

const options = {
  config: {
    appId: 'org.nightmaredesigns.admin',
    productName: 'CraftForge Admin Dashboard',
    directories: {
      buildResources: 'build',
      output: 'dist'
    },
    files: [
      'src/admin/**/*',
      'src/main.js',
      'package.json',
      'node_modules/**/*',
      'assets/icons/**/*'
    ],
    extraMetadata: {
      main: 'src/admin/main-admin.js'
    },
    asar: false,
    win: {
      target: [
        {
          target: 'portable',
          arch: ['x64']
        }
      ]
    },
    portable: {
      artifactName: 'CraftForge-Admin-${version}.exe'
    }
  },
  win: ['portable']
};

build(options)
  .then(result => {
    console.log('\n✅ Admin Dashboard EXE built successfully!');
    console.log('Location: dist/CraftForge-Admin-0.1.0.exe');
  })
  .catch(error => {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  });
