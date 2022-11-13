const { intToRgb, rgbToHsb } = require('../../../utils/colors');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  EVENTS,
  DEVICE_FEATURE_UNITS,
} = require('../../../utils/constants');
const { normalize } = require('./utils');
const { fahrenheitToCelsius } = require('../../../utils/units');
const { mappings } = require('./deviceMappings');

/**
 * @description Create HomeKit accessory service.
 * @param {Object} accessories - HomeKit accessories.
 * @param {Object} event - Gladys event to forward to HomeKit.
 * @returns {undefined}
 * @example
 * notifyChange(accessories, event)
 */
function notifyChange(accessories, event) {
  if (event.type !== EVENTS.DEVICE.NEW_STATE) {
    return;
  }

  const feature = this.gladys.stateManager.get('deviceFeature', event.device_feature);
  const hkAccessory = accessories.find((accessory) => accessory.UUID === feature.device_id);
  if (!hkAccessory) {
    return;
  }

  const { Characteristic, Service } = this.hap;
  switch (`${feature.category}:${feature.type}`) {
    case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`:
    case `${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`:
    case `${DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          event.last_value,
        );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          normalize(event.last_value, feature.min, feature.max, 0, 100),
        );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`: {
      const rgb = intToRgb(event.last_value);
      const [h, s] = rgbToHsb(rgb);

      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          h,
        )
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[1]],
          s,
        );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          normalize(event.last_value, feature.min, feature.max, 140, 500),
        );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`: {
      let currentTemp = event.last_value;
      if (feature.unit === DEVICE_FEATURE_UNITS.KELVIN) {
        currentTemp -= 273.15;
      } else if (feature.unit === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
        currentTemp = fahrenheitToCelsius(currentTemp);
      }
      hkAccessory
        .getService(Service.TemperatureSensor)
        .updateCharacteristic(Characteristic.CurrentTemperature, currentTemp);
      break;
    }
    default:
      break;
  }
}

module.exports = {
  notifyChange,
};
