/**
 * Licensing System — CraftForge
 * Handles trial periods (30 days), key validation, and software lockout
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TRIAL_DAYS = 30;
const LICENSE_FILE = path.join(os.homedir(), '.craftforge', 'license.json');
const LICENSE_DIR = path.dirname(LICENSE_FILE);

class LicenseManager {
  constructor() {
    this.ensureDir();
    this.license = this.loadLicense();
  }

  /**
   * Ensure license directory exists
   */
  ensureDir() {
    if (!fs.existsSync(LICENSE_DIR)) {
      fs.mkdirSync(LICENSE_DIR, { recursive: true });
    }
  }

  /**
   * Load license from file
   */
  loadLicense() {
    try {
      if (fs.existsSync(LICENSE_FILE)) {
        const data = fs.readFileSync(LICENSE_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading license:', err);
    }
    return null;
  }

  /**
   * Save license to file
   */
  saveLicense(license) {
    try {
      this.ensureDir();
      fs.writeFileSync(LICENSE_FILE, JSON.stringify(license, null, 2), 'utf-8');
      this.license = license;
      return true;
    } catch (err) {
      console.error('Error saving license:', err);
      return false;
    }
  }

  /**
   * Start trial period (called on first launch)
   */
  startTrial() {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

    const license = {
      type: 'trial',
      startDate: new Date().toISOString(),
      trialEndDate: trialEnd.toISOString(),
      activated: false,
      activationKey: null,
      activationDate: null,
      machineId: this.getMachineId()
    };

    this.saveLicense(license);
    return license;
  }

  /**
   * Get machine ID (for key validation)
   */
  getMachineId() {
    const platform = os.platform();
    const hostname = os.hostname();
    const userHome = os.homedir();
    const combined = `${platform}-${hostname}-${userHome}`;
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
  }

  /**
   * Check if software is within trial period
   */
  isTrialActive() {
    if (!this.license || this.license.type !== 'trial') {
      return false;
    }

    const trialEnd = new Date(this.license.trialEndDate);
    const now = new Date();
    return now <= trialEnd;
  }

  /**
   * Check if license key is valid (activated)
   */
  isActivated() {
    return this.license && this.license.type === 'activated' && this.license.activated === true;
  }

  /**
   * Get remaining trial days
   */
  getRemainingTrialDays() {
    if (!this.isTrialActive()) return 0;

    const trialEnd = new Date(this.license.trialEndDate);
    const now = new Date();
    const diff = trialEnd - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get license status
   */
  getStatus() {
    if (this.isActivated()) {
      return {
        type: 'activated',
        status: 'Licensed',
        activationKey: this.license.activationKey,
        activationDate: this.license.activationDate,
        machineId: this.license.machineId
      };
    }

    if (this.isTrialActive()) {
      const remaining = this.getRemainingTrialDays();
      return {
        type: 'trial',
        status: `Trial (${remaining} days remaining)`,
        trialEndDate: this.license.trialEndDate,
        machineId: this.license.machineId
      };
    }

    return {
      type: 'expired',
      status: 'Trial Expired - Activate License',
      machineId: this.license ? this.license.machineId : 'N/A'
    };
  }

  /**
   * Validate and activate license key
   * Key format: XXXX-XXXX-XXXX-XXXX (4 segments of 4 hex chars)
   */
  activateKey(keyString) {
    if (!keyString || typeof keyString !== 'string') {
      return { success: false, error: 'Invalid key format' };
    }

    // Normalize key (uppercase, remove spaces)
    const key = keyString.toUpperCase().replace(/\s/g, '');

    // Validate format
    if (!this.isValidKeyFormat(key)) {
      return { success: false, error: 'Invalid key format (expected: XXXX-XXXX-XXXX-XXXX)' };
    }

    // Verify key signature
    const verification = this.verifyKeySignature(key, this.license ? this.license.machineId : '');
    if (!verification.valid) {
      return { success: false, error: 'Invalid license key or not valid for this machine' };
    }

    // Activate license
    const license = {
      type: 'activated',
      activated: true,
      activationKey: key,
      activationDate: new Date().toISOString(),
      machineId: this.license ? this.license.machineId : this.getMachineId(),
      startDate: this.license ? this.license.startDate : new Date().toISOString()
    };

    this.saveLicense(license);
    return { success: true, message: 'License activated successfully' };
  }

  /**
   * Check if key format is valid
   */
  isValidKeyFormat(key) {
    // Format: XXXX-XXXX-XXXX-XXXX or XXXXXXXXXXXXXXXX
    const withDashes = /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/;
    const withoutDashes = /^[0-9A-F]{16}$/;
    return withDashes.test(key) || withoutDashes.test(key);
  }

  /**
   * Verify key signature against machine ID
   */
  verifyKeySignature(key, machineId) {
    // Remove dashes for processing
    const cleanKey = key.replace(/-/g, '');

    // Extract signature and data parts
    // First 12 chars: data, last 4 chars: signature
    const dataPart = cleanKey.substring(0, 12);
    const signaturePart = cleanKey.substring(12, 16);

    // Generate expected signature
    const combined = `${dataPart}${machineId}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    const expectedSignature = hash.substring(0, 4).toUpperCase();

    return {
      valid: signaturePart === expectedSignature,
      dataPart,
      signaturePart,
      expectedSignature
    };
  }

  /**
   * Check if app should be locked (trial expired + not activated)
   */
  isLocked() {
    return !this.isTrialActive() && !this.isActivated();
  }

  /**
   * Reset license (for dev/testing)
   */
  resetLicense() {
    try {
      if (fs.existsSync(LICENSE_FILE)) {
        fs.unlinkSync(LICENSE_FILE);
      }
      this.license = null;
      return true;
    } catch (err) {
      console.error('Error resetting license:', err);
      return false;
    }
  }
}

module.exports = LicenseManager;
