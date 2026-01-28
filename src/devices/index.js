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
  // Generic Cricut driver (backwards compatibility)
  manager.registerDriver('cricut', CricutDriver);
  manager.registerDriver('cricut-usb', CricutDriver);

  // Register specific Cricut model drivers (more granular)
  try {
    const CricutExplore = require('./drivers/cricut-explore');
    const CricutMaker = require('./drivers/cricut-maker');
    const CricutJoy = require('./drivers/cricut-joy');
    const CricutExpress = require('./drivers/cricut-express');

    manager.registerDriver('cricut-explore', CricutExplore);
    manager.registerDriver('cricut-maker', CricutMaker);
    manager.registerDriver('cricut-joy', CricutJoy);
    manager.registerDriver('cricut-express', CricutExpress);
  } catch (err) {
    // If specific drivers can't be loaded, continue silently
    console.warn('Cricut specific drivers not loaded:', err.message);
  }
  
  return manager;
}

module.exports = {
  DeviceManager,
  HPGLDriver,
  CricutDriver,
  createDeviceManager
};
