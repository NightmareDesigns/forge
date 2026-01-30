/**
 * Key Generator Window - Frontend Logic
 */

class KeyGenApp {
  constructor() {
    this.keys = [];
    this.setupEventListeners();
    this.loadExistingKeys();
  }

  setupEventListeners() {
    // Key generation buttons
    document.getElementById('generate-btn').addEventListener('click', () => this.generateKeys());
    document.getElementById('export-json-btn').addEventListener('click', () => this.exportJSON());
    document.getElementById('export-csv-btn').addEventListener('click', () => this.exportCSV());

    // Chat functionality
    const sendBtn = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');

    sendBtn.addEventListener('click', () => this.sendMessage());
    
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  async loadExistingKeys() {
    try {
      const result = await window.keygen.loadKeys();
      if (result.success) {
        this.keys = result.keys;
        this.updateStats();
        this.displayKeys();
        this.showStatus('Loaded existing keys', 'info');
      }
    } catch (err) {
      console.log('No existing keys found');
    }
  }

  async generateKeys() {
    const count = parseInt(document.getElementById('key-count').value);
    
    if (isNaN(count) || count < 1 || count > 10000) {
      this.showStatus('Please enter a valid number (1-10000)', 'error');
      return;
    }

    this.showStatus('Generating keys...', 'info');
    document.getElementById('generate-btn').disabled = true;

    try {
      const result = await window.keygen.generateKeys(count);
      
      if (result.success) {
        this.keys = result.keys;
        this.updateStats();
        this.displayKeys();
        this.showStatus(`Successfully generated ${count} keys!`, 'success');
      } else {
        this.showStatus('Failed to generate keys: ' + result.error, 'error');
      }
    } catch (err) {
      this.showStatus('Error: ' + err.message, 'error');
    } finally {
      document.getElementById('generate-btn').disabled = false;
    }
  }

  async exportJSON() {
    if (this.keys.length === 0) {
      this.showStatus('No keys to export', 'error');
      return;
    }

    try {
      const result = await window.keygen.exportJSON();
      if (result.success) {
        this.showStatus(`Exported ${result.count} keys to ${result.path}`, 'success');
      } else {
        this.showStatus('Export failed: ' + result.error, 'error');
      }
    } catch (err) {
      this.showStatus('Error: ' + err.message, 'error');
    }
  }

  async exportCSV() {
    if (this.keys.length === 0) {
      this.showStatus('No keys to export', 'error');
      return;
    }

    try {
      const result = await window.keygen.exportCSV();
      if (result.success) {
        this.showStatus(`Exported ${result.count} keys to ${result.path}`, 'success');
      } else {
        this.showStatus('Export failed: ' + result.error, 'error');
      }
    } catch (err) {
      this.showStatus('Error: ' + err.message, 'error');
    }
  }

  updateStats() {
    const total = this.keys.length;
    const available = this.keys.filter(k => !k.used).length;
    
    document.getElementById('total-keys').textContent = total;
    document.getElementById('available-keys').textContent = available;
  }

  displayKeys() {
    const display = document.getElementById('key-display');
    
    if (this.keys.length === 0) {
      display.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No keys generated yet</div>';
      return;
    }

    const recentKeys = this.keys.slice(-20).reverse();
    const html = recentKeys.map(k => {
      const status = k.used ? '<span style="color: #f44336;">USED</span>' : '<span style="color: #4caf50;">AVAILABLE</span>';
      return `<div class="key-item">${k.key} - ${status}</div>`;
    }).join('');
    
    display.innerHTML = html;
  }

  showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
  }

  // Chat functionality
  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.classList.add('active');

    try {
      // Send to AI server
      const response = await fetch('http://localhost:4000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          context: {
            totalKeys: this.keys.length,
            availableKeys: this.keys.filter(k => !k.used).length,
            usedKeys: this.keys.filter(k => k.used).length
          }
        })
      });

      const data = await response.json();
      
      // Hide typing indicator
      typingIndicator.classList.remove('active');

      // Add AI response
      if (data.reply) {
        this.addMessage(data.reply, 'ai');
      } else {
        this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
      }
    } catch (error) {
      typingIndicator.classList.remove('active');
      
      // Fallback responses if server unavailable
      const reply = this.generateFallbackResponse(message);
      this.addMessage(reply, 'ai');
    }
  }

  addMessage(text, type) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = text;
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  generateFallbackResponse(message) {
    const msg = message.toLowerCase();

    // License key related
    if (msg.includes('key') || msg.includes('license')) {
      if (msg.includes('generate') || msg.includes('create')) {
        return 'To generate license keys, enter the number of keys you want (1-10000) in the input field and click "Generate Keys". Each key is unique and secured with cryptographic hashing.';
      }
      if (msg.includes('how many') || msg.includes('count')) {
        return `You currently have ${this.keys.length} total keys, with ${this.keys.filter(k => !k.used).length} available for use.`;
      }
      if (msg.includes('export')) {
        return 'You can export your keys in two formats: JSON (for programmatic use) or CSV (for spreadsheets). Click the respective export buttons to save your keys.';
      }
      return 'CraftForge uses a 16-character license key format (XXXX-XXXX-XXXX-XXXX). Keys are machine-locked and include a 30-day trial period. You can generate up to 10,000 keys at once.';
    }

    // Software features
    if (msg.includes('feature') || msg.includes('what can') || msg.includes('capabilities')) {
      return 'CraftForge is a professional craft cutting software with:\n• AI-powered design generation\n• Image tracing and vectorization\n• 20+ design and editing tools\n• Support for Cricut and HPGL devices\n• Export to SVG, PDF, DXF, and more\n• Machine-locked licensing system';
    }

    // Pricing
    if (msg.includes('price') || msg.includes('cost') || msg.includes('buy') || msg.includes('purchase')) {
      return 'CraftForge Professional is $79.99 one-time payment. We accept CashApp ($NGTMRE1). After payment, email your receipt to receive your license key. Trial version includes 30 days full access.';
    }

    // Trial
    if (msg.includes('trial')) {
      return 'The trial version gives you 30 days of full access to all features. No credit card required. The trial is machine-locked to prevent abuse.';
    }

    // Device support
    if (msg.includes('device') || msg.includes('cricut') || msg.includes('hpgl')) {
      return 'CraftForge supports Cricut machines (via USB/Bluetooth) and HPGL-compatible plotters. Connect your device and select it from the Device panel to start cutting.';
    }

    // AI features
    if (msg.includes('ai') || msg.includes('generate design')) {
      return 'The AI design generator uses Ollama/Mistral to create custom SVG designs from text prompts. Describe what you want (e.g., "flower pattern", "geometric star") and the AI will generate it. Make sure the AI server is running on port 4000.';
    }

    // Tools
    if (msg.includes('tool') || msg.includes('draw') || msg.includes('edit')) {
      return 'CraftForge has 20+ tools:\n• Design Tools: Freehand, Rectangle, Circle, Polygon, Star, Line, Pen\n• Edit Tools: Duplicate, Group, Flip, Rotate, Align\n• Vector Tools: Node Editor, Select\n• Transform: Scale, Move, Rotate objects with precision';
    }

    // Help
    if (msg.includes('help') || msg.includes('how to') || msg.includes('tutorial')) {
      return 'What do you need help with? I can explain:\n• License key generation\n• Using design tools\n• AI features\n• Device connectivity\n• Exporting files\n• Pricing and payment\n\nJust ask!';
    }

    // Greeting
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return 'Hello! How can I help you with CraftForge today? Feel free to ask about license keys, features, or anything else.';
    }

    // Thank you
    if (msg.includes('thank') || msg.includes('thanks')) {
      return 'You\'re welcome! Let me know if you need anything else. Happy crafting! 🎨';
    }

    // Default
    return 'I can help you with license key generation, software features, pricing, device support, and more. What would you like to know?';
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.keygenApp = new KeyGenApp();
});
