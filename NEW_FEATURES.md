# New Features Added to CraftForge

## 1. Design Assistant 🎨

**Location:** Left Panel (below SVG Search)

**What it does:**
- Answers questions about tools, materials, and cutting techniques
- Provides practical design advice
- Helps with troubleshooting

**How to use:**
1. Type your question in the input field
2. Click "Ask Assistant" or press Enter
3. View the response in the chat window

**Example questions:**
- "What settings should I use for vinyl?"
- "How do I combine shapes?"
- "Best fonts for cutting?"
- "How do I trace an image?"

**Technical Details:**
- Uses Ollama AI (mistral model) if available
- Falls back to pre-programmed responses for common questions
- Context-aware (knows what objects you have selected)

---

## 2. SVG Optimizer ⚡

**Location:** Right Drawer (below Advanced Selection tools)

**What it does:**
Three powerful tools to improve your SVG files:

### A. Optimize SVG (⚡)
- Reduces file size significantly
- Removes unnecessary code
- Merges paths where possible
- Shows percentage saved
- **Use when:** Importing complex SVGs or preparing files for cutting

### B. Simplify SVG (⌄)
- Reduces number of points in paths
- Makes curves smoother
- Easier for cutting machines to process
- **Use when:** SVG has too many anchor points or cuts slowly

### C. Clean SVG (🧹)
- Removes metadata, comments, and unused code
- Cleans up attribute formatting
- Strips editor-specific data
- **Use when:** SVG came from another program and has extra junk

**How to use:**
1. Select an SVG object on the canvas
2. Click one of the three tools in the right drawer
3. Watch the status bar for confirmation
4. Changes are saved to undo history

**Technical Details:**
- Uses SVGO library for professional optimization
- All processing happens server-side
- Original SVG is backed up in undo history
- Works only on SVG objects (not shapes or text)

---

## Server Endpoints

Three new endpoints have been added to the AI server (port 4000):

### 1. `/assistant` (POST)
```json
{
  "message": "How do I weld shapes?",
  "context": {
    "selectedObjects": 2,
    "currentTool": "select",
    "hasObjects": true
  }
}
```

Response:
```json
{
  "reply": "To weld/combine shapes, select multiple objects..."
}
```

### 2. `/optimize-svg` (POST)
```json
{
  "svg": "<svg>...</svg>"
}
```

Response:
```json
{
  "optimized": "<svg>...</svg>",
  "originalSize": 5432,
  "optimizedSize": 2156
}
```

### 3. `/simplify-svg` (POST)
```json
{
  "svg": "<svg>...</svg>",
  "tolerance": 1.0
}
```

Response:
```json
{
  "simplified": "<svg>...</svg>"
}
```

### 4. `/clean-svg` (POST)
```json
{
  "svg": "<svg>...</svg>"
}
```

Response:
```json
{
  "cleaned": "<svg>...</svg>"
}
```

---

## Installation Notes

**New dependency:** SVGO
```bash
npm install svgo
```

**Ollama (Optional - for full AI assistant):**
1. Download from https://ollama.ai
2. Install and run: `ollama pull mistral`
3. Server will automatically connect

Without Ollama, the assistant still works with pre-programmed responses for common design questions.

---

## Files Modified

1. **src/renderer/index.html**
   - Added Design Assistant section (lines 141-157)
   - Added SVG Optimizer tools (lines 487-503)

2. **src/renderer/styles.css**
   - Added chat message styles (lines 924-965)
   - User messages (blue, right-aligned)
   - Assistant messages (dark, left-aligned)
   - System messages (centered, gray)

3. **src/renderer/app.js**
   - Added `askAssistant()` method
   - Added `optimizeSvg()`, `simplifySvg()`, `cleanSvg()` methods
   - Wired up event listeners for all new features

4. **src/server/server.js**
   - Added `/assistant` endpoint
   - Added `/optimize-svg` endpoint
   - Added `/simplify-svg` endpoint
   - Added `/clean-svg` endpoint

5. **package.json**
   - Added SVGO dependency

---

## Usage Tips

### Design Assistant
- Ask specific questions for better answers
- Include context (e.g., "for vinyl" or "using Cricut")
- Use for quick reference while designing

### SVG Optimizer
- **Always optimize before exporting** for best cutting results
- Use Simplify if your machine is struggling with complex paths
- Clean SVGs imported from other programs before using
- Check undo history if you need to revert changes

### Best Workflow
1. Import or create your design
2. Use Design Assistant for questions
3. Optimize SVG before exporting
4. Export to your cutting machine

---

## Troubleshooting

**Design Assistant not responding:**
- Check that AI server is running (port 4000)
- Fallback responses will work without Ollama
- Check browser console for errors

**SVG Optimizer errors:**
- Make sure you've selected an SVG object (not shapes or text)
- Check that SVGO is installed: `npm list svgo`
- Restart the application if needed

**Server not starting:**
- Port 4000 might be in use
- Check firewall settings
- Try restarting with `npm start`
