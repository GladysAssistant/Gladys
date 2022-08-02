const ecovacsHandler = function EcovacsHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

const { start } = require('./commands/ecovacs.start');
const { stop } = require('./commands/ecovacs.stop');
const { getStatus } = require('./commands/ecovacs.getStatus');
const { getConfiguration } = require('./config/ecovacs.getConfiguration');
const { saveConfiguration } = require('./config/ecovacs.saveConfiguration');

// COMMANDS
ecovacsHandler.prototype.start = start;
ecovacsHandler.prototype.stop = stop;
ecovacsHandler.prototype.getStatus = getStatus;

// CONFIG
ecovacsHandler.prototype.getConfiguration = getConfiguration;
ecovacsHandler.prototype.saveConfiguration = saveConfiguration;

module.exports =  ecovacsHandler;
