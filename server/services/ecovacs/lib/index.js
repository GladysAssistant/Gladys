const ecovacsHandler = function EcovacsHandler(gladys, ecovacsDeebot, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.ecovacsLibrary = ecovacsDeebot;
  this.ecovacsClient = null;

  this.configured = false;
  this.connected = false;

  this.vacbots = new Map();
};

const { start } = require('./commands/ecovacs.start');
const { stop } = require('./commands/ecovacs.stop');
const { connect } = require('./commands/ecovacs.connect');
const { getStatus } = require('./commands/ecovacs.getStatus');
const { loadVacbots } = require('./commands/ecovacs.loadVacbots');
const { discover } = require('./device/vacbot.discover');
const { getVacbotObj } = require('./device/vacbot.getVacbotObj');
const { getDeviceStatus } = require('./device/vacbot.getStatus');
const { setValue } = require('./device/vacbot.setValue');
const { getConfiguration } = require('./config/ecovacs.getConfiguration');
const { saveConfiguration } = require('./config/ecovacs.saveConfiguration');

// COMMANDS
ecovacsHandler.prototype.start = start;
ecovacsHandler.prototype.stop = stop;
ecovacsHandler.prototype.connect = connect;
ecovacsHandler.prototype.getStatus = getStatus;
ecovacsHandler.prototype.loadVacbots = loadVacbots;

// CONFIG
ecovacsHandler.prototype.getConfiguration = getConfiguration;
ecovacsHandler.prototype.saveConfiguration = saveConfiguration;

// DEVICE
ecovacsHandler.prototype.discover = discover;
ecovacsHandler.prototype.setValue = setValue;
ecovacsHandler.prototype.getVacbotObj = getVacbotObj;
ecovacsHandler.prototype.getDeviceStatus = getDeviceStatus;

module.exports = ecovacsHandler;