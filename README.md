# 🩸 Nightmare Designs Forge

**[nightmaredesigns.org](https://nightmaredesigns.org)**

A powerful design and cutting software — a complete replacement for Cricut Design Space with more tools and more options.

## Features

- **Full Canvas Control**: 12"×12" canvas with zoom, pan, and grid
- **Drawing Tools**: Select, Pen, Shapes, Text, Line tools
- **Image Tools**: Upload images, Image Trace (vectorization)
- **Path Operations**: Offset path, Contour creation
- **Boolean Operations**: Weld, Slice, Attach, Flatten
- **Layer Management**: Multiple layers with visibility and lock controls
- **Transform Controls**: Position, size, rotation adjustments
- **Fill & Stroke**: Color picker with stroke width control
- **Cut Settings**: Material presets and pressure adjustment
- **Export Options**: SVG, PNG, PDF export
- **Undo/Redo**: Full history support
- **Keyboard Shortcuts**: V (select), P (pen), S (shapes), T (text)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start the application
npm start

# Development mode
npm run dev
```

### Building

```bash
# Build for production
npm run build
```

## Project Structure

```
CraftForge/
├── src/
│   ├── main.js           # Electron main process
│   ├── preload.js        # Secure IPC bridge
│   ├── renderer/
│   │   ├── index.html    # Main UI
│   │   ├── styles.css    # Application styles
│   │   └── app.js        # Canvas and UI logic
│   ├── components/       # Reusable UI components
│   ├── tools/            # Tool implementations
│   └── utils/            # Utility functions
├── assets/
│   ├── icons/            # Application icons
│   └── templates/        # Design templates
├── docs/                 # Documentation
├── tests/                # Test files
└── package.json
```

## Supported Materials

- Vinyl
- Cardstock
- Paper
- Iron-On (HTV)
- Fabric
- Faux Leather
- Custom settings

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select tool |
| P | Pen tool |
| S | Shapes tool |
| T | Text tool |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+G | Group |
| Ctrl+Shift+G | Ungroup |
| Ctrl+A | Select all |
| Delete | Delete selected |
| Ctrl+S | Save |
| Ctrl+O | Open |

## Roadmap

- [ ] SVG import/parsing
- [ ] Image trace (potrace integration)
- [ ] Font management
- [ ] Custom shapes library
- [ ] Print & Cut support
- [ ] Cutter device integration
- [ ] Project templates
- [ ] Cloud sync

## Website (GitHub Pages)

The website at nightmaredesigns.org is hosted on GitHub Pages.

### Setup GitHub Pages:
1. Push this repo to `github.com/nightmaredesigns/forge`
2. Go to **Settings** → **Pages**
3. Set Source to **Deploy from a branch**
4. Select **main** branch and **/docs** folder
5. Add custom domain: `nightmaredesigns.org`

### DNS Settings for nightmaredesigns.org:
Add these records at your domain registrar:
```
Type: A
Name: @
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153

Type: CNAME
Name: www
Value: nightmaredesigns.github.io
```

## License

MIT License

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.
