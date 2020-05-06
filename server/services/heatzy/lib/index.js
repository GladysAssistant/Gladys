const { connect } = require('./connect');
const { discoverDevices } = require('./discoverDevices');
const { status } = require('./status');

/**
 * @description Add ability to manage heatzy pilote.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} heatzyLibrary - Heatzy lib.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const heatzyHandler = new HeatzyHandler(gladys, library, serviceId);
 */
const HeatzyHandler = function HeatzyHandler(gladys, heatzyLibrary, serviceId) {
  this.gladys = gladys;
  this.heatzyLibrary = heatzyLibrary;
  this.serviceId = serviceId;
  this.heatzyCient = null;

  this.devices = [];
  this.configured = false;
  this.connected = false;
};

HeatzyHandler.prototype.connect = connect;
HeatzyHandler.prototype.discoverDevices = discoverDevices;
HeatzyHandler.prototype.status = status;
// HeatzyHandler.prototype.newMessage = newMessage;
// HeatzyHandler.prototype.send = send;

module.exports = HeatzyHandler;
