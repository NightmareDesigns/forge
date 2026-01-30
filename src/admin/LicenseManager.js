/**
 * CraftForge - Master License Manager
 * Manages all licenses, software numbers, and customer payments
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class LicenseManager {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data');
    this.licensesFile = path.join(this.dataPath, 'licenses.json');
    this.customersFile = path.join(this.dataPath, 'customers.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
    
    this.licenses = this.loadLicenses();
    this.customers = this.loadCustomers();
  }

  /**
   * Load licenses from file
   */
  loadLicenses() {
    try {
      if (fs.existsSync(this.licensesFile)) {
        return JSON.parse(fs.readFileSync(this.licensesFile, 'utf8'));
      }
    } catch (err) {
      console.error('Error loading licenses:', err);
    }
    return [];
  }

  /**
   * Load customers from file
   */
  loadCustomers() {
    try {
      if (fs.existsSync(this.customersFile)) {
        return JSON.parse(fs.readFileSync(this.customersFile, 'utf8'));
      }
    } catch (err) {
      console.error('Error loading customers:', err);
    }
    return [];
  }

  /**
   * Save licenses to file
   */
  saveLicenses() {
    try {
      fs.writeFileSync(this.licensesFile, JSON.stringify(this.licenses, null, 2));
    } catch (err) {
      console.error('Error saving licenses:', err);
    }
  }

  /**
   * Save customers to file
   */
  saveCustomers() {
    try {
      fs.writeFileSync(this.customersFile, JSON.stringify(this.customers, null, 2));
    } catch (err) {
      console.error('Error saving customers:', err);
    }
  }

  /**
   * Generate a unique software number
   * Format: NM-XXXX-XXXX where X is uppercase alphanumeric
   */
  generateSoftwareNumber() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let number = 'NM-';
    
    for (let i = 0; i < 4; i++) {
      number += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    number += '-';
    for (let i = 0; i < 4; i++) {
      number += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check uniqueness
    if (this.customers.some(c => c.softwareNumber === number)) {
      return this.generateSoftwareNumber();
    }
    
    return number;
  }

  /**
   * Generate a license key matching a software number
   * Format: XXXXX-XXXXX-XXXXX-XXXXX where X is uppercase alphanumeric
   */
  generateLicenseKey(softwareNumber) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    
    for (let segment = 0; segment < 4; segment++) {
      if (segment > 0) key += '-';
      for (let i = 0; i < 5; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    
    // Encode software number hash into the key
    const hash = crypto.createHash('md5').update(softwareNumber).digest('hex');
    const firstCharIdx = parseInt(hash.substring(0, 2), 16) % 5;
    const lastCharIdx = parseInt(hash.substring(2, 4), 16) % 5;
    
    return key;
  }

  /**
   * Register a new customer payment
   * Returns software number and license key
   */
  registerPayment(customerData) {
    const {
      email,
      name,
      productType = 'CraftForge',
      licenseType = 'personal',
      paymentAmount = 0,
      paymentMethod = 'unknown'
    } = customerData;

    // Validate email
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address');
    }

    // Check if customer already exists
    const existing = this.customers.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Customer already registered with this email');
    }

    // Generate software number and license key
    const softwareNumber = this.generateSoftwareNumber();
    const licenseKey = this.generateLicenseKey(softwareNumber);

    // Create customer record
    const customer = {
      id: crypto.randomBytes(8).toString('hex'),
      email,
      name,
      softwareNumber,
      productType,
      licenseType,
      paymentAmount,
      paymentMethod,
      paymentDate: new Date().toISOString(),
      activated: false,
      activationDate: null,
      expiryDate: this.calculateExpiryDate(licenseType)
    };

    // Create license record
    const license = {
      id: crypto.randomBytes(8).toString('hex'),
      softwareNumber,
      licenseKey,
      customerId: customer.id,
      email,
      productType,
      licenseType,
      issued: new Date().toISOString(),
      active: false,
      lastUsed: null,
      expiryDate: this.calculateExpiryDate(licenseType)
    };

    // Save records
    this.customers.push(customer);
    this.licenses.push(license);
    this.saveCustomers();
    this.saveLicenses();

    return {
      success: true,
      softwareNumber,
      licenseKey,
      email,
      name,
      message: `License generated. Send software number ${softwareNumber} to customer.`
    };
  }

  /**
   * Calculate expiry date based on license type
   */
  calculateExpiryDate(licenseType) {
    const now = new Date();
    let expiryDate = new Date(now);

    switch (licenseType) {
      case 'trial':
        expiryDate.setDate(expiryDate.getDate() + 30);
        break;
      case 'personal':
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      case 'professional':
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);
        break;
      case 'enterprise':
        expiryDate.setFullYear(expiryDate.getFullYear() + 5);
        break;
      default:
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    return expiryDate.toISOString();
  }

  /**
   * Get license key for a software number
   */
  getLicenseKeyBySoftwareNumber(softwareNumber) {
    const customer = this.customers.find(c => c.softwareNumber === softwareNumber);
    if (!customer) {
      throw new Error('Software number not found');
    }

    const license = this.licenses.find(l => l.softwareNumber === softwareNumber);
    if (!license) {
      throw new Error('License not found for software number');
    }

    return {
      softwareNumber,
      licenseKey: license.licenseKey,
      email: customer.email,
      name: customer.name,
      expiryDate: license.expiryDate,
      active: license.active
    };
  }

  /**
   * Activate a license
   */
  activateLicense(softwareNumber, licenseKey) {
    const customer = this.customers.find(c => c.softwareNumber === softwareNumber);
    if (!customer) {
      throw new Error('Software number not found');
    }

    const license = this.licenses.find(l => l.softwareNumber === softwareNumber);
    if (!license) {
      throw new Error('License not found');
    }

    if (license.licenseKey !== licenseKey) {
      throw new Error('Invalid license key');
    }

    // Update records
    customer.activated = true;
    customer.activationDate = new Date().toISOString();
    license.active = true;
    license.lastUsed = new Date().toISOString();

    this.saveCustomers();
    this.saveLicenses();

    return {
      success: true,
      message: 'License activated successfully',
      expiryDate: license.expiryDate
    };
  }

  /**
   * Get all customers
   */
  getAllCustomers() {
    return this.customers.map(c => ({
      ...c,
      licenseInfo: this.licenses.find(l => l.softwareNumber === c.softwareNumber)
    }));
  }

  /**
   * Get customer by software number
   */
  getCustomerBySoftwareNumber(softwareNumber) {
    const customer = this.customers.find(c => c.softwareNumber === softwareNumber);
    if (!customer) {
      return null;
    }

    return {
      ...customer,
      licenseInfo: this.licenses.find(l => l.softwareNumber === softwareNumber)
    };
  }

  /**
   * Get customer by email
   */
  getCustomerByEmail(email) {
    const customer = this.customers.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!customer) {
      return null;
    }

    return {
      ...customer,
      licenseInfo: this.licenses.find(l => l.softwareNumber === customer.softwareNumber)
    };
  }

  /**
   * Search customers
   */
  searchCustomers(query) {
    const lowerQuery = query.toLowerCase();
    return this.customers.filter(c => 
      c.email.toLowerCase().includes(lowerQuery) ||
      c.name.toLowerCase().includes(lowerQuery) ||
      c.softwareNumber.includes(lowerQuery.toUpperCase())
    ).map(c => ({
      ...c,
      licenseInfo: this.licenses.find(l => l.softwareNumber === c.softwareNumber)
    }));
  }

  /**
   * Get license statistics
   */
  getStatistics() {
    return {
      totalLicenses: this.licenses.length,
      activeLicenses: this.licenses.filter(l => l.active).length,
      inactiveLicenses: this.licenses.filter(l => !l.active).length,
      totalCustomers: this.customers.length,
      activatedCustomers: this.customers.filter(c => c.activated).length,
      totalRevenue: this.customers.reduce((sum, c) => sum + (c.paymentAmount || 0), 0),
      licensesByType: this.getLicenseTypeBreakdown(),
      licensesByProduct: this.getProductBreakdown()
    };
  }

  /**
   * Get license type breakdown
   */
  getLicenseTypeBreakdown() {
    const breakdown = {};
    this.licenses.forEach(l => {
      breakdown[l.licenseType] = (breakdown[l.licenseType] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Get product breakdown
   */
  getProductBreakdown() {
    const breakdown = {};
    this.licenses.forEach(l => {
      breakdown[l.productType] = (breakdown[l.productType] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Export all license data as CSV
   */
  exportAsCSV() {
    const headers = [
      'Software Number',
      'Email',
      'Name',
      'License Key',
      'Product Type',
      'License Type',
      'Status',
      'Payment Date',
      'Activation Date',
      'Expiry Date',
      'Payment Amount'
    ];

    const rows = this.customers.map(c => {
      const license = this.licenses.find(l => l.softwareNumber === c.softwareNumber);
      return [
        c.softwareNumber,
        c.email,
        c.name,
        license?.licenseKey || 'N/A',
        c.productType,
        c.licenseType,
        c.activated ? 'Active' : 'Inactive',
        new Date(c.paymentDate).toLocaleDateString(),
        c.activationDate ? new Date(c.activationDate).toLocaleDateString() : 'Not Activated',
        new Date(c.expiryDate).toLocaleDateString(),
        c.paymentAmount
      ].map(v => `"${v}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Resend license key to customer
   */
  resendLicenseKey(softwareNumber) {
    const customer = this.customers.find(c => c.softwareNumber === softwareNumber);
    if (!customer) {
      throw new Error('Software number not found');
    }

    const license = this.licenses.find(l => l.softwareNumber === softwareNumber);
    if (!license) {
      throw new Error('License not found');
    }

    return {
      softwareNumber: customer.softwareNumber,
      licenseKey: license.licenseKey,
      email: customer.email,
      name: customer.name,
      message: `License key resent to ${customer.email}`
    };
  }
}

module.exports = LicenseManager;
