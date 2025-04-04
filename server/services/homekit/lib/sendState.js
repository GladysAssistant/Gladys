const { intToRgb, rgbToHsb } = require('../../../utils/colors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { normalize } = require('../../../utils/device');
const { fahrenheitToCelsius } = require('../../../utils/units');
const { mappings, coverStateMapping } = require('./deviceMappings');

/**
 * @description Forward new state value to HomeKit.
 * @param {object} hkAccessory - HomeKit accessories.
 * @param {object} feature - Updated Gladys feature.
 * @param {object} event - Gladys event to forward to HomeKit.
 * @example
 * sendState(accessories, event)
 */
function sendState(hkAccessory, feature, event) {
  const { Characteristic, Service } = this.hap;
  switch (`${feature.category}:${feature.type}`) {
    case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`:
    case `${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`:
    case `${DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`:
    case `${DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          event.last_value,
        );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          +!event.last_value,
        );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`:
    case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE}`:
    case `${DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
    case `${DEVICE_FEATURE_CATEGORIES.CURTAIN}:${DEVICE_FEATURE_TYPES.CURTAIN.POSITION}`:
    case `${DEVICE_FEATURE_CATEGORIES.SHUTTER}:${DEVICE_FEATURE_TYPES.SHUTTER.POSITION}`: {
      const { characteristics } = mappings[feature.category].capabilities[feature.type];
      characteristics.forEach((c) => {
        hkAccessory
          .getService(Service[mappings[feature.category].service])
          .updateCharacteristic(
            Characteristic[c],
            normalize(
              event.last_value,
              feature.min,
              feature.max,
              Characteristic[c].props.minValue,
              Characteristic[c].props.maxValue,
            ),
          );
      });
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
    case `${DEVICE_FEATURE_CATEGORIES.CURTAIN}:${DEVICE_FEATURE_TYPES.CURTAIN.STATE}`:
    case `${DEVICE_FEATURE_CATEGORIES.SHUTTER}:${DEVICE_FEATURE_TYPES.SHUTTER.STATE}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(Characteristic.PositionState, coverStateMapping[event.last_value]);
      break;
    }
    default:
      break;
  }

  delete this.notifyTimeouts[event.device_feature];
}

module.exports = {
  sendState,
};
