const { init } = require('./tessie.init');
const { connect } = require('./tessie.connect');
const { convertVehicle } = require('./device/tessie.convertVehicle');
const { disconnect } = require('./tessie.disconnect');
const { discoverDevices } = require('./tessie.discoverDevices');
const { getConfiguration } = require('./tessie.getConfiguration');
const { getStatus } = require('./tessie.getStatus');
const { loadVehicles } = require('./tessie.loadVehicles');
const { refreshTessieValues, startPolling } = require('./tessie.pollRefreshingValues');
const { saveConfiguration } = require('./tessie.saveConfiguration');
const { saveStatus } = require('./tessie.saveStatus');
const { setValue } = require('./tessie.setValue');
const { updateValues } = require('./tessie.updateValues');
const { updateBattery } = require('./update/tessie.updateBattery');
const { updateCharge } = require('./update/tessie.updateCharge');
const { updateClimate } = require('./update/tessie.updateClimate');
const { updateCommand } = require('./update/tessie.updateCommand');
const { updateConsumption } = require('./update/tessie.updateConsumption');
const { updateDrive } = require('./update/tessie.updateDrive');
const { updateState } = require('./update/tessie.updateState');
const {
  connectWebSocket,
  handleWebSocketMessage,
  updateValuesFromWebSocket,
  getWebSocketFeatureMapping,
  parseWebSocketValue,
  shouldUpdateFeature,
  reconnectWebSocket,
  disconnectAllWebSockets,
  initWebSocketConnections,
} = require('./tessie.websocket');

const { STATUS } = require('./utils/tessie.constants');

const TessieHandler = function TessieHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.configuration = {
    apiKey: null,
    websocketEnabled: false,
  };
  this.stateVehicle = null;
  this.configured = false;
  this.connected = false;
  this.status = STATUS.NOT_INITIALIZED;
  this.pollRefreshValues = undefined;
  this.currentPollingInterval = null;
  this.vehicles = [];
  this.websocketConnections = new Map();
};

TessieHandler.prototype.init = init;
TessieHandler.prototype.connect = connect;
TessieHandler.prototype.convertVehicle = convertVehicle;
TessieHandler.prototype.disconnect = disconnect;
TessieHandler.prototype.discoverDevices = discoverDevices;
TessieHandler.prototype.getConfiguration = getConfiguration;
TessieHandler.prototype.getStatus = getStatus;
TessieHandler.prototype.loadVehicles = loadVehicles;
TessieHandler.prototype.refreshTessieValues = refreshTessieValues;
TessieHandler.prototype.startPolling = startPolling;
TessieHandler.prototype.saveConfiguration = saveConfiguration;
TessieHandler.prototype.saveStatus = saveStatus;
TessieHandler.prototype.setValue = setValue;
TessieHandler.prototype.updateValues = updateValues;
TessieHandler.prototype.updateBattery = updateBattery;
TessieHandler.prototype.updateCharge = updateCharge;
TessieHandler.prototype.updateClimate = updateClimate;
TessieHandler.prototype.updateCommand = updateCommand;
TessieHandler.prototype.updateConsumption = updateConsumption;
TessieHandler.prototype.updateDrive = updateDrive;
TessieHandler.prototype.updateState = updateState;
TessieHandler.prototype.connectWebSocket = connectWebSocket;
TessieHandler.prototype.handleWebSocketMessage = handleWebSocketMessage;
TessieHandler.prototype.updateValuesFromWebSocket = updateValuesFromWebSocket;
TessieHandler.prototype.getWebSocketFeatureMapping = getWebSocketFeatureMapping;
TessieHandler.prototype.parseWebSocketValue = parseWebSocketValue;
TessieHandler.prototype.shouldUpdateFeature = shouldUpdateFeature;
TessieHandler.prototype.reconnectWebSocket = reconnectWebSocket;
TessieHandler.prototype.disconnectAllWebSockets = disconnectAllWebSockets;
TessieHandler.prototype.initWebSocketConnections = initWebSocketConnections;

module.exports = TessieHandler;
