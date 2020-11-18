const turnOn = require('./plug.turnOn');
const turnOff = require('./plug.turnOff');
const getState = require('./plug.getState');
const setValue = require('./plug.setValue');

/**
 * @description Add ability to control a plug
 * @param {Object} gladys - Gladys instance.
 * @param {Object} client - Third-part client object.
 * @example
 * const merossPlugHandler = new MerossPlugHandler(gladys, client);
 */
const MerossPlugHandler = function MerossPlugHandler(gladys, client) {
  this.client = client;
  this.gladys = gladys;
};

MerossPlugHandler.prototype.turnOn = turnOn;
MerossPlugHandler.prototype.turnOff = turnOff;
MerossPlugHandler.prototype.getState = getState;
MerossPlugHandler.prototype.setValue = setValue;

module.exports = MerossPlugHandler;
