# CraftForge License Key Generator

## ⚠️ ADMIN TOOL ONLY

This is a **remote administration tool** for generating and managing CraftForge license keys. It is NOT part of the main application and should only be accessible to administrators.

## Usage

### Launch the Key Generator

```bash
npm run keygen
```

This launches a separate, standalone Electron application for key generation.

### Features

- **Generate Keys**: Create 1-10,000 unique license keys at once
- **Export**: Save keys to JSON (programmatic) or CSV (spreadsheet)
- **Statistics**: Track total and available keys
- **AI Chat**: Ask questions about the software, licensing, and features

### Key Generator Interface

The application is split into two panels:

**Left Panel - Key Generation:**
- Statistics display (total keys, available keys)
- Number input (1-10,000)
- Generate, Export to JSON, Export to CSV buttons
- Recent keys display

**Right Panel - AI Assistant:**
- Chat interface for admin questions
- Fallback responses if AI server unavailable
- Answers about licensing, features, pricing, support

## Security Notes

- This tool should **NOT** be included in user installations
- Should only run on admin/internal machines
- The main CraftForge app does NOT have access to this tool
- Key files are stored in Electron's user data directory

## Related Tools

- **Main App**: `npm start` - User-facing CraftForge design application
- **AI Server**: `npm run ai-server` - Backend AI generation service

## Export Formats

### JSON Export
Contains full key metadata:
```json
{
  "generated": "2026-01-28T00:00:00.000Z",
  "totalCount": 100,
  "keys": [
    {
      "key": "XXXX-XXXX-XXXX-XXXX",
      "index": 0,
      "created": "2026-01-28T00:00:00.000Z",
      "used": false,
      "usedBy": null,
      "usedDate": null
    }
  ]
}
```

### CSV Export
Simple format for spreadsheet applications:
```
License Key,Status,Created Date
XXXX-XXXX-XXXX-XXXX,AVAILABLE,2026-01-28T00:00:00.000Z
YYYY-YYYY-YYYY-YYYY,USED,2026-01-28T00:00:00.000Z
```

## File Locations

- **License Keys**: `%APPDATA%/CraftForge/license_keys.json`
- **CSV Export**: `%APPDATA%/CraftForge/license_keys.csv`

## Requirements

- Node.js 18+
- Electron 40+
- OpenSSL (for key generation)

## Admin Access

To restrict access to this tool in production:

1. Remove `npm run keygen` from user-facing documentation
2. Deploy as separate CLI tool, not Electron app
3. Require authentication/API keys for key generation
4. Store keys in secure database instead of local files
5. Implement key usage tracking and revocation

## Future Enhancements

- [ ] Database backend for key storage
- [ ] User authentication system
- [ ] Key revocation/invalidation
- [ ] Usage analytics and reporting
- [ ] Batch import/export
- [ ] Key recovery system
- [ ] Audit logging
