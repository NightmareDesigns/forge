# CraftForge Admin License Management System

Master license management system for controlling software licenses, customer registrations, and key distribution.

## Features

✅ **Customer Registration** - Register payments and generate software numbers
✅ **License Key Generation** - Automatic matching keys for software numbers
✅ **Admin Dashboard** - Web-based interface for managing licenses
✅ **Search & Filter** - Find customers by email, name, or software number
✅ **License Statistics** - Track active licenses, revenue, and distributions
✅ **CSV Export** - Export all license data for records
✅ **REST API** - Full API for integration with payment systems
✅ **Email Templates** - Ready-to-send customer notification templates

## Quick Start

### 1. Start the Admin Server

```bash
npm run admin-server
```

The server will start on `http://localhost:5000`

### 2. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:5000/dashboard.html
```

**Default Admin Token:** `admin-master-key-2026`

## API Endpoints

### Register Payment (Create Software Number & License Key)
```bash
POST /api/register-payment
Authorization: Bearer admin-master-key-2026
Content-Type: application/json

{
  "email": "customer@example.com",
  "name": "John Doe",
  "productType": "CraftForge",
  "licenseType": "personal",
  "paymentAmount": 49.99,
  "paymentMethod": "stripe"
}
```

**Response:**
```json
{
  "success": true,
  "softwareNumber": "NM-XXXX-XXXX",
  "licenseKey": "XXXXX-XXXXX-XXXXX-XXXXX",
  "email": "customer@example.com",
  "message": "License generated. Send software number NM-XXXX-XXXX to customer."
}
```

### Get License Key by Software Number
```bash
GET /api/license/NM-XXXX-XXXX
Authorization: Bearer admin-master-key-2026
```

**Response:**
```json
{
  "softwareNumber": "NM-XXXX-XXXX",
  "licenseKey": "XXXXX-XXXXX-XXXXX-XXXXX",
  "email": "customer@example.com",
  "name": "John Doe",
  "expiryDate": "2027-01-30T12:00:00.000Z",
  "active": false
}
```

### Activate License
```bash
POST /api/activate-license
Authorization: Bearer admin-master-key-2026
Content-Type: application/json

{
  "softwareNumber": "NM-XXXX-XXXX",
  "licenseKey": "XXXXX-XXXXX-XXXXX-XXXXX"
}
```

### Get All Customers
```bash
GET /api/customers
Authorization: Bearer admin-master-key-2026
```

### Search Customers
```bash
GET /api/search?q=john
Authorization: Bearer admin-master-key-2026
```

### Get Statistics
```bash
GET /api/statistics
Authorization: Bearer admin-master-key-2026
```

### Export as CSV
```bash
GET /api/export/csv
Authorization: Bearer admin-master-key-2026
```

### Resend License Key
```bash
POST /api/resend-key/NM-XXXX-XXXX
Authorization: Bearer admin-master-key-2026
```

## License Types & Expiry

| Type | Duration | Use Case |
|------|----------|----------|
| **trial** | 30 days | Free trial users |
| **personal** | 1 year | Individual users |
| **professional** | 2 years | Professional designers |
| **enterprise** | 5 years | Business/Organizations |

## Software Number & License Key Format

**Software Number:** `NM-XXXX-XXXX` (Prefix: NM = Nightmare)
- 4 random alphanumeric characters
- Dash separator
- 4 random alphanumeric characters

**License Key:** `XXXXX-XXXXX-XXXXX-XXXXX`
- 5 random alphanumeric characters
- Dash separators between each group
- 4 groups total

## Customer Workflow

1. **Customer Makes Payment** → Payment processor notifies your system
2. **Register Payment** → Admin calls POST `/api/register-payment`
3. **Send Software Number** → Email customer their unique software number
4. **Customer Activates** → Enters software number in CraftForge app
5. **Get License Key** → Customer calls GET `/api/license/{softwareNumber}`
6. **Activate License** → Customer enters software number + license key
7. **License Active** → Software unlocked and ready to use

## Data Storage

All license and customer data is stored in:
- `data/licenses.json` - License information
- `data/customers.json` - Customer registration data

Backup these files regularly!

## Security

⚠️ **Important Security Notes:**

1. **Change the default admin token** - Set `ADMIN_TOKEN` environment variable:
   ```bash
   set ADMIN_TOKEN=your-secure-token-here
   npm run admin-server
   ```

2. **Use HTTPS in production** - Deploy behind a reverse proxy with SSL/TLS

3. **Backup your data** - Regularly backup `data/` directory

4. **Limit API access** - Use IP whitelisting if possible

5. **Rotate tokens** - Change admin token periodically

## Integration with Payment Systems

### Stripe Webhook Example
```javascript
app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'payment_intent.succeeded') {
    const payment = event.data.object;
    
    // Register payment in license system
    fetch('http://localhost:5000/api/register-payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: payment.receipt_email,
        name: payment.metadata.customer_name,
        productType: payment.metadata.product,
        licenseType: payment.metadata.license_type,
        paymentAmount: payment.amount / 100,
        paymentMethod: 'stripe'
      })
    })
    .then(r => r.json())
    .then(data => {
      // Send email to customer with software number
      sendEmail(data.email, {
        softwareNumber: data.softwareNumber,
        licenseType: data.licenseType
      });
    });
  }

  res.json({received: true});
});
```

## Troubleshooting

**API returns 401 Unauthorized**
- Check your Authorization header includes the correct token
- Format: `Authorization: Bearer your-token`

**Software number already exists**
- The system generates a new one automatically
- This is very rare and will retry up to 10 times

**License key mismatch**
- Software numbers are case-sensitive
- License keys must match the software number's key
- Cannot activate with mismatched numbers/keys

**Port 5000 already in use**
- Change the port in `AdminServer.js` constructor
- Or kill the process using the port

## Support

For issues or feature requests, contact the development team.

---

**CraftForge Admin License System v1.0** | Nightmare Designs 2026
