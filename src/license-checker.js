/**
 * CraftForge License Checker
 * Validates licenses within the CraftForge application
 * 
 * Usage: Import in main.js to check licenses on app startup
 */

const fs = require('fs');
const path = require('path');

class LicenseChecker {
  constructor() {
    this.licensePath = path.join(process.env.APPDATA || process.env.HOME, '.craftforge', 'license.json');
    this.ensureLicenseDirectory();
  }

  ensureLicenseDirectory() {
    const dir = path.dirname(this.licensePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Save activated license to local storage
   */
  saveLicense(softwareNumber, licenseKey) {
    const licenseData = {
      softwareNumber,
      licenseKey,
      activatedAt: new Date().toISOString(),
      activatedOn: process.platform + ' ' + require('os').hostname()
    };

    fs.writeFileSync(this.licensePath, JSON.stringify(licenseData, null, 2));
    return licenseData;
  }

  /**
   * Get saved license from local storage
   */
  getSavedLicense() {
    try {
      if (fs.existsSync(this.licensePath)) {
        const data = fs.readFileSync(this.licensePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading license file:', error);
    }
    return null;
  }

  /**
   * Verify license with admin server
   */
  async verifyLicense(softwareNumber, licenseKey) {
    try {
      const response = await fetch('http://localhost:5000/api/activate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          softwareNumber,
          licenseKey
        })
      });

      const data = await response.json();

      if (data.error) {
        return {
          valid: false,
          error: data.error
        };
      }

      return {
        valid: true,
        softwareNumber,
        licenseKey,
        expiryDate: data.expiryDate,
        daysRemaining: Math.ceil(
          (new Date(data.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        )
      };
    } catch (error) {
      console.error('Error verifying license:', error);
      return {
        valid: false,
        error: 'Could not connect to license server'
      };
    }
  }

  /**
   * Check if locally saved license is still valid
   */
  isLicenseValid() {
    const license = this.getSavedLicense();
    if (!license) return false;

    // Could call verifyLicense() to check with server
    // For now, just check if license exists
    return true;
  }

  /**
   * Remove saved license
   */
  removeLicense() {
    try {
      if (fs.existsSync(this.licensePath)) {
        fs.unlinkSync(this.licensePath);
        return true;
      }
    } catch (error) {
      console.error('Error removing license:', error);
    }
    return false;
  }

  /**
   * Get license status for UI display
   */
  getLicenseStatus() {
    const license = this.getSavedLicense();

    if (!license) {
      return {
        status: 'unlicensed',
        message: 'No license found',
        activated: false
      };
    }

    return {
      status: 'licensed',
      message: 'License activated',
      activated: true,
      softwareNumber: license.softwareNumber,
      activatedAt: license.activatedAt
    };
  }
}

/**
 * IPC Handlers for License Management
 * Add these to your main.js
 */
function setupLicenseHandlers(ipcMain) {
  const checker = new LicenseChecker();

  /**
   * Get current license status
   */
  ipcMain.handle('license-status', async () => {
    return checker.getLicenseStatus();
  });

  /**
   * Activate a license
   */
  ipcMain.handle('license-activate', async (event, softwareNumber, licenseKey) => {
    const result = await checker.verifyLicense(softwareNumber, licenseKey);

    if (result.valid) {
      checker.saveLicense(softwareNumber, licenseKey);
    }

    return result;
  });

  /**
   * Remove license
   */
  ipcMain.handle('license-remove', async () => {
    const removed = checker.removeLicense();
    return { success: removed };
  });

  /**
   * Get saved license (without verification)
   */
  ipcMain.handle('license-get', async () => {
    return checker.getSavedLicense();
  });
}

module.exports = {
  LicenseChecker,
  setupLicenseHandlers
};

/**
 * INTEGRATION INSTRUCTIONS
 * 
 * 1. In src/main.js, add at the top:
 * 
 *    const { setupLicenseHandlers } = require('./license-checker');
 * 
 * 2. In the App.whenReady() function, add:
 * 
 *    setupLicenseHandlers(ipcMain);
 * 
 * 3. In src/preload.js, add:
 * 
 *    // License APIs
 *    licenseStatus: () => ipcRenderer.invoke('license-status'),
 *    licenseActivate: (softwareNumber, licenseKey) => 
 *      ipcRenderer.invoke('license-activate', softwareNumber, licenseKey),
 *    licenseRemove: () => ipcRenderer.invoke('license-remove'),
 *    licenseGet: () => ipcRenderer.invoke('license-get'),
 * 
 * 4. In your renderer (src/renderer/app.js), use like:
 * 
 *    // Check if licensed on startup
 *    window.api.licenseStatus().then(status => {
 *      console.log('License status:', status);
 *      if (!status.activated) {
 *        showLicenseDialog();
 *      }
 *    });
 *    
 *    // Activate license
 *    const result = await window.api.licenseActivate(
 *      'NM-XXXX-XXXX',
 *      'XXXXX-XXXXX-XXXXX-XXXXX'
 *    );
 *    
 *    if (result.valid) {
 *      console.log('License activated!');
 *      console.log('Expires:', result.expiryDate);
 *    } else {
 *      console.log('License error:', result.error);
 *    }
 */
