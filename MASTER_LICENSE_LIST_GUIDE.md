# 🔐 Master Software ID & License Key List - Quick Guide

## What Is It?

A comprehensive **master list** that shows all Software Numbers paired with their matching License Keys. This is your complete license database in one place.

---

## 📊 Format & Structure

Each entry contains:
```
Software Number: NM-XXXX-XXXX
License Key:     XXXXX-XXXXX-XXXXX-XXXXX
Customer Name:   John Doe
Email:           john@example.com
License Type:    personal
Status:          Active
Days Remaining:  365
```

---

## 🚀 How to Access

### Option 1: Web Interface (Best for Viewing)
```
http://localhost:5000/master-license-list.html
```
- Beautiful dark-themed table view
- Search by software number, email, or name
- Copy individual keys or pairs
- View statistics
- Export to CSV/JSON/TXT

### Option 2: API Endpoint (For Programmatic Access)
```bash
curl http://localhost:5000/api/license-list \
  -H "Authorization: Bearer admin-master-key-2026"
```

Returns JSON with all licenses and statistics.

### Option 3: Command Line
```bash
node src/admin/MasterLicenseList.js
```

Displays table in console and creates export files in `data/` directory.

---

## 📤 Export Options

### From Web Interface
Click export buttons:
- **CSV** - Spreadsheet format (Excel, Google Sheets)
- **JSON** - Machine-readable format
- **Text** - Human-readable format with full details

### From Command Line
```bash
node src/admin/MasterLicenseList.js
```

Creates these files in `data/`:
- `master-license-list.json` - Full data
- `master-license-list.csv` - Spreadsheet
- `master-license-list.txt` - Formatted text
- `software-license-map.txt` - Simple pairs
- `license-lookup.json` - Fast lookup by any field

### From API
```bash
# Get as JSON
curl http://localhost:5000/api/export-license-list?format=json \
  -H "Authorization: Bearer admin-master-key-2026"

# Get as CSV
curl http://localhost:5000/api/export-license-list?format=csv \
  -H "Authorization: Bearer admin-master-key-2026"

# Get as TXT
curl http://localhost:5000/api/export-license-list?format=txt \
  -H "Authorization: Bearer admin-master-key-2026"
```

---

## 🔍 Search & Filter

### In Web Interface
1. Open: http://localhost:5000/master-license-list.html
2. Use search box to filter by:
   - Software Number: `NM-A1B2`
   - Email: `john@example.com`
   - Name: `John Doe`

### Via API
```bash
# Search by email
curl "http://localhost:5000/api/search?q=john@example.com" \
  -H "Authorization: Bearer admin-master-key-2026"

# Search by software number
curl "http://localhost:5000/api/search?q=NM-A1B2" \
  -H "Authorization: Bearer admin-master-key-2026"
```

### Via Code
```javascript
const MasterLicenseList = require('./src/admin/MasterLicenseList');
const list = new MasterLicenseList();

// Find by software number
const license = list.findBySoftwareNumber('NM-A1B2-C3D4');
console.log(license.licenseKey);

// Find by email
const customerLicenses = list.findByEmail('john@example.com');
```

---

## 📊 Statistics

The master list provides:
- Total number of licenses
- Number of active licenses
- Number of inactive licenses
- Number of expired licenses
- Licenses expiring within 30 days
- Breakdown by license type (trial/personal/professional/enterprise)

View in:
- Web interface dashboard
- API response
- Console output

---

## 💾 Use Cases

### 1. Manual Verification
Customer claims to have a license? Check the master list:
1. Open master-license-list.html
2. Search for customer email
3. Verify software number and key

### 2. Backup & Recovery
Export master list regularly:
```bash
node src/admin/MasterLicenseList.js
# Creates backup files in data/ directory
```

### 3. Reporting
Generate reports for management:
- How many active licenses?
- Which licenses are expiring?
- Revenue by license type?
- All in one view on the web interface

### 4. Integration with External Systems
Export as CSV and import into:
- Accounting software
- CRM (Salesforce, HubSpot)
- Email marketing (Mailchimp)
- Analytics tools

### 5. Customer Support
Quickly look up customer's license:
1. Search master list for customer email
2. Get their software number and key
3. Provide support

---

## 📋 CSV Format

When exporting as CSV, you get:

| Software Number | License Key | Customer Email | Customer Name | Product Type | License Type | Issued Date | Status | Expiry Date | Days Remaining |
|---|---|---|---|---|---|---|---|---|---|
| NM-A1B2-C3D4 | XXXXX-XXXXX-XXXXX-XXXXX | john@example.com | John Doe | CraftForge | personal | 1/15/2024 | Active | 1/15/2025 | 365 |

Perfect for:
- Excel/Google Sheets
- Pivot tables
- Charts and graphs
- Database imports

---

## 🔄 Updating

The master list is **automatically generated** from your licenses.json database.

When you:
- Register a new customer → automatically added to list
- Activate a license → status updated
- Delete a license → removed from list

**Always current** - no manual updates needed!

---

## 🔒 Security

### Who Can Access?

| Access Point | Authentication |
|---|---|
| Web Interface | None (local/admin) |
| API | Bearer token required |
| Export Files | Stored in data/ directory |
| Command Line | Local machine only |

### Protecting the List

1. **Don't share the export files** - Contains all license keys
2. **Use strong admin token** - Change from default
3. **Backup securely** - Keep backups in encrypted storage
4. **Limit API access** - Only expose to trusted systems

---

## 🎯 Common Tasks

### Find License Key by Software Number
```bash
# Web: Search in table
# API: GET /api/license/NM-XXXX-XXXX
# CLI: node MasterLicenseList.js then search output
```

### Check License Status
```bash
# Web: Look at Status column
# Show: Active, Inactive, or Expired
# Days Remaining: How many days until expiry
```

### Export for Accounting
```bash
# Click CSV export button
# Opens in Excel
# Import to accounting software
```

### Get All Customer Licenses
```bash
# Web: Search by email
# Shows all licenses for that customer
```

### Schedule Renewal Reminders
```bash
# Look at "Days Remaining" column
# Find licenses expiring within 30 days
# Send renewal emails
```

---

## 📈 Statistics Available

```javascript
{
  totalLicenses: 150,
  activeLicenses: 145,
  inactiveLicenses: 5,
  expiredLicenses: 0,
  expiringWithinMonth: 8,
  byLicenseType: {
    trial: 10,
    personal: 80,
    professional: 40,
    enterprise: 20
  }
}
```

---

## 🔧 Customization

### Add Custom Fields
Edit `MasterLicenseList.js` to include:
- Payment amount
- Payment method
- Activation date
- Last used date
- Custom metadata

### Change Export Format
Modify export functions to:
- Add custom columns
- Change date formats
- Include/exclude fields
- Generate different file types

### Advanced Filtering
Extend the class to filter by:
- Date range
- License type
- Status
- Payment method
- Custom criteria

---

## 🚀 Getting Started

### Step 1: Start the Server
```bash
npm run admin-server
```

### Step 2: Open Master List
```
http://localhost:5000/master-license-list.html
```

### Step 3: Register Test Customer
Use dashboard to register a customer.

### Step 4: View in Master List
Refresh master list page to see new entry.

### Step 5: Export
Click export button to download as CSV/JSON/TXT.

---

## 📞 API Reference

### Get Master List
```
GET /api/license-list
Headers: Authorization: Bearer admin-master-key-2026
Returns: { licenses: [...], stats: {...} }
```

### Export Master List
```
GET /api/export-license-list?format=csv|json|txt
Headers: Authorization: Bearer admin-master-key-2026
Returns: File download (CSV/JSON/TXT)
```

### Example Usage
```bash
# Get JSON list
curl -H "Authorization: Bearer admin-master-key-2026" \
  http://localhost:5000/api/license-list | jq '.'

# Download CSV
curl -H "Authorization: Bearer admin-master-key-2026" \
  http://localhost:5000/api/export-license-list?format=csv \
  > licenses.csv

# Download JSON
curl -H "Authorization: Bearer admin-master-key-2026" \
  http://localhost:5000/api/export-license-list?format=json \
  > licenses.json
```

---

## 🎉 Summary

You now have:
✅ Complete master list of all Software Numbers & License Keys
✅ Web interface to view and search
✅ API for programmatic access
✅ Export to CSV, JSON, or TXT
✅ Statistics dashboard
✅ Command-line tools
✅ Always up-to-date automatic generation

**Open now:** http://localhost:5000/master-license-list.html
