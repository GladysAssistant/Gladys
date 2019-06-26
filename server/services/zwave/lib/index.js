// EVENTS
const { driverReady } = require('./events/zwave.driverReady');
const { driverFailed } = require('./events/zwave.driverFailed');
const { nodeAdded } = require('./events/zwave.nodeAdded');
const { nodeEvent } = require('./events/zwave.nodeEvent');
const { valueAdded } = require('./events/zwave.valueAdded');
const { valueChanged } = require('./events/zwave.valueChanged');
const { valueRemoved } = require('./events/zwave.valueRemoved');
const { nodeReady } = require('./events/zwave.nodeReady');
const { notification } = require('./events/zwave.notification');
const { scanComplete } = require('./events/zwave.scanComplete');
const { controllerCommand } = require('./events/zwave.controllerCommand');

// COMMANDS
const { addNode } = require('./commands/zwave.addNode');
const { connect } = require('./commands/zwave.connect');
const { disconnect } = require('./commands/zwave.disconnect');
const { healNetwork } = require('./commands/zwave.healNetwork');
const { refreshNodeParams } = require('./commands/zwave.refreshNodeParams');
const { getInfos } = require('./commands/zwave.getInfos');
const { getNodes } = require('./commands/zwave.getNodes');
const { getNodeNeighbors } = require('./commands/zwave.getNodeNeighbors');
const { removeNode } = require('./commands/zwave.removeNode');

const DEFAULT_ZWAVE_OPTIONS = {
  Logging: false,
  ConsoleOutput: false,
  SaveConfiguration: true,
  // NetworkKey: '0x49,0x43,0x1D,0xBD,0x03,0x6D,0x9D,0x8C,0x39,0x67,0x16,0x82,0xA8,0x67,0xEE,0x91',
};

const ZwaveManager = function ZwaveManager(Zwave, eventManager, serviceId) {
  this.zwave = new Zwave(DEFAULT_ZWAVE_OPTIONS);
  this.eventManager = eventManager;
  this.serviceId = serviceId;
  this.nodes = {};
  this.connected = false;
  this.scanInProgress = false;
  // setup all events listener
  this.zwave.on('driver ready', this.driverReady.bind(this));
  this.zwave.on('driver failed', this.driverFailed.bind(this));
  this.zwave.on('node added', this.nodeAdded.bind(this));
  this.zwave.on('node event', this.nodeEvent.bind(this));
  this.zwave.on('value added', this.valueAdded.bind(this));
  this.zwave.on('value changed', this.valueChanged.bind(this));
  this.zwave.on('node ready', this.nodeReady.bind(this));
  this.zwave.on('notification', this.notification.bind(this));
  this.zwave.on('scan complete', this.scanComplete.bind(this));
  this.zwave.on('controller command', this.controllerCommand.bind(this));
};

// EVENTS
ZwaveManager.prototype.driverReady = driverReady;
ZwaveManager.prototype.driverFailed = driverFailed;
ZwaveManager.prototype.nodeAdded = nodeAdded;
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
ZwaveManager.prototype.disconnect = disconnect;
ZwaveManager.prototype.healNetwork = healNetwork;
ZwaveManager.prototype.refreshNodeParams = refreshNodeParams;
ZwaveManager.prototype.getInfos = getInfos;
ZwaveManager.prototype.getNodes = getNodes;
ZwaveManager.prototype.getNodeNeighbors = getNodeNeighbors;
ZwaveManager.prototype.removeNode = removeNode;

module.exports = ZwaveManager;
