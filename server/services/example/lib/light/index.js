const turnOn = require('./light.turnOn');
const turnOff = require('./light.turnOff');
const getState = require('./light.getState');

/**
 * @description Add ability to control a light
 * @param {Object} gladys - Gladys instance.
 * @param {Object} client - Third-part client object.
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

module.exports = ExampleLightHandler;
