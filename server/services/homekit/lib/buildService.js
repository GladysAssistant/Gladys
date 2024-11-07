const { promisify } = require('util');
const { intToRgb, rgbToHsb, hsbToRgb, rgbToInt } = require('../../../utils/colors');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ACTIONS,
  ACTIONS_STATUS,
  EVENTS,
  DEVICE_FEATURE_UNITS,
} = require('../../../utils/constants');
const { normalize } = require('../../../utils/device');
const { fahrenheitToCelsius } = require('../../../utils/units');

const sleep = promisify(setTimeout);

/**
 * @description Create HomeKit accessory service.
 * @param {object} device - Gladys device to format as HomeKit accessory.
 * @param {object} features - Device features to associate to service.
 * @param {object} categoryMapping - Homekit mapping for the current device category.
 * @param {string} subtype - Optional subtype if multiple same service.
 * @returns {object} HomeKit service to expose.
 * @example
 * buildService(device, features, categoryMapping)
 */
function buildService(device, features, categoryMapping, subtype) {
  const { Characteristic, CharacteristicEventTypes, Perms, Service } = this.hap;

  const service = new Service[categoryMapping.service](subtype ? features[0].name : device.name, subtype);

  features.forEach((feature) => {
    switch (`${feature.category}:${feature.type}`) {
      case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`:
      case `${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`:
      case `${DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`:
      case `${DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`: {
        const characteristic = service.getCharacteristic(
          Characteristic[categoryMapping.capabilities[feature.type].characteristics[0]],
        );

        if (characteristic.props.perms.includes(Perms.PAIRED_READ)) {
          characteristic.on(CharacteristicEventTypes.GET, async (callback) => {
            const { features: updatedFeatures } = await this.gladys.device.getBySelector(device.selector);
            callback(undefined, updatedFeatures.find((feat) => feat.id === feature.id).last_value);
          });
        }

        if (characteristic.props.perms.includes(Perms.PAIRED_WRITE)) {
          characteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
            const action = {
              type: ACTIONS.DEVICE.SET_VALUE,
              status: ACTIONS_STATUS.PENDING,
              value: value ? 1 : 0,
              device: device.selector,
              device_feature: feature.selector,
            };
            this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
            callback();
          });
        }
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`: {
        const contactCharacteristic = service.getCharacteristic(Characteristic.ContactSensorState);

        contactCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          const { features: updatedFeatures } = await this.gladys.device.getBySelector(device.selector);
          callback(undefined, +!updatedFeatures.find((feat) => feat.id === feature.id).last_value);
        });
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`:
      case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE}`:
      case `${DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`: {
        const characteristic = service.getCharacteristic(
          Characteristic[categoryMapping.capabilities[feature.type].characteristics[0]],
        );

        if (characteristic.props.perms.includes(Perms.PAIRED_READ)) {
          characteristic.on(CharacteristicEventTypes.GET, async (callback) => {
            const { features: updatedFeatures } = await this.gladys.device.getBySelector(device.selector);
            callback(
              undefined,
              normalize(
                updatedFeatures.find((feat) => feat.id === feature.id).last_value,
                feature.min,
                feature.max,
                characteristic.props.minValue,
                characteristic.props.maxValue,
              ),
            );
          });
        }

        if (characteristic.props.perms.includes(Perms.PAIRED_WRITE)) {
          characteristic.on(CharacteristicEventTypes.SET, (value, callback) => {
            const action = {
              type: ACTIONS.DEVICE.SET_VALUE,
              status: ACTIONS_STATUS.PENDING,
              value: Math.round(
                normalize(
                  value,
                  characteristic.props.minValue,
                  characteristic.props.maxValue,
                  feature.min,
                  feature.max,
                ),
              ),
              device: device.selector,
              device_feature: feature.selector,
            };
            this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
            callback();
          });
        }
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`: {
        const hueCharacteristic = service.getCharacteristic(Characteristic.Hue);

        hueCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          const { features: updatedFeatures } = await this.gladys.device.getBySelector(device.selector);
          const rgb = intToRgb(updatedFeatures.find((feat) => feat.id === feature.id).last_value);
          const [h] = rgbToHsb(rgb);
          callback(undefined, h);
        });
        hueCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
          await sleep(50);
          const { features: updatedFeatures } = await this.gladys.device.getBySelector(device.selector);
          let rgb = intToRgb(updatedFeatures.find((feat) => feat.id === feature.id).last_value);
          const [, s, b] = rgbToHsb(rgb);
          rgb = hsbToRgb([value, s, b]);
          const action = {
            type: ACTIONS.DEVICE.SET_VALUE,
            status: ACTIONS_STATUS.PENDING,
            value: rgbToInt(rgb),
            device: device.selector,
            device_feature: feature.selector,
          };
          this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
          callback();
        });

        const saturationCharacteristic = service.getCharacteristic(Characteristic.Saturation);

        saturationCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          const { features: updatedFeatures } = await this.gladys.device.getBySelector(device.selector);
          const rgb = intToRgb(updatedFeatures.find((feat) => feat.id === feature.id).last_value);
          const [, s] = rgbToHsb(rgb);
          callback(undefined, s);
        });
        saturationCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
          const { features: updatedFeatures } = await this.gladys.device.getBySelector(device.selector);
          let rgb = intToRgb(updatedFeatures.find((feat) => feat.id === feature.id).last_value);
          const [h, , b] = rgbToHsb(rgb);
          rgb = hsbToRgb([h, value, b]);
          const action = {
            type: ACTIONS.DEVICE.SET_VALUE,
            status: ACTIONS_STATUS.PENDING,
            value: rgbToInt(rgb),
            device: device.selector,
            device_feature: feature.selector,
          };
          this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
          callback();
        });
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`: {
        const currentTemperatureCharacteristic = service.getCharacteristic(Characteristic.CurrentTemperature);

        currentTemperatureCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          const { features: updatedFeatures } = await this.gladys.device.getBySelector(device.selector);
          let currentTemp = updatedFeatures.find((feat) => feat.id === feature.id).last_value;

          if (feature.unit === DEVICE_FEATURE_UNITS.KELVIN) {
            currentTemp -= 273.15;
          } else if (feature.unit === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
            currentTemp = fahrenheitToCelsius(currentTemp);
          }

          callback(undefined, currentTemp);
        });
        break;
      }
      default:
        break;
    }
  });

  return service;
}

module.exports = {
  buildService,
};
