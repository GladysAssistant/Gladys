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

const Zwavejs2mqttManager = function Zwavejs2mqttManager(gladys, mqtt, serviceId) {
  this.gladys = gladys;
  this.eventManager = gladys.event;
  this.serviceId = serviceId;
  this.nodes = {};

  this.mqttExist = false;
  this.mqttRunning = false;
  this.mqttConnected = false;
  this.mqtt = mqtt;
  this.mqttClient = null;

  this.zwavejs2mqttExist = false;
  this.zwavejs2mqttRunning = false;

  this.usbConfigured = false;
  this.usbConfigured = false;
  this.externalZwavejs2mqtt = true;

  this.dockerBased = true;
  this.scanInProgress = false;
};

// EVENTS
Zwavejs2mqttManager.prototype.nodeAdded = nodeAdded;
Zwavejs2mqttManager.prototype.nodeRemoved = nodeRemoved;
Zwavejs2mqttManager.prototype.valueAdded = valueAdded;
Zwavejs2mqttManager.prototype.valueUpdated = valueUpdated;
Zwavejs2mqttManager.prototype.valueRemoved = valueRemoved;
Zwavejs2mqttManager.prototype.valueNotification = valueNotification;
Zwavejs2mqttManager.prototype.metadataUpdate = metadataUpdate;
Zwavejs2mqttManager.prototype.nodeReady = nodeReady;
Zwavejs2mqttManager.prototype.notification = notification;
Zwavejs2mqttManager.prototype.scanComplete = scanComplete;
Zwavejs2mqttManager.prototype.nodeSleep = nodeSleep;
Zwavejs2mqttManager.prototype.nodeDead = nodeDead;
Zwavejs2mqttManager.prototype.nodeAlive = nodeAlive;
Zwavejs2mqttManager.prototype.nodeWakeUp = nodeWakeUp;
Zwavejs2mqttManager.prototype.nodeInterviewStarted = nodeInterviewStarted;
Zwavejs2mqttManager.prototype.nodeInterviewFailed = nodeInterviewFailed;
Zwavejs2mqttManager.prototype.nodeInterviewCompleted = nodeInterviewCompleted;
Zwavejs2mqttManager.prototype.nodeInterviewStageCompleted = nodeInterviewStageCompleted;
Zwavejs2mqttManager.prototype.statisticsUpdated = statisticsUpdated;
Zwavejs2mqttManager.prototype.handleMqttMessage = handleMqttMessage;

// COMMANDS
Zwavejs2mqttManager.prototype.connect = connect;
Zwavejs2mqttManager.prototype.disconnect = disconnect;
Zwavejs2mqttManager.prototype.getStatus = getStatus;
Zwavejs2mqttManager.prototype.getConfiguration = getConfiguration;
Zwavejs2mqttManager.prototype.getNodes = getNodes;
Zwavejs2mqttManager.prototype.addNode = addNode;
Zwavejs2mqttManager.prototype.removeNode = removeNode;
Zwavejs2mqttManager.prototype.setValue = setValue;
Zwavejs2mqttManager.prototype.updateConfiguration = updateConfiguration;
Zwavejs2mqttManager.prototype.installMqttContainer = installMqttContainer;
Zwavejs2mqttManager.prototype.installZ2mContainer = installZ2mContainer;

module.exports = Zwavejs2mqttManager;
