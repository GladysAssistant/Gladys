const turnOn = require('./light.turnOn');
const turnOff = require('./light.turnOff');
const getState = require('./light.getState');
const setValue = require('./light.setValue');

/**
 * @description Add ability to control a light.
 * @param {object} gladys - Gladys instance.
 * @param {object} client - Third-part client object.
 * @example
 * const exampleLightHandler = new ExampleLightHandler(gladys, client);
 */
const ExampleLightHandler = function ExampleLightHandler(gladys, client) {
  this.client = client;
  this.gladys = gladys;
};

ExampleLightHandler.prototype.turnOn = turnOn;
ExampleLightHandler.prototype.turnOff = turnOff;
ExampleLightHandler.prototype.getState = getState;
ExampleLightHandler.prototype.setValue = setValue;

module.exports = ExampleLightHandler;
