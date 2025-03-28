const { init } = require('./matter.init');
const { stop } = require('./matter.stop');
const { pairDevice } = require('./matter.pairDevice');
const { getDevices } = require('./matter.getDevices');
const { setValue } = require('./matter.setValue');

/**
 * @description Matter handler.
 * @param {object} gladys - Gladys instance.
 * @param {object} MatterMain - Matter main.
 * @param {object} ProjectChipMatter - Project chip matter.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, serviceId);
 */
const MatterHandler = function MatterHandler(gladys, MatterMain, ProjectChipMatter, serviceId) {
  this.gladys = gladys;
  this.MatterMain = MatterMain;
  this.ProjectChipMatter = ProjectChipMatter;
  this.serviceId = serviceId;
  this.devices = [];
  this.nodesMap = new Map();
  this.commissioningController = null;
};

MatterHandler.prototype.init = init;
MatterHandler.prototype.stop = stop;
MatterHandler.prototype.pairDevice = pairDevice;
MatterHandler.prototype.getDevices = getDevices;
MatterHandler.prototype.setValue = setValue;

module.exports = MatterHandler;
