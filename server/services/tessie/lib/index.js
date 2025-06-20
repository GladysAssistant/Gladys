const { init } = require('./tessie.init');
const { connect } = require('./tessie.connect');
const { convertVehicle } = require('./device/tessie.convertVehicle');
const { disconnect } = require('./tessie.disconnect');
const { discoverDevices } = require('./tessie.discoverDevices');
const { getConfiguration } = require('./tessie.getConfiguration');
const { getStatus } = require('./tessie.getStatus');
const { loadVehicles } = require('./tessie.loadVehicles');
const { pollRefreshingValues, refreshTessieValues } = require('./tessie.pollRefreshingValues');
const { saveConfiguration } = require('./tessie.saveConfiguration');
const { saveStatus } = require('./tessie.saveStatus');
const { setValue } = require('./tessie.setValue');
const { updateValues } = require('./tessie.updateValues');
const { updateBattery } = require('./update/tessie.updateBattery');
const { updateCharge } = require('./update/tessie.updateCharge');
const { updateClimate } = require('./update/tessie.updateClimate');

const { STATUS } = require('./utils/tessie.constants');

const TessieHandler = function TessieHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.configuration = {
    apiKey: null,
  };
  this.configured = false;
  this.connected = false;
  this.status = STATUS.NOT_INITIALIZED;
  this.pollRefreshValues = undefined;
  this.vehicles = [];
};

TessieHandler.prototype.init = init;
TessieHandler.prototype.connect = connect;
TessieHandler.prototype.convertVehicle = convertVehicle;
TessieHandler.prototype.disconnect = disconnect;
TessieHandler.prototype.discoverDevices = discoverDevices;
TessieHandler.prototype.getConfiguration = getConfiguration;
TessieHandler.prototype.getStatus = getStatus;
TessieHandler.prototype.loadVehicles = loadVehicles;
TessieHandler.prototype.pollRefreshingValues = pollRefreshingValues;
TessieHandler.prototype.refreshTessieValues = refreshTessieValues;
TessieHandler.prototype.saveConfiguration = saveConfiguration;
TessieHandler.prototype.saveStatus = saveStatus;
TessieHandler.prototype.setValue = setValue;
TessieHandler.prototype.updateValues = updateValues;
TessieHandler.prototype.updateBattery = updateBattery;
TessieHandler.prototype.updateCharge = updateCharge;
TessieHandler.prototype.updateClimate = updateClimate;

module.exports = TessieHandler;
