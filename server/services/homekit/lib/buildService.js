const { promisify } = require('util');
const { intToRgb, rgbToHsb, hsbToRgb, rgbToInt } = require('../../../utils/colors');
const {
  DEVICE_FEATURE_TYPES,
  ACTIONS,
  ACTIONS_STATUS,
  EVENTS,
  DEVICE_FEATURE_UNITS,
} = require('../../../utils/constants');
const { normalize } = require('./utils');
const { fahrenheitToCelsius } = require('../../../utils/units');

const sleep = promisify(setTimeout);

/**
 * @description Create HomeKit accessory service.
 * @param {Object} device - Gladys device to format as HomeKit accessory.
 * @param {Object} features - Device features to associate to service.
 * @param {Object} categoryMapping - Homekit mapping for the current device category.
 * @returns {Object} HomeKit service to expose.
 * @example
 * buildService(device, features, categoryMapping)
 */
function buildService(device, features, categoryMapping) {
  const { Characteristic, CharacteristicEventTypes, Service } = this.hap;

  const service = new Service[categoryMapping.service](device.name);

  features.forEach((feature) => {
    switch (feature.type) {
      case DEVICE_FEATURE_TYPES.LIGHT.BINARY:
      case DEVICE_FEATURE_TYPES.SWITCH.BINARY: {
        const onCharacteristic = service.getCharacteristic(Characteristic.On);

        onCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          const { features: updatedFeatures } = await this.gladys.device.getBySelector(device.selector);
          callback(undefined, updatedFeatures.find((feat) => feat.id === feature.id).last_value);
        });
        onCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
          const action = {
            type: ACTIONS.DEVICE.SET_VALUE,
            status: ACTIONS_STATUS.PENDING,
            value: value ? 1 : 0,
            device: device.selector,
            feature_category: feature.category,
            feature_type: feature.type,
          };
          this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
          callback();
        });
        break;
      }
      case DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS: {
        const brightnessCharacteristic = service.getCharacteristic(Characteristic.Brightness);

        brightnessCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          const { features: updatedFeatures } = await this.gladys.device.getBySelector(device.selector);
          callback(undefined, updatedFeatures.find((feat) => feat.id === feature.id).last_value);
        });
        brightnessCharacteristic.on(CharacteristicEventTypes.SET, (value, callback) => {
          const action = {
            type: ACTIONS.DEVICE.SET_VALUE,
            status: ACTIONS_STATUS.PENDING,
            value,
            device: device.selector,
            feature_category: feature.category,
            feature_type: feature.type,
          };
          this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
          callback();
        });
        break;
      }
      case DEVICE_FEATURE_TYPES.LIGHT.COLOR: {
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
            feature_category: feature.category,
            feature_type: feature.type,
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
            feature_category: feature.category,
            feature_type: feature.type,
          };
          this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
          callback();
        });
        break;
      }
      case DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE: {
        const temperatureCharacteristic = service.getCharacteristic(Characteristic.ColorTemperature);
        temperatureCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          const { features: updatedFeatures } = await this.gladys.device.getBySelector(device.selector);
          callback(
            undefined,
            normalize(
              updatedFeatures.find((feat) => feat.id === feature.id).last_value,
              feature.min,
              feature.max,
              140,
              500,
            ),
          );
        });
        temperatureCharacteristic.on(CharacteristicEventTypes.SET, (value, callback) => {
          const action = {
            type: ACTIONS.DEVICE.SET_VALUE,
            status: ACTIONS_STATUS.PENDING,
            value: normalize(value, 140, 500, feature.min, feature.max),
            device: device.selector,
            feature_category: feature.category,
            feature_type: feature.type,
          };
          this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
          callback();
        });
        break;
      }
      case DEVICE_FEATURE_TYPES.SENSOR.DECIMAL: {
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
