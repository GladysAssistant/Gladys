const { init } = require('./tessie.init');
const { connect } = require('./tessie.connect');
const { convertVehicle } = require('./tessie.convertVehicle');
const { disconnect } = require('./tessie.disconnect');
const { discoverDevices } = require('./tessie.discoverDevices');
const { getConfiguration } = require('./tessie.getConfiguration');
const { getStatus } = require('./tessie.getStatus');
const { loadDeviceDetails } = require('./tessie.loadDeviceDetails');
const { loadVehicles } = require('./tessie.loadVehicles');
const { pollRefreshingValues, refreshTessieValues } = require('./tessie.pollRefreshingValues');
const { saveConfiguration } = require('./tessie.saveConfiguration');
const { saveStatus } = require('./tessie.saveStatus');
const { setValue } = require('./tessie.setValue');
const { updateValues } = require('./tessie.updateValues');

const { STATUS, SCOPES } = require('./utils/tessie.constants');
const buildScopesConfig = require('./utils/tessie.buildScopesConfig');

const TessieHandler = function TessieHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.configuration = {
    apiKey: null,
    clientId: null,
    clientSecret: null,
    vehiclesApi: null,
    driversApi: null,
    telemetryApi: null,
    scopes: buildScopesConfig(SCOPES),
  };
  this.configured = false;
  this.connected = false;
  this.redirectUri = null;
  this.accessToken = null;
  this.refreshToken = null;
  this.expireInToken = null;
  this.stateGetAccessToken = null;
  this.status = STATUS.NOT_INITIALIZED;
  this.pollRefreshToken = undefined;
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
TessieHandler.prototype.loadDeviceDetails = loadDeviceDetails;
TessieHandler.prototype.loadVehicles = loadVehicles;
TessieHandler.prototype.pollRefreshingValues = pollRefreshingValues;
TessieHandler.prototype.refreshTessieValues = refreshTessieValues;
TessieHandler.prototype.saveConfiguration = saveConfiguration;
TessieHandler.prototype.saveStatus = saveStatus;
TessieHandler.prototype.setValue = setValue;
TessieHandler.prototype.updateValues = updateValues;

module.exports = TessieHandler;
