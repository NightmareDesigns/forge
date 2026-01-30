# 🔐 CraftForge License System - Quick Start Guide

## What You Now Have

A **complete license management system** that:
- ✅ Generates unique **Software Numbers** (NM-XXXX-XXXX) for each customer
- ✅ Creates matching **License Keys** (XXXXX-XXXXX-XXXXX-XXXXX)
- ✅ Sends customers their Software Number via email
- ✅ Stores all customer and license data
- ✅ Provides admin dashboard to manage everything
- ✅ Includes REST API for programmatic access

---

## 🚀 Get Started (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
# or if not already installed:
npm install express cors nodemailer
```

### Step 2: Start the Admin Server
```bash
# Windows:
npm run admin-server

# Or manually:
node src/admin/AdminServer.js
```

You should see:
```
✓ Admin server running on http://localhost:5000
```

### Step 3: Open the Dashboard
Go to: **http://localhost:5000/dashboard.html**

You should see the admin interface with tabs:
- Dashboard (statistics)
- Register Payment
- Customers
- Search
- Tools

---

## 💻 How to Use

### Via Dashboard (Easy)

1. Click **Register Payment** tab
2. Fill in customer info:
   - Email: customer@example.com
   - Name: John Doe
   - License Type: personal (or personal/professional/enterprise)
3. Click **Register**
4. You get:
   - Software Number: `NM-A1B2-C3D4`
   - License Key: `XXXXX-XXXXX-XXXXX-XXXXX`
5. Copy the email template and send to customer

### Via REST API (Programmatic)

```bash
# Register a customer and get license
curl -X POST http://localhost:5000/api/register-payment \
  -H "Authorization: Bearer admin-master-key-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "name": "John Doe",
    "productType": "CraftForge",
    "licenseType": "personal",
    "paymentAmount": 49.99,
    "paymentMethod": "stripe"
  }'

# Response:
{
  "success": true,
  "softwareNumber": "NM-A1B2-C3D4",
  "licenseKey": "XXXXX-XXXXX-XXXXX-XXXXX",
  "email": "customer@example.com"
}
```

### Via Test Script

```bash
# Run the demo to see everything in action:
node demo-admin-api.js
```

This will:
- Register a test customer
- Generate Software Number and License Key
- Show how to look up licenses
- Display statistics
- Search customers
- Activate a license

---

## 📧 Sending License Email

### Option A: Manual Copy-Paste
1. Register customer in dashboard
2. Copy the pre-formatted email template
3. Send via your email client

### Option B: Automatic Email (Recommended)

Install nodemailer:
```bash
npm install nodemailer
```

Set up email service (Gmail example):
```bash
# Create a .env file or set environment variables:
CRAFTFORGE_EMAIL=your-email@gmail.com
CRAFTFORGE_EMAIL_PASSWORD=your-app-password
```

For Gmail:
1. Enable 2-Factor Authentication
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an App Password
4. Use that password in CRAFTFORGE_EMAIL_PASSWORD

Then use the email module:
```javascript
const emailModule = require('./src/admin/email-integration');
const LicenseManager = require('./src/admin/LicenseManager');

const licMgr = new LicenseManager();
const result = await licMgr.registerPayment({
  email: 'customer@example.com',
  name: 'John Doe',
  productType: 'CraftForge',
  licenseType: 'personal',
  paymentAmount: 49.99,
  paymentMethod: 'stripe'
});

// Send license email
await emailModule.sendLicenseEmail(
  result.customer,
  result.softwareNumber,
  result.licenseKey
);
```

---

## 🔗 Integrate with Payment Processor

### Stripe Integration

1. Create webhook endpoint in your backend
2. Add this code:

```javascript
const emailModule = require('./src/admin/email-integration');

app.post('/webhook/stripe', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'payment_intent.succeeded') {
    await emailModule.handleStripeWebhook(event);
  }
  
  res.json({ received: true });
});
```

3. In Stripe Dashboard:
   - Settings → Webhooks
   - Add endpoint: `https://yoursite.com/webhook/stripe`
   - Select: `payment_intent.succeeded`

### PayPal Integration

Similar approach - listen to webhooks and call handlers.

See **email-integration.js** for complete examples.

---

## 📊 Available API Endpoints

### Register Payment
```
POST /api/register-payment
Authorization: Bearer admin-master-key-2026
Body: { email, name, productType, licenseType, paymentAmount, paymentMethod }
Returns: { softwareNumber, licenseKey }
```

### Get License by Software Number
```
GET /api/license/NM-XXXX-XXXX
Authorization: Bearer admin-master-key-2026
Returns: { softwareNumber, licenseKey, active, expiryDate }
```

### Activate License
```
POST /api/activate-license
Body: { softwareNumber, licenseKey }
Returns: { success, message, expiryDate }
```

### List All Customers
```
GET /api/customers
Authorization: Bearer admin-master-key-2026
Returns: [ { id, email, name, softwareNumber, ... } ]
```

### Search Customers
```
GET /api/search?q=searchterm
Authorization: Bearer admin-master-key-2026
Returns: [ { matching customers } ]
```

### Get Statistics
```
GET /api/statistics
Authorization: Bearer admin-master-key-2026
Returns: { totalLicenses, activeLicenses, totalCustomers, totalRevenue }
```

### Export as CSV
```
GET /api/export/csv
Authorization: Bearer admin-master-key-2026
Returns: CSV file download
```

---

## 🔒 Security Considerations

### Change Admin Token
Edit **src/admin/AdminServer.js**, line 10:
```javascript
const ADMIN_TOKEN = 'your-secret-token-here'; // Change this!
```

### For Production
1. Use environment variables for sensitive data:
   ```javascript
   const ADMIN_TOKEN = process.env.CRAFTFORGE_ADMIN_TOKEN || 'default-token';
   ```

2. Enable HTTPS only:
   ```javascript
   const https = require('https');
   const fs = require('fs');
   https.createServer({
     key: fs.readFileSync('key.pem'),
     cert: fs.readFileSync('cert.pem')
   }, app).listen(5000);
   ```

3. IP Whitelist (optional):
   ```javascript
   const allowedIPs = ['127.0.0.1', '192.168.1.100'];
   app.use((req, res, next) => {
     if (!allowedIPs.includes(req.ip)) {
      return res.status(403).json({ error: 'Forbidden' });
     }
     next();
   });
   ```

4. Rate limiting:
   ```bash
   npm install express-rate-limit
   ```

---

## 📁 Data Storage

All customer and license data is stored in JSON files in the `data/` directory:

```
data/
  ├── customers.json     # All customer records
  ├── licenses.json      # All license records
  └── backup/           # (create manually for backups)
```

### Backup Your Data
```bash
# Windows
xcopy data\ data-backup\ /E /Y

# Mac/Linux
cp -r data/ data-backup/
```

### Data Format

**customers.json:**
```json
{
  "id": "uuid-123",
  "email": "customer@example.com",
  "name": "John Doe",
  "softwareNumber": "NM-A1B2-C3D4",
  "productType": "CraftForge",
  "licenseType": "personal",
  "paymentAmount": 49.99,
  "paymentMethod": "stripe",
  "paymentDate": "2024-01-15T10:30:00Z"
}
```

**licenses.json:**
```json
{
  "id": "uuid-456",
  "softwareNumber": "NM-A1B2-C3D4",
  "licenseKey": "XXXXX-XXXXX-XXXXX-XXXXX",
  "customerId": "uuid-123",
  "email": "customer@example.com",
  "productType": "CraftForge",
  "licenseType": "personal",
  "issued": "2024-01-15T10:30:00Z",
  "active": true,
  "activationDate": "2024-01-15T10:35:00Z",
  "expiryDate": "2025-01-15T23:59:59Z",
  "lastUsed": "2024-01-20T14:22:00Z"
}
```

---

## ✨ License Types & Expiry

| Type | Duration | Price (Example) |
|------|----------|---|
| trial | 30 days | Free |
| personal | 1 year | $49.99 |
| professional | 2 years | $99.99 |
| enterprise | 5 years | $299.99 |

Expiry dates are automatically calculated when licenses are created.

---

## 🆘 Troubleshooting

### "Cannot find module 'express'"
```bash
npm install express cors
```

### "Port 5000 already in use"
Use a different port in **AdminServer.js**:
```javascript
const port = 5001; // or any available port
```

### "License key not found"
Make sure you're using the exact Software Number and License Key (case-sensitive).

### "Dashboard not loading"
- Check that server is running: `node src/admin/AdminServer.js`
- Try: http://localhost:5000/ (should show welcome page)
- Check browser console for errors

### "Email not sending"
- Check email credentials in environment variables
- Gmail: Generate App Password at myaccount.google.com/apppasswords
- Check firewall/antivirus blocking port 587 (SMTP)

---

## 🎯 Next Steps

1. ✅ **Test Everything**: Run `node demo-admin-api.js`
2. ✅ **Register First Customer**: Use dashboard
3. ✅ **Set Up Email**: Install nodemailer and configure
4. ✅ **Integrate Payment Processor**: Add Stripe/PayPal webhooks
5. ✅ **Change Admin Token**: For production security
6. ✅ **Set Up HTTPS**: If exposing to internet
7. ✅ **Regular Backups**: Copy data/ directory weekly

---

## 📞 Support

For issues or questions:
1. Check console output for error messages
2. Review **ADMIN_SETUP.md** for detailed documentation
3. Check **src/admin/README.md** for API reference
4. Examine **email-integration.js** for payment processor examples

---

**You now have a professional license management system ready to use! 🎉**

Start the server and open the dashboard: **npm run admin-server**
