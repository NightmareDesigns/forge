/**
 * CraftForge - Device Manager
 * Manages connections to cutting machines and plotters
 */

const { EventEmitter } = require('events');
const { SerialPort } = require('serialport');
const usb = require('usb');

class DeviceManager extends EventEmitter {
  constructor() {
    super();
    this.devices = new Map();
    this.activeDevice = null;
    this.drivers = new Map();
  }

  /**
   * Register a device driver
   * @param {string} name - Driver name
   * @param {object} driver - Driver class
   */
  registerDriver(name, driver) {
    this.drivers.set(name, driver);
  }

  /**
   * Scan for available serial ports
   * @returns {Promise<Array>} - List of available ports
   */
  async scanSerialPorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map(port => ({
        path: port.path,
        manufacturer: port.manufacturer || 'Unknown',
        serialNumber: port.serialNumber || '',
        vendorId: port.vendorId,
        productId: port.productId,
        type: 'serial'
      }));
    } catch (err) {
      console.error('Error scanning serial ports:', err);
      return [];
    }
  }

  /**
   * Scan for USB devices
   * @returns {Array} - List of USB devices
   */
  scanUSBDevices() {
    try {
      const devices = usb.getDeviceList();
      return devices.map(device => {
        const desc = device.deviceDescriptor;
        return {
          vendorId: desc.idVendor,
          productId: desc.idProduct,
          manufacturer: desc.iManufacturer,
          product: desc.iProduct,
          type: 'usb'
        };
      });
    } catch (err) {
      console.error('Error scanning USB devices:', err);
      return [];
    }
  }

  /**
   * Scan for all supported devices
   * @returns {Promise<Array>} - Combined list of devices
   */
  async scanAllDevices() {
    const serialPorts = await this.scanSerialPorts();
    const usbDevices = this.scanUSBDevices();
    
    const allDevices = [];
    
    // Check serial devices against known drivers
    for (const port of serialPorts) {
      const identified = this.identifyDevice(port);
      allDevices.push({
        ...port,
        ...identified
      });
    }
    
    // Check USB devices against known drivers
    for (const device of usbDevices) {
      const identified = this.identifyUSBDevice(device);
      if (identified.supported) {
        allDevices.push({
          ...device,
          ...identified
        });
      }
    }
    
    this.emit('devices-scanned', allDevices);
    return allDevices;
  }

  /**
   * Identify a serial device
   * @param {object} port - Port info
   * @returns {object} - Device identification
   */
  identifyDevice(port) {
    // Check for known device signatures
    const vendorId = parseInt(port.vendorId, 16);
    const productId = parseInt(port.productId, 16);
    
    // Cricut devices
    if (vendorId === 0x04D8 || (port.manufacturer && port.manufacturer.includes('Cricut'))) {
      return {
        name: 'Cricut Machine',
        driver: 'cricut',
        supported: true
      };
    }
    
    // Silhouette devices
    if (vendorId === 0x0B4D) {
      return {
        name: 'Silhouette Cutter',
        driver: 'silhouette',
        supported: true
      };
    }
    
    // Generic plotter (assume HPGL compatible)
    return {
      name: 'Plotter/Cutter',
      driver: 'hpgl',
      supported: true
    };
  }

  /**
   * Identify a USB device
   * @param {object} device - USB device
   * @returns {object} - Device identification
   */
  identifyUSBDevice(device) {
    const { vendorId, productId } = device;
    
    // Cricut USB VID/PIDs
    const cricutVendorIds = [0x04D8, 0x20A0];
    if (cricutVendorIds.includes(vendorId)) {
      return {
        name: 'Cricut Machine (USB)',
        driver: 'cricut-usb',
        supported: true
      };
    }
    
    return { supported: false };
  }

  /**
   * Connect to a device
   * @param {object} deviceInfo - Device to connect
   * @param {string} driverName - Driver to use
   * @returns {Promise<object>} - Connected device instance
   */
  async connect(deviceInfo, driverName) {
    const DriverClass = this.drivers.get(driverName);
    if (!DriverClass) {
      throw new Error(`Driver not found: ${driverName}`);
    }
    
    const driver = new DriverClass();
    await driver.connect(deviceInfo);
    
    const deviceId = `${driverName}-${Date.now()}`;
    this.devices.set(deviceId, {
      id: deviceId,
      info: deviceInfo,
      driver: driver,
      status: 'connected'
    });
    
    this.activeDevice = deviceId;
    
    driver.on('status', (status) => {
      this.emit('device-status', { deviceId, status });
    });
    
    driver.on('error', (error) => {
      this.emit('device-error', { deviceId, error });
    });
    
    driver.on('progress', (progress) => {
      this.emit('cut-progress', { deviceId, progress });
    });
    
    this.emit('device-connected', { deviceId, info: deviceInfo });
    return { deviceId, driver };
  }

  /**
   * Disconnect from a device
   * @param {string} deviceId - Device to disconnect
   */
  async disconnect(deviceId) {
    const device = this.devices.get(deviceId);
    if (device) {
      await device.driver.disconnect();
      this.devices.delete(deviceId);
      
      if (this.activeDevice === deviceId) {
        this.activeDevice = null;
      }
      
      this.emit('device-disconnected', { deviceId });
    }
  }

  /**
   * Send a cut job to the active device
   * @param {object} job - Cut job data
   * @returns {Promise<void>}
   */
  async sendCutJob(job) {
    if (!this.activeDevice) {
      throw new Error('No active device');
    }
    
    const device = this.devices.get(this.activeDevice);
    if (!device) {
      throw new Error('Active device not found');
    }
    
    this.emit('cut-started', { deviceId: this.activeDevice, job });
    
    try {
      await device.driver.cut(job);
      this.emit('cut-completed', { deviceId: this.activeDevice });
    } catch (err) {
      this.emit('cut-error', { deviceId: this.activeDevice, error: err });
      throw err;
    }
  }

  /**
   * Get active device status
   * @returns {object} - Device status
   */
  getStatus() {
    if (!this.activeDevice) {
      return { connected: false };
    }
    
    const device = this.devices.get(this.activeDevice);
    return {
      connected: true,
      deviceId: this.activeDevice,
      info: device.info,
      status: device.status
    };
  }

  /**
   * Disconnect all devices
   */
  async disconnectAll() {
    for (const [deviceId] of this.devices) {
      await this.disconnect(deviceId);
    }
  }
}

module.exports = DeviceManager;
