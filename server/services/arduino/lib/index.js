const { connect } = require('./connect');
const { send } = require('./send');

const ArduinoManager = function ArduinoManager(gladys, serial, eventManager, serviceId) {
  this.gladys = gladys;
  this.serial = serial;
  this.eventManager = eventManager;
  this.serviceId = serviceId;
  this.connected = false;
};

ArduinoManager.prototype.connect = connect;
ArduinoManager.prototype.send = send;

module.exports = ArduinoManager;
