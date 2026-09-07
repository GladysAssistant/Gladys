const { curtainType } = require('./googleActions.curtain.type');
const { humiditySensorType } = require('./googleActions.humiditySensor.type');
const { lightType } = require('./googleActions.light.type');
const { shutterType } = require('./googleActions.shutter.type');
const { switchType } = require('./googleActions.switch.type');
const { temperatureSensorType } = require('./googleActions.temperatureSensor.type');

// Sensor types are declared last: when a device mixes an actionable category with a sensor
// category (a light also measuring the temperature for example), the actionable type wins.
module.exports = [curtainType, lightType, shutterType, switchType, humiditySensorType, temperatureSensorType];
