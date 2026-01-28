/**
 * License Key Generator — CraftForge
 * Generates and validates 5000 unique license keys
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class KeyGenerator {
  constructor() {
    this.keys = [];
    this.keyMap = {}; // For quick lookup
  }

  /**
   * Generate a single license key
   * Format: XXXX-XXXX-XXXX-XXXX (16 hex characters)
   */
  generateKey(machineId = '') {
    // Generate random 12-char data part
    const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase().substring(0, 12);

    // Generate signature from data + machine ID
    const combined = `${randomPart}${machineId}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    const signaturePart = hash.substring(0, 4).toUpperCase();

    // Combine: 12-char data + 4-char signature
    const fullKey = randomPart + signaturePart;

    // Format with dashes: XXXX-XXXX-XXXX-XXXX
    return `${fullKey.substring(0, 4)}-${fullKey.substring(4, 8)}-${fullKey.substring(8, 12)}-${fullKey.substring(12, 16)}`;
  }

  /**
   * Generate batch of unique keys
   */
  generateBatch(count = 5000, machineIdPrefix = '') {
    const keys = [];
    const seen = new Set();

    for (let i = 0; i < count; i++) {
      let key;
      let attempts = 0;
      const maxAttempts = 100;

      // Ensure uniqueness
      do {
        const machineId = machineIdPrefix ? `${machineIdPrefix}${String(i).padStart(5, '0')}` : '';
        key = this.generateKey(machineId);
        attempts++;
      } while (seen.has(key) && attempts < maxAttempts);

      if (attempts < maxAttempts) {
        keys.push({
          key,
          index: i,
          created: new Date().toISOString(),
          used: false,
          usedBy: null,
          usedDate: null
        });
        seen.add(key);
      }
    }

    this.keys = keys;
    return keys;
  }

  /**
   * Export keys to JSON file
   */
  exportToJSON(filePath = './license_keys.json') {
    try {
      const data = {
        generated: new Date().toISOString(),
        totalCount: this.keys.length,
        keys: this.keys
      };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, path: filePath, count: this.keys.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Export keys to CSV for distribution
   */
  exportToCSV(filePath = './license_keys.csv') {
    try {
      const lines = ['License Key,Status,Created Date'];
      this.keys.forEach(k => {
        const status = k.used ? 'USED' : 'AVAILABLE';
        lines.push(`${k.key},${status},${k.created}`);
      });
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
      return { success: true, path: filePath, count: this.keys.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Import keys from JSON file
   */
  importFromJSON(filePath) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.keys = parsed.keys || [];
      this.buildKeyMap();
      return { success: true, count: this.keys.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Build lookup map for quick key searches
   */
  buildKeyMap() {
    this.keyMap = {};
    this.keys.forEach(k => {
      this.keyMap[k.key.replace(/-/g, '')] = k;
    });
  }

  /**
   * Mark key as used
   */
  markKeyAsUsed(keyString, machineId) {
    const cleanKey = keyString.replace(/-/g, '').toUpperCase();
    const keyRecord = this.keyMap[cleanKey];

    if (!keyRecord) {
      return { success: false, error: 'Key not found in database' };
    }

    if (keyRecord.used) {
      return { success: false, error: 'Key already used' };
    }

    keyRecord.used = true;
    keyRecord.usedBy = machineId;
    keyRecord.usedDate = new Date().toISOString();

    return { success: true, message: 'Key marked as used' };
  }

  /**
   * Get key statistics
   */
  getStats() {
    const total = this.keys.length;
    const used = this.keys.filter(k => k.used).length;
    const available = total - used;
    const usagePercent = total > 0 ? ((used / total) * 100).toFixed(2) : 0;

    return {
      total,
      used,
      available,
      usagePercent: `${usagePercent}%`
    };
  }

  /**
   * Get sample keys
   */
  getSampleKeys(count = 10) {
    return this.keys.slice(0, count);
  }

  /**
   * Verify key exists in database
   */
  verifyKeyExists(keyString) {
    const cleanKey = keyString.replace(/-/g, '').toUpperCase();
    return this.keyMap.hasOwnProperty(cleanKey);
  }
}

module.exports = KeyGenerator;
