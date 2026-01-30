#!/usr/bin/env node

/**
 * Master License List - Demo & Test Script
 * Shows how to use the master license list system
 */

const MasterLicenseList = require('./src/admin/MasterLicenseList');

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║     CraftForge - Master License List Demo                     ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const master = new MasterLicenseList();

// 1. Display in console
console.log('📊 OPTION 1: View in Console\n');
console.log('Displaying all licenses in table format:\n');
master.displayInConsole();

// 2. Get statistics
console.log('\n📈 OPTION 2: Get Statistics\n');
const stats = master.getStatistics();
console.log('Statistics:');
console.log(`  • Total Licenses: ${stats.totalLicenses}`);
console.log(`  • Active: ${stats.activeLicenses}`);
console.log(`  • Inactive: ${stats.inactiveLicenses}`);
console.log(`  • Expired: ${stats.expiredLicenses}`);
console.log(`  • Expiring Soon (30 days): ${stats.expiringWithinMonth}`);
console.log('\nBy License Type:');
console.log(`  • Trial: ${stats.byLicenseType.trial}`);
console.log(`  • Personal: ${stats.byLicenseType.personal}`);
console.log(`  • Professional: ${stats.byLicenseType.professional}`);
console.log(`  • Enterprise: ${stats.byLicenseType.enterprise}\n`);

// 3. Search examples
console.log('🔍 OPTION 3: Search Functions\n');

// Get first license to search for
const allLicenses = master.generateMasterList();
if (allLicenses.length > 0) {
  const firstLicense = allLicenses[0];
  
  console.log(`Example 1: Search by Software Number\n`);
  console.log(`  Searching for: "${firstLicense.softwareNumber}"\n`);
  const byNumber = master.findBySoftwareNumber(firstLicense.softwareNumber);
  if (byNumber) {
    console.log(`  ✓ Found:`);
    console.log(`    Software: ${byNumber.softwareNumber}`);
    console.log(`    Key: ${byNumber.licenseKey}`);
    console.log(`    Customer: ${byNumber.customerName}`);
    console.log(`    Email: ${byNumber.email}\n`);
  }

  console.log(`Example 2: Search by Email\n`);
  console.log(`  Searching for: "${firstLicense.email}"\n`);
  const byEmail = master.findByEmail(firstLicense.email);
  console.log(`  ✓ Found ${byEmail.length} license(s):`);
  byEmail.forEach((lic, idx) => {
    console.log(`    ${idx + 1}. ${lic.softwareNumber} - ${lic.licenseType}`);
  });
  console.log('');
}

// 4. Export examples
console.log('📤 OPTION 4: Export to Files\n');
console.log('Creating export files in data/ directory:\n');

const jsonPath = master.exportAsJSON();
const csvPath = master.exportAsCSV();
const txtPath = master.exportAsText();
const mapPath = master.exportAsKeyValueList();
const lookupPath = master.exportAsLookupJSON();

console.log(`✓ ${jsonPath}`);
console.log(`✓ ${csvPath}`);
console.log(`✓ ${txtPath}`);
console.log(`✓ ${mapPath}`);
console.log(`✓ ${lookupPath}\n`);

// 5. Show file locations
console.log('📁 OPTION 5: Access via Web Interface\n');
console.log('Start the admin server and open:\n');
console.log('  Web Interface:');
console.log('    http://localhost:5000/master-license-list.html\n');
console.log('  API Endpoint:');
console.log('    GET http://localhost:5000/api/license-list');
console.log('    (requires: Authorization: Bearer admin-master-key-2026)\n');

// 6. Show API examples
console.log('💻 OPTION 6: Use via API\n');
console.log('cURL examples:\n');
console.log('Get master list as JSON:');
console.log('  curl -H "Authorization: Bearer admin-master-key-2026" \\');
console.log('    http://localhost:5000/api/license-list\n');

console.log('Export as CSV:');
console.log('  curl -H "Authorization: Bearer admin-master-key-2026" \\');
console.log('    http://localhost:5000/api/export-license-list?format=csv \\\n');
console.log('    > licenses.csv\n');

console.log('Export as JSON:');
console.log('  curl -H "Authorization: Bearer admin-master-key-2026" \\');
console.log('    http://localhost:5000/api/export-license-list?format=json \\\n');
console.log('    > licenses.json\n');

// 7. Code examples
console.log('🔧 OPTION 7: Use in Your Code\n');
console.log('JavaScript examples:\n');

console.log('// Load the master list');
console.log("const MasterLicenseList = require('./src/admin/MasterLicenseList');");
console.log('const list = new MasterLicenseList();\n');

console.log('// Get all licenses');
console.log('const allLicenses = list.generateMasterList();\n');

console.log('// Find a license');
console.log('const license = list.findBySoftwareNumber("NM-A1B2-C3D4");');
console.log('console.log(license.licenseKey);\n');

console.log('// Find customer licenses');
console.log('const customerLicenses = list.findByEmail("john@example.com");\n');

console.log('// Get statistics');
console.log('const stats = list.getStatistics();');
console.log('console.log(stats.totalLicenses);\n');

console.log('// Export');
console.log('list.exportAsCSV();');
console.log('list.exportAsJSON();\n');

// Summary
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                         Summary                               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('✅ Master License List System Ready!\n');
console.log('You can now:\n');
console.log('1. View all licenses in web interface');
console.log('   → http://localhost:5000/master-license-list.html\n');

console.log('2. Search by software number or email');
console.log('   → Use the search box in web interface\n');

console.log('3. Export to CSV, JSON, or TXT');
console.log('   → Click export buttons or use API\n');

console.log('4. Access via API');
console.log('   → /api/license-list endpoint\n');

console.log('5. Use in code');
console.log('   → Import MasterLicenseList class\n');

console.log('6. Run from command line');
console.log('   → node src/admin/MasterLicenseList.js\n');

console.log('📖 For more details, see: MASTER_LICENSE_LIST_GUIDE.md\n');

console.log('🚀 Next steps:\n');
console.log('1. Start admin server:');
console.log('   npm run admin-server\n');

console.log('2. Open master list:');
console.log('   http://localhost:5000/master-license-list.html\n');

console.log('3. Search and export licenses\n');

console.log('═══════════════════════════════════════════════════════════════\n');
