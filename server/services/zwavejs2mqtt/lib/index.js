const { addNode } = require('./commands/addNode');
const { connect } = require('./commands/connect');
const { disconnect } = require('./commands/disconnect');
const { getStatus } = require('./commands/getStatus');
const { getNodeNeighbors } = require('./commands/getNodeNeighbors');
const { getNodes } = require('./commands/getNodes');
const { healNetwork } = require('./commands/healNetwork');
const { refreshValues } = require('./commands/refreshValues');
const { refreshInfo } = require('./commands/refreshInfo');
const { removeNode } = require('./commands/removeNode');
const { setValue } = require('./commands/setValue');
const { driverFailed } = require('./events/driverFailed');
const { driverReady } = require('./events/driverReady');
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

const ZwaveManager = function ZwaveManager(gladys, mqtt, serviceId) {
  this.gladys = gladys;
  this.eventManager = gladys.event;
  this.serviceId = serviceId;
  this.nodes = {};

  this.zwaveConnected = false;
  this.usbConfigured = false;

  this.mqttExist = false;
  this.mqttRunning = false;
  this.mqttConnected = false;
  this.mqttContainerRunning = false;
  this.mqtt = mqtt;
  this.mqttClient = null;

  this.zwave2mqttExist = false;
  this.zwave2mqttRunning = false;

  this.externalZwave2Mqtt = true;
  this.restartRequired = false;

  this.dockerBased = true;
  this.scanInProgress = false;
};

// EVENTS
ZwaveManager.prototype.driverReady = driverReady;
ZwaveManager.prototype.driverFailed = driverFailed;
ZwaveManager.prototype.nodeAdded = nodeAdded;
ZwaveManager.prototype.nodeRemoved = nodeRemoved;
ZwaveManager.prototype.valueAdded = valueAdded;
ZwaveManager.prototype.valueUpdated = valueUpdated;
ZwaveManager.prototype.valueRemoved = valueRemoved;
ZwaveManager.prototype.valueNotification = valueNotification;
ZwaveManager.prototype.metadataUpdate = metadataUpdate;
ZwaveManager.prototype.nodeReady = nodeReady;
ZwaveManager.prototype.notification = notification;
ZwaveManager.prototype.scanComplete = scanComplete;
ZwaveManager.prototype.nodeSleep = nodeSleep;
ZwaveManager.prototype.nodeDead = nodeDead;
ZwaveManager.prototype.nodeAlive = nodeAlive;
ZwaveManager.prototype.nodeWakeUp = nodeWakeUp;
ZwaveManager.prototype.nodeInterviewStarted = nodeInterviewStarted;
ZwaveManager.prototype.nodeInterviewFailed = nodeInterviewFailed;
ZwaveManager.prototype.nodeInterviewCompleted = nodeInterviewCompleted;
ZwaveManager.prototype.nodeInterviewStageCompleted = nodeInterviewStageCompleted;
ZwaveManager.prototype.statisticsUpdated = statisticsUpdated;
ZwaveManager.prototype.handleMqttMessage = handleMqttMessage;

// COMMANDS
ZwaveManager.prototype.connect = connect;
ZwaveManager.prototype.disconnect = disconnect;
ZwaveManager.prototype.connect = connect;
ZwaveManager.prototype.disconnect = disconnect;
ZwaveManager.prototype.healNetwork = healNetwork;
ZwaveManager.prototype.refreshInfo = refreshInfo;
ZwaveManager.prototype.refreshValues = refreshValues;
ZwaveManager.prototype.getStatus = getStatus;
ZwaveManager.prototype.getConfiguration = getConfiguration;
ZwaveManager.prototype.getNodes = getNodes;
ZwaveManager.prototype.getNodeNeighbors = getNodeNeighbors;
ZwaveManager.prototype.addNode = addNode;
ZwaveManager.prototype.removeNode = removeNode;
ZwaveManager.prototype.setValue = setValue;
ZwaveManager.prototype.getConfiguration = getConfiguration;
ZwaveManager.prototype.updateConfiguration = updateConfiguration;
ZwaveManager.prototype.installMqttContainer = installMqttContainer;
ZwaveManager.prototype.installZ2mContainer = installZ2mContainer;

module.exports = ZwaveManager;
