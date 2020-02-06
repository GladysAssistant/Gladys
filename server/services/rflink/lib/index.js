const logger = require('../../../utils/logger');

// Events

const { newValue } = require('./events/rflink.newValue');
const { addDevice } = require('./events/rflink.addDevice');
const { message } = require('./events/rflink.message.js');
const { error } = require('./events/rflink.error');


// Commands

const { setValue } = require('./commands/rflink.setValue');
const { connect } = require('./commands/rflink.connect');
const { disconnect } = require('./commands/rflink.disconnect');
const { listen } = require('./commands/rflink.listen');
const { getDevices } = require('./commands/rflink.getDevices');





const RFlinkManager = function RFlinkManager(usb, gladys, serviceId) {
    this.usb = usb;
    this.gladys = gladys;
    this.scanInProgress = false;
    this.serviceId = serviceId;
    this.connected = false;
    this.device = {};


};

// Events

RFlinkManager.prototype.message = message;
RFlinkManager.prototype.newValue = newValue;
RFlinkManager.prototype.addDevice = addDevice;
RFlinkManager.prototype.error = error;


// Commands

RFlinkManager.prototype.setValue = setValue;
RFlinkManager.prototype.connect = connect;
RFlinkManager.prototype.disconnect = disconnect;
RFlinkManager.prototype.listen = listen;
RFlinkManager.prototype.getDevices = getDevices;













module.exports = RFlinkManager;