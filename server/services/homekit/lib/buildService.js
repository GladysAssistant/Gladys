const { promisify } = require('util');
const { intToRgb, rgbToHsb, hsbToRgb, rgbToInt } = require('../../../utils/colors');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ACTIONS,
  ACTIONS_STATUS,
  EVENTS,
  DEVICE_FEATURE_UNITS,
  LOCK,
} = require('../../../utils/constants');
const { normalize } = require('../../../utils/device');
const { fahrenheitToCelsius } = require('../../../utils/units');
const {
  mappings,
  coverStateMapping,
  lockStateMapping,
  gasDetectedThresholds,
  aqiToAirQuality,
  clampToCharacteristic,
  toMicrogramPerCubicMeter,
} = require('./deviceMappings');

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

  const service = new Service[categoryMapping.service](
    (subtype ? features[0].name : device.name).substring(0, 64),
    subtype,
  );

  features.forEach((feature) => {
    switch (`${feature.category}:${feature.type}`) {
      case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`:
      case `${DEVICE_FEATURE_CATEGORIES.SWITCH}:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`:
      case `${DEVICE_FEATURE_CATEGORIES.SIREN}:${DEVICE_FEATURE_TYPES.SIREN.BINARY}`:
      case `${DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`:
      case `${DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`:
      case `${DEVICE_FEATURE_CATEGORIES.CO_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`:
      case `${DEVICE_FEATURE_CATEGORIES.CO2_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`: {
        const characteristic = service.getCharacteristic(
          Characteristic[categoryMapping.capabilities[feature.type].characteristics[0]],
        );

        if (characteristic.props.perms.includes(Perms.PAIRED_READ)) {
          characteristic.on(CharacteristicEventTypes.GET, async (callback) => {
            callback(undefined, this.gladys.stateManager.get('deviceFeature', feature.selector).last_value);
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
          callback(undefined, +!this.gladys.stateManager.get('deviceFeature', feature.selector).last_value);
        });
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS}`:
      case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE}`:
      case `${DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
      case `${DEVICE_FEATURE_CATEGORIES.CURTAIN}:${DEVICE_FEATURE_TYPES.CURTAIN.POSITION}`:
      case `${DEVICE_FEATURE_CATEGORIES.SHUTTER}:${DEVICE_FEATURE_TYPES.SHUTTER.POSITION}`: {
        const { characteristics } = categoryMapping.capabilities[feature.type];
        characteristics.forEach((c) => {
          const characteristic = service.getCharacteristic(Characteristic[c]);
          if (characteristic.props.perms.includes(Perms.PAIRED_READ)) {
            characteristic.on(CharacteristicEventTypes.GET, async (callback) => {
              callback(
                undefined,
                normalize(
                  this.gladys.stateManager.get('deviceFeature', feature.selector).last_value,
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
        });
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.LIGHT}:${DEVICE_FEATURE_TYPES.LIGHT.COLOR}`: {
        const hueCharacteristic = service.getCharacteristic(Characteristic.Hue);

        hueCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          const rgb = intToRgb(this.gladys.stateManager.get('deviceFeature', feature.selector).last_value);
          const [h] = rgbToHsb(rgb);
          callback(undefined, h);
        });
        hueCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
          await sleep(50);
          let rgb = intToRgb(this.gladys.stateManager.get('deviceFeature', feature.selector).last_value);
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
          const rgb = intToRgb(this.gladys.stateManager.get('deviceFeature', feature.selector).last_value);
          const [, s] = rgbToHsb(rgb);
          callback(undefined, s);
        });
        saturationCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
          let rgb = intToRgb(this.gladys.stateManager.get('deviceFeature', feature.selector).last_value);
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
          let currentTemp = this.gladys.stateManager.get('deviceFeature', feature.selector).last_value;

          if (feature.unit === DEVICE_FEATURE_UNITS.KELVIN) {
            currentTemp -= 273.15;
          } else if (feature.unit === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
            currentTemp = fahrenheitToCelsius(currentTemp);
          }

          callback(undefined, currentTemp);
        });
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
      case `${DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`: {
        const lightLevelCharacteristic = service.getCharacteristic(
          Characteristic[categoryMapping.capabilities[feature.type].characteristics[0]],
        );

        lightLevelCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          callback(
            undefined,
            clampToCharacteristic(
              this.gladys.stateManager.get('deviceFeature', feature.selector).last_value,
              lightLevelCharacteristic.props,
            ),
          );
        });
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.PM25_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
      case `${DEVICE_FEATURE_CATEGORIES.PM25_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`:
      case `${DEVICE_FEATURE_CATEGORIES.PM10_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
      case `${DEVICE_FEATURE_CATEGORIES.PM10_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`: {
        // Densities share the AirQualitySensor service with the index, so the characteristic comes
        // from the feature category and not from the category hosting the service.
        const densityCharacteristic = service.getCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
        );

        densityCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          callback(
            undefined,
            clampToCharacteristic(
              toMicrogramPerCubicMeter(
                this.gladys.stateManager.get('deviceFeature', feature.selector).last_value,
                feature.unit,
              ),
              densityCharacteristic.props,
            ),
          );
        });
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.CO_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
      case `${DEVICE_FEATURE_CATEGORIES.CO_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`:
      case `${DEVICE_FEATURE_CATEGORIES.CO2_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
      case `${DEVICE_FEATURE_CATEGORIES.CO2_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`: {
        const [levelName, detectedName] = categoryMapping.capabilities[feature.type].characteristics;
        const threshold = gasDetectedThresholds[feature.category];

        const levelCharacteristic = service.getCharacteristic(Characteristic[levelName]);
        levelCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          callback(
            undefined,
            clampToCharacteristic(
              this.gladys.stateManager.get('deviceFeature', feature.selector).last_value,
              levelCharacteristic.props,
            ),
          );
        });

        // HomeKit requires the "detected" characteristic, Gladys only exposes a concentration,
        // so the alarm is derived from a fixed threshold.
        const detectedCharacteristic = service.getCharacteristic(Characteristic[detectedName]);
        detectedCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          const concentration = this.gladys.stateManager.get('deviceFeature', feature.selector).last_value;
          callback(undefined, concentration >= threshold ? 1 : 0);
        });
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR}:${DEVICE_FEATURE_TYPES.AIRQUALITY_SENSOR.AQI}`: {
        const airQualityCharacteristic = service.getCharacteristic(
          Characteristic[categoryMapping.capabilities[feature.type].characteristics[0]],
        );

        airQualityCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          callback(
            undefined,
            aqiToAirQuality(this.gladys.stateManager.get('deviceFeature', feature.selector).last_value),
          );
        });
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.LOCK}:${DEVICE_FEATURE_TYPES.LOCK.BINARY}`: {
        const [targetStateName, currentStateName] = categoryMapping.capabilities[feature.type].characteristics;
        const hasStateFeature = features.some((f) => f.type === DEVICE_FEATURE_TYPES.LOCK.STATE);

        // Without a state feature, the command is the only source of truth for the lock position,
        // and a lock takes time to move. The commanded value is remembered so that a read landing
        // before the device reports back does not answer with the previous position. It is dropped
        // as soon as the device reports anything, so a command that failed cannot be masked for
        // long — on a lock, a stale optimistic answer is worse than a slow honest one.
        let commanded;
        let valueAtCommand;
        const readLockState = () => {
          const { last_value: lastValue } = this.gladys.stateManager.get('deviceFeature', feature.selector);
          if (commanded !== undefined && lastValue === valueAtCommand) {
            return commanded;
          }
          commanded = undefined;
          return lastValue ? 1 : 0;
        };

        const targetStateCharacteristic = service.getCharacteristic(Characteristic[targetStateName]);
        targetStateCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          callback(undefined, readLockState());
        });
        targetStateCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
          const action = {
            type: ACTIONS.DEVICE.SET_VALUE,
            status: ACTIONS_STATUS.PENDING,
            value: value ? LOCK.ACTION.LOCK : LOCK.ACTION.UNLOCK,
            device: device.selector,
            device_feature: feature.selector,
          };
          this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);

          if (!hasStateFeature) {
            commanded = value ? 1 : 0;
            valueAtCommand = this.gladys.stateManager.get('deviceFeature', feature.selector).last_value;
            service.updateCharacteristic(Characteristic[currentStateName], commanded);
          }
          callback();
        });

        if (!hasStateFeature) {
          const currentStateCharacteristic = service.getCharacteristic(Characteristic[currentStateName]);
          currentStateCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
            callback(undefined, readLockState());
          });
        }
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.LOCK}:${DEVICE_FEATURE_TYPES.LOCK.STATE}`: {
        const [currentStateName, targetStateName] = categoryMapping.capabilities[feature.type].characteristics;

        const currentStateCharacteristic = service.getCharacteristic(Characteristic[currentStateName]);
        currentStateCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          callback(
            undefined,
            lockStateMapping[this.gladys.stateManager.get('deviceFeature', feature.selector).last_value],
          );
        });

        // HomeKit always requires a target state, even on a lock Gladys can only read.
        if (!features.some((f) => f.type === DEVICE_FEATURE_TYPES.LOCK.BINARY)) {
          const targetStateCharacteristic = service.getCharacteristic(Characteristic[targetStateName]);
          // Without a command feature there is nothing to write to. Dropping the write permission
          // makes the Home app show the lock as a read-only accessory, instead of accepting a
          // lock or unlock that silently does nothing.
          targetStateCharacteristic.setProps({
            perms: targetStateCharacteristic.props.perms.filter((perm) => perm !== Perms.PAIRED_WRITE),
          });
          targetStateCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
            const state = this.gladys.stateManager.get('deviceFeature', feature.selector).last_value;
            callback(undefined, state === LOCK.STATE.LOCKED ? 1 : 0);
          });
        }
        break;
      }
      case `${DEVICE_FEATURE_CATEGORIES.CURTAIN}:${DEVICE_FEATURE_TYPES.CURTAIN.STATE}`:
      case `${DEVICE_FEATURE_CATEGORIES.SHUTTER}:${DEVICE_FEATURE_TYPES.SHUTTER.STATE}`: {
        const characteristic = service.getCharacteristic(
          Characteristic[categoryMapping.capabilities[feature.type].characteristics[0]],
        );

        characteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          callback(
            undefined,
            coverStateMapping[this.gladys.stateManager.get('deviceFeature', feature.selector).last_value],
          );
        });

        if (
          !features.find((f) =>
            [
              `${DEVICE_FEATURE_CATEGORIES.CURTAIN}:${DEVICE_FEATURE_TYPES.CURTAIN.POSITION}`,
              `${DEVICE_FEATURE_CATEGORIES.SHUTTER}:${DEVICE_FEATURE_TYPES.SHUTTER.POSITION}`,
            ].includes(`${f.category}:${f.type}`),
          )
        ) {
          const targetPosCharacteristic = service.getCharacteristic(
            Characteristic[categoryMapping.capabilities[DEVICE_FEATURE_TYPES.CURTAIN.POSITION].characteristics[1]],
          );
          targetPosCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
            const action = {
              type: ACTIONS.DEVICE.SET_VALUE,
              status: ACTIONS_STATUS.PENDING,
              value: Math.round(
                normalize(
                  value,
                  targetPosCharacteristic.props.minValue,
                  targetPosCharacteristic.props.maxValue,
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
      default:
        break;
    }
  });

  return service;
}

module.exports = {
  buildService,
};
