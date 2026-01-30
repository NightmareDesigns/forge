# Security Policy

## Overview

Nightmare designs svg forge is a desktop application built with Electron. Security is critical to protect user data and system integrity.

## Security Features

### Electron Configuration
- **Context Isolation**: Enabled (`contextIsolation: true`) — renderer process cannot access Node APIs directly
- **Node Integration**: Disabled (`nodeIntegration: false`) — prevents renderer from requiring modules
- **Sandbox**: Enabled via `enableSandbox: true`
- **Preload Script**: Strict whitelist of IPC methods exposed via contextBridge
- **Content Security Policy**: Restrictive CSP headers in index.html

### Input Validation
- All file paths validated before use (no path traversal)
- User-supplied parameters sanitized in IPC handlers
- Device info and job data validated before sending to hardware

### IPC Security
- Only serializable data passed over IPC (no function refs, native handles)
- All IPC invoke handlers return safe, validated data
- File operations restricted to user-selected directories (via dialog)
- Device manager protects internal state; only public info exposed

## Reporting Vulnerabilities

**Do not create public GitHub issues for security vulnerabilities.**

If you find a security issue:
1. Email security details to the maintainer
2. Include: description, reproduction steps, potential impact
3. Allow 48 hours for acknowledgment, 7 days for patch
4. Do not disclose publicly until patch is released

## Security Best Practices for Contributors

### Code Review Checklist
- [ ] No `eval()`, `Function()`, or dynamic code execution
- [ ] No hardcoded secrets, credentials, API keys
- [ ] File paths validated with `path.resolve()` and checked against allowed dirs
- [ ] IPC handlers validate all arguments; return only serializable data
- [ ] No direct access to renderer process from main without validation
- [ ] Dependencies checked for known vulnerabilities (`npm audit`)
- [ ] User input sanitized before display or command execution
- [ ] Device communication errors handled gracefully (no stack traces to UI)

### Forbidden Patterns
```javascript
// ❌ Never allow path traversal
require('fs').readFileSync(userSuppliedPath);

// ❌ Never use eval or Function constructor
eval(userInput);
new Function(userInput)();

// ❌ Never return native objects over IPC
ipcMain.handle('get-device', () => deviceManager.activeDevice); // BAD

// ❌ Never execute shell commands with user input unsanitized
require('child_process').exec(`process file: ${filename}`); // VULNERABLE

// ❌ Never hardcode secrets
const API_KEY = 'sk_live_...' // BAD
```

### Safe Patterns
```javascript
// ✅ Validate and normalize paths
const path = require('path');
const safeDir = path.resolve(userDir);
if (!safeDir.startsWith(path.resolve(allowedBase))) throw new Error('Path traversal');

// ✅ Return only serializable data over IPC
ipcMain.handle('get-device-status', () => {
  const status = deviceManager.getStatus();
  return { connected: status.connected, name: status.info.name }; // Safe subset
});

// ✅ Validate all user input
ipcMain.handle('process-file', async (event, filename) => {
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) throw new Error('Invalid filename');
  // Process safely
});

// ✅ Catch and log errors securely (never leak internals to user)
try {
  // operation
} catch (err) {
  console.error('Internal error:', err); // Logs internally
  mainWindow.webContents.send('error', { message: 'Operation failed' }); // Safe message
}
```

## Dependencies

### Vetted Packages
- `electron`: UI framework (actively maintained, security reviews published)
- `serialport`: Serial communication (peer-reviewed for hardware safety)
- `usb`: USB communication (established library with community vetting)
- `potrace`: Vector tracing (legacy library, no active vulns; used in read-only mode)
- `axios`: HTTP client (security-focused, widely audited)
- `express`: AI server (established, security-hardened version)

### Dependency Audits
Run `npm audit` regularly:
```bash
npm audit
npm audit fix  # Auto-patch low/medium vulns
```

High-severity vulns block release until patched.

## Testing

Security tests run as part of CI/CD:
- `npm audit` — dependency vulnerability scan
- Preload script validation — ensure only whitelisted IPC exposed
- Path traversal tests — verify file operations are safe
- IPC serialization tests — confirm no objects leak over bridge

## Disclosure Timeline

When we patch a security issue:
1. Fix is committed to private/staging branch
2. Tests added to prevent regression
3. Patch version released (semver patch bump)
4. GitHub security advisory published post-release
5. Users notified to upgrade

## Resources

- [Electron Security Documentation](https://www.electronjs.org/docs/tutorial/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
