const { load } = require('./service.load');
const { start } = require('./service.start');
const { stop } = require('./service.stop');
const { startAll } = require('./service.startAll');
const { getAll } = require('./service.getAll');
const { getByName } = require('./service.getByName');
const { getService } = require('./service.getService');
const { getServiceById } = require('./service.getServiceById');
const { getServices } = require('./service.getServices');
const { getMessageServices } = require('./service.getMessageServices');
const { getLocalServiceByName } = require('./service.getLocalServiceByName');
const { getUsage } = require('./service.getUsage');
const { getStartupState, setStartupState } = require('./service.startupState');

const Service = function Service(servicesFromFiles, stateManager, eventManager) {
  this.servicesFromFiles = servicesFromFiles;
  this.stateManager = stateManager;
  this.eventManager = eventManager;
  // Where the start of the integrations stands (see service.startupState.js)
  this.startupState = { in_progress: false, total: 0, done: 0, current: null, waiting: [] };
};

Service.prototype.load = load;
Service.prototype.start = start;
Service.prototype.stop = stop;
Service.prototype.startAll = startAll;
Service.prototype.getService = getService;
Service.prototype.getServiceById = getServiceById;
Service.prototype.getAll = getAll;
Service.prototype.getByName = getByName;
Service.prototype.getServices = getServices;
Service.prototype.getMessageServices = getMessageServices;
Service.prototype.getLocalServiceByName = getLocalServiceByName;
Service.prototype.getUsage = getUsage;
Service.prototype.getStartupState = getStartupState;
Service.prototype.setStartupState = setStartupState;

module.exports = Service;
