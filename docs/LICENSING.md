# CraftForge Licensing System

## Overview

CraftForge includes a complete licensing system with:
- **30-day free trial** (automatic on first launch)
- **Software lockout** after trial expires until valid key is entered
- **5000 unique license keys** pre-generated
- **Key validation** tied to machine ID for security
- **License UI** with activation dialog and status display

## Pricing

| Edition | Price | Features |
|---------|-------|----------|
| Trial | Free | Full access for 30 days |
| Professional | $79.99 | Unlimited access after activation |

## License Key Format

Keys are 16 hexadecimal characters in format: `XXXX-XXXX-XXXX-XXXX`

Example: `A1B2-C3D4-E5F6-7890`

### Key Structure
- **12 characters**: Random data part
- **4 characters**: Signature (derived from data + machine ID)

This prevents key sharing across machines while allowing offline validation.

## How It Works

### 1. First Launch (Trial Start)
```
User launches CraftForge
    ↓
License manager checks for existing license
    ↓
No license found? Create trial record
    ↓
Trial starts: 30 days from today
    ↓
License status: "Trial (30 days remaining)"
```

### 2. During Trial
- App displays "Trial (X days remaining)" in status bar
- User can access all features
- License checked at startup only (no network needed)

### 3. Trial Expiration
- After 30 days, app detects trial has expired
- License activation dialog appears automatically
- User must enter valid key or app locks
- Dialog prevents closing without valid key

### 4. License Activation
```
User enters license key: XXXX-XXXX-XXXX-XXXX
    ↓
Key signature verified against machine ID
    ↓
If signature matches: License activated
    ↓
License status: "Licensed"
    ↓
App unlocked, full access restored
```

## License Storage

Licenses are stored locally (offline):
```
~/.craftforge/
└── license.json
```

Example license.json:
```json
{
  "type": "trial",
  "startDate": "2026-01-28T12:00:00.000Z",
  "trialEndDate": "2026-02-27T12:00:00.000Z",
  "activated": false,
  "activationKey": null,
  "activationDate": null,
  "machineId": "a1b2c3d4e5f6g7h8"
}
```

After activation:
```json
{
  "type": "activated",
  "activated": true,
  "activationKey": "A1B2-C3D4-E5F6-7890",
  "activationDate": "2026-01-28T12:30:00.000Z",
  "machineId": "a1b2c3d4e5f6g7h8",
  "startDate": "2026-01-28T12:00:00.000Z"
}
```

## Generating Keys

### Generate 5000 Keys
```bash
cd scripts
node generate-keys.js
```

Output:
- `license_keys.json` — All 5000 keys (keep private!)
- `license_keys.csv` — CSV export for distribution

### Sample Output
```
🔑 CraftForge License Key Generator

Generating 5000 unique license keys...
Output file: ./license_keys.json

⏳ Generating batch of 5000 keys...
✅ Generated 5000 unique keys

📊 Sample keys (first 10):
  1. A1B2-C3D4-E5F6-7890
  2. B3C4-D5E6-F7G8-H9I0
  3. C5D6-E7F8-G9H0-I1J2
  ...

💾 Saving to JSON...
✅ Saved to: ./license_keys.json
   Total keys: 5000
```

## Managing Keys

### Check Status
```bash
node manage-keys.js status license_keys.json
```

Output:
```
📊 Key Database Statistics

File: ./license_keys.json
Total keys: 5000
Available: 4998
Used: 2
Usage: 0.04%
```

### Verify a Key
```bash
node manage-keys.js verify license_keys.json A1B2-C3D4-E5F6-7890
```

Output:
```
🔍 Key Verification: A1B2-C3D4-E5F6-7890

✅ Key found in database
   Status: AVAILABLE
```

### List Keys
```bash
node manage-keys.js list license_keys.json 20
```

Output:
```
📋 First 20 Keys

     1 | A1B2-C3D4-E5F6-7890
     2 | B3C4-D5E6-F7G8-H9I0
     3 | C5D6-E7F8-G9H0-I1J2
   ...
```

### Mark Key as Used
```bash
node manage-keys.js mark license_keys.json A1B2-C3D4-E5F6-7890 machine-id-123
```

### Export to CSV
```bash
node manage-keys.js export license_keys.json output.csv
```

## API Reference

### License Manager (Backend)

#### JavaScript
```javascript
const LicenseManager = require('./src/licensing');
const licenseManager = new LicenseManager();

// Get license status
const status = licenseManager.getStatus();
// Returns: { type, status, machineId, ... }

// Check if trial is active
if (licenseManager.isTrialActive()) { ... }

// Check if activated
if (licenseManager.isActivated()) { ... }

// Get remaining trial days
const days = licenseManager.getRemainingTrialDays();

// Activate a key
const result = licenseManager.activateKey('XXXX-XXXX-XXXX-XXXX');
// Returns: { success: boolean, error?: string, message?: string }

// Check if locked
if (licenseManager.isLocked()) { ... }
```

### UI Methods (Frontend)

#### JavaScript
```javascript
// Get current license status
const status = await window.craftforge.getLicenseStatus();

// Activate a license key
const result = await window.craftforge.activateLicense('XXXX-XXXX-XXXX-XXXX');

// Check if app is locked
const lockStatus = await window.craftforge.checkLicenseLocked();

// Listen for license updates
window.craftforge.onLicenseStatus((status) => {
  console.log('License updated:', status);
});
```

## Workflow: Creating & Distributing Keys

### Step 1: Generate Keys
```bash
npm run generate-keys
# Outputs: license_keys.json (keep secure)
```

### Step 2: Distribute Keys
- Send individual keys via email to customers
- Use a web portal to distribute keys
- Include key in invoice/receipt
- Never share `license_keys.json`

### Step 3: Customer Activates
1. Customer launches CraftForge (or receives activation dialog)
2. Clicks "Activate" or "License" button
3. Pastes key: `XXXX-XXXX-XXXX-XXXX`
4. App validates and activates
5. Full access granted

### Step 4: Track Usage
- Keep `license_keys.json` in secure location
- Run `manage-keys.js status` to track usage
- Update after each key activation
- Backup file regularly

## Security Considerations

### What's Protected
✅ Keys cannot be shared across machines (tied to machine ID)  
✅ Offline validation (no network required)  
✅ Key signature prevents tampering  
✅ Machine ID includes hostname, platform, and home path  

### What's NOT Protected
⚠️ License file can be deleted (user loses license)  
⚠️ License file can be copied to other machine (won't activate)  
⚠️ User can edit license.json manually (won't work - signature verified)  

### Best Practices
1. Keep `license_keys.json` in secure, private location
2. Backup license_keys.json regularly
3. Track key distribution in database
4. Audit usage periodically
5. Revoke keys if customer support ends
6. Don't distribute 5000 keys at once

## Testing

### Test Trial Period
```bash
# In app or via dev tools:
1. Reset license: await window.craftforge.resetLicense()
2. App will start new trial
3. Check status: await window.craftforge.getLicenseStatus()
```

### Test Activation
```bash
1. Get a sample key: node manage-keys.js list license_keys.json 1
2. Copy first key from output
3. Use activation dialog or API: 
   await window.craftforge.activateLicense('XXXX-XXXX-XXXX-XXXX')
4. Verify: await window.craftforge.getLicenseStatus()
```

### Test Lockout
```bash
1. Manually edit ~/.craftforge/license.json
2. Set "type" to "trial" with past date
3. Restart app
4. Should show activation dialog
```

## Troubleshooting

### "Invalid key or not valid for this machine"
- Key is not in the database
- Key has already been activated on a different machine
- Key signature is invalid

**Fix**: Generate new key, ensure key format is correct

### "Key already used"
- Key has been activated on another machine

**Fix**: Generate new key for user, revoke old key

### License status shows "Expired" after restart
- Trial period ended
- No valid license key entered

**Fix**: Enter valid license key to reactivate

### "Machine ID doesn't match"
- App running on different machine
- Machine configuration changed significantly

**Fix**: This is by design. Key is tied to specific machine. Generate new key for new machine.

## Roadmap

- [ ] Cloud-based key management portal
- [ ] Key revocation/blacklist support
- [ ] Floating licenses (multiple machines per key)
- [ ] Site licenses (enterprise)
- [ ] Automatic license renewal via API
- [ ] Grace period after license expiration

---

**Need help?** Email: support@nightmaredesigns.org
