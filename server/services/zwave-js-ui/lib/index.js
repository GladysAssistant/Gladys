const { addNode } = require('./commands/addNode');
const { connect } = require('./commands/connect');
const { disconnect } = require('./commands/disconnect');
const { getStatus } = require('./commands/getStatus');
const { getNodes } = require('./commands/getNodes');
const { removeNode } = require('./commands/removeNode');
const { setValue } = require('./commands/setValue');
const { valueAdded } = require('./events/valueAdded');
const { valueUpdated } = require('./events/valueUpdated');
const { nodeReady } = require('./events/nodeReady');
const { notification } = require('./events/notification');
const { scanComplete } = require('./events/scanComplete');
const { valueNotification } = require('./events/valueNotification');
const { installMqttContainer } = require('./commands/installMqttContainer');
const { installZwaveJSUIContainer } = require('./commands/installZwaveJSUIContainer');
const { getConfiguration } = require('./commands/getConfiguration');
const { handleMqttMessage } = require('./events/handleMqttMessage');
const { updateConfiguration } = require('./commands/updateConfiguration');
const { scanNetwork } = require('./commands/scanNetwork');

const ZwaveJSUIManager = function ZwaveJSUIManager(gladys, mqtt, serviceId) {
  this.gladys = gladys;
  this.eventManager = gladys.event;
  this.serviceId = serviceId;
  this.nodes = {};

  this.mqttExist = false;
  this.mqttRunning = false;
  this.mqttConnected = false;
  this.mqtt = mqtt;
  this.mqttClient = null;

  this.zwaveJSUIExist = false;
  this.zwaveJSUIRunning = false;
  this.zwaveJSUIConnected = false;

  this.usbConfigured = false;

  this.dockerBased = true;
  this.scanInProgress = false;
};

// EVENTS
ZwaveJSUIManager.prototype.valueAdded = valueAdded;
ZwaveJSUIManager.prototype.valueUpdated = valueUpdated;
ZwaveJSUIManager.prototype.valueNotification = valueNotification;
ZwaveJSUIManager.prototype.nodeReady = nodeReady;
ZwaveJSUIManager.prototype.notification = notification;
ZwaveJSUIManager.prototype.scanComplete = scanComplete;
ZwaveJSUIManager.prototype.handleMqttMessage = handleMqttMessage;

// COMMANDS
ZwaveJSUIManager.prototype.connect = connect;
ZwaveJSUIManager.prototype.disconnect = disconnect;
ZwaveJSUIManager.prototype.getStatus = getStatus;
ZwaveJSUIManager.prototype.getConfiguration = getConfiguration;
ZwaveJSUIManager.prototype.getNodes = getNodes;
ZwaveJSUIManager.prototype.addNode = addNode;
ZwaveJSUIManager.prototype.removeNode = removeNode;
ZwaveJSUIManager.prototype.scanNetwork = scanNetwork;
ZwaveJSUIManager.prototype.setValue = setValue;
ZwaveJSUIManager.prototype.updateConfiguration = updateConfiguration;
ZwaveJSUIManager.prototype.installMqttContainer = installMqttContainer;
ZwaveJSUIManager.prototype.installZwaveJSUIContainer = installZwaveJSUIContainer;

module.exports = ZwaveJSUIManager;
