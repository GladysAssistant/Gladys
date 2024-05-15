const { init } = require('./init');
const { connect } = require('./connect');
const { getConfiguration } = require('./getConfiguration');
const { saveConfiguration } = require('./saveConfiguration');
const { disconnect } = require('./disconnect');
const { handleMqttMessage } = require('./handleMqttMessage');
const { getDiscoveredDevices } = require('./getDiscoveredDevices');
const { findMatchingExpose } = require('./findMatchingExpose');
const { readValue } = require('./readValue');
const { setValue } = require('./setValue');
const { status } = require('./status');
const { isEnabled } = require('./isEnabled');
const { subscribe } = require('./subscribe');
const { checkForContainerUpdates } = require('./checkForContainerUpdates');
const { installMqttContainer } = require('./installMqttContainer');
const { installZ2mContainer } = require('./installZ2mContainer');
const { configureContainer } = require('./configureContainer');
const { setup } = require('./setup');
const { getSetup } = require('./getSetup');
const { saveOrDestroyVariable } = require('./saveOrDestroyVariable');
const { setPermitJoin } = require('./setPermitJoin');
const { getPermitJoin } = require('./getPermitJoin');
const { saveZ2mBackup } = require('./saveZ2mBackup');
const { restoreZ2mBackup } = require('./restoreZ2mBackup');
const { backup } = require('./backup');
const { getManagedAdapters } = require('./getManagedAdapters');
const { JOB_TYPES } = require('../../../utils/constants');

// EVENTS
const { emitStatusEvent } = require('./events/emitStatusEvent');

/**
 * @description Add ability to connect to Zigbee2mqtt devices.
 * @param {object} gladys - Gladys instance.
 * @param {object} mqttLibrary - MQTT lib.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const zigbee2mqttManager = new Zigbee2mqttManager(gladys, mqttLibrary, serviceId);
 */
const Zigbee2mqttManager = function Zigbee2mqttManager(gladys, mqttLibrary, serviceId) {
  this.gladys = gladys;
  this.mqttLibrary = mqttLibrary;
  this.serviceId = serviceId;
  this.mqttClient = null;

  this.discoveredDevices = {};
  this.topicBinds = {};
  this.usbConfigured = false;
  this.mqttExist = false;
  this.mqttRunning = false;
  this.mqttContainerRunning = false;
  this.zigbee2mqttExist = false;
  this.zigbee2mqttRunning = false;
  this.gladysConnected = false;
  this.zigbee2mqttConnected = false;
  this.z2mPermitJoin = false;
  this.networkModeValid = false;
  this.dockerBased = false;

  this.containerRestartWaitTimeInMs = 5 * 1000;

  this.backup = gladys.job.wrapper(JOB_TYPES.SERVICE_ZIGBEE2MQTT_BACKUP, this.backup.bind(this));
  this.backupJob = {};
  this.backupScheduledJob = null;
};

Zigbee2mqttManager.prototype.init = init;
Zigbee2mqttManager.prototype.connect = connect;
Zigbee2mqttManager.prototype.getConfiguration = getConfiguration;
Zigbee2mqttManager.prototype.saveConfiguration = saveConfiguration;
Zigbee2mqttManager.prototype.disconnect = disconnect;
Zigbee2mqttManager.prototype.handleMqttMessage = handleMqttMessage;
Zigbee2mqttManager.prototype.getDiscoveredDevices = getDiscoveredDevices;
Zigbee2mqttManager.prototype.findMatchingExpose = findMatchingExpose;
Zigbee2mqttManager.prototype.readValue = readValue;
Zigbee2mqttManager.prototype.setValue = setValue;
Zigbee2mqttManager.prototype.status = status;
Zigbee2mqttManager.prototype.isEnabled = isEnabled;
Zigbee2mqttManager.prototype.subscribe = subscribe;
Zigbee2mqttManager.prototype.checkForContainerUpdates = checkForContainerUpdates;
Zigbee2mqttManager.prototype.installMqttContainer = installMqttContainer;
Zigbee2mqttManager.prototype.installZ2mContainer = installZ2mContainer;
Zigbee2mqttManager.prototype.configureContainer = configureContainer;
Zigbee2mqttManager.prototype.setup = setup;
Zigbee2mqttManager.prototype.getSetup = getSetup;
Zigbee2mqttManager.prototype.saveOrDestroyVariable = saveOrDestroyVariable;
Zigbee2mqttManager.prototype.setPermitJoin = setPermitJoin;
Zigbee2mqttManager.prototype.getPermitJoin = getPermitJoin;
Zigbee2mqttManager.prototype.saveZ2mBackup = saveZ2mBackup;
Zigbee2mqttManager.prototype.restoreZ2mBackup = restoreZ2mBackup;
Zigbee2mqttManager.prototype.backup = backup;
Zigbee2mqttManager.prototype.getManagedAdapters = getManagedAdapters;

// EVENTS
Zigbee2mqttManager.prototype.emitStatusEvent = emitStatusEvent;

module.exports = Zigbee2mqttManager;
