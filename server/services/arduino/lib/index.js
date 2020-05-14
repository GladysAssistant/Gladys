const Bottleneck = require('bottleneck/es5');

//const { connect } = require('./connect');
const { send } = require('./send');
const { setup } = require('./setup');
const { setValue } = require('./device.setValue');

// we rate-limit the number of request per seconds to poll lights
const pollLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 200, // 200 ms
});

// we rate-limit the number of request per seconds to control lights
const setValueLimiter = new Bottleneck({
  minTime: 400, // 400 ms
});

const ArduinoManager = function ArduinoManager(gladys, serial, eventManager, serviceId) {
  this.gladys = gladys;
  this.serial = serial;
  this.eventManager = eventManager;
  this.serviceId = serviceId;
  this.connected = false;
};

//ArduinoManager.prototype.connect = connect;
ArduinoManager.prototype.send = send;
ArduinoManager.prototype.setup = setup;
ArduinoManager.prototype.setValue = setValueLimiter.wrap(setValue);

module.exports = ArduinoManager;
