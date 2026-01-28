# CraftForge Security Quick Reference

## For Developers

### Before Writing Code
✓ No eval/Function/exec with user input  
✓ All IPC parameters validated with `src/security.js`  
✓ Errors logged to console, safe messages to renderer  
✓ File paths validated with `validateFilePath()`  
✓ Device commands validated with `validateCutJob()`  

### When Adding IPC Handler
```javascript
// ❌ BAD: Unvalidated input
ipcMain.handle('trace-image', async (event, imagePath) => {
  return await vectorizer.traceImage(imagePath);
});

// ✅ GOOD: Validated input with error handling
ipcMain.handle('trace-image', async (event, imagePath, options) => {
  try {
    const validatedPath = validateFilePath(imagePath);
    const validatedOptions = validateTraceOptions(options);
    return await vectorizer.traceImage(validatedPath, validatedOptions);
  } catch (err) {
    throw new Error(handleSecureError(err, 'trace-image'));
  }
});
```

### Before Committing
```bash
npm audit --audit-level=moderate      # Must pass
npm test tests/security.test.js        # Must pass
grep -r "eval\|Function(" src/         # Must be empty
grep -r "password\|token\|key" src/   # Must be empty (except tests)
```

### When Releasing
Follow [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) completely.

---

## For Users / Administrators

### Installation
- Download latest installer from GitHub Releases
- Verify file hash matches SHA256 on release page
- Run installer; app launches with bundled Ollama + Mistral
- Works offline; no data leaves your machine

### Security Features
- **Sandboxed**: Renderer process isolated from Node.js
- **Validated**: All device commands validated before sending
- **Logged**: Device operations logged for audit trail
- **Air-gapped**: Uses bundled Ollama, no cloud dependencies
- **Signed**: Code signed (when configured for release)

### Reporting Security Issues
Email: security@nightmaredesigns.org  
GitHub: https://github.com/NightmareDesigns/CraftForge/security  
PGP Key: Available on website

**Do NOT** create public GitHub issues for security vulns. Use private advisories.

---

## For Security Auditors

### Quick Assessment
1. Read [SECURITY.md](SECURITY.md) — policy & architecture
2. Review [src/security.js](src/security.js) — validation logic
3. Check [src/main.js](src/main.js) lines ~190–260 — IPC handlers
4. Run [tests/security.test.js](tests/security.test.js) — test coverage
5. Review [npm audit](npm%20audit) output — known vulnerabilities

### Code Audit Checklist
- [ ] No eval/Function patterns: `grep -r "eval\|Function(" src/`
- [ ] No shell exec: `grep -r "exec\|spawnSync" src/`
- [ ] No hardcoded secrets: `grep -r "password\|token\|key\|secret" src/`
- [ ] All IPC validated: Check all `ipcMain.handle` calls in main.js
- [ ] CSP enforced: Check meta tag in renderer/index.html
- [ ] Context isolation: Check webPreferences in main.js
- [ ] No node integration: Check webPreferences nodeIntegration: false

### Dependency Assessment
- **electron**: Maintained by GitHub, well-audited
- **serialport**: USB serial comms, no vulns reported
- **potrace**: Image vectorization; 2 transitive vulns (phin, jimp)
- **jimp**: Image processing; 5 transitive vulns (tar, phin)
- **express**: AI server, well-maintained, no vulns
- **axios**: HTTP client, well-maintained, no vulns

### Testing
```bash
npm install
npm test tests/security.test.js  # 20+ test cases
npm audit                        # 7 known transitive vulns
```

All tests should pass; vulns are expected (transitive, low risk).

---

## For DevOps / Release Engineering

### Pre-Release Automation
```bash
# In CI/CD pipeline before building:
npm ci                                    # Install exact versions
npm audit --audit-level=moderate         # Fail if high vulns
npm test tests/security.test.js          # Run security tests
npm run lint                             # Check code patterns
npm run build                            # Build electron app
```

### Build Configuration
- **electron-builder**: Bundles bin/ (Ollama exe + models) into installer
- **Code signing**: Windows Authenticode (if configured)
- **Output**: CraftForge-Setup.exe (~4.5GB with bundled runtime)

### Release Checklist
See [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) — 50 items to verify.

---

## Common Q&A

**Q: Are there known vulnerabilities?**  
A: Yes, 7 in transitive dependencies (potrace/tar). All low risk; located in dev/build tools, not runtime code. See [SECURITY-AUDIT.md](SECURITY-AUDIT.md).

**Q: How is the AI server secured?**  
A: Local Ollama at localhost:11434; only accessible from app on same machine. No network exposure.

**Q: Can malicious image files harm the app?**  
A: No. Image paths validated (no traversal), and potrace runs in isolated process. Worst case: memory DoS, which crashes the app (not security issue).

**Q: What about USB device commands?**  
A: All cut jobs validated before sending. Impossible to inject malformed commands or access unauthorized files.

**Q: Is the code signed?**  
A: Not yet; can be configured in electron-builder. See docs for Windows Authenticode setup.

**Q: Can I audit the Ollama runtime?**  
A: Yes; it's bundled in bin/ollama.exe. Source available at https://github.com/ollama/ollama. Mistral model reproducible (sha256 hashes in bin/models/).

---

## Resources

- [SECURITY.md](SECURITY.md) — Full policy
- [SECURITY-AUDIT.md](SECURITY-AUDIT.md) — Vulnerability report
- [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) — Pre-release checklist
- [src/security.js](src/security.js) — Validation source code
- [tests/security.test.js](tests/security.test.js) — Test source code
- [Electron Security](https://www.electronjs.org/docs/tutorial/security) — Best practices
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — App security risks

---

Last updated: January 28, 2026
