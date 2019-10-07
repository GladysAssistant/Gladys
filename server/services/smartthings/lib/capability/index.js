const { batteryCapability } = require('./battery');
const { colorControlCapability } = require('./colorControl');
const { illuminanceMeasurementCapability } = require('./illuminanceMeasurement');
const { motionSensorCapability } = require('./motionSensor');
const { relativeHumidityMeasurementCapability } = require('./relativeHumidityMeasurement');
const { smokeDetectorCapability } = require('./smokeDetector');
const { switchCapability } = require('./switch');
const { switchLevelCapability } = require('./switchLevel');
const { temperatureMeasurementCapability } = require('./temperatureMeasurement');
const { waterSensorCapability } = require('./waterSensor');

module.exports = {
  batteryCapability,
  colorControlCapability,
  illuminanceMeasurementCapability,
  motionSensorCapability,
  relativeHumidityMeasurementCapability,
  smokeDetectorCapability,
  switchCapability,
  switchLevelCapability,
  temperatureMeasurementCapability,
  waterSensorCapability,
};
