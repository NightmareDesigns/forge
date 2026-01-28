# CraftForge Licensing System - Testing Guide

## Overview
This guide walks through testing all licensing system features before deployment.

## Pre-Testing Setup

### 1. Generate Test Keys
```bash
cd scripts
node generate-keys.js
```

Expected output:
- `license_keys.json` created with 5000 keys
- `license_keys.csv` created with list of keys

### 2. Verify Key Generation
```bash
node manage-keys.js status license_keys.json
```

Expected output:
```
📊 Key Database Statistics
Total keys: 5000
Available: 5000
Used: 0
Usage: 0.00%
```

## Test Scenarios

### Test 1: First Launch (Auto-Start Trial)

**Objective**: Verify that first launch automatically starts a 30-day trial

**Steps**:
1. Delete `~/.craftforge/license.json` (if exists)
2. Launch CraftForge: `npm start`
3. Check console output for "Trial started"
4. Look for license status in bottom-right: "Trial (30 days remaining)"

**Expected Results**:
- ✅ No errors on startup
- ✅ `~/.craftforge/license.json` created
- ✅ License status shows trial period
- ✅ All features accessible

**Test Status**: [ ] Pass [ ] Fail

---

### Test 2: License Status Display

**Objective**: Verify license status UI elements appear correctly

**Steps**:
1. Launch app during trial
2. Look for license status in bottom-right corner
3. Click on status to open info modal
4. Verify machine ID is displayed

**Expected Results**:
- ✅ Status bar shows "📋 Trial (X days remaining)"
- ✅ Click opens modal with detailed info
- ✅ Machine ID displayed (16 hex chars)
- ✅ Modal has "Close" button

**Test Status**: [ ] Pass [ ] Fail

---

### Test 3: License Key Activation

**Objective**: Verify valid license key activates successfully

**Steps**:
1. Get a sample key: `node manage-keys.js list license_keys.json 1`
2. Copy the key from output
3. In app, click license status → "Activate" 
4. Enter key (app auto-formats with dashes)
5. Click "Activate"

**Expected Results**:
- ✅ Key input auto-formats with dashes (XXXX-XXXX-XXXX-XXXX)
- ✅ "Activating..." appears briefly
- ✅ Success message shown
- ✅ Status changes to "Licensed"
- ✅ `license.json` updated with activation date

**Test Status**: [ ] Pass [ ] Fail

---

### Test 4: Invalid Key Rejection

**Objective**: Verify invalid keys are rejected

**Steps**:
1. Click license status
2. Try entering bad keys:
   - Random key: `ZZZZ-ZZZZ-ZZZZ-ZZZZ`
   - Short key: `ABC-123`
   - Empty key: leave blank
3. For each, click "Activate"

**Expected Results**:
- ✅ Invalid format: "Invalid key format" error
- ✅ Non-existent key: "Invalid license key or not valid for this machine"
- ✅ Empty key: "Please enter a license key"
- ✅ Error displayed in red
- ✅ Activate button re-enabled for retry

**Test Status**: [ ] Pass [ ] Fail

---

### Test 5: Trial Expiration & Lockout

**Objective**: Verify software locks out after trial expires

**Steps**:
1. Manually edit `~/.craftforge/license.json`
2. Change `trialEndDate` to a date in the past:
   ```json
   "trialEndDate": "2020-01-01T00:00:00.000Z"
   ```
3. Restart app
4. Observe lockout behavior

**Expected Results**:
- ✅ Activation dialog appears automatically
- ✅ Dialog cannot be closed without valid key
- ✅ Error message: "Trial Expired - Activate License"
- ✅ Key entry still works
- ✅ Entering valid key unlocks the app

**Test Status**: [ ] Pass [ ] Fail

---

### Test 6: License Persistence

**Objective**: Verify license persists across restarts

**Steps**:
1. Activate a valid key
2. Note the activation date/key
3. Restart app
4. Check license status

**Expected Results**:
- ✅ License status still shows "Licensed"
- ✅ Same activation key displayed
- ✅ No need to re-enter key
- ✅ All features still accessible

**Test Status**: [ ] Pass [ ] Fail

---

### Test 7: Key Management Tools

**Objective**: Verify key management CLI works correctly

**Steps**:
1. Generate keys: `node generate-keys.js`
2. Check status: `node manage-keys.js status license_keys.json`
3. Get sample: `node manage-keys.js list license_keys.json 5`
4. Verify a key: `node manage-keys.js verify license_keys.json [KEY]`
5. Export CSV: `node manage-keys.js export license_keys.json test.csv`

**Expected Results**:
- ✅ All commands execute without errors
- ✅ Status shows correct counts
- ✅ Sample keys formatted correctly
- ✅ Verification works for valid/invalid keys
- ✅ CSV file created and readable

**Test Status**: [ ] Pass [ ] Fail

---

### Test 8: API Integration (Developer)

**Objective**: Verify IPC API works from renderer process

**Steps**:
1. Open DevTools (F12)
2. Run commands in console:
   ```javascript
   await window.craftforge.getLicenseStatus()
   await window.craftforge.checkLicenseLocked()
   // These should log current status
   ```

**Expected Results**:
- ✅ Commands return objects with status info
- ✅ No errors in console
- ✅ Status info is current and accurate

**Test Status**: [ ] Pass [ ] Fail

---

### Test 9: License Reset (Dev Tool)

**Objective**: Verify dev tool to reset license for testing

**Steps**:
1. In DevTools console:
   ```javascript
   await window.craftforge.resetLicense()
   ```
2. Reload app
3. Check if trial restarts

**Expected Results**:
- ✅ License file deleted
- ✅ App restarts trial on reload
- ✅ New `license.json` created with trial dates
- ✅ Status shows new trial period

**Test Status**: [ ] Pass [ ] Fail

---

### Test 10: Website Pricing Display

**Objective**: Verify pricing section displays correctly

**Steps**:
1. Open `docs/index.html` in browser (or deploy to GitHub Pages)
2. Scroll to pricing section
3. Check responsive design on mobile

**Expected Results**:
- ✅ Three pricing cards visible
- ✅ Trial card shows "Free"
- ✅ Professional card shows "$79.99"
- ✅ Enterprise card shows "Custom"
- ✅ Buttons functional (or show placeholder)
- ✅ FAQ section displays correctly
- ✅ Responsive layout on mobile

**Test Status**: [ ] Pass [ ] Fail

---

## Performance & Security Tests

### Test 11: Performance - Key Generation

**Objective**: Verify 5000 keys generate in reasonable time

**Steps**:
1. Time the key generation:
   ```bash
   time node scripts/generate-keys.js
   ```
2. Check file size of `license_keys.json`

**Expected Results**:
- ✅ Completes in < 5 seconds
- ✅ `license_keys.json` < 1MB
- ✅ No memory errors

**Test Status**: [ ] Pass [ ] Fail

---

### Test 12: Security - Key Format

**Objective**: Verify key format prevents tampering

**Steps**:
1. Get valid key: `node manage-keys.js list license_keys.json 1`
2. Try modified versions:
   - Change 1 character: `A1B2-C3D4-E5F6-789X`
   - Swap parts: `C3D4-A1B2-E5F6-7890`
3. Try to activate each

**Expected Results**:
- ✅ All modified keys rejected
- ✅ Error: "Invalid license key"
- ✅ No tampering possible

**Test Status**: [ ] Pass [ ] Fail

---

### Test 13: Security - Machine ID Binding

**Objective**: Verify keys are tied to machine ID

**Steps**:
1. Activate key on machine A
2. Copy `license.json` to machine B (simulated)
3. Try to use license on machine B

**Expected Results**:
- ✅ License still shows as activated on machine B
- ✅ Machine ID should match (if same machine)
- ✅ OR key won't activate if we change machineId in JSON

**Test Status**: [ ] Pass [ ] Fail

---

## Deployment Checklist

- [ ] All 13 tests passed
- [ ] No console errors
- [ ] License file created in correct location
- [ ] Trial period correctly calculated
- [ ] Key validation working
- [ ] UI displays properly
- [ ] Website pricing visible
- [ ] Documentation complete
- [ ] Git commit and push successful
- [ ] Ready for release

## Known Issues & Workarounds

### Issue: Keys not validating
**Cause**: Machine ID mismatch or corrupted key format  
**Workaround**: Generate new keys, ensure proper key format

### Issue: License file not created
**Cause**: Permission denied on `~/.craftforge/` directory  
**Workaround**: Create directory manually or run with elevated permissions

### Issue: Trial not starting
**Cause**: Existing license file with invalid dates  
**Workaround**: Delete `~/.craftforge/license.json` and restart

## Next Steps

1. ✅ **Testing Complete**: Run all tests above
2. **Build**: `npm run build` to create installer
3. **Deploy**: Push to GitHub Releases
4. **Monitor**: Watch for license activation issues
5. **Update**: Add website purchase portal integration

---

## Support

For issues or questions:
- Email: support@nightmaredesigns.org
- GitHub: https://github.com/NightmareDesigns/CraftForge/issues
- Docs: docs/LICENSING.md

---

**Test Date**: ________________  
**Tester**: ________________  
**Status**: [ ] PASS [ ] FAIL [ ] PARTIAL  
**Notes**: ________________________________________________
