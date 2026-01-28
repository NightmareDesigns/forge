# CraftForge Security Checklist — Pre-Release

Use this checklist before building and releasing any version to production.

## Code Review

- [ ] **No eval/Function**: `grep -r "eval\|Function(" src/ --exclude-dir=node_modules` returns no matches
- [ ] **No shell injection**: `grep -r "child_process.exec\|shell: true" src/` returns no matches
- [ ] **No hardcoded secrets**: `grep -r "password\|token\|key\|secret\|api_key" src/ --exclude=security.js` only matches in tests
- [ ] **IPC handlers validated**: All `ipcMain.handle` calls in [main.js](main.js) use `validate*` functions
- [ ] **Error handling safe**: All error messages logged to console, safe versions sent to renderer
- [ ] **File paths validated**: All file operations use `validateFilePath()`
- [ ] **Device commands validated**: All `send-cut-job` calls use `validateCutJob()`
- [ ] **CSP headers enforced**: [index.html](renderer/index.html) contains restrictive CSP meta tag
- [ ] **Context isolation enabled**: [main.js](main.js) has `contextIsolation: true`
- [ ] **Node integration disabled**: [main.js](main.js) has `nodeIntegration: false`
- [ ] **Preload used**: [main.js](main.js) specifies `preload: path.join(__dirname, 'preload.js')`

## Dependencies

- [ ] **npm audit passing**: `npm audit --audit-level=moderate` returns 0 vulnerabilities (or approved risk exceptions)
- [ ] **Dependencies up-to-date**: `npm outdated` shows no critical/security updates available
- [ ] **Lockfile committed**: `package-lock.json` is committed to version control
- [ ] **No insecure packages**: No packages from `npm's "unpopular-packages"` list
- [ ] **License compliance**: Run `npm ls --all` and verify licenses are compatible with project license

## Testing

- [ ] **Security tests pass**: `npm test -- tests/security.test.js` all pass
- [ ] **Path traversal blocked**: `npm test -- --testNamePattern="path traversal"` passes
- [ ] **Injection attempts blocked**: `npm test -- --testNamePattern="injection"` passes
- [ ] **IPC serialization safe**: `npm test -- --testNamePattern="IPC Serialization"` passes
- [ ] **Manual device test**: Connect a test device, send safe cut job, verify no command injection
- [ ] **Manual AI test**: Call AI endpoints, verify no prompt injection in results
- [ ] **Manual file test**: Trace a local image, verify no path traversal attempted

## Build

- [ ] **Build succeeds**: `npm run build` completes without errors
- [ ] **Build size reasonable**: Electron app + runtime + models < 5GB (acceptable for offline use)
- [ ] **Installer created**: `dist/CraftForge-Setup.exe` exists and is ~4.5GB
- [ ] **Code signed** (if applicable): Binary has valid code signature for Windows Authenticode
- [ ] **No secrets in build**: `grep -r "password\|token\|key" dist/` returns no matches
- [ ] **Runtime bundled**: `bin/ollama.exe` and `bin/models/` present in installer package

## Deployment

- [ ] **Release notes published**: GitHub Release includes security patch notes (if any)
- [ ] **Security advisory sent**: If fixing vulnerabilities, send disclosure to security contacts
- [ ] **Version bumped**: `package.json` version matches release tag (e.g., v0.1.2)
- [ ] **Git tag created**: `git tag -s v0.1.2 -m "Security release"` (signed commit)
- [ ] **CHANGELOG updated**: Latest version documented in CHANGELOG.md
- [ ] **Installer verified**: Download installer, run on clean Windows VM, verify app launches and basic functions work

## Post-Release

- [ ] **Monitoring enabled**: Log server collecting error reports from users
- [ ] **Security contacts notified**: Email security@nightmaredesigns.org with release notes
- [ ] **Archive kept**: Original source & binary archived with hash for audit trail
- [ ] **30-day review**: Monitor GitHub Issues & Twitter for reported security problems

## Risk Acceptance (if applicable)

If any step fails and you accept the risk, document here:

```
Risk: _______________
Reason: ______________
Accepted by: __________ (Signature/GitHub handle)
Date: ______________
Approved by: __________ (Security lead)
```

---

**For questions or to report security issues**, see [SECURITY.md](SECURITY.md).

Last updated: January 28, 2026  
Next review: April 28, 2026
