const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

const { getBatteryPercent } = require('../utils/getBatteryPercent');

const MIN_VOLT = 2800;
const MAX_VOLT = 3300;

/**
 * @description New value received temperature sensor.
 * @param {object} message - Message received.
 * @param {object} data - Data received.
 * @example
 * newValueTemperatureSensor(message, data);
 */
function newValueTemperatureSensor(message, data) {
  const { sid } = message;
  logger.debug(`Xiaomi : New value temperature sensor, sid = ${sid}`);

  const newSensor = {
    service_id: this.serviceId,
    name: 'Xiaomi Temperature Sensor',
    selector: `xiaomi:${sid}`,
    external_id: `xiaomi:${sid}`,
    model: 'xiaomi-temperature',
    should_poll: false,
    features: [
      {
        name: 'Temperature',
        selector: `xiaomi:${sid}:temperature`,
        external_id: `xiaomi:${sid}:temperature`,
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: -20,
        max: 60,
      },
      {
        name: 'Humidity',
        selector: `xiaomi:${sid}:humidity`,
        external_id: `xiaomi:${sid}:humidity`,
        category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100,
      },
      {
        name: 'Battery',
        selector: `xiaomi:${sid}:battery`,
        external_id: `xiaomi:${sid}:battery`,
        category: DEVICE_FEATURE_CATEGORIES.BATTERY,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        read_only: true,
        keep_history: true,
        has_feedback: true,
        min: 0,
        max: 100,
      },
    ],
  };

  if (message.model === 'weather.v1') {
    newSensor.features.push({
      name: 'Pressure',
      selector: `xiaomi:${sid}:pressure`,
      external_id: `xiaomi:${sid}:pressure`,
      category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      unit: DEVICE_FEATURE_UNITS.PASCAL,
      read_only: true,
      keep_history: true,
      has_feedback: true,
      min: 3000,
      max: 11000,
    });
  }

  this.addDevice(sid, newSensor);

  // emit battery event
  if (data.voltage) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:battery`,
      state: getBatteryPercent(data.voltage, MIN_VOLT, MAX_VOLT),
    });
  }

  // emit temperature event
  if (data.temperature) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:temperature`,
      state: Math.round(data.temperature / 10) / 10,
    });
  }

  // emit humidity event
  if (data.humidity) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:humidity`,
      state: Math.round(data.humidity / 100),
    });
  }

  // emit pressure event
  if (data.pressure) {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `xiaomi:${sid}:pressure`,
      state: Math.round(data.pressure / 10),
    });
  }
}

module.exports = {
  newValueTemperatureSensor,
};
