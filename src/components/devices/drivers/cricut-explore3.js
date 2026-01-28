const BaseDriver = require('../BaseDriver');

class CricutExplore3Driver extends BaseDriver {
  constructor() {
    super();
    this.id = 'cricut-explore-3';
    this.name = 'Cricut Explore 3';
    this.supportedModels = ['Explore 3'];
  }

  async connect(options) {
    this.connected = true;
    return { ok: true, model: this.supportedModels[0] };
  }

  async disconnect() {
    this.connected = false;
    return { ok: true };
  }
}

module.exports = new CricutExplore3Driver();
