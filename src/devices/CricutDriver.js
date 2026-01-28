/**
 * CraftForge - Cricut Driver
 * Driver for Cricut cutting machines
 * 
 * Note: This is a reverse-engineered implementation based on community research.
 * Use at your own risk. Not affiliated with or endorsed by Cricut.
 */

const { EventEmitter } = require('events');
const { SerialPort } = require('serialport');
const usb = require('usb');

class CricutDriver extends EventEmitter {
  constructor() {
    super();
    this.connection = null;
    this.connectionType = null; // 'serial' or 'usb'
    this.connected = false;
    this.busy = false;
    
    // Cricut USB identifiers
    this.VENDOR_IDS = [0x04D8, 0x20A0];
    
    // Machine settings
    this.settings = {
      material: 'vinyl',
      pressure: 'default',
      speed: 'default',
      multiCut: 1,
      matSize: { width: 12, height: 12 } // inches
    };
    
    // Material presets (pressure, speed, multiCut)
    this.materialPresets = {
      'vinyl': { pressure: 175, speed: 4, multiCut: 1 },
      'cardstock': { pressure: 230, speed: 3, multiCut: 1 },
      'cardstock-heavy': { pressure: 280, speed: 2, multiCut: 2 },
      'paper': { pressure: 150, speed: 5, multiCut: 1 },
      'iron-on': { pressure: 275, speed: 3, multiCut: 1 },
      'fabric': { pressure: 250, speed: 2, multiCut: 1 },
      'faux-leather': { pressure: 300, speed: 1, multiCut: 2 },
      'sticker-paper': { pressure: 190, speed: 4, multiCut: 1 },
      'vellum': { pressure: 140, speed: 5, multiCut: 1 }
    };
    
    // Coordinate system: 1 unit = 1/508 inch (508 units per inch)
    this.UNITS_PER_INCH = 508;
  }

  /**
   * Connect to Cricut machine
   * @param {object} deviceInfo - Device connection info
   */
  async connect(deviceInfo) {
    if (deviceInfo.type === 'usb') {
      return this.connectUSB(deviceInfo);
    } else {
      return this.connectSerial(deviceInfo);
    }
  }

  /**
   * Connect via USB
   * @param {object} deviceInfo - USB device info
   */
  async connectUSB(deviceInfo) {
    return new Promise((resolve, reject) => {
      try {
        const device = deviceInfo.device;
        device.open();
        
        const iface = device.interface(0);
        
        // Detach kernel driver if necessary (Linux)
        if (iface.isKernelDriverActive()) {
          iface.detachKernelDriver();
        }
        
        iface.claim();
        
        // Find endpoints
        this.outEndpoint = iface.endpoints.find(ep => ep.direction === 'out');
        this.inEndpoint = iface.endpoints.find(ep => ep.direction === 'in');
        
        if (!this.outEndpoint || !this.inEndpoint) {
          throw new Error('Could not find USB endpoints');
        }
        
        // Start listening for responses
        this.inEndpoint.startPoll(1, 64);
        this.inEndpoint.on('data', (data) => this.handleResponse(data));
        this.inEndpoint.on('error', (err) => this.emit('error', err));
        
        this.connection = device;
        this.connectionType = 'usb';
        this.connected = true;
        
        this.initialize();
        this.emit('status', 'connected');
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Connect via Serial port
   * @param {object} deviceInfo - Serial port info
   */
  async connectSerial(deviceInfo) {
    return new Promise((resolve, reject) => {
      this.connection = new SerialPort({
        path: deviceInfo.path,
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      this.connection.on('open', () => {
        this.connectionType = 'serial';
        this.connected = true;
        this.initialize();
        this.emit('status', 'connected');
        resolve();
      });

      this.connection.on('error', (err) => {
        this.emit('error', err);
        reject(err);
      });

      this.connection.on('data', (data) => {
        this.handleResponse(data);
      });

      this.connection.on('close', () => {
        this.connected = false;
        this.emit('status', 'disconnected');
      });
    });
  }

  /**
   * Disconnect from machine
   */
  async disconnect() {
    if (!this.connected) return;
    
    if (this.connectionType === 'usb') {
      try {
        this.inEndpoint.stopPoll();
        this.connection.close();
      } catch (err) {
        console.error('USB disconnect error:', err);
      }
    } else if (this.connectionType === 'serial') {
      return new Promise((resolve) => {
        this.connection.close(() => resolve());
      });
    }
    
    this.connected = false;
  }

  /**
   * Send command to machine
   * @param {Buffer|string} command - Command to send
   */
  send(command) {
    if (!this.connected) {
      throw new Error('Not connected');
    }
    
    const buffer = Buffer.isBuffer(command) ? command : Buffer.from(command);
    
    if (this.connectionType === 'usb') {
      this.outEndpoint.transfer(buffer, (err) => {
        if (err) this.emit('error', err);
      });
    } else {
      this.connection.write(buffer, (err) => {
        if (err) this.emit('error', err);
      });
    }
  }

  /**
   * Handle response from machine
   * @param {Buffer} data - Response data
   */
  handleResponse(data) {
    this.emit('response', data);
  }

  /**
   * Initialize the machine
   */
  initialize() {
    // Send initialization sequence
    this.send('FN0\x03'); // Function 0 - Initialize
    this.emit('status', 'initialized');
  }

  /**
   * Set material preset
   * @param {string} material - Material name
   */
  setMaterial(material) {
    const preset = this.materialPresets[material];
    if (preset) {
      this.settings.material = material;
      this.settings.pressure = preset.pressure;
      this.settings.speed = preset.speed;
      this.settings.multiCut = preset.multiCut;
    }
  }

  /**
   * Set custom cut settings
   * @param {object} settings - Cut settings
   */
  setSettings(settings) {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Convert inches to machine units
   * @param {number} inches - Value in inches
   * @returns {number} - Value in machine units
   */
  toUnits(inches) {
    return Math.round(inches * this.UNITS_PER_INCH);
  }

  /**
   * Execute a cut job
   * @param {object} job - Cut job data
   */
  async cut(job) {
    if (this.busy) {
      throw new Error('Machine is busy');
    }
    
    this.busy = true;
    this.emit('status', 'preparing');
    
    try {
      const { paths, settings = {} } = job;
      
      // Apply job settings
      if (settings.material) {
        this.setMaterial(settings.material);
      }
      
      // Build cut data
      const cutCommands = this.buildCutCommands(paths);
      
      // Send settings
      this.sendSettings();
      
      await this.delay(100);
      
      // Send cut data
      this.emit('status', 'cutting');
      
      const totalCommands = cutCommands.length;
      for (let i = 0; i < totalCommands; i++) {
        this.send(cutCommands[i]);
        
        // Progress update
        if (i % 10 === 0) {
          this.emit('progress', {
            current: i,
            total: totalCommands,
            percent: Math.round((i / totalCommands) * 100)
          });
        }
        
        await this.delay(10);
      }
      
      // Multi-cut passes
      for (let pass = 1; pass < this.settings.multiCut; pass++) {
        this.emit('status', `cutting (pass ${pass + 1}/${this.settings.multiCut})`);
        for (const cmd of cutCommands) {
          this.send(cmd);
          await this.delay(10);
        }
      }
      
      // Finish
      this.send('FN0\x03'); // Return to home
      
      this.emit('progress', { current: totalCommands, total: totalCommands, percent: 100 });
      this.emit('status', 'completed');
      
    } finally {
      this.busy = false;
    }
  }

  /**
   * Build cut commands from paths
   * @param {Array} paths - Array of paths to cut
   * @returns {Array} - Array of commands
   */
  buildCutCommands(paths) {
    const commands = [];
    
    for (const path of paths) {
      const { coordinates } = path;
      
      if (!coordinates || coordinates.length === 0) continue;
      
      for (const coord of coordinates) {
        const x = this.toUnits(coord.x);
        const y = this.toUnits(coord.y);
        
        if (coord.pen === 'up') {
          // Move without cutting
          commands.push(this.buildMoveCommand(x, y));
        } else {
          // Cut to position
          commands.push(this.buildCutCommand(x, y));
        }
      }
    }
    
    return commands;
  }

  /**
   * Build move command
   * @param {number} x - X position in units
   * @param {number} y - Y position in units
   * @returns {string} - Move command
   */
  buildMoveCommand(x, y) {
    return `M${x.toString().padStart(5, '0')},${y.toString().padStart(5, '0')}\x03`;
  }

  /**
   * Build cut command
   * @param {number} x - X position in units
   * @param {number} y - Y position in units
   * @returns {string} - Cut command
   */
  buildCutCommand(x, y) {
    return `D${x.toString().padStart(5, '0')},${y.toString().padStart(5, '0')}\x03`;
  }

  /**
   * Send current settings to machine
   */
  sendSettings() {
    // Set speed (1-10 scale typically)
    const speed = typeof this.settings.speed === 'number' 
      ? this.settings.speed 
      : 4;
    this.send(`!${speed}\x03`);
    
    // Set pressure
    const pressure = typeof this.settings.pressure === 'number'
      ? this.settings.pressure
      : 175;
    this.send(`FX${pressure}\x03`);
  }

  /**
   * Load mat
   */
  loadMat() {
    this.send('FM1\x03');
    this.emit('status', 'mat-loading');
  }

  /**
   * Unload mat
   */
  unloadMat() {
    this.send('FM0\x03');
    this.emit('status', 'mat-unloading');
  }

  /**
   * Home the cutting head
   */
  home() {
    this.send('H\x03');
    this.emit('status', 'homing');
  }

  /**
   * Pause cutting
   */
  pause() {
    this.send('FP\x03');
    this.emit('status', 'paused');
  }

  /**
   * Resume cutting
   */
  resume() {
    this.send('FR\x03');
    this.emit('status', 'cutting');
  }

  /**
   * Cancel current job
   */
  cancel() {
    this.send('FC\x03');
    this.busy = false;
    this.emit('status', 'cancelled');
  }

  /**
   * Get machine status
   * @returns {object} - Status info
   */
  getStatus() {
    return {
      connected: this.connected,
      busy: this.busy,
      connectionType: this.connectionType,
      settings: this.settings
    };
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = CricutDriver;
