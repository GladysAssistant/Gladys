const logger = require('../../../../utils/logger');

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');
const { addSelector } = require('../../../../utils/addSelector');
const { setDeviceFeature } = require('../../../../utils/setDeviceFeature');
const { setDeviceParam } = require('../../../../utils/setDeviceParam');

const { PARAMS } = require('../utils/bluetooth.constants');

const fillFeature = (serviceUuid, characteristic, device, tmpFeature) => {
  const externalId = `${device.external_id}:${serviceUuid}:${characteristic.uuid}`;
  const feature = { ...tmpFeature, external_id: externalId, selector: externalId };

  addSelector(feature);

  if (feature.read_only && !device.should_poll && !characteristic.notify) {
    device.should_poll = true;
    device.poll_frequency = DEVICE_POLL_FREQUENCIES.EVERY_MINUTES;
  }

  logger.trace(`Bluetooth: add new feature ${feature.name} to device ${device.name}`);
  return setDeviceFeature(device, feature);
};

const encodeParamValue = (value) => {
  let encodedValue;

  if (value) {
    encodedValue = value
      .toString('utf-8')
      .replace('\u0000', '')
      .trim();
  }

  if (encodedValue === '') {
    return undefined;
  }

  return encodedValue;
};

const INFORMATION_SERVICES = {
  // Generic access
  '1800': {
    // Device name
    '2a00': {
      read: (device, value) => {
        device.name = encodeParamValue(value) || device.name;
      },
    },
  },
  // Device information
  '180a': {
    // Manufacturer name
    '2a29': {
      read: (device, value) => {
        const encoded = encodeParamValue(value);
        if (encoded) {
          setDeviceParam(device, PARAMS.MANUFACTURER, encoded);
        }
      },
    },
    // Model
    '2a24': {
      read: (device, value) => {
        device.model = encodeParamValue(value) || device.model;
      },
    },
  },
  // org.bluetooth.service.battery_service
  '180f': {
    // org.bluetooth.characteristic.battery_level
    '2a19': {
      discover: (serviceUuid, characteristic, device) => {
        const feature = {
          name: 'Battery',
          category: DEVICE_FEATURE_CATEGORIES.BATTERY,
          type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 100,
        };

        return fillFeature(serviceUuid, characteristic, device, feature);
      },
    },
  },
  // org.bluetooth.service.health_thermometer
  '1809': {
    // org.bluetooth.characteristic.temperature
    '2a6e': {
      discover: (serviceUuid, characteristic, device) => {
        const feature = {
          name: 'Temperature',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: -100,
          max: 250,
        };

        return fillFeature(serviceUuid, characteristic, device, feature);
      },
    },
    // org.bluetooth.characteristic.temperature_celsius
    '2a1f': {
      discover: (serviceUuid, characteristic, device) => {
        const feature = {
          name: 'Temperature',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.CELSIUS,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: -100,
          max: 250,
        };

        return fillFeature(serviceUuid, characteristic, device, feature);
      },
    },
    // org.bluetooth.characteristic.temperature_fahrenheit
    '2a20': {
      discover: (serviceUuid, characteristic, device) => {
        const feature = {
          name: 'Temperature',
          category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
          type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
          unit: DEVICE_FEATURE_UNITS.FAHRENHEIT,
          read_only: true,
          keep_history: true,
          has_feedback: false,
          min: -200,
          max: 500,
        };

        return fillFeature(serviceUuid, characteristic, device, feature);
      },
    },
  },
};

const defaultDecodeValue = (feature, value) => {
  if (feature) {
    return parseInt(value, 16);
  }

  return value;
};

const decodeValue = (serviceUuid, characteristicUuid, feature, value) => {
  const serviceInfo = INFORMATION_SERVICES[serviceUuid];
  if (!serviceInfo) {
    logger.warn(`Bluetooth: unknown service ${serviceUuid}`);
    return defaultDecodeValue(feature, value);
  }

  const charInfo = serviceInfo[characteristicUuid];
  if (!charInfo) {
    logger.warn(`Bluetooth: unknown characteristic ${characteristicUuid} for ${serviceUuid}`);
    return defaultDecodeValue(feature, value);
  }

  return (INFORMATION_SERVICES[serviceUuid][characteristicUuid].decode || defaultDecodeValue)(feature, value);
};

const defaultEncodeValue = (value) => {
  if (Number.isNaN(value)) {
    return value;
  }
  return value.toString(16);
};

const encodeValue = (serviceUuid, characteristicUuid, value) => {
  const serviceInfo = INFORMATION_SERVICES[serviceUuid];

  if (!serviceInfo) {
    logger.warn(`Bluetooth: unknown service ${serviceUuid}`);
    return defaultEncodeValue(value);
  }

  const charInfo = serviceInfo[characteristicUuid];
  if (!charInfo) {
    logger.warn(`Bluetooth: unknown characteristic ${characteristicUuid} for ${serviceUuid}`);
    return defaultEncodeValue(value);
  }

  return (INFORMATION_SERVICES[serviceUuid][characteristicUuid].decode || defaultEncodeValue)(value);
};

module.exports = {
  INFORMATION_SERVICES,
  encodeParamValue,
  decodeValue,
  encodeValue,
};
