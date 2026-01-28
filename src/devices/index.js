/**
 * CraftForge - Device Drivers
 */

const DeviceManager = require('./DeviceManager');
const HPGLDriver = require('./HPGLDriver');
const CricutDriver = require('./CricutDriver');

// Create and configure device manager
function createDeviceManager() {
  const manager = new DeviceManager();
  
  // Register built-in drivers
  manager.registerDriver('hpgl', HPGLDriver);
  manager.registerDriver('cricut', CricutDriver);
  manager.registerDriver('cricut-usb', CricutDriver);
  
  return manager;
}

module.exports = {
  DeviceManager,
  HPGLDriver,
  CricutDriver,
  createDeviceManager
};
