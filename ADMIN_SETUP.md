# 🔐 CraftForge Master License System Setup Guide

Your complete solution for managing software licenses, customer payments, and license key distribution.

## What This System Does

When a customer pays for CraftForge:

1. **Customer Payment** → They purchase a license
2. **Generate Software Number** → Unique identifier like `NM-XXXX-XXXX`
3. **Email to Customer** → Customer receives this number
4. **Customer Enters Number** → They input it in the CraftForge app
5. **Automatic Key Generation** → System provides matching license key
6. **License Activated** → Software unlocked and ready to use

## Getting Started

### Step 1: Start the Admin Server

**On Windows:**
```cmd
start-admin.bat
```

**On Mac/Linux:**
```bash
bash start-admin.sh
```

**Or manually:**
```bash
npm run admin-server
```

You should see:
```
🔐 Admin License Server started on http://localhost:5000
```

### Step 2: Open the Dashboard

Open your web browser and go to:
```
http://localhost:5000/dashboard.html
```

You'll see the admin dashboard with the default admin token loaded.

### Step 3: Register Your First Customer

1. Click the **"Register Payment"** tab
2. Fill in customer details:
   - Email: `customer@example.com`
   - Name: `John Doe`
   - Product Type: `CraftForge`
   - License Type: `Personal`
   - Payment Amount: `49.99`
   - Payment Method: `Stripe`
3. Click **"Register Payment & Generate Keys"**

The system will generate:
- **Software Number** → `NM-XXXX-XXXX` (send to customer)
- **License Key** → `XXXXX-XXXXX-XXXXX-XXXXX` (customer gets when they activate)

### Step 4: Send Email to Customer

Copy the provided email template and send to customer with the software number.

Example:
```
Dear John Doe,

Thank you for your purchase of CraftForge!

Your Software Number is:
NM-A7K2-M9P5

To activate your license, please use this software number 
when prompted in the application.

Once you enter the software number, you will receive your 
license key via email.

Best regards,
Nightmare Designs Team
```

## Dashboard Features

### 📊 Dashboard Tab
- View license statistics
- See active vs inactive licenses
- Check total revenue
- Monitor license type distribution

### ✅ Register Payment Tab
- Register new customer purchases
- Auto-generate software number
- Auto-generate license key
- Get ready-to-send email template
- Copy to clipboard buttons

### 👥 Customers Tab
- View all registered customers
- See activation status
- Check payment amounts
- Quick actions (View details, Resend key)

### 🔍 Search Tab
- Search by email, name, or software number
- View customer license information
- Copy license keys

### 🛠️ Tools Tab
- Get license key by software number
- Resend key to customer
- Export data as CSV or JSON

## API Reference

### Register Payment
Registers a customer and generates software number + license key.

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

**Response:**
```json
{
  "success": true,
  "softwareNumber": "NM-A7K2-M9P5",
  "licenseKey": "XXXXX-XXXXX-XXXXX-XXXXX",
  "email": "customer@example.com",
  "name": "John Doe"
}
```

### Get License Key
Retrieve license key for a software number.

```bash
curl http://localhost:5000/api/license/NM-A7K2-M9P5 \
  -H "Authorization: Bearer admin-master-key-2026"
```

### View All Customers
```bash
curl http://localhost:5000/api/customers \
  -H "Authorization: Bearer admin-master-key-2026"
```

### Search Customers
```bash
curl "http://localhost:5000/api/search?q=john" \
  -H "Authorization: Bearer admin-master-key-2026"
```

### Get Statistics
```bash
curl http://localhost:5000/api/statistics \
  -H "Authorization: Bearer admin-master-key-2026"
```

### Export CSV
```bash
curl http://localhost:5000/api/export/csv \
  -H "Authorization: Bearer admin-master-key-2026" \
  > licenses.csv
```

## Integration with Payment Processors

### Stripe Integration Example

When you receive a Stripe webhook for successful payment:

```javascript
const response = await fetch('http://localhost:5000/api/register-payment', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer admin-master-key-2026',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: paymentData.receipt_email,
    name: paymentData.metadata.customer_name,
    productType: 'CraftForge',
    licenseType: paymentData.metadata.license_type,
    paymentAmount: paymentData.amount / 100,
    paymentMethod: 'stripe'
  })
});

const { softwareNumber, licenseKey } = await response.json();

// Send email with software number
await sendEmail(paymentData.receipt_email, {
  template: 'license_issued',
  softwareNumber: softwareNumber,
  licenseKey: licenseKey
});
```

### PayPal Integration Example

```javascript
app.post('/webhook/paypal', async (req, res) => {
  const verified = await verifyPayPalWebhook(req);
  
  if (verified && req.body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const payment = req.body.resource;
    
    const response = await fetch('http://localhost:5000/api/register-payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: payment.payer.email_address,
        name: `${payment.payer.name.given_name} ${payment.payer.name.surname}`,
        productType: 'CraftForge',
        licenseType: payment.custom_id,
        paymentAmount: parseFloat(payment.amount.value),
        paymentMethod: 'paypal'
      })
    });
    
    const data = await response.json();
    await notifyCustomer(data);
  }
  
  res.json({ status: 'received' });
});
```

## Data Files

License data is stored in:

**`data/licenses.json`**
```json
[
  {
    "id": "abc123...",
    "softwareNumber": "NM-A7K2-M9P5",
    "licenseKey": "XXXXX-XXXXX-XXXXX-XXXXX",
    "customerId": "def456...",
    "email": "customer@example.com",
    "issued": "2026-01-30T...",
    "active": false,
    "expiryDate": "2027-01-30T..."
  }
]
```

**`data/customers.json`**
```json
[
  {
    "id": "def456...",
    "email": "customer@example.com",
    "name": "John Doe",
    "softwareNumber": "NM-A7K2-M9P5",
    "productType": "CraftForge",
    "licenseType": "personal",
    "paymentAmount": 49.99,
    "paymentMethod": "stripe",
    "paymentDate": "2026-01-30T...",
    "activated": false,
    "expiryDate": "2027-01-30T..."
  }
]
```

**⚠️ Backup these files regularly!**

## Security

### Change the Admin Token

Before going to production, change the default token:

**Option 1: Environment Variable**
```bash
set ADMIN_TOKEN=your-super-secret-token-here
npm run admin-server
```

**Option 2: Edit AdminServer.js**
```javascript
const adminToken = process.env.ADMIN_TOKEN || 'your-custom-token';
```

### HTTPS in Production

Use a reverse proxy like Nginx:

```nginx
server {
  listen 443 ssl;
  server_name admin.craftforge.com;
  
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  location / {
    proxy_pass http://localhost:5000;
    proxy_set_header Authorization $http_authorization;
    proxy_pass_header Authorization;
  }
}
```

### IP Whitelisting

Only allow your payment processor IPs to register payments.

## Troubleshooting

**Q: "Port 5000 already in use"**
A: Kill the process or change the port in AdminServer.js

**Q: "API returns 401 Unauthorized"**
A: Make sure you're including the correct Authorization header

**Q: "Customer email already exists"**
A: Check if customer was already registered

**Q: "How do I resend a license key?"**
A: Use the "Resend Key" button in Customers tab or POST `/api/resend-key/{softwareNumber}`

## Support

For questions or issues, contact the development team or check the detailed README in `src/admin/README.md`

---

**Happy licensing! 🎉**

Nightmare Designs - CraftForge Admin System v1.0
