# 🔐 CraftForge License System - Complete Integration Guide

## Overview

This guide walks you through integrating the complete license management system into CraftForge. The system includes:

1. **Admin Backend** - REST API server for managing licenses
2. **Admin Dashboard** - Web interface for admins
3. **Customer Portal** - Public license verification
4. **In-App License Checker** - CraftForge integration
5. **Email Integration** - Automatic customer emails

---

## Architecture

```
Customer Pays (Stripe/PayPal)
            ↓
    Webhook Triggered
            ↓
Backend Registers Payment
    (LicenseManager)
            ↓
Software Number + Key Generated
            ↓
Email Sent to Customer
    (email-integration.js)
            ↓
Customer Enters License in CraftForge
            ↓
In-App Verifies with Admin Server
    (license-checker.js)
            ↓
License Activated & Saved Locally
```

---

## Setup Step-by-Step

### Part 1: Start Admin Server (Already Done)

Files created:
- `src/admin/LicenseManager.js` - Core logic
- `src/admin/AdminServer.js` - Express API
- `src/admin/dashboard.html` - Admin interface
- `src/admin/customer-portal.html` - Customer verification
- `src/admin/email-integration.js` - Email handling

Start it:
```bash
npm run admin-server
# Or: node src/admin/AdminServer.js
```

Dashboard: http://localhost:5000/dashboard.html

---

### Part 2: Integrate License Checker Into CraftForge

File created:
- `src/license-checker.js` - In-app license validation

#### Step 1: Update src/main.js

Add at the top with other requires:
```javascript
const { setupLicenseHandlers } = require('./license-checker');
```

In `App.whenReady()` function, add this after other IPC handlers:
```javascript
// License management IPC handlers
setupLicenseHandlers(ipcMain);
```

Complete example:
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const { setupLicenseHandlers } = require('./license-checker');

App.whenReady().then(() => {
  // ... existing code ...
  
  // License system
  setupLicenseHandlers(ipcMain);
  
  // ... rest of code ...
});
```

#### Step 2: Update src/preload.js

Add these API functions to the exposed context:
```javascript
// In the object returned by contextBridge.exposeInMainWorld:

// License APIs
licenseStatus: () => ipcRenderer.invoke('license-status'),
licenseActivate: (softwareNumber, licenseKey) => 
  ipcRenderer.invoke('license-activate', softwareNumber, licenseKey),
licenseRemove: () => ipcRenderer.invoke('license-remove'),
licenseGet: () => ipcRenderer.invoke('license-get'),
```

Complete example:
```javascript
contextBridge.exposeInMainWorld('api', {
  // ... existing APIs ...
  
  // License APIs
  licenseStatus: () => ipcRenderer.invoke('license-status'),
  licenseActivate: (softwareNumber, licenseKey) => 
    ipcRenderer.invoke('license-activate', softwareNumber, licenseKey),
  licenseRemove: () => ipcRenderer.invoke('license-remove'),
  licenseGet: () => ipcRenderer.invoke('license-get'),
});
```

#### Step 3: Add License UI to CraftForge

In `src/renderer/index.html`, add a license button to the toolbar:
```html
<!-- In your toolbar section -->
<button id="license-btn" class="toolbar-btn" title="License Activation">
  🔐
</button>
```

In `src/renderer/app.js`, add license handling:
```javascript
// Check license on app start
async function checkLicense() {
  const status = await window.api.licenseStatus();
  
  if (status.activated) {
    console.log('✓ License active:', status.softwareNumber);
    updateLicenseUI('licensed', status.softwareNumber);
  } else {
    console.log('No license found');
    updateLicenseUI('unlicensed', null);
  }
}

// Show license dialog
function showLicenseDialog() {
  const modal = document.getElementById('license-dialog') || createLicenseDialog();
  modal.style.display = 'block';
}

// Create license dialog HTML
function createLicenseDialog() {
  const modal = document.createElement('div');
  modal.id = 'license-dialog';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>🔐 License Activation</h2>
        <button class="modal-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
      
      <div class="modal-body">
        <p>Enter your license information to activate CraftForge:</p>
        
        <div class="form-group">
          <label>Software Number</label>
          <input type="text" id="software-number" placeholder="NM-XXXX-XXXX" />
        </div>
        
        <div class="form-group">
          <label>License Key</label>
          <input type="text" id="license-key" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" />
        </div>
        
        <div id="license-message"></div>
        
        <div class="button-group">
          <button onclick="activateLicense()" class="btn-primary">Activate</button>
          <button onclick="openCustomerPortal()" class="btn-secondary">Verify License</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  return modal;
}

// Activate license
async function activateLicense() {
  const softwareNumber = document.getElementById('software-number').value.trim();
  const licenseKey = document.getElementById('license-key').value.trim();
  const msgEl = document.getElementById('license-message');
  
  if (!softwareNumber || !licenseKey) {
    msgEl.innerHTML = '<p style="color: #ff0000;">Please enter both fields</p>';
    return;
  }
  
  msgEl.innerHTML = '<p style="color: #8b0000;">Activating...</p>';
  
  try {
    const result = await window.api.licenseActivate(softwareNumber, licenseKey);
    
    if (result.valid) {
      msgEl.innerHTML = `<p style="color: #00c853;">✓ License activated! Expires: ${new Date(result.expiryDate).toLocaleDateString()}</p>`;
      setTimeout(() => {
        document.getElementById('license-dialog').style.display = 'none';
        checkLicense();
      }, 2000);
    } else {
      msgEl.innerHTML = `<p style="color: #ff0000;">❌ ${result.error}</p>`;
    }
  } catch (error) {
    msgEl.innerHTML = `<p style="color: #ff0000;">Error: ${error.message}</p>`;
  }
}

// Open customer portal
function openCustomerPortal() {
  require('electron').shell.openExternal('http://localhost:5000/customer-portal.html');
}

// Update UI based on license status
function updateLicenseUI(status, softwareNumber) {
  const btn = document.getElementById('license-btn');
  if (!btn) return;
  
  if (status === 'licensed') {
    btn.style.opacity = '1';
    btn.title = `✓ Licensed: ${softwareNumber}`;
  } else {
    btn.style.opacity = '0.5';
    btn.title = 'Click to activate license';
  }
}

// License button click handler
document.getElementById('license-btn').addEventListener('click', showLicenseDialog);

// Check license on startup
window.addEventListener('load', checkLicense);
```

Add CSS styling to `src/renderer/styles.css`:
```css
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: #1a1a1a;
  margin: 5% auto;
  padding: 0;
  border: 1px solid #8b0000;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(139, 0, 0, 0.3);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #8b0000;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  color: #8b0000;
  margin: 0;
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  color: #cccccc;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
}

.modal-close:hover {
  color: #ffffff;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  color: #cccccc;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  color: #cccccc;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 5px;
  text-transform: uppercase;
}

.form-group input {
  width: 100%;
  padding: 10px;
  background: rgba(50, 50, 50, 0.5);
  border: 1px solid #333;
  border-radius: 4px;
  color: #cccccc;
  font-size: 14px;
  font-family: 'Courier New', monospace;
}

.form-group input:focus {
  outline: none;
  border-color: #8b0000;
  background: rgba(50, 50, 50, 0.8);
}

#license-message {
  margin: 15px 0;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #8b0000;
  color: white;
}

.btn-primary:hover {
  background: #a00000;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #8b0000;
  color: #8b0000;
}

.btn-secondary:hover {
  background: rgba(139, 0, 0, 0.1);
}
```

---

### Part 3: Setup Payment Processor Integration

#### Option A: Stripe

In your backend payment handler:
```javascript
const emailModule = require('./src/admin/email-integration');

// Stripe webhook
app.post('/webhook/stripe', async (req, res) => {
  const event = req.body;
  
  if (event.type === 'payment_intent.succeeded') {
    await emailModule.handleStripeWebhook(event);
  }
  
  res.json({ received: true });
});
```

#### Option B: PayPal

```javascript
app.post('/webhook/paypal', async (req, res) => {
  const event = req.body;
  
  if (event.event_type === 'BILLING.SUBSCRIPTION.CREATED') {
    await emailModule.handlePayPalWebhook(event);
  }
  
  res.json({ received: true });
});
```

See `src/admin/email-integration.js` for complete examples.

---

### Part 4: Configure Email (Optional but Recommended)

Install nodemailer:
```bash
npm install nodemailer
```

Set environment variables:
```
CRAFTFORGE_EMAIL=your-email@gmail.com
CRAFTFORGE_EMAIL_PASSWORD=your-app-password
```

For Gmail:
1. Go to https://myaccount.google.com/apppasswords
2. Generate an app password
3. Use that password (not your regular Gmail password)

---

## 📊 Complete Setup Verification

After all integration, you should have:

✓ **Admin Server Running**
```bash
npm run admin-server
```
Access: http://localhost:5000/dashboard.html

✓ **CraftForge with License Button**
- License button (🔐) in toolbar
- Click to show activation dialog
- Can enter Software Number + License Key
- Shows success/error messages

✓ **Local License Storage**
- License saved to `~/.craftforge/license.json`
- Persists across app restarts
- Can be removed via dialog

✓ **Email Integration** (Optional)
- Customer emails sent automatically on payment
- Template includes Software Number and License Key
- Instructions on how to activate

---

## 🧪 Testing the Complete Flow

### Test 1: Register Customer in Dashboard
```
1. Open http://localhost:5000/dashboard.html
2. Click "Register Payment" tab
3. Fill in test customer info
4. Note Software Number and License Key
```

### Test 2: Activate in CraftForge
```
1. Open CraftForge
2. Click 🔐 license button
3. Paste Software Number and License Key
4. Click Activate
5. Should see success message
```

### Test 3: Verify License Persisted
```
1. Close CraftForge
2. Reopen CraftForge
3. License button should show ✓ as active
4. Check ~/.craftforge/license.json
```

### Test 4: Test Email (Optional)
```
1. Set CRAFTFORGE_EMAIL environment variables
2. Register customer in dashboard
3. Check email account for license email
4. Should contain Software Number and License Key
```

---

## 🚀 Deployment Checklist

- [ ] Change admin token in `AdminServer.js`
- [ ] Set up email credentials
- [ ] Configure payment processor webhooks
- [ ] Enable HTTPS for production
- [ ] Set up regular backups of `data/` folder
- [ ] Test complete flow end-to-end
- [ ] Add license page to website
- [ ] Create customer support documentation
- [ ] Set up monitoring/logging
- [ ] Train team on admin dashboard

---

## 🔒 Security Reminders

1. **Never commit secrets** - Use environment variables
2. **Change default token** - `AdminServer.js` line 10
3. **Use HTTPS in production** - Add SSL certificate
4. **Whitelist IPs** - Restrict dashboard access
5. **Regular backups** - Back up `data/` folder daily
6. **Secure payment tokens** - Keep Stripe/PayPal keys safe

---

## 📚 Documentation Files

Read these for complete details:

1. **QUICK_START_LICENSE.md** - 5-minute setup
2. **LICENSE_SYSTEM_GUIDE.md** - Complete overview
3. **src/admin/README.md** - API reference
4. **ADMIN_SETUP.md** - Detailed setup guide
5. **src/admin/email-integration.js** - Code examples

---

## ✨ You're Done!

Your CraftForge now has a complete, professional license management system. Customers can:

1. ✅ Purchase licenses
2. ✅ Receive software numbers and keys via email
3. ✅ Activate in CraftForge
4. ✅ Verify license status anytime
5. ✅ See expiry information

You can:
1. ✅ Manage all licenses from dashboard
2. ✅ Search and export customer data
3. ✅ Resend keys if needed
4. ✅ Track revenue and analytics
5. ✅ Integrate with any payment processor

**Ready to start? Run:**
```bash
npm run admin-server
```

Then open: **http://localhost:5000/dashboard.html**
