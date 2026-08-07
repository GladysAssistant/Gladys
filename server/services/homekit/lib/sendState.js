const { intToRgb, rgbToHsb } = require('../../../utils/colors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
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
      hkAccessory
        .getService(Service.TemperatureSensor)
        .updateCharacteristic(Characteristic.CurrentTemperature, currentTemp);
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
    case `${DEVICE_FEATURE_CATEGORIES.LOCK}:${DEVICE_FEATURE_TYPES.LOCK.BINARY}`: {
      const service = hkAccessory.getService(Service[mappings[feature.category].service]);
      const [targetStateName, currentStateName] = mappings[feature.category].capabilities[feature.type].characteristics;
      const lockState = event.last_value ? 1 : 0;

      service.updateCharacteristic(Characteristic[targetStateName], lockState);

      // On a lock with no state feature, the command is also what HomeKit reads as the current
      // position. Updating only the target would leave the Home app showing the old one.
      //
      // Whether the service carries LockCurrentState says nothing here: HomeKit requires it on
      // every LockMechanism. What matters is whether the device reports a state of its own. That
      // feature knows about motion and jamming, so a lock command must not overwrite it — a Nuki
      // reports `locking` on the command feature before the state feature says it is moving.
      const device = this.gladys.stateManager.get('deviceById', feature.device_id);
      const hasStateFeature = ((device && device.features) || []).some(
        (deviceFeature) =>
          deviceFeature.category === DEVICE_FEATURE_CATEGORIES.LOCK &&
          deviceFeature.type === DEVICE_FEATURE_TYPES.LOCK.STATE,
      );
      if (!hasStateFeature) {
        service.updateCharacteristic(Characteristic[currentStateName], lockState);
      }
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.LOCK}:${DEVICE_FEATURE_TYPES.LOCK.STATE}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          lockStateMapping[event.last_value],
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
