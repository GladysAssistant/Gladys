const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { toCelsius100ths, toHumidity100ths, luxToIlluminance, toPressure } = require('../converters');
const { sensorAdapter } = require('./helpers');

const { SENSOR } = DEVICE_FEATURE_TYPES;
const NUMERIC = [SENSOR.DECIMAL, SENSOR.INTEGER];

// Measured values are nullable in Matter: an unknown value is reported as such rather than as 0.
const UNKNOWN_MEASUREMENT = { measuredValue: null, minMeasuredValue: null, maxMeasuredValue: null };

const temperatureSensor = sensorAdapter({
  key: 'temperature',
  matches: [[DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR, NUMERIC]],
  deviceType: (matter) => matter.devices.TemperatureSensorDevice,
  initialState: () => ({ temperatureMeasurement: UNKNOWN_MEASUREMENT }),
  toState: (value, feature) => ({ temperatureMeasurement: { measuredValue: toCelsius100ths(value, feature.unit) } }),
});

const humiditySensor = sensorAdapter({
  key: 'humidity',
  matches: [[DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR, NUMERIC]],
  deviceType: (matter) => matter.devices.HumiditySensorDevice,
  initialState: () => ({ relativeHumidityMeasurement: UNKNOWN_MEASUREMENT }),
  toState: (value) => ({ relativeHumidityMeasurement: { measuredValue: toHumidity100ths(value) } }),
});

const lightSensor = sensorAdapter({
  key: 'illuminance',
  matches: [[DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR, NUMERIC]],
  deviceType: (matter) => matter.devices.LightSensorDevice,
  initialState: () => ({ illuminanceMeasurement: UNKNOWN_MEASUREMENT }),
  toState: (value) => ({ illuminanceMeasurement: { measuredValue: luxToIlluminance(value) } }),
});

const pressureSensor = sensorAdapter({
  key: 'pressure',
  matches: [[DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR, NUMERIC]],
  deviceType: (matter) => matter.devices.PressureSensorDevice,
  initialState: () => ({ pressureMeasurement: UNKNOWN_MEASUREMENT }),
  toState: (value, feature) => ({ pressureMeasurement: { measuredValue: toPressure(value, feature.unit) } }),
});

// Gladys reports 1 for a closed door, which is what the Matter BooleanState of a contact sensor
// calls true: the contact is made.
const contactSensor = sensorAdapter({
  key: 'contact',
  matches: [[DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR, [SENSOR.BINARY]]],
  deviceType: (matter) => matter.devices.ContactSensorDevice,
  initialState: () => ({ booleanState: { stateValue: true } }),
  toState: (value) => ({ booleanState: { stateValue: value === 1 } }),
});

const leakSensor = sensorAdapter({
  key: 'leak',
  matches: [[DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR, [SENSOR.BINARY]]],
  deviceType: (matter) => matter.devices.WaterLeakDetectorDevice,
  initialState: () => ({ booleanState: { stateValue: false } }),
  toState: (value) => ({ booleanState: { stateValue: value === 1 } }),
});

// Motion and presence both end up as Matter occupancy. The push flavour lan-manager creates carries
// a lasting state despite its name (1 while the device answers, 0 once it stops), so it is read the
// same way as the binary one.
const occupancySensor = sensorAdapter({
  key: 'occupancy',
  matches: [
    [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR, [SENSOR.BINARY]],
    [DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR, [SENSOR.BINARY, SENSOR.PUSH]],
  ],
  deviceType: (matter) =>
    matter.devices.OccupancySensorDevice.with(matter.behaviors.OccupancySensingServer.with('PassiveInfrared')),
  initialState: () => ({
    occupancySensing: {
      occupancy: { occupied: false },
      occupancySensorType: 0,
      occupancySensorTypeBitmap: { pir: true },
    },
  }),
  toState: (value) => ({ occupancySensing: { occupancy: { occupied: value === 1 } } }),
});

module.exports = {
  temperatureSensor,
  humiditySensor,
  lightSensor,
  pressureSensor,
  contactSensor,
  leakSensor,
  occupancySensor,
};
