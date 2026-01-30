/**
 * Admin License System - Demo & Testing Script
 * Shows how to use the API to register customers and manage licenses
 */

const http = require('http');

const API_URL = 'localhost:5000';
const ADMIN_TOKEN = 'admin-master-key-2026';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_URL.split(':')[0],
      port: API_URL.split(':')[1],
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function demo() {
  console.log('🔐 CraftForge Admin License System - Demo\n');
  console.log('Make sure the admin server is running on port 5000!\n');

  try {
    // 1. Register a new customer
    console.log('📝 1. Registering new customer...');
    const registerResult = await makeRequest('POST', '/api/register-payment', {
      email: `customer-${Date.now()}@example.com`,
      name: 'Demo Customer',
      productType: 'CraftForge',
      licenseType: 'personal',
      paymentAmount: 49.99,
      paymentMethod: 'demo'
    });

    if (registerResult.error) {
      console.error('❌ Error:', registerResult.error);
      return;
    }

    console.log('✓ Customer registered!');
    console.log(`  Software Number: ${registerResult.softwareNumber}`);
    console.log(`  License Key: ${registerResult.licenseKey}`);
    console.log(`  Email: ${registerResult.email}\n`);

    const softwareNumber = registerResult.softwareNumber;

    // 2. Get license key by software number
    console.log('🔍 2. Retrieving license key by software number...');
    const licenseResult = await makeRequest('GET', `/api/license/${softwareNumber}`);

    if (licenseResult.error) {
      console.error('❌ Error:', licenseResult.error);
      return;
    }

    console.log('✓ License retrieved!');
    console.log(`  Software: ${licenseResult.softwareNumber}`);
    console.log(`  Key: ${licenseResult.licenseKey}`);
    console.log(`  Status: ${licenseResult.active ? 'Active' : 'Inactive'}`);
    console.log(`  Expires: ${new Date(licenseResult.expiryDate).toLocaleDateString()}\n`);

    // 3. Get statistics
    console.log('📊 3. Fetching license statistics...');
    const statsResult = await makeRequest('GET', '/api/statistics');

    if (statsResult.error) {
      console.error('❌ Error:', statsResult.error);
      return;
    }

    console.log('✓ Statistics retrieved!');
    console.log(`  Total Licenses: ${statsResult.totalLicenses}`);
    console.log(`  Active Licenses: ${statsResult.activeLicenses}`);
    console.log(`  Total Customers: ${statsResult.totalCustomers}`);
    console.log(`  Total Revenue: $${statsResult.totalRevenue.toFixed(2)}\n`);

    // 4. Get all customers
    console.log('👥 4. Fetching all customers...');
    const customersResult = await makeRequest('GET', '/api/customers');

    if (Array.isArray(customersResult)) {
      console.log(`✓ Retrieved ${customersResult.length} customer(s)`);
      customersResult.forEach((customer, idx) => {
        console.log(`  ${idx + 1}. ${customer.name} (${customer.email}) - ${customer.softwareNumber}`);
      });
      console.log('');
    } else if (customersResult.error) {
      console.error('❌ Error:', customersResult.error);
    }

    // 5. Search customers
    console.log('🔎 5. Searching for customers...');
    const searchResult = await makeRequest('GET', '/api/search?q=demo');

    if (Array.isArray(searchResult)) {
      console.log(`✓ Found ${searchResult.length} result(s) for "demo"`);
      searchResult.forEach((customer) => {
        console.log(`  - ${customer.name}: ${customer.softwareNumber}`);
      });
      console.log('');
    } else if (searchResult.error) {
      console.error('❌ Error:', searchResult.error);
    }

    // 6. Activate a license
    console.log('✅ 6. Activating license...');
    const activateResult = await makeRequest('POST', '/api/activate-license', {
      softwareNumber: softwareNumber,
      licenseKey: registerResult.licenseKey
    });

    if (activateResult.error) {
      console.error('❌ Error:', activateResult.error);
    } else {
      console.log('✓ License activated!');
      console.log(`  Message: ${activateResult.message}`);
      console.log(`  Expires: ${new Date(activateResult.expiryDate).toLocaleDateString()}\n`);
    }

    console.log('🎉 Demo completed successfully!\n');
    console.log('📖 Next steps:');
    console.log('  1. Open http://localhost:5000/dashboard.html in your browser');
    console.log('  2. View the newly registered customer');
    console.log('  3. Test the search and export features');
    console.log('  4. Integrate with your payment processor\n');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.log('\nMake sure the admin server is running:');
    console.log('  npm run admin-server\n');
  }
}

// Run demo
console.log('\n⏳ Waiting for server...\n');
setTimeout(demo, 1000);
