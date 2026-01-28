#!/usr/bin/env node

/**
 * License Key Manager Tool — CraftForge
 * Manages and validates license keys
 * Usage: node manage-keys.js [command] [args]
 */

const KeyGenerator = require('../src/key-generator');
const fs = require('fs');
const path = require('path');

const commands = {
  status: 'Show key database statistics',
  import: 'Import keys from JSON file',
  verify: 'Verify a license key',
  mark: 'Mark a key as used',
  export: 'Export keys to CSV',
  list: 'List first N keys',
  help: 'Show help'
};

function showHelp() {
  console.log('\n🔑 CraftForge License Key Manager\n');
  console.log('Commands:');
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(12)} ${desc}`);
  });
  console.log('\nExamples:');
  console.log('  node manage-keys.js status license_keys.json');
  console.log('  node manage-keys.js verify license_keys.json XXXX-XXXX-XXXX-XXXX');
  console.log('  node manage-keys.js list license_keys.json 20');
  console.log('  node manage-keys.js export license_keys.json output.csv\n');
}

function showStatus(keyFile) {
  if (!fs.existsSync(keyFile)) {
    console.error(`❌ File not found: ${keyFile}`);
    process.exit(1);
  }

  const keygen = new KeyGenerator();
  const result = keygen.importFromJSON(keyFile);
  if (!result.success) {
    console.error(`❌ Error importing keys: ${result.error}`);
    process.exit(1);
  }

  const stats = keygen.getStats();
  console.log('\n📊 Key Database Statistics\n');
  console.log(`File: ${path.resolve(keyFile)}`);
  console.log(`Total keys: ${stats.total}`);
  console.log(`Available: ${stats.available}`);
  console.log(`Used: ${stats.used}`);
  console.log(`Usage: ${stats.usagePercent}\n`);
}

function verifyKey(keyFile, keyString) {
  if (!keyString) {
    console.error('❌ Please provide a license key to verify');
    process.exit(1);
  }

  if (!fs.existsSync(keyFile)) {
    console.error(`❌ File not found: ${keyFile}`);
    process.exit(1);
  }

  const keygen = new KeyGenerator();
  const result = keygen.importFromJSON(keyFile);
  if (!result.success) {
    console.error(`❌ Error importing keys: ${result.error}`);
    process.exit(1);
  }

  const exists = keygen.verifyKeyExists(keyString);
  console.log(`\n🔍 Key Verification: ${keyString}\n`);
  if (exists) {
    console.log('✅ Key found in database');
    const cleanKey = keyString.replace(/-/g, '').toUpperCase();
    const keyRecord = keygen.keyMap[cleanKey];
    if (keyRecord) {
      console.log(`   Status: ${keyRecord.used ? 'USED' : 'AVAILABLE'}`);
      if (keyRecord.used) {
        console.log(`   Used by: ${keyRecord.usedBy}`);
        console.log(`   Used on: ${keyRecord.usedDate}`);
      }
    }
  } else {
    console.log('❌ Key not found in database (INVALID KEY)');
  }
  console.log();
}

function listKeys(keyFile, count = 10) {
  if (!fs.existsSync(keyFile)) {
    console.error(`❌ File not found: ${keyFile}`);
    process.exit(1);
  }

  const keygen = new KeyGenerator();
  const result = keygen.importFromJSON(keyFile);
  if (!result.success) {
    console.error(`❌ Error importing keys: ${result.error}`);
    process.exit(1);
  }

  const n = parseInt(count) || 10;
  const samples = keygen.getSampleKeys(n);

  console.log(`\n📋 First ${samples.length} Keys\n`);
  samples.forEach((k, i) => {
    console.log(`  ${(i + 1).toString().padStart(4)} | ${k.key}`);
  });
  console.log();
}

function exportKeys(keyFile, outputFile) {
  if (!fs.existsSync(keyFile)) {
    console.error(`❌ File not found: ${keyFile}`);
    process.exit(1);
  }

  const keygen = new KeyGenerator();
  const result = keygen.importFromJSON(keyFile);
  if (!result.success) {
    console.error(`❌ Error importing keys: ${result.error}`);
    process.exit(1);
  }

  const csvFile = outputFile || keyFile.replace('.json', '.csv');
  const csvResult = keygen.exportToCSV(csvFile);

  console.log(`\n📤 Export Complete\n`);
  if (csvResult.success) {
    console.log(`✅ Exported to: ${path.resolve(csvResult.path)}`);
    console.log(`   Keys exported: ${csvResult.count}\n`);
  } else {
    console.error(`❌ Export failed: ${csvResult.error}\n`);
    process.exit(1);
  }
}

function markKeyUsed(keyFile, keyString, machineId) {
  if (!keyString || !machineId) {
    console.error('❌ Please provide: key-string and machine-id');
    process.exit(1);
  }

  if (!fs.existsSync(keyFile)) {
    console.error(`❌ File not found: ${keyFile}`);
    process.exit(1);
  }

  const keygen = new KeyGenerator();
  const result = keygen.importFromJSON(keyFile);
  if (!result.success) {
    console.error(`❌ Error importing keys: ${result.error}`);
    process.exit(1);
  }

  const markResult = keygen.markKeyAsUsed(keyString, machineId);
  console.log(`\n🔖 Mark Key as Used\n`);
  if (markResult.success) {
    console.log(`✅ ${markResult.message}`);
    console.log(`   Key: ${keyString}`);
    console.log(`   Machine: ${machineId}`);
    keygen.exportToJSON(keyFile);
    console.log(`   Updated file: ${path.resolve(keyFile)}\n`);
  } else {
    console.error(`❌ ${markResult.error}\n`);
    process.exit(1);
  }
}

// Main
const cmd = process.argv[2] || 'help';
const arg1 = process.argv[3];
const arg2 = process.argv[4];
const arg3 = process.argv[5];

switch (cmd) {
  case 'status':
    showStatus(arg1 || './license_keys.json');
    break;
  case 'verify':
    verifyKey(arg1 || './license_keys.json', arg2);
    break;
  case 'list':
    listKeys(arg1 || './license_keys.json', arg2);
    break;
  case 'export':
    exportKeys(arg1 || './license_keys.json', arg2);
    break;
  case 'mark':
    markKeyUsed(arg1 || './license_keys.json', arg2, arg3);
    break;
  case 'help':
  default:
    showHelp();
}
