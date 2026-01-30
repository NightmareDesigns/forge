/**
 * Master Software ID & License Key List Generator
 * Creates exportable lists of all software numbers paired with their license keys
 */

const fs = require('fs');
const path = require('path');

class MasterLicenseList {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.licensesPath = path.join(this.dataDir, 'licenses.json');
    this.customersPath = path.join(this.dataDir, 'customers.json');
  }

  /**
   * Load all licenses from JSON
   */
  loadLicenses() {
    try {
      if (fs.existsSync(this.licensesPath)) {
        const data = fs.readFileSync(this.licensesPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading licenses:', error.message);
    }
    return [];
  }

  /**
   * Load all customers from JSON
   */
  loadCustomers() {
    try {
      if (fs.existsSync(this.customersPath)) {
        const data = fs.readFileSync(this.customersPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading customers:', error.message);
    }
    return [];
  }

  /**
   * Generate master list with software number and license key pairs
   */
  generateMasterList() {
    const licenses = this.loadLicenses();
    const customers = this.loadCustomers();

    // Create a map of customer IDs to customer data
    const customerMap = {};
    customers.forEach(customer => {
      customerMap[customer.id] = customer;
    });

    // Generate pairs
    const masterList = licenses.map(license => ({
      softwareNumber: license.softwareNumber,
      licenseKey: license.licenseKey,
      email: license.email || (customerMap[license.customerId]?.email || 'N/A'),
      customerName: customerMap[license.customerId]?.name || 'N/A',
      productType: license.productType || 'CraftForge',
      licenseType: license.licenseType || 'personal',
      issued: license.issued,
      active: license.active,
      expiryDate: license.expiryDate,
      daysRemaining: this.calculateDaysRemaining(license.expiryDate)
    })).sort((a, b) => a.softwareNumber.localeCompare(b.softwareNumber));

    return masterList;
  }

  /**
   * Calculate days remaining for a license
   */
  calculateDaysRemaining(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysLeft;
  }

  /**
   * Export as JSON file
   */
  exportAsJSON(filename = 'master-license-list.json') {
    const masterList = this.generateMasterList();
    const filepath = path.join(this.dataDir, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(masterList, null, 2));
      console.log(`✓ Master list exported to: ${filepath}`);
      console.log(`  Total licenses: ${masterList.length}`);
      return filepath;
    } catch (error) {
      console.error('Error exporting JSON:', error.message);
      return null;
    }
  }

  /**
   * Export as CSV file
   */
  exportAsCSV(filename = 'master-license-list.csv') {
    const masterList = this.generateMasterList();
    const filepath = path.join(this.dataDir, filename);

    try {
      // CSV header
      const headers = [
        'Software Number',
        'License Key',
        'Customer Email',
        'Customer Name',
        'Product Type',
        'License Type',
        'Issued Date',
        'Status',
        'Expiry Date',
        'Days Remaining'
      ];

      // CSV rows
      const rows = masterList.map(item => [
        item.softwareNumber,
        item.licenseKey,
        `"${item.email}"`,
        `"${item.customerName}"`,
        item.productType,
        item.licenseType,
        new Date(item.issued).toLocaleDateString(),
        item.active ? 'Active' : 'Inactive',
        new Date(item.expiryDate).toLocaleDateString(),
        item.daysRemaining
      ]);

      // Combine headers and rows
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      fs.writeFileSync(filepath, csv);
      console.log(`✓ Master list exported to: ${filepath}`);
      console.log(`  Total licenses: ${masterList.length}`);
      return filepath;
    } catch (error) {
      console.error('Error exporting CSV:', error.message);
      return null;
    }
  }

  /**
   * Export as simple text list (pairs only)
   */
  exportAsText(filename = 'master-license-list.txt') {
    const masterList = this.generateMasterList();
    const filepath = path.join(this.dataDir, filename);

    try {
      let content = '╔════════════════════════════════════════════════════════════════╗\n';
      content += '║          CRAFTFORGE - MASTER LICENSE LIST                       ║\n';
      content += '║          Software Numbers & License Keys                         ║\n';
      content += '╚════════════════════════════════════════════════════════════════╝\n\n';
      content += `Generated: ${new Date().toLocaleString()}\n`;
      content += `Total Licenses: ${masterList.length}\n\n`;
      content += '─'.repeat(70) + '\n\n';

      masterList.forEach((item, index) => {
        content += `${index + 1}. ${item.customerName} (${item.email})\n`;
        content += `   Software Number: ${item.softwareNumber}\n`;
        content += `   License Key:     ${item.licenseKey}\n`;
        content += `   Type:            ${item.licenseType} (${item.productType})\n`;
        content += `   Status:          ${item.active ? 'Active' : 'Inactive'}\n`;
        content += `   Issued:          ${new Date(item.issued).toLocaleDateString()}\n`;
        content += `   Expires:         ${new Date(item.expiryDate).toLocaleDateString()}\n`;
        content += `   Days Left:       ${item.daysRemaining}\n`;
        content += '\n';
      });

      content += '─'.repeat(70) + '\n';
      content += `End of list - ${masterList.length} total licenses\n`;

      fs.writeFileSync(filepath, content);
      console.log(`✓ Master list exported to: ${filepath}`);
      console.log(`  Total licenses: ${masterList.length}`);
      return filepath;
    } catch (error) {
      console.error('Error exporting text:', error.message);
      return null;
    }
  }

  /**
   * Display master list in console (formatted table)
   */
  displayInConsole() {
    const masterList = this.generateMasterList();

    if (masterList.length === 0) {
      console.log('\n⚠️  No licenses found.\n');
      return;
    }

    console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║           CRAFTFORGE - MASTER SOFTWARE & LICENSE LIST             ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

    // Display in table format
    const tableData = masterList.map((item, idx) => ({
      '#': idx + 1,
      'Software #': item.softwareNumber,
      'License Key': item.licenseKey.substring(0, 10) + '...',
      'Customer': item.customerName.substring(0, 15),
      'Email': item.email.substring(0, 20),
      'Type': item.licenseType,
      'Status': item.active ? '✓ Active' : '✗ Inactive',
      'Days Left': item.daysRemaining
    }));

    console.table(tableData);

    console.log(`\nTotal Licenses: ${masterList.length}`);
    const activeCount = masterList.filter(l => l.active).length;
    const inactiveCount = masterList.length - activeCount;
    console.log(`Active: ${activeCount}, Inactive: ${inactiveCount}\n`);
  }

  /**
   * Find license by software number
   */
  findBySoftwareNumber(softwareNumber) {
    const masterList = this.generateMasterList();
    return masterList.find(item => item.softwareNumber === softwareNumber);
  }

  /**
   * Find license by email
   */
  findByEmail(email) {
    const masterList = this.generateMasterList();
    return masterList.filter(item => item.email.toLowerCase().includes(email.toLowerCase()));
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const masterList = this.generateMasterList();

    return {
      totalLicenses: masterList.length,
      activeLicenses: masterList.filter(l => l.active).length,
      inactiveLicenses: masterList.filter(l => !l.active).length,
      expiredLicenses: masterList.filter(l => l.daysRemaining < 0).length,
      expiringWithinMonth: masterList.filter(l => l.daysRemaining >= 0 && l.daysRemaining < 30).length,
      byLicenseType: {
        trial: masterList.filter(l => l.licenseType === 'trial').length,
        personal: masterList.filter(l => l.licenseType === 'personal').length,
        professional: masterList.filter(l => l.licenseType === 'professional').length,
        enterprise: masterList.filter(l => l.licenseType === 'enterprise').length
      }
    };
  }

  /**
   * Create simple key-value lookup file
   */
  exportAsKeyValueList(filename = 'software-license-map.txt') {
    const masterList = this.generateMasterList();
    const filepath = path.join(this.dataDir, filename);

    try {
      let content = '# Software Number => License Key Mapping\n';
      content += '# Generated: ' + new Date().toLocaleString() + '\n\n';

      masterList.forEach(item => {
        content += `${item.softwareNumber}=${item.licenseKey}\n`;
      });

      fs.writeFileSync(filepath, content);
      console.log(`✓ Key-value map exported to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Error exporting key-value list:', error.message);
      return null;
    }
  }

  /**
   * Create JSON lookup file (for fast lookups)
   */
  exportAsLookupJSON(filename = 'license-lookup.json') {
    const masterList = this.generateMasterList();
    const filepath = path.join(this.dataDir, filename);

    try {
      const lookup = {
        bySoftwareNumber: {},
        byEmail: {},
        byLicenseKey: {},
        generated: new Date().toISOString()
      };

      masterList.forEach(item => {
        // By software number
        lookup.bySoftwareNumber[item.softwareNumber] = {
          licenseKey: item.licenseKey,
          email: item.email,
          status: item.active ? 'active' : 'inactive'
        };

        // By email
        if (!lookup.byEmail[item.email]) {
          lookup.byEmail[item.email] = [];
        }
        lookup.byEmail[item.email].push({
          softwareNumber: item.softwareNumber,
          licenseKey: item.licenseKey
        });

        // By license key
        lookup.byLicenseKey[item.licenseKey] = {
          softwareNumber: item.softwareNumber,
          email: item.email
        };
      });

      fs.writeFileSync(filepath, JSON.stringify(lookup, null, 2));
      console.log(`✓ Lookup file exported to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Error exporting lookup file:', error.message);
      return null;
    }
  }
}

module.exports = MasterLicenseList;

// If run directly
if (require.main === module) {
  const masterList = new MasterLicenseList();

  console.log('\n🔐 Master License List Generator\n');

  // Display in console
  masterList.displayInConsole();

  // Show statistics
  const stats = masterList.getStatistics();
  console.log('📊 Statistics:');
  console.log(`   Total: ${stats.totalLicenses}`);
  console.log(`   Active: ${stats.activeLicenses}`);
  console.log(`   Inactive: ${stats.inactiveLicenses}`);
  console.log(`   Expired: ${stats.expiredLicenses}`);
  console.log(`   Expiring within 30 days: ${stats.expiringWithinMonth}`);
  console.log('\nBy Type:');
  console.log(`   Trial: ${stats.byLicenseType.trial}`);
  console.log(`   Personal: ${stats.byLicenseType.personal}`);
  console.log(`   Professional: ${stats.byLicenseType.professional}`);
  console.log(`   Enterprise: ${stats.byLicenseType.enterprise}\n`);

  // Export to all formats
  console.log('📤 Exporting...\n');
  masterList.exportAsJSON();
  masterList.exportAsCSV();
  masterList.exportAsText();
  masterList.exportAsKeyValueList();
  masterList.exportAsLookupJSON();

  console.log('\n✅ All exports complete!\n');
  console.log('Files created in: data/ directory\n');
}
