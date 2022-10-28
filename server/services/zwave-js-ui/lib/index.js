const { addNode } = require('./commands/addNode');
const { connect } = require('./commands/connect');
const { disconnect } = require('./commands/disconnect');
const { getStatus } = require('./commands/getStatus');
const { getNodes } = require('./commands/getNodes');
const { removeNode } = require('./commands/removeNode');
const { setValue } = require('./commands/setValue');
const { nodeAdded } = require('./events/nodeAdded');
const { nodeRemoved } = require('./events/nodeRemoved');
const { valueAdded } = require('./events/valueAdded');
const { valueUpdated } = require('./events/valueUpdated');
const { valueRemoved } = require('./events/valueRemoved');
const { nodeReady } = require('./events/nodeReady');
const { notification } = require('./events/notification');
const { scanComplete } = require('./events/scanComplete');
const { valueNotification } = require('./events/valueNotification');
const { nodeWakeUp, nodeSleep, nodeDead, nodeAlive } = require('./events/nodeState');
const {
  nodeInterviewCompleted,
  nodeInterviewFailed,
  nodeInterviewStageCompleted,
  nodeInterviewStarted,
} = require('./events/nodeInterview');
const { metadataUpdate } = require('./events/metadataUpdate');
const { statisticsUpdated } = require('./events/statisticsUpdated');
const { installMqttContainer } = require('./commands/installMqttContainer');
const { installZ2mContainer } = require('./commands/installZ2mContainer');
const { getConfiguration } = require('./commands/getConfiguration');
const { handleMqttMessage } = require('./events/handleMqttMessage');
const { updateConfiguration } = require('./commands/updateConfiguration');

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

  this.usbConfigured = false;
  this.usbConfigured = false;
  this.externalZwaveJSUI = true;

  this.dockerBased = true;
  this.scanInProgress = false;
};

// EVENTS
ZwaveJSUIManager.prototype.nodeAdded = nodeAdded;
ZwaveJSUIManager.prototype.nodeRemoved = nodeRemoved;
ZwaveJSUIManager.prototype.valueAdded = valueAdded;
ZwaveJSUIManager.prototype.valueUpdated = valueUpdated;
ZwaveJSUIManager.prototype.valueRemoved = valueRemoved;
ZwaveJSUIManager.prototype.valueNotification = valueNotification;
ZwaveJSUIManager.prototype.metadataUpdate = metadataUpdate;
ZwaveJSUIManager.prototype.nodeReady = nodeReady;
ZwaveJSUIManager.prototype.notification = notification;
ZwaveJSUIManager.prototype.scanComplete = scanComplete;
ZwaveJSUIManager.prototype.nodeSleep = nodeSleep;
ZwaveJSUIManager.prototype.nodeDead = nodeDead;
ZwaveJSUIManager.prototype.nodeAlive = nodeAlive;
ZwaveJSUIManager.prototype.nodeWakeUp = nodeWakeUp;
ZwaveJSUIManager.prototype.nodeInterviewStarted = nodeInterviewStarted;
ZwaveJSUIManager.prototype.nodeInterviewFailed = nodeInterviewFailed;
ZwaveJSUIManager.prototype.nodeInterviewCompleted = nodeInterviewCompleted;
ZwaveJSUIManager.prototype.nodeInterviewStageCompleted = nodeInterviewStageCompleted;
ZwaveJSUIManager.prototype.statisticsUpdated = statisticsUpdated;
ZwaveJSUIManager.prototype.handleMqttMessage = handleMqttMessage;

// COMMANDS
ZwaveJSUIManager.prototype.connect = connect;
ZwaveJSUIManager.prototype.disconnect = disconnect;
ZwaveJSUIManager.prototype.getStatus = getStatus;
ZwaveJSUIManager.prototype.getConfiguration = getConfiguration;
ZwaveJSUIManager.prototype.getNodes = getNodes;
ZwaveJSUIManager.prototype.addNode = addNode;
ZwaveJSUIManager.prototype.removeNode = removeNode;
ZwaveJSUIManager.prototype.setValue = setValue;
ZwaveJSUIManager.prototype.updateConfiguration = updateConfiguration;
ZwaveJSUIManager.prototype.installMqttContainer = installMqttContainer;
ZwaveJSUIManager.prototype.installZ2mContainer = installZ2mContainer;

module.exports = ZwaveJSUIManager;
