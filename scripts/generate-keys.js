#!/usr/bin/env node

/**
 * License Key Generator Tool — CraftForge
 * Generates 5000 unique license keys
 * Usage: node generate-keys.js [output-file]
 */

const KeyGenerator = require('../src/key-generator');
const fs = require('fs');
const path = require('path');

console.log('🔑 CraftForge License Key Generator\n');

const outputFile = process.argv[2] || './license_keys.json';

console.log(`Generating 5000 unique license keys...`);
console.log(`Output file: ${path.resolve(outputFile)}\n`);

const keygen = new KeyGenerator();

console.log('⏳ Generating batch of 5000 keys...');
const keys = keygen.generateBatch(5000);

console.log(`✅ Generated ${keys.length} unique keys\n`);

console.log('📊 Sample keys (first 10):');
keys.slice(0, 10).forEach((k, i) => {
  console.log(`  ${i + 1}. ${k.key}`);
});
console.log('...\n');

console.log('💾 Saving to JSON...');
const jsonResult = keygen.exportToJSON(outputFile);
if (jsonResult.success) {
  console.log(`✅ Saved to: ${jsonResult.path}`);
  console.log(`   Total keys: ${jsonResult.count}\n`);
} else {
  console.error(`❌ Error saving JSON: ${jsonResult.error}\n`);
  process.exit(1);
}

const csvFile = outputFile.replace('.json', '.csv');
console.log('📄 Exporting to CSV...');
const csvResult = keygen.exportToCSV(csvFile);
if (csvResult.success) {
  console.log(`✅ Saved to: ${csvResult.path}\n`);
} else {
  console.error(`❌ Error saving CSV: ${csvResult.error}\n`);
  process.exit(1);
}

console.log('📈 Key Statistics:');
const stats = keygen.getStats();
console.log(`   Total generated: ${stats.total}`);
console.log(`   Available: ${stats.available}`);
console.log(`   Used: ${stats.used}\n`);

console.log('✨ License key generation complete!');
console.log('\n⚠️  IMPORTANT: Keep license_keys.json secure and private!');
console.log('   This file contains all unused keys and should not be distributed.\n');
console.log('💡 Next steps:');
console.log('   1. Distribute individual keys to customers via email or portal');
console.log('   2. Track key usage by storing the JSON file securely');
console.log('   3. Update the list after each key activation\n');
