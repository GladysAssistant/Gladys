const light = require('./light');
const plug = require('./plug');
const cover = require('./cover');
const smokeCoAlarm = require('./smokeCoAlarm');
const airQualitySensor = require('./airQualitySensor');
const battery = require('./battery');
const {
  temperatureSensor,
  humiditySensor,
  lightSensor,
  pressureSensor,
  contactSensor,
  leakSensor,
  occupancySensor,
} = require('./sensors');

// Every Matter function the bridge knows how to expose. Each adapter claims the features it uses,
// in this order, so a feature is never exposed twice. Adding a device type is adding an adapter.
const ADAPTERS = [
  light,
  plug,
  cover,
  contactSensor,
  occupancySensor,
  leakSensor,
  smokeCoAlarm,
  temperatureSensor,
  humiditySensor,
  lightSensor,
  pressureSensor,
  airQualitySensor,
];

module.exports = {
  ADAPTERS,
  BATTERY_ADAPTER: battery,
};
