const { connect } = require('./tuya.connect');
const { disconnect } = require('./tuya.disconnect');

const TuyaHandler = function TuyaHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

TuyaHandler.prototype.connect = connect;
TuyaHandler.prototype.disconnect = disconnect;

module.exports = TuyaHandler;
