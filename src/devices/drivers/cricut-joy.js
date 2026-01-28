const CricutDriver = require('../CricutDriver');

class CricutJoy extends CricutDriver {
  constructor() {
    super();
    this.id = 'cricut-joy';
    this.name = 'Cricut Joy';
    this.supportedModels = ['Joy'];
  }
}

module.exports = CricutJoy;
