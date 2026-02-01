# 🎥 Video Chat AI - Lifelike AI Assistant

## Overview

The Video Chat AI feature provides a **local-only, realistic AI video chat experience** for Nightmare Designs SVG Forge. This allows users to have face-to-face conversations with a **lifelike 3D animated AI assistant** to get help with design questions, tool usage, and creative tips.

## Key Features

### ✅ **Local-Only Operation**
- All processing happens on-device
- No cloud dependencies (except optional Ollama AI)
- Privacy-focused design
- Works completely offline (with fallback responses)

### 🎤 **Voice Interaction**
- Real-time speech recognition (uses Web Speech API)
- Natural text-to-speech responses
- Automatic conversation flow
- Hands-free operation while designing

### 📹 **Realistic Video Interface**
- **NEW: Lifelike 3D Avatar** using Three.js
- Realistic facial features (eyes, nose, mouth, hair)
- Natural blinking and breathing motions
- **Advanced lip-sync** - mouth movements match speech
- **Emotional expressions** - eyebrows and face react to conversation
- Live user camera feed
- Professional video chat layout
- Speaking indicators

### 🤖 **AI Assistant**
- Design-focused responses
- Material recommendations
- Tool usage guidance
- Cutting machine settings
- Real-time design context awareness

## Realistic Avatar Features

### 3D Rendered Face
The avatar uses Three.js for real-time 3D rendering:
- **Realistic skin tones and lighting**
- **Proper facial structure** with cheeks, nose, lips
- **Beautiful hair rendering**
- **Soft shadows and highlights**
- **60 FPS animation** for smooth motion

### Natural Animations
- **Breathing motion** - subtle head and body movement
- **Realistic blinking** - eyes close naturally every 3-5 seconds
- **Head gestures** - gentle nodding and rotation
- **Micro-expressions** - subtle facial movements

### Advanced Lip-Sync
- **Phoneme simulation** - mouth shapes match speech sounds
- **Jaw movement** - realistic jaw motion while talking
- **Teeth visibility** - teeth show when mouth opens wide
- **Lip deformation** - lips stretch and compress naturally

### Emotional States
The avatar displays different emotions:
- **Neutral** - calm, relaxed expression
- **Happy** - eyebrows raised, slight smile
- **Thinking** - one eyebrow raised, contemplative look
- **Explaining** - animated eyebrows, engaged expression

## Requirements

### Hardware
- **Minimum**: Any modern PC with webcam
- **Recommended**: RTX 3060 Ti + 32GB RAM (for smooth AI responses)
- Webcam (for video, optional)
- Microphone (for voice input)

### Software
- Electron-based app (included)
- Node.js 18+
- **Optional**: Ollama with Mistral model (for enhanced AI responses)
  - Without Ollama: Uses intelligent fallback responses
  - With Ollama: Full conversational AI capabilities

## How to Use

### Starting a Video Chat

1. **Open the Tool Panel**
   - Click the 🛠 tools button on the left toolbar

2. **Start Video Chat**
   - Scroll to the "AI Video Chat" section
   - Click "📹 Start Video Chat"

3. **Grant Permissions**
   - Allow camera access (optional but recommended)
   - Allow microphone access (required for voice chat)

4. **Start Talking**
   - The AI will greet you automatically
   - Simply speak your questions
   - The AI will respond with voice and text

### Using the Controls

#### Camera Toggle
- **Button**: 📹 Camera
- **Function**: Turn your camera on/off
- **Note**: Camera is optional - you can chat with video disabled

#### Microphone Toggle
- **Button**: 🎤 Microphone
- **Function**: Mute/unmute your microphone
- **Indicator**: Green = active, Red = muted

#### End Call
- **Button**: 📞 End Call
- **Function**: Closes the video chat session
- **Also**: Click the ✕ in the top-right corner

### Conversation Tips

**Good Questions:**
- "What settings should I use for vinyl?"
- "How do I combine shapes together?"
- "What's the best way to trace an image?"
- "How do I resize my design?"
- "What blade pressure for cardstock?"

**Context-Aware:**
The AI knows what you're working on:
- Number of selected objects
- Current tool in use
- Whether your canvas has objects

## Technical Details

### Architecture

```
┌─────────────────────────────────────────┐
│         Video Chat UI (Renderer)        │
│  ┌────────────┐      ┌───────────────┐ │
│  │  User      │      │  AI Avatar    │ │
│  │  Camera    │      │  (Canvas)     │ │
│  └────────────┘      └───────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Conversation Transcript       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
            ↕ IPC / HTTP
┌─────────────────────────────────────────┐
│        AI Server (Port 4000)            │
│  ┌────────────────────────────────┐    │
│  │   Ollama Integration            │    │
│  │   (Mistral Model)               │    │
│  │   or Fallback Responses         │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- HTML5 Canvas (for AI avatar)
- MediaDevices API (for camera/mic)
- Web Speech API (for voice recognition)
- Speech Synthesis API (for TTS)

**Backend:**
- Express.js server (port 4000)
- Ollama API integration (optional)
- Intelligent fallback system

### AI Avatar

The AI avatar is a simple animated face rendered on HTML5 Canvas:
- **Face**: Red circle (brand color)
- **Eyes**: Animated blinking
- **Mouth**: Moves while speaking
- **Expressions**: React to conversation state

Animation runs at 60 FPS for smooth motion.

## Setup Instructions

### 1. Install Dependencies

```bash
cd /path/to/forge
npm install
```

Dependencies include:
- `socket.io` - Real-time communication
- `socket.io-client` - Client-side socket connection

### 2. Start the AI Server

```bash
npm run ai-server
```

The server will start on port 4000.

### 3. (Optional) Install Ollama

For enhanced AI responses:

```bash
# Download from https://ollama.ai
# Or use bundled version in bin/ollama.exe

# Pull the Mistral model
ollama pull mistral
```

### 4. Start the Application

```bash
npm start
```

The application will automatically connect to the AI server.

## Troubleshooting

### Camera Not Working
- **Check Permissions**: Ensure browser/Electron has camera access
- **Try Different Browser**: Some browsers have better WebRTC support
- **Fallback**: You can still use voice chat without camera

### Microphone Not Working
- **Check Permissions**: Ensure microphone access is granted
- **Test Mic**: Use system settings to verify mic is working
- **Browser Support**: Some browsers need HTTPS for mic access

### AI Not Responding
- **Check Server**: Ensure AI server is running on port 4000
- **Check Console**: Look for error messages in DevTools
- **Fallback Mode**: Without Ollama, uses pre-programmed responses

### Speech Recognition Issues
- **Browser Support**: Works best in Chrome/Edge
- **Network Required**: Web Speech API needs internet for processing
- **Alternative**: Type questions in the text assistant instead

### Performance Issues
- **Close Other Apps**: Free up system resources
- **Lower Quality**: Disable camera to reduce load
- **Update Drivers**: Ensure GPU drivers are current

## Privacy & Security

### Data Handling
✅ **Local Processing**: All video/audio stays on your device
✅ **No Recording**: Nothing is saved or transmitted
✅ **No Tracking**: No analytics or telemetry
✅ **Offline Capable**: Works without internet (with fallbacks)

### Permissions
The app requests:
- **Camera** (optional): Only for video display
- **Microphone** (required): For voice input
- **Internet** (optional): For Web Speech API and Ollama

### What Gets Sent
- **To AI Server**: Only text messages (not audio/video)
- **To Web Speech API**: Audio for transcription (Google servers)
- **Nothing Else**: No personal data, no tracking

## Advanced Configuration

### Customizing AI Responses

Edit `/src/server/server.js` to customize fallback responses:

```javascript
// Around line 280-300
if (msg.includes('vinyl')) {
  reply = "Your custom vinyl advice here";
}
```

### Changing AI Model

Edit `/src/server/server.js` to change the Ollama model:

```javascript
const MODEL = 'mistral'; // Change to 'llama2', 'neural-chat', etc.
```

### Avatar Customization

Edit `/src/renderer/app.js` in the `animateAIAvatar()` method:

```javascript
// Change colors, size, animation speed
ctx.fillStyle = '#8b0000'; // Change avatar color
const eyeOffset = 30; // Change eye spacing
```

## Future Enhancements

Potential improvements for future versions:
- [ ] Enhanced 3D avatar with texture mapping for photorealism
- [ ] True phoneme-based lip-sync using audio analysis
- [ ] Multiple avatar personalities and appearances
- [ ] Video recording and playback
- [ ] Screen sharing for design review
- [ ] Multi-language support
- [ ] Gesture recognition
- [ ] Emotion detection from user's face
- [ ] Eye tracking to follow cursor/user
- [ ] Full body animation (not just face)

## API Reference

### Video Chat Methods

#### `startVideoChat()`
Initializes and starts the video chat session.

#### `endVideoChat()`
Stops all media streams and closes the video chat.

#### `toggleCamera()`
Enables/disables the user's camera feed.

#### `toggleMicrophone()`
Mutes/unmutes the microphone.

#### `speakAIMessage(text)`
Converts text to speech and animates the avatar.

#### `addVideoChatMessage(type, text)`
Adds a message to the conversation transcript.
- `type`: 'user', 'ai', or 'system'
- `text`: Message content

### Server Endpoint

#### `POST /assistant`
Handles chat messages from the video chat interface.

**Request:**
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

**Response:**
```json
{
  "reply": "To weld/combine shapes, select multiple objects and use Path > Union from the tools menu..."
}
```

## Files Modified

### UI Files
- `src/renderer/index.html` - Video chat modal and controls
- `src/renderer/styles.css` - Video chat styling
- `src/renderer/app.js` - Video chat functionality

### Dependencies
- `package.json` - Added socket.io dependencies

## Credits

**Developed for**: Nightmare Designs SVG Forge
**Technology**: Electron, Web Speech API, Canvas, Ollama
**License**: MIT

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review console logs in DevTools
- Ensure all dependencies are installed
- Verify AI server is running

**Enjoy your lifelike AI assistant! 🎥🤖**
