const fs = require('fs');
const path = require('path');

const DRIVERS_DIR = path.join(__dirname, 'drivers');

function loadDrivers() {
  const drivers = [];
  if (!fs.existsSync(DRIVERS_DIR)) return drivers;

  const files = fs.readdirSync(DRIVERS_DIR);
  files.forEach(file => {
    if (!file.endsWith('.js')) return;
    try {
      const mod = require(path.join(DRIVERS_DIR, file));
      // driver module may export instance or constructor
      const driver = (mod && mod.id) ? mod : (mod && mod.default ? mod.default : null);
      if (driver) drivers.push(driver);
    } catch (err) {
      console.warn('Failed to load driver', file, err.message);
    }
  });
  return drivers;
}

const drivers = loadDrivers();

function listDrivers() {
  return drivers.map(d => ({ id: d.id, name: d.name, supportedModels: d.supportedModels || [] }));
}

function getDriverById(id) {
  return drivers.find(d => d.id === id) || null;
}

module.exports = { listDrivers, getDriverById, drivers };
