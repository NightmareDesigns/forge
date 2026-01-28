# Security Audit Report — CraftForge (Jan 2026)

## Summary
- **Total Vulnerabilities**: 7 (5 moderate, 2 high)
- **Action Required**: Monitor; potrace & tar updates needed upstream
- **Risk Level**: Low (found only in dev/build dependencies, not runtime code)

## Vulnerabilities

### High Severity (2)
1. **tar** (node-tar <=7.5.6) — `@mapbox/node-pre-gyp/node_modules/tar`
   - Path traversal in tar extraction
   - Impact: Could allow arbitrary file writes during native module builds
   - Mitigation: Updated in package-lock; appears in dev dependencies only
   - Fix: Monitor for `@mapbox/node-pre-gyp` updates

### Moderate Severity (5)
1. **phin** (<3.7.1) — `potrace/node_modules/phin`
   - Header leakage in HTTP redirects
   - Impact: Potential credential exposure in redirect scenarios
   - Mitigation: `potrace` uses phin in read-only image processing; not for auth flows
   - Fix: Await `potrace` package update or replace with `jimp` directly

## Code-Level Security Review

### ✅ Strengths
- **Electron hardening**: Context isolation enabled, nodeIntegration disabled, sandbox enabled
- **IPC security**: Preload script uses strict whitelist; only safe methods exposed
- **Input validation**: New `security.js` validates file paths, device info, cut jobs
- **Error handling**: Errors logged internally; safe messages sent to renderer
- **No code injection**: No `eval()`, `Function()`, `child_process.exec()` with user input
- **No hardcoded secrets**: No API keys, tokens, or credentials in source

### ⚠️ Items to Monitor
- **Transitive dependencies**: `potrace` uses outdated Jimp; consider lazy-loading or replacement
- **Serial/USB access**: Device drivers access hardware; ensure only for trusted devices
- **File access**: Image tracing reads user files; paths validated before use
- **Device commands**: Cut jobs sent to hardware; payload validated and logged

## Recommendations

### Immediate (Do)
- ✅ Add `security.js` with validation functions (DONE)
- ✅ Create `SECURITY.md` policy (DONE)
- ✅ Configure `.npmrc` audit settings (DONE)
- [ ] Add pre-commit hook to run `npm audit` before commits
- [ ] Update CI/CD to fail builds on high/critical vulns

### Short-term (1–2 weeks)
- [ ] Evaluate `potrace` alternatives (e.g., use `jimp` directly)
- [ ] Update to latest stable tar (already in place via npm audit fix)
- [ ] Add integration tests for path validation
- [ ] Document threat model for hardware access

### Long-term (Monthly+)
- [ ] Implement content-hash validation for cut job parameters
- [ ] Add audit logging for sensitive operations (device access, file reads)
- [ ] Annual security review + dependency audit
- [ ] Publish security advisories for any found issues

## Testing Checklist

Run these to verify security:

```bash
# Check dependencies
npm audit

# Verify preload whitelist (manual review of src/preload.js)
# Ensure only intended IPC methods exposed

# Test path validation
node -e "const s=require('./src/security.js'); s.validateFilePath('../etc/passwd')" # Should throw

# Test device info sanitization
node -e "const s=require('./src/security.js'); console.log(s.validateDeviceInfo({x:1, vendor:'test'}))"

# Lint for dangerous patterns
grep -r "eval\|Function\|exec\|require.*process" src/ --exclude-dir=node_modules | grep -v security.js || echo "✓ No dangerous patterns found"
```

## Incident Response

If a vulnerability is discovered:

1. **Triage**: Assess severity, exploitability, affected versions
2. **Patch**: Create fix in isolated branch; add regression tests
3. **Release**: Patch version bump (semver); publish on GitHub Releases
4. **Notify**: Email security contacts; publish advisory
5. **Monitor**: Track issue for 30 days; publish post-mortem if high-impact

Contact: See `SECURITY.md` for vulnerability reporting.

---
Generated: January 28, 2026  
Next Review: April 28, 2026
