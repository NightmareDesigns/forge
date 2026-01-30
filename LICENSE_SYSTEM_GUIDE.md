# 🎨 CraftForge - Complete License System Summary

## What's Been Created

You now have a **complete, production-ready license management system** for CraftForge with three main components:

### 1. **Admin Backend** (Node.js/Express)
- Generate unique Software Numbers (NM-XXXX-XXXX)
- Generate License Keys (XXXXX-XXXXX-XXXXX-XXXXX)
- Manage all customer and license data
- REST API endpoints for programmatic access
- Search, export, and analytics features

### 2. **Admin Dashboard** (Web Interface)
- Beautiful dark-themed interface
- Register customers and generate licenses
- View all customers and licenses
- Search functionality
- Export data as CSV
- Resend license keys

### 3. **Customer Portal** (License Verification)
- Customers can verify their license status
- Check expiry dates and days remaining
- Beautiful, user-friendly interface
- Works independently (can be hosted separately)

---

## 📁 Files Created

```
src/admin/
├── LicenseManager.js           # Core business logic
├── AdminServer.js              # Express API server
├── dashboard.html              # Admin interface
├── customer-portal.html        # Customer verification portal
├── email-integration.js        # Email sending + webhook handlers
└── README.md                   # API documentation

Root level:
├── QUICK_START_LICENSE.md      # Quick start guide
├── ADMIN_SETUP.md              # Detailed setup guide
├── demo-admin-api.js           # Test/demo script
├── start-admin.sh              # Unix startup script
└── start-admin.bat             # Windows startup script
```

---

## 🚀 Quick Start (Choose One)

### Option A: Dashboard Web Interface (Easiest)
```bash
npm run admin-server
# Then open: http://localhost:5000/dashboard.html
```

### Option B: REST API (Programmatic)
```bash
node src/admin/AdminServer.js
# Then make HTTP requests to http://localhost:5000/api/...
```

### Option C: Demo/Test
```bash
# First start the server in one terminal:
npm run admin-server

# Then in another terminal:
node demo-admin-api.js
```

---

## 💻 How Customers Get Their License

### The Complete Flow:

```
1. Customer Pays (Stripe/PayPal)
    ↓
2. Webhook triggers your backend
    ↓
3. Register payment with:
   POST /api/register-payment
   {
     email: "customer@example.com",
     name: "John Doe",
     productType: "CraftForge",
     licenseType: "personal",
     paymentAmount: 49.99,
     paymentMethod: "stripe"
   }
    ↓
4. You get back:
   {
     softwareNumber: "NM-A1B2-C3D4",
     licenseKey: "XXXXX-XXXXX-XXXXX-XXXXX"
   }
    ↓
5. Email template automatically generated
    ↓
6. Customer receives email with:
   - Software Number
   - License Key
   - Instructions on how to activate
    ↓
7. Customer opens CraftForge → Help → License
    ↓
8. Pastes Software Number + License Key
    ↓
9. License is activated!
    ↓
10. Valid for: 1 year (personal), 2 years (professional), etc.
```

---

## 📧 How to Send License Emails

### Method 1: Manual (Copy-Paste)
1. Register customer in dashboard
2. Copy pre-formatted email template
3. Send via Gmail/Outlook

### Method 2: Automatic (Best for Production)
```bash
npm install nodemailer
```

Set environment variables:
```
CRAFTFORGE_EMAIL=your-email@gmail.com
CRAFTFORGE_EMAIL_PASSWORD=your-app-password
```

Use in code:
```javascript
const emailModule = require('./src/admin/email-integration');
await emailModule.sendLicenseEmail(customer, softwareNumber, licenseKey);
```

See **email-integration.js** for full examples with Stripe/PayPal.

---

## 🔗 Integration Points

### Stripe Webhook
```javascript
// Your backend
const emailModule = require('./src/admin/email-integration');

app.post('/webhook/stripe', async (req, res) => {
  await emailModule.handleStripeWebhook(req.body);
  res.json({ received: true });
});
```

See **email-integration.js** for complete Stripe and PayPal examples.

### PayPal Webhook
Similar process - see **email-integration.js** for code.

---

## 🌐 API Reference (Quick)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/register-payment` | POST | Register customer, get license |
| `/api/license/:softwareNumber` | GET | Get license key by software number |
| `/api/activate-license` | POST | Activate license (customer-facing) |
| `/api/customers` | GET | List all customers |
| `/api/customer/:softwareNumber` | GET | Get specific customer |
| `/api/search?q=term` | GET | Search customers |
| `/api/statistics` | GET | Get dashboard stats |
| `/api/export/csv` | GET | Download CSV export |
| `/api/resend-key/:softwareNumber` | POST | Resend license email |

All endpoints (except `/api/activate-license`) require:
```
Authorization: Bearer admin-master-key-2026
```

---

## 📊 Admin Dashboard Features

### Dashboard Tab
- Total licenses, active licenses, customers count
- Total revenue
- Breakdown by license type
- Real-time statistics

### Register Payment Tab
- Enter customer info
- Auto-generates Software Number + License Key
- Shows pre-formatted email template
- Copy buttons for easy sharing

### Customers Tab
- View all registered customers
- See email, name, software number, status
- Resend license key if needed

### Search Tab
- Search by email, name, or software number
- Real-time results
- Quick access to customer details

### Tools Tab
- Look up license key by software number
- Export all data as CSV or JSON

---

## 🔐 Customer Portal

Customers can verify their license at:
```
http://your-domain.com/customer-portal.html
```

They enter:
- Software Number
- License Key

They see:
- License status (Active/Expired/Expiring Soon)
- Days remaining
- Expiry date
- License type and product

---

## 📁 Data Storage

All data stored in JSON files in `data/` directory:

```
data/
├── customers.json          # All customer records
└── licenses.json          # All license records
```

Each customer record includes:
- Email, name
- Software Number
- Product type, license type
- Payment amount, method, date
- License key

**Backup regularly!**
```bash
# Windows
xcopy data\ data-backup\ /E /Y

# Mac/Linux
cp -r data/ data-backup/
```

---

## 🔒 Security Checklist

- [ ] **Change Admin Token** - Edit `src/admin/AdminServer.js` line 10
- [ ] **Use HTTPS** - In production, enable SSL
- [ ] **IP Whitelist** - Restrict admin dashboard access
- [ ] **Rate Limiting** - Add `express-rate-limit`
- [ ] **Backup Data** - Regular backups of `data/` folder
- [ ] **Environment Variables** - Use `.env` for sensitive data
- [ ] **Secure Payment Processor Token** - Never commit to git

---

## 🎯 License Types & Pricing

Configure in your payment processor:

| Type | Duration | Example Price |
|------|----------|---|
| trial | 30 days | Free |
| personal | 1 year | $49.99 |
| professional | 2 years | $99.99 |
| enterprise | 5 years | $299.99 |

---

## 🆘 Common Tasks

### Register a Customer
```bash
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
```

### Get License Key
```bash
curl http://localhost:5000/api/license/NM-XXXX-XXXX \
  -H "Authorization: Bearer admin-master-key-2026"
```

### Search Customers
```bash
curl http://localhost:5000/api/search?q=john@example.com \
  -H "Authorization: Bearer admin-master-key-2026"
```

### Export Data
```bash
curl http://localhost:5000/api/export/csv \
  -H "Authorization: Bearer admin-master-key-2026" \
  -o customers.csv
```

---

## 📚 Documentation Files

1. **QUICK_START_LICENSE.md** - Get running in 5 minutes
2. **ADMIN_SETUP.md** - Detailed setup and integration guide
3. **src/admin/README.md** - Complete API reference
4. **email-integration.js** - Email + webhook examples
5. This file - System overview

---

## 🚀 Deployment Options

### Local Development
```bash
npm run admin-server
# http://localhost:5000/dashboard.html
```

### Production Deployment

#### Option 1: Own Server
```bash
# Install PM2 for process management
npm install -g pm2

# Start as service
pm2 start src/admin/AdminServer.js --name craftforge-admin
pm2 startup
pm2 save
```

#### Option 2: Cloud (Heroku, DigitalOcean, etc.)
- Fork the project
- Deploy to your platform
- Set `CRAFTFORGE_ADMIN_TOKEN` environment variable
- Enable HTTPS

#### Option 3: Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT=5000
EXPOSE 5000
CMD ["node", "src/admin/AdminServer.js"]
```

---

## 📞 Support & Troubleshooting

### "Port 5000 already in use"
Change port in `AdminServer.js`:
```javascript
const port = process.env.PORT || 5000;
```

### "Module not found"
```bash
npm install express cors nodemailer
```

### "License verification fails"
- Check Software Number is uppercase
- Verify License Key exactly matches
- Check expiry date hasn't passed

### "Email not sending"
- For Gmail: Use App Password (not regular password)
- Check `CRAFTFORGE_EMAIL_PASSWORD` environment variable
- Verify firewall allows port 587

---

## ✅ You're All Set!

Your license system is ready to:
1. ✅ Accept payments from customers
2. ✅ Generate unique software numbers
3. ✅ Create matching license keys
4. ✅ Email customers automatically
5. ✅ Manage all licenses from one dashboard
6. ✅ Track revenue and analytics
7. ✅ Allow customers to verify their licenses

**Next Steps:**
1. Run `npm run admin-server`
2. Open dashboard at http://localhost:5000/dashboard.html
3. Register a test customer
4. Integrate with your payment processor
5. Deploy to production!

---

## 📝 Quick Reference

```bash
# Start admin server
npm run admin-server

# Run demo/test
node demo-admin-api.js

# Check what endpoints are available
curl http://localhost:5000/

# View all customers (requires token)
curl http://localhost:5000/api/customers \
  -H "Authorization: Bearer admin-master-key-2026"
```

---

**Built with ❤️ for CraftForge**

For questions or issues, see the comprehensive documentation files included with this system.
