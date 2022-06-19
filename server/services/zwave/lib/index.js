const schedule = require('node-schedule');

const { addNode } = require('./commands/zwave.addNode');
const { connectZwaveJS, connectZwave2mqtt } = require('./commands/zwave.connect');
const { disconnectZwaveJS, disconnectZwave2mqtt } = require('./commands/zwave.disconnect');
const { getStatus } = require('./commands/zwave.getStatus');
const { getNodeNeighbors } = require('./commands/zwave.getNodeNeighbors');
const { getNodes } = require('./commands/zwave.getNodes');
const { healNetwork } = require('./commands/zwave.healNetwork');
const { refreshValues } = require('./commands/zwave.refreshValues');
const { refreshInfo } = require('./commands/zwave.refreshInfo');
const { removeNode } = require('./commands/zwave.removeNode');
const { setValue } = require('./commands/zwave.setValue');
const { driverFailed } = require('./events/zwave.driverFailed');
const { driverReady } = require('./events/zwave.driverReady');
const { nodeAdded } = require('./events/zwave.nodeAdded');
const { nodeRemoved } = require('./events/zwave.nodeRemoved');
const { valueAdded } = require('./events/zwave.valueAdded');
const { valueUpdated } = require('./events/zwave.valueUpdated');
const { valueRemoved } = require('./events/zwave.valueRemoved');
const { nodeReady } = require('./events/zwave.nodeReady');
const { notification } = require('./events/zwave.notification');
const { scanComplete } = require('./events/zwave.scanComplete');
const { valueNotification } = require('./events/zwave.valueNotification');
const { nodeWakeUp, nodeSleep, nodeDead, nodeAlive } = require('./events/zwave.nodeState');
const {
  nodeInterviewCompleted,
  nodeInterviewFailed,
  nodeInterviewStageCompleted,
  nodeInterviewStarted,
} = require('./events/zwave.nodeInterview');
const { metadataUpdate } = require('./events/zwave.metadataUpdate');
const { statisticsUpdated } = require('./events/zwave.statisticsUpdated');
const { updateDeviceConfiguration } = require('./commands/zwave.updateDeviceConfiguration');
const { installMqttContainer } = require('./commands/zwave.installMqttContainer');
const { installZ2mContainer } = require('./commands/zwave.installZ2mContainer');
const { getConfiguration } = require('./commands/zwave.getConfiguration');
const { handleMqttMessage } = require('./events/zwave.handleMqttMessage');
const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { updateConfiguration } = require('./commands/zwave.updateConfiguration');

const ZwaveManager = function ZwaveManager(gladys, ZWaveJS, mqtt, serviceId) {
  this.gladys = gladys;
  this.eventManager = gladys.event;
  this.serviceId = serviceId;
  this.ZWaveJS = ZWaveJS;
  this.nodes = {};
  this.schedule = schedule;

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

  this.zwaveMode = null;
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
ZwaveManager.prototype.connectZwaveJS = connectZwaveJS;
ZwaveManager.prototype.connectZwave2mqtt = connectZwave2mqtt;
ZwaveManager.prototype.disconnectZwaveJS = disconnectZwaveJS;
ZwaveManager.prototype.disconnectZwave2mqtt = disconnectZwave2mqtt;
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
ZwaveManager.prototype.updateDeviceConfiguration = updateDeviceConfiguration;
ZwaveManager.prototype.getConfiguration = getConfiguration;
ZwaveManager.prototype.updateConfiguration = updateConfiguration;
ZwaveManager.prototype.installMqttContainer = installMqttContainer;
ZwaveManager.prototype.installZ2mContainer = installZ2mContainer;

module.exports = ZwaveManager;
