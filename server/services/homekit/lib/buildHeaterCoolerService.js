const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ACTIONS,
  ACTIONS_STATUS,
  EVENTS,
  AC_MODE,
} = require('../../../utils/constants');
const {
  HOMEKIT_HEATER_COOLER_STATE,
  HOMEKIT_CURRENT_HEATER_COOLER_STATE,
  acModeToHeaterCoolerState,
  heaterCoolerStateToAcMode,
  clampToCharacteristic,
} = require('./deviceMappings');
const { toCelsius, fromCelsius, listSupportedModes } = require('./buildThermostatService');

// Values of the HomeKit Active characteristic.
const HOMEKIT_ACTIVE = {
  INACTIVE: 0,
  ACTIVE: 1,
};

// Bounds of the setpoint sliders, in Celsius. HAP defaults the heating threshold to 0..25 °C, which
// is a thermostat's range, not an air conditioner's: one heating at 28 °C would read as 25 and could
// not be set higher from the Home app. Both thresholds get the range the device declares, kept
// inside the range the Thermostat service used to offer these same devices, so nothing that could be
// set before becomes unreachable. A device declaring no range, or one that makes no sense as a
// setpoint — Matter reports -100..200 — gets that range alone.
const SETPOINT_BOUNDS = { minValue: 10, maxValue: 38 };

/**
 * @description Compute the bounds of the threshold characteristics backed by a setpoint feature.
 * @param {object} setpointFeature - Gladys setpoint feature behind the thresholds.
 * @returns {object} The minValue and maxValue props to give both thresholds, in Celsius.
 * @example
 * buildThresholdProps({ min: 16, max: 31 });
 */
function buildThresholdProps(setpointFeature) {
  const declaredMin = Number.isFinite(setpointFeature.min)
    ? toCelsius(setpointFeature.min, setpointFeature.unit)
    : SETPOINT_BOUNDS.minValue;
  const declaredMax = Number.isFinite(setpointFeature.max)
    ? toCelsius(setpointFeature.max, setpointFeature.unit)
    : SETPOINT_BOUNDS.maxValue;
  const minValue = clampToCharacteristic(declaredMin, SETPOINT_BOUNDS);
  const maxValue = clampToCharacteristic(declaredMax, SETPOINT_BOUNDS);

  return minValue < maxValue ? { minValue, maxValue } : { ...SETPOINT_BOUNDS };
}

/**
 * @description List the HomeKit heater/cooler states the device can actually be switched to, so the
 * Home app does not offer modes the device cannot honour. Off is not one of them: a HeaterCooler is
 * switched off through Active, which is the whole point of exposing an air conditioner as one.
 * @param {object} heaterCoolerFeatures - Features driving the heater/cooler state.
 * @returns {Array} HomeKit TargetHeaterCoolerState values the device supports.
 * @example
 * buildValidHeaterCoolerStates({ modeFeature, setpointFeature });
 */
function buildValidHeaterCoolerStates(heaterCoolerFeatures) {
  const { modeFeature, setpointFeature } = heaterCoolerFeatures;

  if (modeFeature) {
    const validStates = [];

    listSupportedModes(modeFeature, acModeToHeaterCoolerState).forEach((mode) => {
      const state = acModeToHeaterCoolerState[mode];
      if (state !== undefined && !validStates.includes(state)) {
        validStates.push(state);
      }
    });

    return validStates.sort((a, b) => a - b);
  }

  // Without a mode feature the device runs in the one mode its setpoint implies: an air conditioning
  // setpoint is a cooling one. With nothing but an on/off command, it does whatever it does.
  return [setpointFeature ? HOMEKIT_HEATER_COOLER_STATE.COOL : HOMEKIT_HEATER_COOLER_STATE.AUTO];
}

/**
 * @description Wire the HomeKit HeaterCooler characteristics of an air conditioner.
 * An air conditioner is exposed as a HeaterCooler rather than a Thermostat because HomeKit gives the
 * former an Active characteristic of its own: "turn on the air conditioning" is then a power command
 * that leaves the mode alone, where on a Thermostat being on means being in a mode, and the one Siri
 * picks is Auto — a device told to turn on in summer would start heating.
 * Like the Thermostat, the service is built from features of several Gladys categories at once (the
 * on/off command, the mode, the setpoint and the temperature sensor of the same device), so the whole
 * service is wired here instead of feature by feature.
 * @param {object} service - HomeKit HeaterCooler service to fill.
 * @param {object} device - Gladys device exposed as this heater/cooler.
 * @param {object} features - Device features merged into the HeaterCooler service.
 * @returns {object} The HomeKit service, with its characteristics bound.
 * @example
 * buildHeaterCoolerService.call(this, service, device, features);
 */
function buildHeaterCoolerService(service, device, features) {
  const { Characteristic, CharacteristicEventTypes } = this.hap;

  const findFeature = (category, type) => features.find((f) => f.category === category && f.type === type);

  const currentTemperatureFeature = findFeature(
    DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
    DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
  );
  const setpointFeature = findFeature(
    DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
  );
  const modeFeature = findFeature(
    DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
  );
  const powerFeature = findFeature(
    DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
    DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
  );

  const readValue = (feature) => this.gladys.stateManager.get('deviceFeature', feature.selector).last_value;
  const readCelsius = (feature) => toCelsius(readValue(feature), feature.unit);
  const emitValue = (feature, value) => {
    const action = {
      type: ACTIONS.DEVICE.SET_VALUE,
      status: ACTIONS_STATUS.PENDING,
      value,
      device: device.selector,
      device_feature: feature.selector,
    };
    this.gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
  };

  // Gladys has no "off" AC mode, the binary feature carries it. A device without that feature is
  // always considered on.
  const isOn = () => (powerFeature ? Boolean(readValue(powerFeature)) : true);

  const readTargetState = () => {
    if (modeFeature) {
      const state = acModeToHeaterCoolerState[readValue(modeFeature)];
      return state === undefined ? HOMEKIT_HEATER_COOLER_STATE.AUTO : state;
    }
    return setpointFeature ? HOMEKIT_HEATER_COOLER_STATE.COOL : HOMEKIT_HEATER_COOLER_STATE.AUTO;
  };

  const readCurrentState = () => {
    if (!isOn()) {
      return HOMEKIT_CURRENT_HEATER_COOLER_STATE.INACTIVE;
    }

    // Dry and fan are reported to HomeKit as auto, but a device in one of those modes is neither
    // heating nor cooling.
    const mode = modeFeature ? readValue(modeFeature) : undefined;
    if (mode === AC_MODE.DRYING || mode === AC_MODE.FAN) {
      return HOMEKIT_CURRENT_HEATER_COOLER_STATE.IDLE;
    }

    const targetState = readTargetState();
    if (targetState === HOMEKIT_HEATER_COOLER_STATE.HEAT) {
      return HOMEKIT_CURRENT_HEATER_COOLER_STATE.HEATING;
    }
    if (targetState === HOMEKIT_HEATER_COOLER_STATE.COOL) {
      return HOMEKIT_CURRENT_HEATER_COOLER_STATE.COOLING;
    }

    // In auto the device decides: the setpoint against the room temperature says which way it goes.
    if (currentTemperatureFeature && setpointFeature) {
      const currentTemperature = readCelsius(currentTemperatureFeature);
      const setpoint = readCelsius(setpointFeature);
      if (currentTemperature < setpoint) {
        return HOMEKIT_CURRENT_HEATER_COOLER_STATE.HEATING;
      }
      if (currentTemperature > setpoint) {
        return HOMEKIT_CURRENT_HEATER_COOLER_STATE.COOLING;
      }
      return HOMEKIT_CURRENT_HEATER_COOLER_STATE.IDLE;
    }
    // Without a room temperature to compare against, an air conditioner is assumed to be cooling.
    return HOMEKIT_CURRENT_HEATER_COOLER_STATE.COOLING;
  };

  // A mode the device never declared must not be written to it.
  const writeMode = (mode) => {
    if (mode !== undefined && listSupportedModes(modeFeature, acModeToHeaterCoolerState).includes(mode)) {
      emitValue(modeFeature, mode);
    }
  };

  // Active is the on/off command, and the reason an air conditioner is a HeaterCooler at all.
  const activeCharacteristic = service.getCharacteristic(Characteristic.Active);
  if (!powerFeature) {
    // A device with no on/off command cannot be switched off: HomeKit is told so rather than told
    // it is off until the next read says otherwise.
    activeCharacteristic.setProps({ validValues: [HOMEKIT_ACTIVE.ACTIVE] });
  }
  activeCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
    callback(undefined, isOn() ? HOMEKIT_ACTIVE.ACTIVE : HOMEKIT_ACTIVE.INACTIVE);
  });
  activeCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
    if (powerFeature) {
      emitValue(powerFeature, value === HOMEKIT_ACTIVE.ACTIVE ? 1 : 0);
    }
    callback();
  });

  const targetStateCharacteristic = service.getCharacteristic(Characteristic.TargetHeaterCoolerState);
  const validTargetStates = buildValidHeaterCoolerStates({ modeFeature, setpointFeature });
  // An integration declaring only modes HomeKit has no equivalent for would leave the list empty,
  // and HAP rejects a characteristic with no valid value at all.
  if (validTargetStates.length > 0) {
    targetStateCharacteristic.setProps({ validValues: validTargetStates });
  }
  targetStateCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
    callback(undefined, readTargetState());
  });
  targetStateCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
    // Only the mode is written: switching the device on is Active's job, and HomeKit writes both
    // when it means both. Dry and fan are reported as auto, so auto has to stay selectable even on
    // a device that has no auto mode — but writing AC_MODE.AUTO there would push a mode it never
    // declared. The device is left in whatever mode it was running in.
    if (modeFeature) {
      writeMode(heaterCoolerStateToAcMode[value]);
    }
    callback();
  });

  service.getCharacteristic(Characteristic.CurrentHeaterCoolerState).on(CharacteristicEventTypes.GET, (callback) => {
    callback(undefined, readCurrentState());
  });

  // HomeKit only ever exchanges Celsius, this characteristic is the unit shown in the Home app.
  service
    .getCharacteristic(Characteristic.TemperatureDisplayUnits)
    .on(CharacteristicEventTypes.GET, async (callback) => {
      callback(undefined, Characteristic.TemperatureDisplayUnits.CELSIUS);
    });

  // CurrentTemperature is required. Without a temperature sensor on the device, the setpoint is the
  // closest thing to the room temperature we can report; a device with neither is left with the HAP
  // default, as binding a handler there would throw on the first poll.
  const temperatureSourceFeature = currentTemperatureFeature || setpointFeature;
  if (temperatureSourceFeature) {
    const currentTemperatureCharacteristic = service.getCharacteristic(Characteristic.CurrentTemperature);
    currentTemperatureCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
      callback(
        undefined,
        clampToCharacteristic(readCelsius(temperatureSourceFeature), currentTemperatureCharacteristic.props),
      );
    });
  }

  // A HeaterCooler has no TargetTemperature: the Home app shows the heating threshold in heat mode,
  // the cooling one in cool mode and both in auto. An air conditioner has a single setpoint, so it
  // stands behind both.
  if (setpointFeature) {
    const thresholdProps = buildThresholdProps(setpointFeature);

    [Characteristic.CoolingThresholdTemperature, Characteristic.HeatingThresholdTemperature].forEach(
      (characteristicType) => {
        const characteristic = service.getCharacteristic(characteristicType);
        characteristic.setProps(thresholdProps);

        characteristic.on(CharacteristicEventTypes.GET, async (callback) => {
          callback(undefined, clampToCharacteristic(readCelsius(setpointFeature), characteristic.props));
        });
        characteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
          emitValue(setpointFeature, fromCelsius(value, setpointFeature.unit));
          callback();
        });
      },
    );
  }

  return service;
}

module.exports = {
  buildHeaterCoolerService,
  buildValidHeaterCoolerStates,
  buildThresholdProps,
  HOMEKIT_ACTIVE,
};
