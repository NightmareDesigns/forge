/**
 * CraftForge - HPGL Plotter Driver
 * Supports HPGL/HPGL2 compatible plotters and cutters
 */

const { EventEmitter } = require('events');
const { SerialPort } = require('serialport');

class HPGLDriver extends EventEmitter {
  constructor() {
    super();
    this.port = null;
    this.connected = false;
    this.busy = false;
    this.queue = [];
    
    // Default settings
    this.settings = {
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      units: 'mm',        // mm or inch
      speed: 100,         // cutting speed (mm/s)
      pressure: 30,       // blade pressure (device specific)
      origin: { x: 0, y: 0 }
    };
    
    // HPGL units: 1 unit = 0.025mm (40 units per mm)
    this.HPGL_UNITS_PER_MM = 40;
    this.HPGL_UNITS_PER_INCH = 1016;
  }

  /**
   * Connect to the plotter
   * @param {object} deviceInfo - Device connection info
   */
  async connect(deviceInfo) {
    return new Promise((resolve, reject) => {
      this.port = new SerialPort({
        path: deviceInfo.path,
        baudRate: this.settings.baudRate,
        dataBits: this.settings.dataBits,
        stopBits: this.settings.stopBits,
        parity: this.settings.parity
      });

      this.port.on('open', () => {
        this.connected = true;
        this.emit('status', 'connected');
        this.initialize();
        resolve();
      });

      this.port.on('error', (err) => {
        this.emit('error', err);
        reject(err);
      });

      this.port.on('data', (data) => {
        this.handleResponse(data);
      });

      this.port.on('close', () => {
        this.connected = false;
        this.emit('status', 'disconnected');
      });
    });
  }

  /**
   * Disconnect from the plotter
   */
  async disconnect() {
    if (this.port && this.port.isOpen) {
      return new Promise((resolve) => {
        this.port.close(() => {
          this.connected = false;
          resolve();
        });
      });
    }
  }

  /**
   * Initialize the plotter
   */
  initialize() {
    this.send('IN;');  // Initialize
    this.send('SP1;'); // Select pen 1 (or blade)
  }

  /**
   * Send HPGL command
   * @param {string} command - HPGL command
   */
  send(command) {
    if (!this.connected || !this.port) {
      throw new Error('Not connected');
    }
    
    this.port.write(command, (err) => {
      if (err) {
        this.emit('error', err);
      }
    });
  }

  /**
   * Handle response from plotter
   * @param {Buffer} data - Response data
   */
  handleResponse(data) {
    const response = data.toString();
    this.emit('response', response);
  }

  /**
   * Convert coordinates to HPGL units
   * @param {number} value - Value in mm or inches
   * @returns {number} - Value in HPGL units
   */
  toHPGLUnits(value) {
    if (this.settings.units === 'inch') {
      return Math.round(value * this.HPGL_UNITS_PER_INCH);
    }
    return Math.round(value * this.HPGL_UNITS_PER_MM);
  }

  /**
   * Execute a cut job
   * @param {object} job - Cut job with paths
   */
  async cut(job) {
    if (this.busy) {
      throw new Error('Device is busy');
    }
    
    this.busy = true;
    this.emit('status', 'cutting');
    
    try {
      const { paths, settings = {} } = job;
      const mergedSettings = { ...this.settings, ...settings };
      
      // Set speed if supported
      if (mergedSettings.speed) {
        this.send(`VS${mergedSettings.speed};`);
      }
      
      // Set pressure/force if supported
      if (mergedSettings.pressure) {
        this.send(`FS${mergedSettings.pressure};`);
      }
      
      // Process each path
      const totalPaths = paths.length;
      
      for (let i = 0; i < totalPaths; i++) {
        const path = paths[i];
        await this.cutPath(path);
        
        // Emit progress
        this.emit('progress', {
          current: i + 1,
          total: totalPaths,
          percent: Math.round(((i + 1) / totalPaths) * 100)
        });
      }
      
      // Return to origin
      this.send('PU;');
      this.send('PA0,0;');
      
      this.emit('status', 'completed');
    } finally {
      this.busy = false;
    }
  }

  /**
   * Cut a single path
   * @param {object} path - Path with coordinates
   */
  async cutPath(path) {
    const { coordinates } = path;
    
    if (!coordinates || coordinates.length === 0) {
      return;
    }
    
    for (const coord of coordinates) {
      const x = this.toHPGLUnits(coord.x + this.settings.origin.x);
      const y = this.toHPGLUnits(coord.y + this.settings.origin.y);
      
      if (coord.pen === 'up') {
        // Pen up, move to position
        this.send(`PU${x},${y};`);
      } else {
        // Pen down, cut to position
        this.send(`PD${x},${y};`);
      }
      
      // Small delay to prevent buffer overflow
      await this.delay(5);
    }
    
    // Pen up at end of path
    this.send('PU;');
  }

  /**
   * Move to position without cutting
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  moveTo(x, y) {
    const hx = this.toHPGLUnits(x);
    const hy = this.toHPGLUnits(y);
    this.send(`PU${hx},${hy};`);
  }

  /**
   * Cut to position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  cutTo(x, y) {
    const hx = this.toHPGLUnits(x);
    const hy = this.toHPGLUnits(y);
    this.send(`PD${hx},${hy};`);
  }

  /**
   * Draw a rectangle
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   */
  rectangle(x, y, width, height) {
    this.moveTo(x, y);
    this.send('PD;');
    this.cutTo(x + width, y);
    this.cutTo(x + width, y + height);
    this.cutTo(x, y + height);
    this.cutTo(x, y);
    this.send('PU;');
  }

  /**
   * Draw a circle
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} radius - Radius
   */
  circle(cx, cy, radius) {
    this.moveTo(cx + radius, cy);
    const r = this.toHPGLUnits(radius);
    this.send(`CI${r};`);
  }

  /**
   * Set cutting speed
   * @param {number} speed - Speed in mm/s
   */
  setSpeed(speed) {
    this.settings.speed = speed;
    this.send(`VS${speed};`);
  }

  /**
   * Set blade pressure
   * @param {number} pressure - Pressure value
   */
  setPressure(pressure) {
    this.settings.pressure = pressure;
    this.send(`FS${pressure};`);
  }

  /**
   * Set origin point
   * @param {number} x - X offset
   * @param {number} y - Y offset
   */
  setOrigin(x, y) {
    this.settings.origin = { x, y };
  }

  /**
   * Get plotter status
   * @returns {Promise<object>} - Status info
   */
  async getStatus() {
    return {
      connected: this.connected,
      busy: this.busy,
      settings: this.settings
    };
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to wait
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = HPGLDriver;
