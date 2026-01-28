const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, 'plugins.json');

function loadManifest() {
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
    return JSON.parse(raw).plugins || [];
  } catch (err) {
    console.error('Failed to load plugins manifest:', err);
    return [];
  }
}

function listPlugins() {
  return loadManifest();
}

function getPluginById(id) {
  return listPlugins().find(p => p.id === id);
}

function getGPUPlugins() {
  return listPlugins().filter(p => p.gpu);
}

function enablePlugin(id) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const plugin = manifest.plugins.find(p => p.id === id);
  if (plugin) {
    plugin.enabled = true;
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
    return true;
  }
  return false;
}

function disablePlugin(id) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const plugin = manifest.plugins.find(p => p.id === id);
  if (plugin) {
    plugin.enabled = false;
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
    return true;
  }
  return false;
}

function loadPluginModule(id) {
  const implPath = path.join(__dirname, 'impl', `${id}.js`);
  if (fs.existsSync(implPath)) {
    try {
      return require(implPath);
    } catch (err) {
      console.error('Failed to load plugin module', id, err);
    }
  }
  return null;
}

module.exports = {
  listPlugins,
  getPluginById,
  getGPUPlugins,
  enablePlugin,
  disablePlugin,
  loadPluginModule
};
