const { addNode } = require('./commands/zwave.addNode');
const { connect } = require('./commands/zwave.connect');
const { disconnect } = require('./commands/zwave.disconnect');
const { getInfos } = require('./commands/zwave.getInfos');
const { getNodeNeighbors } = require('./commands/zwave.getNodeNeighbors');
const { getNodes } = require('./commands/zwave.getNodes');
const { healNetwork } = require('./commands/zwave.healNetwork');
const { refreshNodeParams } = require('./commands/zwave.refreshNodeParams');
const { removeNode } = require('./commands/zwave.removeNode');
const { setValue } = require('./commands/zwave.setValue');
const { driverFailed } = require('./events/zwave.driverFailed');
const { driverReady } = require('./events/zwave.driverReady');
const { nodeAdded } = require('./events/zwave.nodeAdded');
const { nodeRemoved } = require('./events/zwave.nodeRemoved');
const { nodeEvent } = require('./events/zwave.nodeEvent');
const { valueAdded } = require('./events/zwave.valueAdded');
const { valueUpdated } = require('./events/zwave.valueUpdated');
const { valueRemoved } = require('./events/zwave.valueRemoved');
const { nodeReady } = require('./events/zwave.nodeReady');
const { notification } = require('./events/zwave.notification');
const { scanComplete } = require('./events/zwave.scanComplete');
const { controllerCommand } = require('./events/zwave.controllerCommand');
const { valueNotification } = require('./events/zwave.valueNotification');

const ZwaveManager = function ZwaveManager(gladys, serviceId) {
  this.zwave = undefined;
  this.gladys = gladys;
  this.eventManager = gladys.event;
  this.serviceId = serviceId;
  this.nodes = {};
  this.connected = false;
  this.scanInProgress = false;
};

// EVENTS
ZwaveManager.prototype.driverReady = driverReady;
ZwaveManager.prototype.driverFailed = driverFailed;
ZwaveManager.prototype.nodeAdded = nodeAdded;
ZwaveManager.prototype.nodeRemoved = nodeRemoved;
ZwaveManager.prototype.nodeEvent = nodeEvent;
ZwaveManager.prototype.valueAdded = valueAdded;
ZwaveManager.prototype.valueUpdated = valueUpdated;
ZwaveManager.prototype.valueRemoved = valueRemoved;
ZwaveManager.prototype.valueNotification = valueNotification;
ZwaveManager.prototype.nodeReady = nodeReady;
ZwaveManager.prototype.notification = notification;
ZwaveManager.prototype.scanComplete = scanComplete;
ZwaveManager.prototype.controllerCommand = controllerCommand;

// COMMANDS
ZwaveManager.prototype.addNode = addNode;
ZwaveManager.prototype.connect = connect;
ZwaveManager.prototype.disconnect = disconnect;
ZwaveManager.prototype.healNetwork = healNetwork;
ZwaveManager.prototype.refreshNodeParams = refreshNodeParams;
ZwaveManager.prototype.getInfos = getInfos;
ZwaveManager.prototype.getNodes = getNodes;
ZwaveManager.prototype.getNodeNeighbors = getNodeNeighbors;
ZwaveManager.prototype.removeNode = removeNode;
ZwaveManager.prototype.setValue = setValue;

module.exports = ZwaveManager;
