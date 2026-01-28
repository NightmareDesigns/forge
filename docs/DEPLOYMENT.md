# CraftForge Deployment & Release Guide

## Pre-Release Checklist

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] No lint errors: `npm run lint`
- [ ] Security audit clean: `npm audit`
- [ ] No console errors or warnings
- [ ] All new features documented

### Licensing System
- [ ] Trial period verified (30 days)
- [ ] Key generation working (5000 keys)
- [ ] Key validation tested
- [ ] Activation UI working
- [ ] License persistence verified
- [ ] Pricing page updated ($79.99)

### Documentation
- [ ] [LICENSING.md](docs/LICENSING.md) complete
- [ ] [TESTING-LICENSING.md](docs/TESTING-LICENSING.md) complete
- [ ] [pricing-section.html](docs/pricing-section.html) added to website
- [ ] README.md mentions trial period
- [ ] Release notes prepared

### Security
- [ ] [SECURITY.md](../SECURITY.md) reviewed
- [ ] No hardcoded secrets in code
- [ ] No eval/injection patterns
- [ ] Input validation in place
- [ ] Error messages safe

## Build & Package

### Step 1: Generate License Keys
```bash
npm run generate-keys
```

Output:
- `license_keys.json` — keep private/secure
- `license_keys.csv` — for distribution

Store `license_keys.json` in secure location (encrypted, backed up).

### Step 2: Build Application
```bash
npm run build
```

Output: `dist/CraftForge-Setup.exe` (~4.5GB with bundled runtime)

### Step 3: Verify Build
- [ ] Installer file created and size is correct
- [ ] Test installer on clean Windows VM
- [ ] App launches and shows license/trial
- [ ] Trial starts automatically
- [ ] Can activate with test key

## Release Process

### Step 1: Version Bump
```bash
# Update version in package.json
# Commit: "release: v0.2.0-licensing"
git add -A
git commit -m "release: v0.2.0 - licensing system"
```

### Step 2: Create Release Notes
```markdown
# CraftForge v0.2.0 - Licensing Release

## What's New
- ✨ 30-day free trial on first launch
- 🔑 License activation with unique keys
- 💰 $79.99 professional license
- 🛡️ Machine-locked keys for security
- 📊 License key management tools
- 🌐 Pricing page on website

## Key Features
- Auto-starting trial (30 days)
- Software lockout after trial expires
- One-time payment, lifetime access
- Free updates forever
- Works offline - no phone home

## How to Get Licensed
1. Download and try for free (30 days)
2. After trial, enter license key
3. Keys available at https://nightmaredesigns.org

## For Developers
- Key generation: `npm run generate-keys`
- Key management: `npm run manage-keys`
- Licensing docs: [docs/LICENSING.md](docs/LICENSING.md)

## Known Limitations
- One key per machine (tied to machine ID)
- Trial locked to 30 days (cannot extend)
- License tied to specific machine (cannot transfer)

## Feedback & Issues
- Report bugs: https://github.com/NightmareDesigns/CraftForge/issues
- Licensing questions: support@nightmaredesigns.org

## Thank You!
Thanks for using CraftForge. We hope you love it as much as we do! 🩸
```

### Step 3: Create GitHub Release
```bash
git tag -s v0.2.0 -m "Licensing release"
git push origin main --tags
```

Then on GitHub:
1. Go to Releases
2. Create new release from tag `v0.2.0`
3. Add release notes (copy from above)
4. Upload `dist/CraftForge-Setup.exe`
5. Mark as "Pre-release" if still in beta

### Step 4: Update Website
```bash
# Copy pricing section to main site
cp docs/pricing-section.html docs/pricing-section-insert.html
```

Then manually add pricing section to `docs/index.html` (or integrate automatically).

### Step 5: Announce Release
- [ ] Update GitHub repo description to mention "30-day free trial"
- [ ] Post on social media (Twitter, etc.)
- [ ] Email mailing list (if any)
- [ ] Update website homepage

## Post-Release

### Monitor for Issues
- [ ] Check GitHub Issues for license-related bugs
- [ ] Monitor license activation failures
- [ ] Check for key generation issues
- [ ] Track key activation rate

### Support
- [ ] Respond to license questions
- [ ] Provide keys to customers
- [ ] Track key usage
- [ ] Update key database

### Metrics to Track
- Number of trial installations
- Number of keys generated
- Number of keys activated
- Average trial duration
- Conversion rate (trial → paid)

## Troubleshooting Common Issues

### "Keys not generating"
```bash
# Verify Node.js installed
node --version

# Try again
npm run generate-keys

# Check permissions on current directory
ls -la
```

### "Can't activate key"
1. Verify key format: `XXXX-XXXX-XXXX-XXXX`
2. Check key in database: `npm run manage-keys status`
3. Verify machine ID hasn't changed
4. Generate new key if needed

### "License file corrupted"
```bash
# Reset license (user will restart trial)
rm ~/.craftforge/license.json
# App will recreate on next launch
```

### "Trial won't start"
1. Check `~/.craftforge/` directory exists
2. Check write permissions on home directory
3. Verify system date/time correct
4. Try: `npm run` with elevated permissions

## Scaling Considerations

### For Large Customer Base
- [ ] Store keys in database (not JSON file)
- [ ] Build customer portal for key distribution
- [ ] Implement analytics for key usage
- [ ] Add bulk key generation
- [ ] Consider cloud-based license verification

### For Enterprise
- [ ] Floating licenses (multiple machines per key)
- [ ] Site licenses (all machines in org)
- [ ] License groups (teams)
- [ ] Centralized key management

### For Future Versions
- [ ] Automatic license renewal
- [ ] Subscription model option
- [ ] Trial extension requests
- [ ] Grace period after expiration
- [ ] License transfer feature

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v0.2.0 | 2026-01-28 | Initial licensing system |
| v0.1.2 | 2026-01-28 | Security hardening |
| v0.1.0 | 2025-12-01 | Beta release |

## Support Contacts

- **Support**: support@nightmaredesigns.org
- **Sales**: sales@nightmaredesigns.org
- **GitHub**: https://github.com/NightmareDesigns/CraftForge
- **Website**: https://nightmaredesigns.org

---

## Quick Commands Reference

```bash
# Development
npm start                   # Launch app with trial
npm run ai-server          # Start AI server
npm run build              # Create installer

# Licensing
npm run generate-keys      # Generate 5000 keys
npm run manage-keys status # Check key stats
npm run manage-keys list   # List sample keys
npm run manage-keys verify # Verify a key

# Testing
npm test                   # Run tests
npm run lint              # Check code quality

# Release
git tag -s v0.2.0 -m "Release message"
git push origin main --tags
```

---

**Last Updated**: January 28, 2026  
**Next Review**: After first release
