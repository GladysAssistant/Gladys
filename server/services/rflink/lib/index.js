
// Events

const { newValue } = require('./events/rflink.newValue');
const { addDevice } = require('./events/rflink.addDevice');
const { message } = require('./events/rflink.message.js');


// COMMANDS
const { setValue } = require('./commands/rflink.setValue');
const { connect } = require('./commands/rflink.connect');
const { disconnect } = require('./commands/rflink.disconnect');
const { listen } = require('./commands/rflink.listen');
const { getDevices } = require('./commands/rflink.getDevices');
const { pair } = require('./commands/rflink.milight.pair');
const { unpair } = require('./commands/rflink.milight.unpair');





const RFlinkManager = function RFlinkManager(gladys, serviceId) {
    this.gladys = gladys;
    this.scanInProgress = false;
    this.serviceId = serviceId;
    this.connected = false;
    this.ready = false;
    this.scanInProgress = false;
    this.device = {};
    this.currentMilightGateway = 'F746';
    this.milightBridges = {};


};

// Events

RFlinkManager.prototype.message = message;
RFlinkManager.prototype.newValue = newValue;
RFlinkManager.prototype.addDevice = addDevice;


// Commands

RFlinkManager.prototype.setValue = setValue;
RFlinkManager.prototype.connect = connect;
RFlinkManager.prototype.disconnect = disconnect;
RFlinkManager.prototype.listen = listen;
RFlinkManager.prototype.getDevices = getDevices;
RFlinkManager.prototype.pair = pair;
RFlinkManager.prototype.unpair = unpair;













module.exports = RFlinkManager;