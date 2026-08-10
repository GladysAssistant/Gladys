const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  ACTIONS,
  ACTIONS_STATUS,
  EVENTS,
  DEVICE_FEATURE_UNITS,
  THERMOSTAT_MODE,
} = require('../../../utils/constants');
const { celsiusToFahrenheit, fahrenheitToCelsius } = require('../../../utils/units');
const {
  HOMEKIT_HEATING_COOLING_STATE,
  acModeToHeatingCoolingState,
  heatingCoolingStateToAcMode,
  thermostatModeToHeatingCoolingState,
  heatingCoolingStateToThermostatMode,
  thermostatOperatingStateToHeatingCoolingState,
} = require('./deviceMappings');

const KELVIN_OFFSET = 273.15;

/**
 * @description Convert a Gladys temperature to Celsius, the only unit HomeKit accepts.
 * @param {number} value - Temperature in the feature unit.
 * @param {string} unit - Gladys unit of the feature.
 * @returns {number} Temperature in Celsius.
 * @example
 * toCelsius(68, DEVICE_FEATURE_UNITS.FAHRENHEIT);
 */
function toCelsius(value, unit) {
  if (unit === DEVICE_FEATURE_UNITS.KELVIN) {
    return value - KELVIN_OFFSET;
  }
  if (unit === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
    return fahrenheitToCelsius(value);
  }
  return value;
}

/**
 * @description Convert a Celsius temperature coming from HomeKit back to the feature unit.
 * @param {number} celsius - Temperature in Celsius.
 * @param {string} unit - Gladys unit of the feature.
 * @returns {number} Temperature in the feature unit.
 * @example
 * fromCelsius(20, DEVICE_FEATURE_UNITS.FAHRENHEIT);
 */
function fromCelsius(celsius, unit) {
  if (unit === DEVICE_FEATURE_UNITS.KELVIN) {
    return celsius + KELVIN_OFFSET;
  }
  if (unit === DEVICE_FEATURE_UNITS.FAHRENHEIT) {
    return celsiusToFahrenheit(celsius);
  }
  return celsius;
}

/**
 * @description Keep a temperature inside the bounds of a HomeKit characteristic.
 * @param {number} value - Temperature in Celsius.
 * @param {object} props - Props of the HomeKit characteristic receiving the value.
 * @returns {number} Temperature clamped between the characteristic bounds.
 * @example
 * clampToCharacteristic(45, { minValue: 10, maxValue: 38 });
 */
function clampToCharacteristic(value, props = {}) {
  const minValue = props.minValue === undefined ? -Infinity : props.minValue;
  const maxValue = props.maxValue === undefined ? Infinity : props.maxValue;
  return Math.min(maxValue, Math.max(minValue, value));
}

/**
 * @description List the Gladys modes a device declares, in the enum of its mode feature.
 * @param {object} modeFeature - Gladys mode feature of the device.
 * @param {object} modeToHeatingCoolingState - Table mapping that enum to the HomeKit states.
 * @returns {Array} Gladys mode values the device supports.
 * @example
 * listSupportedModes({ supported_options: [{ value: 1 }, { value: 3 }] }, acModeToHeatingCoolingState);
 */
function listSupportedModes(modeFeature, modeToHeatingCoolingState) {
  // supported_options lists the modes the device actually declares, and they are not contiguous:
  // a Matter cooling-only air conditioner reports cool, dry and fan — 1, 3 and 4 — so walking
  // min..max would offer HomeKit a heat mode the device cannot honour, and SET would write it.
  // min/max are only a fallback for integrations that declare no options.
  if (modeFeature.supported_options) {
    return modeFeature.supported_options.map(({ value }) => value);
  }
  return Object.keys(modeToHeatingCoolingState)
    .map(Number)
    .filter((mode) => mode >= modeFeature.min && mode <= modeFeature.max);
}

/**
 * @description List the HomeKit heating/cooling states the device can actually be switched to, so
 * the Home app does not offer modes the device cannot honour.
 * @param {object} thermostatFeatures - Features driving the thermostat state.
 * @returns {Array} HomeKit TargetHeatingCoolingState values the device supports.
 * @example
 * buildValidTargetStates({ powerFeature, modeFeature, thermostatModeFeature, heatingSetpointFeature });
 */
function buildValidTargetStates(thermostatFeatures) {
  const {
    powerFeature,
    modeFeature,
    thermostatModeFeature,
    heatingSetpointFeature,
    coolingSetpointFeature,
  } = thermostatFeatures;
  const validStates = [];

  if (powerFeature) {
    validStates.push(HOMEKIT_HEATING_COOLING_STATE.OFF);
  }

  const addStatesOf = (feature, modeToHeatingCoolingState) => {
    listSupportedModes(feature, modeToHeatingCoolingState).forEach((mode) => {
      const state = modeToHeatingCoolingState[mode];
      if (state !== undefined && !validStates.includes(state)) {
        validStates.push(state);
      }
    });
  };

  if (modeFeature) {
    addStatesOf(modeFeature, acModeToHeatingCoolingState);
  }
  if (thermostatModeFeature) {
    addStatesOf(thermostatModeFeature, thermostatModeToHeatingCoolingState);
  }

  // Without a mode feature of either kind, the states are deduced from the setpoints the device
  // exposes.
  if (!modeFeature && !thermostatModeFeature) {
    if (heatingSetpointFeature && !coolingSetpointFeature) {
      validStates.push(HOMEKIT_HEATING_COOLING_STATE.HEAT);
    } else if (coolingSetpointFeature && !heatingSetpointFeature) {
      validStates.push(HOMEKIT_HEATING_COOLING_STATE.COOL);
    } else {
      validStates.push(HOMEKIT_HEATING_COOLING_STATE.AUTO);
    }
  }

  return validStates.sort((a, b) => a - b);
}

/**
 * @description Bind one of the two threshold temperatures to its Gladys setpoint feature.
 * @param {object} service - HomeKit Thermostat service to fill.
 * @param {object} characteristicType - Heating or cooling threshold characteristic.
 * @param {object} feature - Gladys setpoint feature backing the threshold.
 * @param {object} helpers - Read and emit helpers bound to the current device.
 * @returns {undefined}
 * @example
 * bindThresholdCharacteristic.call(this, service, Characteristic.HeatingThresholdTemperature, feature, helpers);
 */
function bindThresholdCharacteristic(service, characteristicType, feature, helpers) {
  const { CharacteristicEventTypes } = this.hap;
  const characteristic = service.getCharacteristic(characteristicType);

  characteristic.on(CharacteristicEventTypes.GET, async (callback) => {
    callback(undefined, clampToCharacteristic(helpers.readCelsius(feature), characteristic.props));
  });
  characteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
    helpers.emitValue(feature, fromCelsius(value, feature.unit));
    callback();
  });
}

/**
 * @description Wire the HomeKit Thermostat characteristics of a device.
 * Unlike the other categories, a thermostat is built from features of several Gladys categories at
 * once (the setpoints, the mode, the on/off command and the temperature sensor of the same device),
 * so the whole service is wired here instead of feature by feature.
 * @param {object} service - HomeKit Thermostat service to fill.
 * @param {object} device - Gladys device exposed as this thermostat.
 * @param {object} features - Device features merged into the thermostat service.
 * @returns {object} The HomeKit service, with its characteristics bound.
 * @example
 * buildThermostatService.call(this, service, device, features);
 */
function buildThermostatService(service, device, features) {
  const { Characteristic, CharacteristicEventTypes } = this.hap;

  const findFeature = (category, type) => features.find((f) => f.category === category && f.type === type);

  const currentTemperatureFeature = findFeature(
    DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
    DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
  );
  const heatingSetpointFeature = findFeature(
    DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
  );
  const coolingSetpointFeature = findFeature(
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
  const thermostatModeFeature = findFeature(DEVICE_FEATURE_CATEGORIES.THERMOSTAT, DEVICE_FEATURE_TYPES.THERMOSTAT.MODE);
  const operatingStateFeature = findFeature(
    DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE,
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

  const readTargetHeatingCoolingState = () => {
    if (!isOn()) {
      return HOMEKIT_HEATING_COOLING_STATE.OFF;
    }
    if (modeFeature) {
      const state = acModeToHeatingCoolingState[readValue(modeFeature)];
      return state === undefined ? HOMEKIT_HEATING_COOLING_STATE.AUTO : state;
    }
    // The thermostat mode has an off value of its own, so it can report OFF without the device
    // carrying an on/off command.
    if (thermostatModeFeature) {
      const state = thermostatModeToHeatingCoolingState[readValue(thermostatModeFeature)];
      return state === undefined ? HOMEKIT_HEATING_COOLING_STATE.AUTO : state;
    }
    if (heatingSetpointFeature && !coolingSetpointFeature) {
      return HOMEKIT_HEATING_COOLING_STATE.HEAT;
    }
    if (coolingSetpointFeature && !heatingSetpointFeature) {
      return HOMEKIT_HEATING_COOLING_STATE.COOL;
    }
    return HOMEKIT_HEATING_COOLING_STATE.AUTO;
  };

  // In AUTO (and in the DRY/FAN modes reported as AUTO), HomeKit still wants to know whether the
  // device is currently heating or cooling: it is deduced from the setpoint and the room temperature.
  const readCurrentHeatingCoolingState = () => {
    const targetState = readTargetHeatingCoolingState();
    if (targetState === HOMEKIT_HEATING_COOLING_STATE.OFF) {
      return HOMEKIT_HEATING_COOLING_STATE.OFF;
    }

    // A device reporting its operating state is telling us what it is doing, which beats any
    // deduction: a thermostat set to heat but sitting at its setpoint is idle, not heating.
    if (operatingStateFeature) {
      const state = thermostatOperatingStateToHeatingCoolingState[readValue(operatingStateFeature)];
      if (state !== undefined) {
        return state;
      }
    }

    if (targetState !== HOMEKIT_HEATING_COOLING_STATE.AUTO) {
      return targetState;
    }

    // A device driven as a range sits idle between its two setpoints. Comparing against the heating
    // one alone would report a room at 21 °C, between a 20 °C heating and a 25 °C cooling setpoint,
    // as cooling — the Home app would show it working when it is doing nothing.
    if (currentTemperatureFeature && heatingSetpointFeature && coolingSetpointFeature) {
      const currentTemperature = readCelsius(currentTemperatureFeature);
      if (currentTemperature < readCelsius(heatingSetpointFeature)) {
        return HOMEKIT_HEATING_COOLING_STATE.HEAT;
      }
      if (currentTemperature > readCelsius(coolingSetpointFeature)) {
        return HOMEKIT_HEATING_COOLING_STATE.COOL;
      }
      return HOMEKIT_HEATING_COOLING_STATE.OFF;
    }

    const setpointFeature = heatingSetpointFeature || coolingSetpointFeature;
    if (currentTemperatureFeature && setpointFeature) {
      return readCelsius(setpointFeature) > readCelsius(currentTemperatureFeature)
        ? HOMEKIT_HEATING_COOLING_STATE.HEAT
        : HOMEKIT_HEATING_COOLING_STATE.COOL;
    }
    return coolingSetpointFeature && !heatingSetpointFeature
      ? HOMEKIT_HEATING_COOLING_STATE.COOL
      : HOMEKIT_HEATING_COOLING_STATE.HEAT;
  };

  // The setpoint TargetTemperature reads and writes. With both setpoints, the active one follows the
  // mode the device is running in.
  const activeSetpointFeature = () => {
    if (!heatingSetpointFeature) {
      return coolingSetpointFeature;
    }
    if (!coolingSetpointFeature) {
      return heatingSetpointFeature;
    }
    return readTargetHeatingCoolingState() === HOMEKIT_HEATING_COOLING_STATE.COOL
      ? coolingSetpointFeature
      : heatingSetpointFeature;
  };

  // HomeKit only ever exchanges Celsius, this characteristic is the unit shown in the Home app.
  service
    .getCharacteristic(Characteristic.TemperatureDisplayUnits)
    .on(CharacteristicEventTypes.GET, async (callback) => {
      callback(undefined, Characteristic.TemperatureDisplayUnits.CELSIUS);
    });

  // CurrentTemperature is required. Without a temperature sensor on the device, the setpoint is the
  // closest thing to the room temperature we can report.
  const temperatureSourceFeature = currentTemperatureFeature || heatingSetpointFeature || coolingSetpointFeature;
  if (temperatureSourceFeature) {
    const currentTemperatureCharacteristic = service.getCharacteristic(Characteristic.CurrentTemperature);
    currentTemperatureCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
      callback(
        undefined,
        clampToCharacteristic(readCelsius(temperatureSourceFeature), currentTemperatureCharacteristic.props),
      );
    });
  }

  // A mode the device never declared must not be written to it, whichever enum it is expressed in.
  const writeMode = (feature, mode, modeToHeatingCoolingState) => {
    if (mode !== undefined && listSupportedModes(feature, modeToHeatingCoolingState).includes(mode)) {
      emitValue(feature, mode);
    }
  };

  const targetStateCharacteristic = service.getCharacteristic(Characteristic.TargetHeatingCoolingState);
  const validTargetStates = buildValidTargetStates({
    powerFeature,
    modeFeature,
    thermostatModeFeature,
    heatingSetpointFeature,
    coolingSetpointFeature,
  });
  // An integration declaring only modes HomeKit has no equivalent for would leave the list empty,
  // and HAP rejects a characteristic with no valid value at all.
  if (validTargetStates.length > 0) {
    targetStateCharacteristic.setProps({ validValues: validTargetStates });
  }
  targetStateCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
    callback(undefined, readTargetHeatingCoolingState());
  });
  targetStateCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
    if (value === HOMEKIT_HEATING_COOLING_STATE.OFF) {
      if (powerFeature) {
        emitValue(powerFeature, 0);
      }
      // A thermostat driven by its mode is switched off through that mode: it has no on/off command.
      if (thermostatModeFeature) {
        writeMode(thermostatModeFeature, THERMOSTAT_MODE.OFF, thermostatModeToHeatingCoolingState);
      }
      callback();
      return;
    }

    if (powerFeature) {
      emitValue(powerFeature, 1);
    }
    if (modeFeature) {
      // Dry and fan are reported to HomeKit as Auto, so Auto has to stay selectable even on a
      // device that has no auto mode — but writing AC_MODE.AUTO there would push a mode it never
      // declared. The device is left in whatever mode it was running in; powering it on is enough.
      writeMode(modeFeature, heatingCoolingStateToAcMode[value], acModeToHeatingCoolingState);
    }
    if (thermostatModeFeature) {
      writeMode(thermostatModeFeature, heatingCoolingStateToThermostatMode[value], thermostatModeToHeatingCoolingState);
    }
    callback();
  });

  service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).on(CharacteristicEventTypes.GET, (callback) => {
    callback(undefined, readCurrentHeatingCoolingState());
  });

  // TargetTemperature is required by HomeKit, but a device exposing only a mode or an on/off
  // command has no setpoint to back it. Binding handlers there would throw on the first poll, so
  // the characteristic is left with its HAP default instead.
  if (heatingSetpointFeature || coolingSetpointFeature) {
    const targetTemperatureCharacteristic = service.getCharacteristic(Characteristic.TargetTemperature);
    targetTemperatureCharacteristic.on(CharacteristicEventTypes.GET, async (callback) => {
      callback(
        undefined,
        clampToCharacteristic(readCelsius(activeSetpointFeature()), targetTemperatureCharacteristic.props),
      );
    });
    targetTemperatureCharacteristic.on(CharacteristicEventTypes.SET, async (value, callback) => {
      const setpointFeature = activeSetpointFeature();
      emitValue(setpointFeature, fromCelsius(value, setpointFeature.unit));
      callback();
    });
  }

  // A device exposing both setpoints can be driven as a range in the Home app.
  if (heatingSetpointFeature && coolingSetpointFeature) {
    bindThresholdCharacteristic.call(
      this,
      service,
      Characteristic.HeatingThresholdTemperature,
      heatingSetpointFeature,
      {
        readCelsius,
        emitValue,
      },
    );
    bindThresholdCharacteristic.call(
      this,
      service,
      Characteristic.CoolingThresholdTemperature,
      coolingSetpointFeature,
      {
        readCelsius,
        emitValue,
      },
    );
  }

  return service;
}

module.exports = {
  buildThermostatService,
  buildValidTargetStates,
  toCelsius,
  fromCelsius,
};
