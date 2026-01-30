/**
 * CraftForge - Admin License API Server
 * RESTful API for managing licenses and customers
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const LicenseManager = require('./LicenseManager');

class AdminServer {
  constructor(port = 5000) {
    this.port = port;
    this.app = express();
    this.licenseManager = new LicenseManager();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ limit: '50mb', extended: true }));
    this.app.use(cors());

    // Basic auth middleware
    this.app.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      const adminToken = process.env.ADMIN_TOKEN || 'admin-master-key-2026';

      // Skip auth for root health check
      if (req.path === '/health') {
        return next();
      }

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token === adminToken) {
          return next();
        }
      }

      res.status(401).json({ error: 'Unauthorized - Invalid or missing token' });
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'Admin License Server running', timestamp: new Date() });
    });

    // Register payment and generate software number + license key
    this.app.post('/api/register-payment', (req, res) => {
      try {
        const result = this.licenseManager.registerPayment(req.body);
        res.json(result);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    // Get license key by software number
    this.app.get('/api/license/:softwareNumber', (req, res) => {
      try {
        const result = this.licenseManager.getLicenseKeyBySoftwareNumber(req.params.softwareNumber);
        res.json(result);
      } catch (err) {
        res.status(404).json({ error: err.message });
      }
    });

    // Activate license
    this.app.post('/api/activate-license', (req, res) => {
      try {
        const { softwareNumber, licenseKey } = req.body;
        const result = this.licenseManager.activateLicense(softwareNumber, licenseKey);
        res.json(result);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    // Get all customers (admin only)
    this.app.get('/api/customers', (req, res) => {
      try {
        const customers = this.licenseManager.getAllCustomers();
        res.json(customers);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    // Get customer by software number (admin only)
    this.app.get('/api/customer/:softwareNumber', (req, res) => {
      try {
        const customer = this.licenseManager.getCustomerBySoftwareNumber(req.params.softwareNumber);
        if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    // Search customers (admin only)
    this.app.get('/api/search', (req, res) => {
      try {
        const { q } = req.query;
        if (!q) {
          return res.status(400).json({ error: 'Query parameter required' });
        }
        const results = this.licenseManager.searchCustomers(q);
        res.json(results);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    // Get statistics (admin only)
    this.app.get('/api/statistics', (req, res) => {
      try {
        const stats = this.licenseManager.getStatistics();
        res.json(stats);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    // Export as CSV (admin only)
    this.app.get('/api/export/csv', (req, res) => {
      try {
        const csv = this.licenseManager.exportAsCSV();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="licenses.csv"');
        res.send(csv);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    // Resend license key
    this.app.post('/api/resend-key/:softwareNumber', (req, res) => {
      try {
        const result = this.licenseManager.resendLicenseKey(req.params.softwareNumber);
        res.json(result);
      } catch (err) {
        res.status(404).json({ error: err.message });
      }
    });

    // Master license list
    this.app.get('/api/license-list', (req, res) => {
      try {
        const MasterLicenseList = require('./MasterLicenseList');
        const masterList = new MasterLicenseList();
        const licenses = masterList.generateMasterList();
        const stats = masterList.getStatistics();

        res.json({
          success: true,
          licenses: licenses,
          stats: stats
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Export master license list
    this.app.get('/api/export-license-list', (req, res) => {
      try {
        const format = req.query.format || 'json';
        const MasterLicenseList = require('./MasterLicenseList');
        const masterList = new MasterLicenseList();
        const licenses = masterList.generateMasterList();

        if (format === 'csv') {
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

          const rows = licenses.map(item => [
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

          const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename="master-license-list.csv"');
          res.send(csv);
        } else if (format === 'txt') {
          let content = '╔════════════════════════════════════════════════════════════════╗\n';
          content += '║          CRAFTFORGE - MASTER LICENSE LIST                       ║\n';
          content += '║          Software Numbers & License Keys                         ║\n';
          content += '╚════════════════════════════════════════════════════════════════╝\n\n';
          content += `Generated: ${new Date().toLocaleString()}\n`;
          content += `Total Licenses: ${licenses.length}\n\n`;
          content += '─'.repeat(70) + '\n\n';

          licenses.forEach((item, index) => {
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
          content += `End of list - ${licenses.length} total licenses\n`;

          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Content-Disposition', 'attachment; filename="master-license-list.txt"');
          res.send(content);
        } else {
          // JSON format (default)
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', 'attachment; filename="master-license-list.json"');
          res.send(JSON.stringify(licenses, null, 2));
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Serve master license list HTML page
    this.app.get('/master-license-list.html', (req, res) => {
      res.sendFile(path.join(__dirname, 'master-license-list.html'));
    });
  }

  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(`\n🔐 Admin License Server started on http://localhost:${this.port}`);
      console.log('📋 API Documentation:');
      console.log('  POST   /api/register-payment - Register customer payment');
      console.log('  GET    /api/license/:softwareNumber - Get license key');
      console.log('  POST   /api/activate-license - Activate a license');
      console.log('  GET    /api/customers - Get all customers');
      console.log('  GET    /api/customer/:softwareNumber - Get specific customer');
      console.log('  GET    /api/search?q=query - Search customers');
      console.log('  GET    /api/statistics - Get license statistics');
      console.log('  GET    /api/export/csv - Export as CSV');
      console.log('  POST   /api/resend-key/:softwareNumber - Resend license key');
      console.log('  GET    /api/license-list - Get master license list');
      console.log('  GET    /api/export-license-list - Export master list (CSV/TXT/JSON)');
      console.log('\n📱 Web Interfaces:');
      console.log('  http://localhost:' + this.port + '/dashboard.html - Admin Dashboard');
      console.log('  http://localhost:' + this.port + '/master-license-list.html - Master License List');
      console.log('  http://localhost:' + this.port + '/customer-portal.html - Customer Portal\n');
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new AdminServer(5000);
  server.start();

  process.on('SIGINT', () => {
    console.log('\n Shutting down Admin License Server...');
    server.stop();
    process.exit(0);
  });
}

module.exports = AdminServer;
