

const ZwaveManager = function ZwaveManager(eventManager, serviceId) {
  this.zwave = undefined;
  this.eventManager = eventManager;
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
ZwaveManager.prototype.valueChanged = valueChanged;
ZwaveManager.prototype.valueRemoved = valueRemoved;
ZwaveManager.prototype.nodeReady = nodeReady;
ZwaveManager.prototype.notification = notification;
ZwaveManager.prototype.scanComplete = scanComplete;
ZwaveManager.prototype.controllerCommand = controllerCommand;

// COMMANDS
ZwaveManager.prototype.addNode = addNode;
ZwaveManager.prototype.connect = connect;
ZwaveManager.prototype.cancelControllerCommand = cancelControllerCommand;
ZwaveManager.prototype.disconnect = disconnect;
ZwaveManager.prototype.healNetwork = healNetwork;
ZwaveManager.prototype.refreshNodeParams = refreshNodeParams;
ZwaveManager.prototype.getInfos = getInfos;
ZwaveManager.prototype.getNodes = getNodes;
ZwaveManager.prototype.getNodeNeighbors = getNodeNeighbors;
ZwaveManager.prototype.removeNode = removeNode;
ZwaveManager.prototype.setValue = setValue;

module.exports = ZwaveManager;
