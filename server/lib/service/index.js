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

const Service = function Service(servicesFromFiles, stateManager) {
  this.servicesFromFiles = servicesFromFiles;
  this.stateManager = stateManager;
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

module.exports = Service;
