const { intToRgb, rgbToHsb } = require('../../../utils/colors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { normalize } = require('../../../utils/device');
const { fahrenheitToCelsius } = require('../../../utils/units');
const {
  mappings,
  coverStateMapping,
  gasDetectedThresholds,
  aqiToAirQuality,
  clampToCharacteristic,
  toMicrogramPerCubicMeter,
} = require('./deviceMappings');
const { toCelsius } = require('./buildThermostatService');

/**
 * @description Recompute a thermostat characteristic through the GET handler built by buildService
 * and push the result to HomeKit. A thermostat characteristic depends on several Gladys features at
 * once (power, mode, setpoints, room temperature), so it cannot be derived from the single feature
 * that changed.
 * @param {object} hap - HAP library.
 * @param {object} service - HomeKit service holding the characteristic.
 * @param {object} characteristicType - HomeKit characteristic to refresh.
 * @returns {undefined}
 * @example
 * refreshCharacteristic(hap, service, hap.Characteristic.CurrentHeatingCoolingState);
 */
function refreshCharacteristic(hap, service, characteristicType) {
  if (!service.testCharacteristic(characteristicType)) {
    return;
  }

  service.getCharacteristic(characteristicType).emit(hap.CharacteristicEventTypes.GET, (error, value) => {
    if (!error) {
      service.updateCharacteristic(characteristicType, value);
    }
  });
}

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
    case `${DEVICE_FEATURE_CATEGORIES.SIREN}:${DEVICE_FEATURE_TYPES.SIREN.BINARY}`:
    case `${DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`:
    case `${DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`:
    case `${DEVICE_FEATURE_CATEGORIES.CO_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`:
    case `${DEVICE_FEATURE_CATEGORIES.CO2_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`: {
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
      const service = hkAccessory.getService(Service[mappings[feature.category].service]);
      const { characteristics } = mappings[feature.category].capabilities[feature.type];
      characteristics.forEach((c) => {
        const characteristic = service.getCharacteristic(Characteristic[c]);
        service.updateCharacteristic(
          Characteristic[c],
          normalize(
            event.last_value,
            feature.min,
            feature.max,
            characteristic.props.minValue,
            characteristic.props.maxValue,
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
      // On a heating or cooling device the temperature sensor is merged into the Thermostat service.
      const service = hkAccessory.getService(Service.TemperatureSensor) || hkAccessory.getService(Service.Thermostat);
      // Clamped like the GET path: HAP throws on a value outside the characteristic bounds, and a
      // sensor reporting an out-of-range reading must not take the bridge down.
      service.updateCharacteristic(
        Characteristic.CurrentTemperature,
        clampToCharacteristic(currentTemp, service.getCharacteristic(Characteristic.CurrentTemperature).props),
      );
      // In AUTO, whether the device is heating or cooling depends on the room temperature.
      refreshCharacteristic(this.hap, service, Characteristic.CurrentHeatingCoolingState);
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.THERMOSTAT}:${DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE}`:
    case `${DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING}:${DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE}`: {
      const service = hkAccessory.getService(Service.Thermostat);
      const thresholdCharacteristic =
        feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT
          ? Characteristic.HeatingThresholdTemperature
          : Characteristic.CoolingThresholdTemperature;

      if (service.testCharacteristic(thresholdCharacteristic)) {
        service.updateCharacteristic(
          thresholdCharacteristic,
          clampToCharacteristic(
            toCelsius(event.last_value, feature.unit),
            service.getCharacteristic(thresholdCharacteristic).props,
          ),
        );
      }
      // Which setpoint TargetTemperature follows depends on the mode, so it is recomputed.
      refreshCharacteristic(this.hap, service, Characteristic.TargetTemperature);
      refreshCharacteristic(this.hap, service, Characteristic.CurrentHeatingCoolingState);
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING}:${DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE}`:
    case `${DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING}:${DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY}`: {
      const service = hkAccessory.getService(Service.Thermostat);
      refreshCharacteristic(this.hap, service, Characteristic.TargetHeatingCoolingState);
      refreshCharacteristic(this.hap, service, Characteristic.CurrentHeatingCoolingState);
      refreshCharacteristic(this.hap, service, Characteristic.TargetTemperature);
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
    case `${DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`: {
      const service = hkAccessory.getService(Service[mappings[feature.category].service]);
      const characteristicName = mappings[feature.category].capabilities[feature.type].characteristics[0];
      const characteristic = service.getCharacteristic(Characteristic[characteristicName]);

      service.updateCharacteristic(
        Characteristic[characteristicName],
        clampToCharacteristic(event.last_value, characteristic.props),
      );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.PM25_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
    case `${DEVICE_FEATURE_CATEGORIES.PM25_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`:
    case `${DEVICE_FEATURE_CATEGORIES.PM10_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
    case `${DEVICE_FEATURE_CATEGORIES.PM10_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`: {
      const service = hkAccessory.getService(Service[mappings[feature.category].service]);
      const characteristicName = mappings[feature.category].capabilities[feature.type].characteristics[0];
      const characteristic = service.getCharacteristic(Characteristic[characteristicName]);

      service.updateCharacteristic(
        Characteristic[characteristicName],
        clampToCharacteristic(toMicrogramPerCubicMeter(event.last_value, feature.unit), characteristic.props),
      );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.CO_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
    case `${DEVICE_FEATURE_CATEGORIES.CO_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`:
    case `${DEVICE_FEATURE_CATEGORIES.CO2_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.DECIMAL}`:
    case `${DEVICE_FEATURE_CATEGORIES.CO2_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`: {
      const service = hkAccessory.getService(Service[mappings[feature.category].service]);
      const [levelName, detectedName] = mappings[feature.category].capabilities[feature.type].characteristics;
      const levelCharacteristic = service.getCharacteristic(Characteristic[levelName]);

      service
        .updateCharacteristic(
          Characteristic[levelName],
          clampToCharacteristic(event.last_value, levelCharacteristic.props),
        )
        .updateCharacteristic(
          Characteristic[detectedName],
          event.last_value >= gasDetectedThresholds[feature.category] ? 1 : 0,
        );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR}:${DEVICE_FEATURE_TYPES.AIRQUALITY_SENSOR.AQI}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          aqiToAirQuality(event.last_value),
        );
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
