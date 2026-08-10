const { intToRgb, rgbToHsb } = require('../../../utils/colors');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  FAN_MODE,
  FAN_ROCK_SETTING,
  FAN_AIRFLOW_DIRECTION,
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
  LOW_BATTERY_THRESHOLD,
  buttonEventMapping,
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
    case `${DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`:
    case `${DEVICE_FEATURE_CATEGORIES.CO2_SENSOR}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          event.last_value,
        );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.BUTTON}:${DEVICE_FEATURE_TYPES.BUTTON.CLICK}`:
    case `${DEVICE_FEATURE_CATEGORIES.BUTTON}:${DEVICE_FEATURE_TYPES.BUTTON.PUSH}`: {
      const buttonEvent = buttonEventMapping[event.last_value];
      // A press HomeKit has no equivalent for is dropped rather than reported as another one.
      if (buttonEvent !== undefined) {
        // A remote carries one service per button, so getService — which returns the first match —
        // would report every press on button one. buildAccessory gives those services a subtype
        // prefixed with the category and names them after their feature, which pins the right one.
        const subtypePrefix = `${feature.category} `;
        const service =
          (hkAccessory.services || []).find(
            (candidate) =>
              typeof candidate.subtype === 'string' &&
              candidate.subtype.startsWith(subtypePrefix) &&
              candidate.displayName === feature.name,
          ) || hkAccessory.getService(Service[mappings[feature.category].service]);

        // sendEventNotification and not updateCharacteristic: the latter only notifies when the
        // value changes, so two single presses in a row — both mapping to 0 — would be reported
        // once. A button press must always be delivered.
        service
          .getCharacteristic(Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]])
          .sendEventNotification(buttonEvent);
      }
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
    case `${DEVICE_FEATURE_CATEGORIES.THERMOSTAT}:${DEVICE_FEATURE_TYPES.THERMOSTAT.MODE}`:
    case `${DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING}:${DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE}`:
    case `${DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING}:${DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY}`: {
      const service = hkAccessory.getService(Service.Thermostat);
      refreshCharacteristic(this.hap, service, Characteristic.TargetHeatingCoolingState);
      refreshCharacteristic(this.hap, service, Characteristic.CurrentHeatingCoolingState);
      refreshCharacteristic(this.hap, service, Characteristic.TargetTemperature);
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.THERMOSTAT}:${DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE}`: {
      // Read-only feature: it only tells HomeKit whether the device is currently heating, cooling
      // or idle, so nothing else has to be recomputed.
      refreshCharacteristic(
        this.hap,
        hkAccessory.getService(Service.Thermostat),
        Characteristic.CurrentHeatingCoolingState,
      );
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
    case `${DEVICE_FEATURE_CATEGORIES.BATTERY}:${DEVICE_FEATURE_TYPES.BATTERY.INTEGER}`:
    case `${DEVICE_FEATURE_CATEGORIES.BATTERY}:${DEVICE_FEATURE_TYPES.SENSOR.INTEGER}`:
    case `${DEVICE_FEATURE_CATEGORIES.BATTERY}:${DEVICE_FEATURE_TYPES.LOCK.INTEGER}`: {
      const service = hkAccessory.getService(Service[mappings[feature.category].service]);
      const [levelName] = mappings[feature.category].capabilities[feature.type].characteristics;
      const levelCharacteristic = service.getCharacteristic(Characteristic[levelName]);

      service.updateCharacteristic(
        Characteristic[levelName],
        clampToCharacteristic(event.last_value, levelCharacteristic.props),
      );

      // StatusLowBattery has to be pushed as well, or crossing the threshold would only show up
      // the next time HomeKit polls — updateCharacteristic is what notifies subscribers, the GET
      // handler is not. Only when the device has no dedicated low-battery feature though: that one
      // is authoritative, and a derived value would fight with it.
      const device = this.gladys.stateManager.get('deviceById', feature.device_id);
      const hasDedicatedLowFeature = ((device && device.features) || []).some(
        (deviceFeature) => deviceFeature.category === DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
      );
      if (!hasDedicatedLowFeature) {
        const [, lowName] = mappings[feature.category].capabilities[feature.type].characteristics;
        // Number.isFinite and not a bare comparison: `null <= 20` is true in JavaScript, so a
        // device reporting nothing would be announced as low on battery.
        service.updateCharacteristic(
          Characteristic[lowName],
          Number.isFinite(event.last_value) && event.last_value <= LOW_BATTERY_THRESHOLD ? 1 : 0,
        );
      }
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.BATTERY_LOW}:${DEVICE_FEATURE_TYPES.BATTERY_LOW.BINARY}`:
    case `${DEVICE_FEATURE_CATEGORIES.BATTERY_LOW}:${DEVICE_FEATURE_TYPES.SENSOR.BINARY}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          event.last_value ? 1 : 0,
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
    case `${DEVICE_FEATURE_CATEGORIES.FAN}:${DEVICE_FEATURE_TYPES.FAN.MODE}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          event.last_value === FAN_MODE.OFF ? 0 : 1,
        );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.FAN}:${DEVICE_FEATURE_TYPES.FAN.PERCENT}`:
    case `${DEVICE_FEATURE_CATEGORIES.FAN}:${DEVICE_FEATURE_TYPES.FAN.SPEED}`: {
      // buildService reads RotationSpeed from the percentage when the fan exposes one, since it
      // already uses the HomeKit scale. A fan reporting both would otherwise emit two events per
      // change and the raw speed, rescaled, would overwrite the percentage HomeKit is showing.
      if (feature.type === DEVICE_FEATURE_TYPES.FAN.SPEED) {
        const device = this.gladys.stateManager.get('deviceById', feature.device_id);
        const hasPercentFeature = ((device && device.features) || []).some(
          (deviceFeature) =>
            deviceFeature.category === DEVICE_FEATURE_CATEGORIES.FAN &&
            deviceFeature.type === DEVICE_FEATURE_TYPES.FAN.PERCENT,
        );
        if (hasPercentFeature) {
          break;
        }
      }

      const service = hkAccessory.getService(Service[mappings[feature.category].service]);
      const [rotationSpeedName] = mappings[feature.category].capabilities[feature.type].characteristics;
      const rotationSpeedCharacteristic = service.getCharacteristic(Characteristic[rotationSpeedName]);

      service.updateCharacteristic(
        Characteristic[rotationSpeedName],
        normalize(
          event.last_value,
          feature.min,
          feature.max,
          rotationSpeedCharacteristic.props.minValue,
          rotationSpeedCharacteristic.props.maxValue,
        ),
      );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.FAN}:${DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          event.last_value === FAN_ROCK_SETTING.OFF ? 0 : 1,
        );
      break;
    }
    case `${DEVICE_FEATURE_CATEGORIES.FAN}:${DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION}`: {
      hkAccessory
        .getService(Service[mappings[feature.category].service])
        .updateCharacteristic(
          Characteristic[mappings[feature.category].capabilities[feature.type].characteristics[0]],
          event.last_value === FAN_AIRFLOW_DIRECTION.REVERSE ? 1 : 0,
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
