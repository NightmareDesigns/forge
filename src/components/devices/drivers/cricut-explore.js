const BaseDriver = require('../BaseDriver');

class CricutExploreDriver extends BaseDriver {
  constructor() {
    super();
    this.id = 'cricut-explore';
    this.name = 'Cricut Explore';
    this.supportedModels = ['Explore', 'Explore Air', 'Explore Air 2'];
  }

  async connect(options) {
    // placeholder: actual USB/BLE handshake would go here
    this.connected = true;
    return { ok: true, model: this.supportedModels[0] };
  }

  async disconnect() {
    this.connected = false;
    return { ok: true };
  }
}

module.exports = new CricutExploreDriver();
