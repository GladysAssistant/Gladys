const db = require('../../../models');
const logger = require('../../../utils/logger');
const {
  SYSTEM_VARIABLE_NAMES,
  DEFAULT_TIMEZONE,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  THERMOSTAT_MODE,
  THERMOSTAT_OPERATING_STATE,
  AC_MODE,
  PILOT_WIRE_MODE,
} = require('../../../utils/constants');
const { celsiusToFahrenheit, fahrenheitToCelsius } = require('../../../utils/units');
const {
  toNumber,
  getDeviceConfig,
  getFeatureBySelector,
  isExternal,
  getRunningMode,
} = require('./thermostat.deviceConfig');
const { followsSchedule } = require('./thermostat.scheduleDevice');
const {
  isStopped,
  getRemoteStopUntil,
  getFeature,
  getPreset,
  savePreset,
  announcePreset,
  saveActivePreset,
  saveOperatingState,
  getManualHold,
  setManualHold,
  clearManualHold,
  REMOTE_STOP_UNTIL_PARAM,
} = require('./thermostat.state');
const {
  parseEnd,
  findMatchingPreset,
  findCurrentTransition,
  getCurrentDayAndMinutes,
} = require('../../../utils/thermostatSchedule');
const {
  defaultPresetTemps,
  FALLBACK_SETPOINT,
  DEFAULT_TPI_CYCLE_TIME,
  DEFAULT_TPI_PROPORTIONAL_BAND,
  DEFAULT_HYSTERESIS_START,
  DEFAULT_HYSTERESIS_STOP,
  MIN_TPI_CYCLE_TIME,
  MAX_TPI_CYCLE_TIME,
  MIN_TPI_PROPORTIONAL_BAND,
  MAX_TPI_PROPORTIONAL_BAND,
  DEFAULT_MANUAL_DURATION_MINUTES,
  PILOT_WIRE_REGULATIONS,
  supportedPilotWireOrder,
} = require('../../../utils/thermostatConstants');

// An air conditioner's mode is an AC_MODE, whose values differ from
// THERMOSTAT_MODE (heating is 2 there, 1 here) and which has no off at all: the
// unit is stopped by its power instead (A.0.3).
const AC_MODE_BY_THERMOSTAT_MODE = {
  [THERMOSTAT_MODE.HEATING]: AC_MODE.HEATING,
  [THERMOSTAT_MODE.COOLING]: AC_MODE.COOLING,
  [THERMOSTAT_MODE.AUTO]: AC_MODE.AUTO,
};

/**
 * @description Convert a setpoint written in the thermostat's own unit into the
 * unit of the feature it will be written on.
 *
 * The two can differ on an external thermostat: `THERMOSTAT_TEMP_UNIT` is what
 * the presets are configured in, while the real device's setpoint feature has a
 * unit of its own. Picking Comfort at 21 °C on a Fahrenheit feature must write
 * 70 °F, not 21 °F.
 *
 * The result is rounded to what a device in that unit displays: a whole degree
 * Fahrenheit, half a degree Celsius. 21 °C is 69.8 °F, and a device that echoes
 * back 70 would never equal it: every pass would re-write the setpoint, and the
 * echo would look like a change made on the device and arm a hold.
 * @param {number} setpoint - The setpoint, in the thermostat's unit.
 * @param {string} thermostatUnit - The thermostat's unit, 'C' or 'F'.
 * @param {string} featureUnit - The unit of the feature written on.
 * @returns {number} The setpoint in the feature's unit.
 * @example
 * convertSetpointToFeatureUnit(21, 'C', DEVICE_FEATURE_UNITS.FAHRENHEIT);
 */
function convertSetpointToFeatureUnit(setpoint, thermostatUnit, featureUnit) {
  if (featureUnit === DEVICE_FEATURE_UNITS.FAHRENHEIT && thermostatUnit === 'C') {
    return Math.round(celsiusToFahrenheit(setpoint));
  }
  if (featureUnit === DEVICE_FEATURE_UNITS.CELSIUS && thermostatUnit === 'F') {
    return Math.round(fahrenheitToCelsius(setpoint) * 2) / 2;
  }
  return setpoint;
}

/**
 * @description Write a setpoint on an external thermostat.
 *
 * The real device owns the feature, so the write goes through the core, which
 * routes it to the owning service (Netatmo, Zigbee2MQTT, Matter, MQTT...). It
 * is skipped when the value already matches: several of those services call a
 * cloud API on every write, and re-sending an unchanged setpoint every minute
 * would burn the rate limit for nothing.
 *
 * The value is converted into the target feature's own unit first. A thermostat
 * configured in celsius pointing at a fahrenheit device would otherwise write
 * 21 where the device reads 21 °F.
 * @param {object} gladys - Gladys instance.
 * @param {string} targetSelector - Selector of the external setpoint feature.
 * @param {number} setpoint - Setpoint in the thermostat's unit.
 * @param {string|null} thermostatUnit - Thermostat unit param, 'C' or 'F', or null
 * when the setpoint is already in the target feature's own unit — the case of a
 * manual hold on an external thermostat, whose value came from that very feature.
 * @param {string} logContext - Context for the log line.
 * @param {Map<string, number>} [selfWritten] - Marks of the setpoints this service wrote,
 * so the echo of this write is not mistaken for a change made on the device itself.
 * @returns {Promise<void>}
 * @example
 * await writeExternalSetpoint(gladys, 'netatmo:x:setpoint', 21, 'C', 'salon');
 */
async function writeExternalSetpoint(gladys, targetSelector, setpoint, thermostatUnit, logContext, selfWritten) {
  try {
    const found = await getFeatureBySelector(gladys, targetSelector);
    if (!found) {
      logger.warn(`Thermostat schedule: external target feature not found for selector="${targetSelector}"`);
      return;
    }
    let value = setpoint;
    const featureUnit = found.feature.unit;
    // A null unit means the value is already in the feature's own: converting it
    // again would command 158 °F for a 70 °F hold, or -6 °C for a 21 °C one.
    if (thermostatUnit !== null) {
      value = convertSetpointToFeatureUnit(setpoint, thermostatUnit, featureUnit);
    }
    // A device that declares a step only takes multiples of it, and echoes back
    // the multiple it settled on: the value is snapped first, or the comparison
    // below would never match and the setpoint would be re-written every pass.
    // Rounded again after the division, which leaves 20.000000000000004 behind.
    const step = toNumber(found.feature.step, null);
    if (step !== null && step > 0) {
      value = Number((Math.round(value / step) * step).toFixed(6));
    }
    // The real device advertises the range it accepts. Netatmo says 5-30,
    // Zigbee 5-40, Matter -100-200: writing outside it is rejected by the
    // integration, or silently clamped, so clamp here where it can be logged.
    const min = toNumber(found.feature.min, null);
    const max = toNumber(found.feature.max, null);
    if (min !== null && value < min) {
      logger.info(`Thermostat schedule: setpoint ${value} below the device minimum ${min}, clamped (${logContext})`);
      value = min;
    }
    if (max !== null && value > max) {
      logger.info(`Thermostat schedule: setpoint ${value} above the device maximum ${max}, clamped (${logContext})`);
      value = max;
    }
    if (found.feature.last_value === value) {
      // Nothing to write, but this *is* the value this service stands behind, so
      // it is marked all the same. Without it, an integration that re-reports
      // this untouched setpoint — on a reconnection, or on its regular report —
      // would look like a change made on the device and arm a manual hold.
      if (selfWritten) {
        selfWritten.set(targetSelector, value);
      }
      logger.debug(`Thermostat schedule: external setpoint already ${value} (${logContext})`);
      return;
    }
    // Mark before writing: the device echoes the value back as a NEW_STATE, and
    // the listener must not take our own write for a change made on the device.
    if (selfWritten) {
      selfWritten.set(targetSelector, value);
    }
    try {
      await gladys.device.setValue(found.device, found.feature, value);
    } catch (e) {
      // The write never reached the device (an unreachable integration, an
      // expired token, an external integration that did not acknowledge in
      // time), so no echo will come: leaving the mark behind would make the
      // listener swallow a *real* change to that same value, and the loop would
      // then overwrite what the user set on the thermostat.
      if (selfWritten) {
        selfWritten.delete(targetSelector);
      }
      throw e;
    }
    logger.info(`Thermostat schedule: external setpoint ${value} written (${logContext})`);
  } catch (e) {
    logger.warn(`Thermostat schedule: Failed to write external setpoint: ${e.message}`);
  }
}

/**
 * @description Write the operating mode of an external thermostat.
 *
 * A real thermostat that exposes a mode feature is only truly stopped when that
 * mode says so: writing the frost-protection setpoint alone leaves it in
 * `heating`, ready to fire again as soon as the room drops below 7 °C. This is
 * what the `off` preset means, and it is the mode Gladys hands back to
 * `heating` (or `cooling`) as soon as a heating preset takes over again.
 *
 * The write is skipped when the mode already matches: like the setpoint, it
 * goes through the core to a service that may call a cloud API on every write,
 * and re-sending the same mode every minute would burn the rate limit.
 *
 * Thermostats exposing no mode feature keep the previous behaviour — the frost
 * setpoint is the only "stop" they understand.
 * @param {object} gladys - Gladys instance.
 * @param {string} modeSelector - Selector of the external mode feature.
 * @param {number} mode - Value from the THERMOSTAT_MODE enum.
 * @param {string} logContext - Context for the log line.
 * @returns {Promise<void>}
 * @example
 * await writeExternalMode(gladys, 'netatmo:x:mode', THERMOSTAT_MODE.OFF, 'salon');
 */
async function writeExternalMode(gladys, modeSelector, mode, logContext) {
  try {
    const found = await getFeatureBySelector(gladys, modeSelector);
    if (!found) {
      logger.warn(`Thermostat schedule: external mode feature not found for selector="${modeSelector}"`);
      return;
    }
    let value = mode;
    if (found.feature.category === DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING) {
      // An air conditioner speaks AC_MODE, and has no off: writing 0 would be
      // AC_MODE.AUTO and start the unit. Its power feature is what stops it.
      value = AC_MODE_BY_THERMOSTAT_MODE[mode];
      if (value === undefined) {
        logger.debug(`Thermostat schedule: mode ${mode} has no air-conditioning equivalent, skipped (${logContext})`);
        return;
      }
    } else {
      // The device advertises the modes it accepts: a heating-only thermostat
      // declares max = 1 (OFF, HEATING) and rejects COOLING or AUTO. Asking for a
      // mode it does not support would be refused by the integration, so fall
      // back to the highest it does accept rather than write something invalid.
      const max = toNumber(found.feature.max, null);
      if (max !== null && value > max) {
        logger.info(`Thermostat schedule: mode ${value} above the device maximum ${max}, clamped (${logContext})`);
        value = max;
      }
    }
    if (found.feature.last_value === value) {
      logger.debug(`Thermostat schedule: external mode already ${value} (${logContext})`);
      return;
    }
    await gladys.device.setValue(found.device, found.feature, value);
    logger.info(`Thermostat schedule: external mode ${value} written (${logContext})`);
  } catch (e) {
    logger.warn(`Thermostat schedule: Failed to write external mode: ${e.message}`);
  }
}

/**
 * @description Resolve the setpoint feature of a thermostat device.
 * Feature order is not a contract, so the feature is matched on its category
 * and type rather than taken from index 0.
 * @param {object} device - Thermostat device.
 * @returns {object|null} The target-temperature feature, or null when absent.
 * @example
 * const feature = getThermostatFeature(device);
 */
function getThermostatFeature(device) {
  if (!device || !Array.isArray(device.features)) {
    return null;
  }
  return (
    device.features.find(
      (feature) =>
        feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT &&
        feature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
    ) || null
  );
}

/**
 * @description Read a temperature sensor in the thermostat's own unit.
 * The sensor and the thermostat are configured independently: a Zigbee or
 * Z-Wave probe reports celsius while the thermostat may be set to fahrenheit,
 * and comparing 68 against a 20 setpoint would leave the heating permanently
 * off (or, in cooling, permanently on). A sensor with no declared unit is
 * assumed to already be in the thermostat's unit — that is the pre-existing
 * behaviour, and guessing otherwise would be worse than not converting.
 * @param {object} feature - Temperature device feature.
 * @param {string} thermostatUnit - Thermostat unit param, 'C' or 'F'.
 * @returns {number|null} The reading expressed in the thermostat's unit, or null.
 * @example
 * const temp = readTemperatureInThermostatUnit(feature, 'F');
 */
function readTemperatureInThermostatUnit(feature, thermostatUnit) {
  const value = feature ? feature.last_value : null;
  if (value === null || value === undefined) {
    return null;
  }
  const wantsFahrenheit = thermostatUnit === 'F';
  const sensorUnit = feature.unit || null;
  if (sensorUnit === DEVICE_FEATURE_UNITS.CELSIUS && wantsFahrenheit) {
    return celsiusToFahrenheit(value);
  }
  if (sensorUnit === DEVICE_FEATURE_UNITS.FAHRENHEIT && !wantsFahrenheit) {
    return fahrenheitToCelsius(value);
  }
  return value;
}

// How old a probe's reading may be before the average leaves it out, while a
// fresher probe is there: the core's room average uses the same hour.
const TEMPERATURE_MAX_AGE_MS = 60 * 60 * 1000;

/**
 * @description Read the room temperature from one sensor or several.
 * A large room, or two rooms heated as one, has several probes: regulating on
 * one corner is regulating on the wrong number, so the loop uses their average
 * (A.1.1). Each reading is converted into the thermostat's unit before it is
 * averaged, and a sensor with no value, or that cannot be read, is left out
 * rather than counted as 0. So is one that stopped reporting, while
 * another still does.
 * @param {object} gladys - Gladys instance.
 * @param {Array<string>} selectors - Temperature feature selectors.
 * @param {string} thermostatUnit - Thermostat unit param, 'C' or 'F'.
 * @returns {Promise<number|null>} The average, or null when no sensor has a value.
 * @example
 * const temp = await readAverageTemperature(gladys, ['salon-temp', 'kitchen-temp'], 'C');
 */
async function readAverageTemperature(gladys, selectors, thermostatUnit) {
  // Each probe is read on its own, like the windows: one that cannot be looked
  // up is left out of the average rather than silencing the others.
  const found = await Promise.all(
    selectors.map(async (selector) => {
      try {
        return await getFeatureBySelector(gladys, selector);
      } catch (e) {
        logger.warn(`Thermostat schedule: Failed to read temperature sensor ${selector}: ${e.message}`);
        return null;
      }
    }),
  );
  const read = found.filter((sensor) => {
    if (!sensor) {
      return false;
    }
    const value = readTemperatureInThermostatUnit(sensor.feature, thermostatUnit);
    return value !== null && value !== undefined;
  });
  // A probe that stopped reporting — a flat battery, a lost Zigbee route — keeps
  // its last value for ever, and pulled the average towards a temperature the
  // room left long ago. One older than the core's room average accepts (an
  // hour, getTemperatureInRoom) is left out while a fresher one is there; when
  // every probe is that old, they are all kept, as a single probe always was:
  // a stale reading still beats regulating on nothing.
  const freshAfter = Date.now() - TEMPERATURE_MAX_AGE_MS;
  const fresh = read.filter((sensor) => new Date(sensor.feature.last_value_changed).getTime() > freshAfter);
  const readings = (fresh.length > 0 ? fresh : read).map((sensor) =>
    readTemperatureInThermostatUnit(sensor.feature, thermostatUnit),
  );
  if (readings.length === 0) {
    return null;
  }
  return readings.reduce((sum, value) => sum + value, 0) / readings.length;
}

/**
 * @description Whether any of the thermostat's opening sensors is open.
 * A living room has several windows, and an open-plan floor is heated as one
 * volume: one of them open is enough to suspend the heating (A.1.1). A sensor
 * that cannot be read is not taken as open — on a flat battery, that would stop
 * the heating for good.
 * @param {object} gladys - Gladys instance.
 * @param {Array<string>} selectors - Opening sensor selectors.
 * @returns {Promise<string|null>} The selector of an open sensor, or null.
 * @example
 * const open = await findOpenWindow(gladys, ['salon-window', 'kitchen-door']);
 */
async function findOpenWindow(gladys, selectors) {
  const found = await Promise.all(
    selectors.map(async (selector) => {
      try {
        return await getFeatureBySelector(gladys, selector);
      } catch (e) {
        logger.warn(`Thermostat schedule: Failed to read window sensor ${selector}: ${e.message}`);
        return null;
      }
    }),
  );
  const open = found.find((sensor) => sensor && sensor.feature.last_value === 0);
  return open ? open.feature.selector : null;
}

/**
 * @description Get setpoint temperature for a preset from config.
 * @param {string} preset - Preset name.
 * @param {object} config - Thermostat config object.
 * @returns {number|null} Setpoint temperature, null for the off preset.
 * @example
 * getSetpointForPreset('comfort', config);
 */
function getSetpointForPreset(preset, config) {
  if (preset === 'off') {
    return null;
  }
  const configValue = toNumber(config && config[`preset_${preset}`], null);
  if (configValue !== null) {
    return configValue;
  }
  const defaults = defaultPresetTemps(config && config.default_mode);
  return defaults[preset] !== undefined ? defaults[preset] : FALLBACK_SETPOINT;
}

/**
 * @description Read the switch feature and actuate it if its state differs from the desired one.
 * @param {object} gladys - Gladys instance.
 * @param {string} switchSelector - Switch feature selector.
 * @param {boolean} shouldBeActive - Desired state.
 * @param {string} logContext - Context string for logs.
 * @param {Map<string, number>} [selfWritten] - Marks of the powers this service wrote.
 * @returns {Promise<boolean>} True when the switch is in the desired state afterwards.
 * @example
 * await actuateSwitch(gladys, 'heater-switch', true, 'preset=comfort');
 */
async function actuateSwitch(gladys, switchSelector, shouldBeActive, logContext, selfWritten = null) {
  try {
    const found = await getFeatureBySelector(gladys, switchSelector);
    if (!found) {
      logger.warn(`Thermostat schedule: switch device/feature not found for selector="${switchSelector}"`);
      return false;
    }
    // The state this service stands behind, marked before the write like a
    // setpoint (C.0.1), and when the switch already holds it: the power of an
    // external thermostat is reported back, and only a report that differs from
    // this mark was made on the device itself.
    if (selfWritten) {
      selfWritten.set(switchSelector, shouldBeActive ? 1 : 0);
    }
    const currentSwitchOn = found.feature.last_value === 1;
    if (currentSwitchOn !== shouldBeActive) {
      await gladys.device.setValue(found.device, found.feature, shouldBeActive ? 1 : 0);
      logger.info(`Thermostat schedule: switch ${shouldBeActive ? 'ON' : 'OFF'} (${logContext})`);
    } else {
      logger.debug(`Thermostat schedule: switch already ${shouldBeActive ? 'ON' : 'OFF'} (${logContext})`);
    }
    return true;
  } catch (e) {
    // The mark stays: a failed write may still have reached the unit — the core
    // gives up after 5 s, and a cloud like MELCloud obeys after that — and its
    // report must still read as this service's. Dropped, a stop that had worked
    // came back as a unit switched off from its remote. A write that really got
    // nowhere leaves the unit as it was, whose reports then match the reference
    // and arm nothing.
    logger.warn(`Thermostat schedule: Failed to actuate switch: ${e.message}`);
    return false;
  }
}

/**
 * @description Stop an external thermostat.
 *
 * Three things say "stop" to a real thermostat, and which one it understands
 * depends on the device: the operating mode, which almost none expose, the
 * power of an air conditioner, and the frost-protection setpoint, which every
 * thermostat accepting a setpoint at all understands. The mode and the setpoint
 * are both written when both are configured — the mode is what actually stops
 * it, and the setpoint keeps the frost protection in place for a device that
 * would otherwise be left on its comfort target. A device stopped by its power
 * gets no setpoint (below).
 *
 * A cooling thermostat is stopped from the other end of its range: the frost
 * setpoint asked an air conditioner to cool as hard as it can, which is what it
 * did whenever it had no mode feature or the mode write failed.
 * @param {object} gladys - Gladys instance.
 * @param {object} config - Thermostat config object.
 * @param {string} logContext - Context for the log lines.
 * @param {Map<string, number>} [selfWritten] - Marks of the setpoints this service wrote.
 * @param {Map<string, number>} [selfWrittenPowers] - Marks of the powers this service wrote.
 * @returns {Promise<void>}
 * @example
 * await stopExternalThermostat(gladys, config, 'preset=off, salon');
 */
async function stopExternalThermostat(gladys, config, logContext, selfWritten, selfWrittenPowers = null) {
  // The mode goes first, in both directions: it is what the machine obeys.
  // Writing the frost setpoint to a thermostat still in COOLING asks it to cool
  // the room to 7 °C until the mode write lands — and to keep doing so if that
  // write fails on an expired token or the core's 5 s budget, which is the
  // opposite of suspending it.
  if (config.mode_feature) {
    await writeExternalMode(gladys, config.mode_feature, THERMOSTAT_MODE.OFF, logContext);
  }
  // Then the power: the stop of a device whose mode cannot say off — an air
  // conditioner, whose AC_MODE has no such value (A.0.3). Once it is cut, no
  // setpoint follows: most air-conditioning stacks take a setpoint command as
  // "turn on and aim at this", and MELCloud rebuilds each write from a snapshot
  // of the unit that may still read powered — the setpoint would undo the stop.
  if (config.power_feature) {
    if (await actuateSwitch(gladys, config.power_feature, false, logContext, selfWrittenPowers)) {
      return;
    }
    // The power could not be cut. An air conditioner still gets no setpoint, for
    // the reason above: the stop is retried on the next pass, which writes the
    // power again. Any other device falls back on the setpoint below, so that a
    // boiler is not left on its comfort target while a window is open.
    let target = null;
    try {
      target = await getFeatureBySelector(gladys, config.target_feature);
    } catch (e) {
      logger.warn(`Thermostat schedule: Failed to read the setpoint feature: ${e.message}`);
    }
    if (!target || target.feature.category === DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING) {
      logger.warn(`Thermostat schedule: the unit could not be powered off, retried on the next pass (${logContext})`);
      return;
    }
  }
  // Otherwise the setpoint, which is the fallback for a device with no mode or
  // working power feature and the only "stop" every thermostat understands: frost
  // protection when it heats, the top of its range when it cools — clamped to
  // the device's own.
  const stopSetpoint =
    getRunningMode(config) === THERMOSTAT_MODE.COOLING ? config.temp_max : getSetpointForPreset('frost', config);
  await writeExternalSetpoint(gladys, config.target_feature, stopSetpoint, config.temp_unit, logContext, selfWritten);
}

/**
 * @description Start an external thermostat again: its power, then its mode.
 * A unit that is powered off ignores a mode as surely as a setpoint, and a
 * thermostat left in OFF ignores a setpoint: both are handed back before the
 * setpoint the caller writes next means anything (C.0).
 * @param {object} gladys - Gladys instance.
 * @param {object} config - Thermostat config object.
 * @param {string} logContext - Context for the log lines.
 * @param {Map<string, number>} [selfWrittenPowers] - Marks of the powers this service wrote.
 * @returns {Promise<void>}
 * @example
 * await startExternalThermostat(gladys, config, 'preset=comfort, salon');
 */
async function startExternalThermostat(gladys, config, logContext, selfWrittenPowers = null) {
  if (config.power_feature) {
    await actuateSwitch(gladys, config.power_feature, true, logContext, selfWrittenPowers);
  }
  if (config.mode_feature) {
    await writeExternalMode(gladys, config.mode_feature, getRunningMode(config), logContext);
  }
}

/**
 * @description Constrain a number to a closed range.
 * @param {number} value - Value to constrain.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number} The value, bounded by min and max.
 * @example
 * clamp(0, 0.5, 10); // 0.5
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @description Derive a stable per-thermostat offset inside a TPI cycle.
 * Without it every thermostat sharing a cycle time switches on at the same
 * wall-clock minute, stacking the loads on the electrical installation.
 * @param {string} key - Stable key, typically the thermostat feature selector.
 * @param {number} cycleMinutes - TPI cycle length in minutes.
 * @returns {number} Offset in minutes, within [0, cycleMinutes).
 * @example
 * phaseOffset('thermostat-living-room', 10); // 3
 */
function phaseOffset(key, cycleMinutes) {
  if (!key || !cycleMinutes) {
    return 0;
  }
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  return hash % cycleMinutes;
}

/**
 * @description Compute whether the switch should be active based on current temp and setpoint.
 * Supports hysteresis (default) and TPI (time-proportional) control types.
 * @param {number} currentTemp - Current measured temperature.
 * @param {number} setpoint - Target setpoint.
 * @param {string} mode - 'heating' or 'cooling'.
 * @param {object} config - Thermostat config with hysteresis/TPI values.
 * @param {boolean} currentSwitchOn - Whether the switch is currently ON (for neutral-zone hold).
 * @param {number} [nowMs] - Current epoch in ms (for TPI cycle position, injectable in tests).
 * @param {string} [phaseKey] - Stable key used to offset this thermostat inside the TPI cycle.
 * @returns {boolean} True if switch should be ON.
 * @example
 * computeSwitchActive(18, 20, 'heating', config, false);
 */
function computeSwitchActive(currentTemp, setpoint, mode, config, currentSwitchOn, nowMs = Date.now(), phaseKey = '') {
  if (currentTemp === null || currentTemp === undefined || setpoint === null || setpoint === undefined) {
    return false;
  }
  // TPI modulates the on-time over a cycle, which suits heating only: a cooling
  // compressor cannot be pulsed that way, so cooling always uses hysteresis.
  if (config && config.control_type === 'tpi' && mode !== 'cooling') {
    // Over each cycle, the switch is ON for a fraction of the time proportional
    // to the temperature error within the proportional band.
    // Clamp to the bounds the edit form advertises. An out-of-range value can
    // still reach the database through the API, and a 0 would either divide by
    // zero (band) or modulo by zero (cycle), leaving the heater stuck ON or OFF.
    const cycleMinutes = clamp(
      toNumber(config.tpi_cycle_time, DEFAULT_TPI_CYCLE_TIME),
      MIN_TPI_CYCLE_TIME,
      MAX_TPI_CYCLE_TIME,
    );
    const band = clamp(
      toNumber(config.tpi_proportional_band, DEFAULT_TPI_PROPORTIONAL_BAND),
      MIN_TPI_PROPORTIONAL_BAND,
      MAX_TPI_PROPORTIONAL_BAND,
    );
    const error = setpoint - currentTemp;
    const onFraction = Math.min(1, Math.max(0, error / band));
    const onMinutes = onFraction * cycleMinutes;
    // Regulation runs once a minute, so an on-time below one minute would ask
    // for a pulse shorter than the control step: too short to start a boiler,
    // and needless relay wear. Below that, stay off and let the error grow.
    if (onMinutes < 1) {
      return false;
    }
    if (onFraction >= 1) {
      return true;
    }
    // Offset each thermostat inside the cycle, otherwise every device sharing a
    // cycle time switches on at the same wall-clock minute and the loads add up.
    const phase = phaseOffset(phaseKey, cycleMinutes);
    const minuteInCycle = (Math.floor(nowMs / 60000) + phase) % cycleMinutes;
    return minuteInCycle < onMinutes;
  }
  const hystStart = toNumber(config && config.hysteresis_start, DEFAULT_HYSTERESIS_START);
  const hystStop = toNumber(config && config.hysteresis_stop, DEFAULT_HYSTERESIS_STOP);
  if (mode === 'heating') {
    if (currentTemp < setpoint - hystStart) {
      return true; // too cold → ON
    }
    if (currentTemp > setpoint + hystStop) {
      return false; // hot enough → OFF
    }
    return !!currentSwitchOn; // neutral zone → keep current state
  }
  // cooling
  if (currentTemp > setpoint + hystStart) {
    return true; // too hot → ON
  }
  if (currentTemp < setpoint - hystStop) {
    return false; // cold enough → OFF
  }
  return !!currentSwitchOn; // neutral zone → keep current state
}

/**
 * @description The feature that switches the unit an external thermostat
 * drives: its power, or its mode when it has no power (a reversible thermostat
 * whose mode says off, A.0.3).
 * @param {object} config - The thermostat's config.
 * @returns {string|null} The selector, or null on a virtual thermostat.
 * @example
 * unitFeature(config); // 'ac-power'
 */
function unitFeature(config) {
  if (!config || !isExternal(config)) {
    return null;
  }
  return config.power_feature || config.mode_feature || null;
}

/**
 * @description The unit features (unitFeature) of the external thermostats that
 * are not stopped. Two thermostats may drive one unit — one per mode, or one per
 * setpoint of a reversible device (G) — and a stopped one cut, on every pass,
 * the power the running one handed back: the unit switched off and on once a
 * minute. On a unit with no power, the stopped one wrote its mode off, and the
 * running one its mode back, the same way. A feature in this set is the running
 * thermostat's to switch.
 * @param {Array} devices - The thermostats.
 * @param {string} [exceptId] - A thermostat to leave out.
 * @returns {Set<string>} The power, or mode, selectors.
 * @example
 * runningUnitFeatures(await gladys.device.get({ service: 'thermostat' }), device.id);
 */
function runningUnitFeatures(devices, exceptId = null) {
  const features = new Set();
  (devices || []).forEach((device) => {
    const feature = unitFeature(getDeviceConfig(device));
    if (device.id !== exceptId && feature && !isStopped(device)) {
      features.add(feature);
    }
  });
  return features;
}

/**
 * @description Start a thermostat again once the stop made on its unit has run
 * to the programme's next point (C.0.1): the programme then takes it over, as it
 * would have without the stop.
 * @param {object} gladys - Gladys instance.
 * @param {object} device - The thermostat device.
 * @param {object} config - Its config.
 * @returns {Promise<boolean>} True when the thermostat was started again.
 * @example
 * await liftRemoteStop(gladys, device, config);
 */
async function liftRemoteStop(gladys, device, config) {
  const until = getRemoteStopUntil(device);
  if (until === null || Date.now() < until) {
    return false;
  }
  const modeFeature = getFeature(device, DEVICE_FEATURE_TYPES.THERMOSTAT.MODE);
  if (!modeFeature || !isStopped(device)) {
    // Started by hand already: the end has nothing left to lift.
    await gladys.device.setParam(device, REMOTE_STOP_UNTIL_PARAM, '');
    return false;
  }
  // The mode before the end is forgotten: cleared first, a failed write left the
  // thermostat stopped with nothing left to start it — the sticky stop this end
  // exists to prevent. Kept, the next pass tries again.
  await gladys.device.saveState(modeFeature, getRunningMode(config));
  // A preset picked by hand before the stop lost its hold with it: left on the
  // feature, it read as a standing choice, and the thermostat never followed its
  // programme again. The stop ran to the next point, where that hold would have
  // ended too: the programme takes the thermostat back, as it would have.
  if (getPreset(device) !== 'schedule' && (await followsSchedule(device.id))) {
    await clearManualHold.call({ gladys }, device);
    await savePreset.call({ gladys }, device, 'schedule');
  }
  await gladys.device.setParam(device, REMOTE_STOP_UNTIL_PARAM, '');
  logger.info(`Thermostat schedule: ${device.selector} started again, the stop made on its unit ran to the next point`);
  return true;
}

// A pilot-wire heater is not driven by a temperature but by one of six orders,
// carried on the wire itself. When the heater regulates, each preset sends the
// order it is set to (`config.pilot_wire_orders`, C.1.1); `off` always sends off.
/**
 * @description The order a preset sends a pilot-wire heater that regulates itself.
 * @param {string} preset - The preset in force.
 * @param {object} config - Thermostat config object.
 * @returns {number|undefined} A PILOT_WIRE_MODE value, or undefined for a preset
 * that names no order (`schedule`, or one that no longer exists).
 * @example
 * pilotWireOrderForPreset('eco', config); // PILOT_WIRE_MODE.ECO
 */
function pilotWireOrderForPreset(preset, config) {
  if (preset === 'off') {
    return PILOT_WIRE_MODE.OFF;
  }
  // buildParamsConfig always fills the table in, defaults included.
  return config.pilot_wire_orders[preset];
}

// When Gladys regulates, the module only ever carries comfort or frost from it:
// any other order read back was chosen on the module, and is taken as the
// preset it stands for in that vocabulary. The derived comforts are comfort
// chosen on the heater, not a temperature Gladys knows.
const PRESET_BY_PILOT_WIRE_ORDER = {
  [PILOT_WIRE_MODE.FROST_PROTECTION]: 'frost',
  [PILOT_WIRE_MODE.ECO]: 'eco',
  [PILOT_WIRE_MODE.COMFORT_2]: 'comfort',
  [PILOT_WIRE_MODE.COMFORT_1]: 'comfort',
  [PILOT_WIRE_MODE.COMFORT]: 'comfort',
};

// Which preset wins when several send the same order: the one named after it
// first, so frost protection pressed on the module reads `frost`, not `away`.
const PRESETS_BY_PRIORITY = ['frost', 'eco', 'comfort', 'night', 'away'];

/**
 * @description The preset an order stands for, used when the order was changed
 * on the module itself and is taken as that preset picked by hand (C.1.1).
 *
 * When the heater regulates, it is the preset set to send that order, so a
 * press of comfort -2 reads as night when night sends comfort -2. An order no
 * preset sends falls back on the fixed vocabulary — a derived comfort is still
 * comfort. Off is no preset: pressed on the module it stops the thermostat.
 * @param {number} order - The PILOT_WIRE_MODE value the module now carries.
 * @param {object} config - Thermostat config object.
 * @returns {string|undefined} The preset, or undefined for off or an unknown order.
 * @example
 * presetForPilotWireOrder(PILOT_WIRE_MODE.ECO, config); // 'eco'
 */
function presetForPilotWireOrder(order, config) {
  if (config.pilot_wire_regulation !== PILOT_WIRE_REGULATIONS.GLADYS) {
    const preset = PRESETS_BY_PRIORITY.find((candidate) => config.pilot_wire_orders[candidate] === order);
    if (preset) {
      return preset;
    }
  }
  return PRESET_BY_PILOT_WIRE_ORDER[order];
}

/**
 * @description Whether an order keeps a heater on standby.
 *
 * Off and frost protection are the two standby orders — the heater only keeps
 * the room above 7 °C. Eco and the comforts let it heat to a temperature of its
 * own.
 * @param {number} order - A PILOT_WIRE_MODE value.
 * @returns {boolean} True for off and frost protection.
 * @example
 * isStandbyOrder(PILOT_WIRE_MODE.FROST_PROTECTION); // true
 */
function isStandbyOrder(order) {
  return order === PILOT_WIRE_MODE.OFF || order === PILOT_WIRE_MODE.FROST_PROTECTION;
}

/**
 * @description Whether an order is one of the three comforts.
 * @param {number} order - A PILOT_WIRE_MODE value.
 * @returns {boolean} True for comfort, comfort -1 and comfort -2.
 * @example
 * isComfortOrder(PILOT_WIRE_MODE.COMFORT_1); // true
 */
function isComfortOrder(order) {
  return (
    order === PILOT_WIRE_MODE.COMFORT || order === PILOT_WIRE_MODE.COMFORT_1 || order === PILOT_WIRE_MODE.COMFORT_2
  );
}

/**
 * @description Write an order on a pilot-wire heater.
 *
 * An order already carried is skipped: several of these heaters are Zigbee, and
 * re-sending an unchanged order once a minute is traffic for nothing.
 *
 * The order is marked as this service's own, written or already carried: the
 * module reports it back as a NEW_STATE, and without the mark that report would
 * be taken for an order changed on the module and arm a hold (C.1.1).
 * @param {object} gladys - Gladys instance.
 * @param {string} pilotWireSelector - The heater's pilot-wire-mode feature.
 * @param {number} wanted - The PILOT_WIRE_MODE value to write.
 * @param {string} logContext - What this write is for, for the log line.
 * @param {Map<string, number>} selfWritten - Marks of the values this service wrote.
 * @returns {Promise<number|null|undefined>} The order the heater carries
 * afterwards: the new one, the previous one when the write failed, or nothing
 * when it is unknown.
 * @example
 * await writePilotWireOrder(gladys, 'heater-pilot-wire', PILOT_WIRE_MODE.COMFORT, 'schedule', new Map());
 */
async function writePilotWireOrder(gladys, pilotWireSelector, wanted, logContext, selfWritten) {
  let found = null;
  let marked = false;
  try {
    found = await getFeatureBySelector(gladys, pilotWireSelector);
    if (!found) {
      logger.warn(`Thermostat schedule: pilot-wire feature not found for selector="${pilotWireSelector}"`);
      return null;
    }
    // Only an order the module declares it takes (supportedPilotWireOrder).
    const order = supportedPilotWireOrder(wanted, found.feature.supported_options);
    if (order === null) {
      logger.warn(`Thermostat schedule: the module takes no order ${wanted}, nothing sent (${logContext})`);
      return found.feature.last_value;
    }
    // Marked in both branches: nothing goes on the wire when the order is
    // already carried, but it is still the order Gladys stands behind, and a
    // module re-reporting it must not look like a press of its button.
    selfWritten.set(pilotWireSelector, order);
    if (found.feature.last_value === order) {
      logger.debug(`Thermostat schedule: pilot-wire already on order ${order} (${logContext})`);
      return order;
    }
    marked = true;
    await gladys.device.setValue(found.device, found.feature, order);
    logger.info(`Thermostat schedule: pilot-wire order ${order} written (${logContext})`);
    return order;
  } catch (e) {
    // The write never reached the module, so no report of it will come: a mark
    // left behind would swallow a real press of that same order later on.
    if (marked) {
      selfWritten.delete(pilotWireSelector);
    }
    logger.warn(`Thermostat schedule: Failed to write the pilot-wire order: ${e.message}`);
    // The heater kept the order it had: that is what it is doing now.
    return found ? found.feature.last_value : null;
  }
}

/**
 * @description Retract, once, a running state Gladys no longer stands behind.
 *
 * A heater regulating itself is never said to heat or to idle: nothing Gladys
 * reads tells. But a pass under Gladys, before the thermostat was turned into
 * one the heater regulates, may have left `heating`. The widget no longer reads
 * it then; scenes, MQTT and HomeKit would keep seeing a flame. Idle is written
 * over it a single time, and the state is left alone after that.
 * @param {object} gladys - Gladys instance.
 * @param {object} device - The thermostat device.
 * @returns {Promise<void>}
 * @example
 * await retractStaleRunningState(gladys, device);
 */
async function retractStaleRunningState(gladys, device) {
  const stateFeature = getFeature(device, DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE);
  const claimsRunning =
    stateFeature &&
    (stateFeature.last_value === THERMOSTAT_OPERATING_STATE.HEATING ||
      stateFeature.last_value === THERMOSTAT_OPERATING_STATE.COOLING);
  if (claimsRunning) {
    await saveOperatingState.call({ gladys }, device, THERMOSTAT_OPERATING_STATE.IDLE);
  }
}

/**
 * @description Drive a pilot-wire heater: write the order Gladys decided, then
 * say on the thermostat's operating state what it knows of it.
 *
 * Who regulates is said by the thermostat type (C.1.1):
 *
 * - The heater (a real thermostat, `heater`). Each preset sends the order it is
 *   set to — eco is eco — and the heater heats on a setpoint of its own, set on
 *   its body. Whether it then draws current is unknown, so the state is left
 *   alone.
 * - Gladys (a virtual one with a room sensor, `gladys`). The wire is used as a switch,
 *   with the same hysteresis as one: below the setpoint comfort, above it frost
 *   protection — the standby that still guards the room against frost. Comfort
 *   whatever the preset: the heater's own setpoint is set high, and eco would
 *   hand the decision back to its thermometer, three and a half degrees lower.
 *   TPI is not used: switching orders within a cycle is traffic for a heater
 *   whose own thermostat already smooths the output.
 *
 * When Gladys regulates but the sensor cannot be read, the heater is handed the
 * preset's order and decides alone, rather than a room left unheated; the state
 * then says idle rather than guess heating. `schedule` with no point in force
 * names no order: the heater keeps the one it carries.
 *
 * The state follows the order the heater carries afterwards: a write that
 * failed leaves the previous order in force, and the heater is said to heat
 * only if the loop asks for it and that order lets it. An order that cannot be
 * read leaves the state untouched.
 * @param {object} gladys - Gladys instance.
 * @param {object} device - The thermostat device.
 * @param {object} config - Thermostat config object.
 * @param {string} preset - The preset in force.
 * @param {string} logContext - What this write is for, for the log line.
 * @param {Map<string, number>|null} selfWritten - Marks of the values this service wrote, if kept.
 * @param {object} [options] - Regulation options.
 * @param {number|null} [options.setpoint] - The setpoint to regulate on, in the thermostat's unit.
 * @param {boolean} [options.keepDerivedComfort] - Keep the comfort the module carries when comfort is asked.
 * @param {number} [options.order] - The order to send whatever the preset, with `off`: frost for a window.
 * @returns {Promise<void>}
 * @example
 * await drivePilotWire(gladys, device, config, 'comfort', 'schedule', handler.selfWrittenSetpoints, { setpoint: 21 });
 */
async function drivePilotWire(gladys, device, config, preset, logContext, selfWritten, options = {}) {
  const { setpoint = null, keepDerivedComfort = false, order: forcedOrder = null } = options;
  const stop = preset === 'off';
  const regulated = !stop && setpoint !== null && config.pilot_wire_regulation === PILOT_WIRE_REGULATIONS.GLADYS;
  let carriedBefore = null;
  try {
    const found = await getFeatureBySelector(gladys, config.pilot_wire_feature);
    carriedBefore = found ? found.feature.last_value : null;
  } catch (e) {
    // writePilotWireOrder looks it up again, and says why it cannot.
    logger.debug(`Thermostat schedule: pilot-wire order unreadable: ${e.message}`);
  }

  // Gladys only regulates a thermostat that has a room sensor (buildParamsConfig),
  // on the average of its probes (A.1.1). Each probe that cannot be read is left
  // out: this never rejects.
  const currentTemp = regulated
    ? await readAverageTemperature(gladys, config.temperature_features, config.temp_unit)
    : null;

  let order;
  let heating = false;
  let context = logContext;
  if (currentTemp !== null) {
    // A pilot-wire heater only heats, whatever the thermostat's mode says.
    heating = computeSwitchActive(
      currentTemp,
      setpoint,
      'heating',
      { ...config, control_type: 'hysteresis' },
      carriedBefore !== null && carriedBefore !== undefined && !isStandbyOrder(carriedBefore),
    );
    order = heating ? PILOT_WIRE_MODE.COMFORT : PILOT_WIRE_MODE.FROST_PROTECTION;
    context = `${logContext}, temp=${currentTemp}, setpoint=${setpoint}`;
  } else {
    order = forcedOrder !== null ? forcedOrder : pilotWireOrderForPreset(preset, config);
    if (order === undefined) {
      logger.debug(`Thermostat schedule: no pilot-wire order for preset "${preset}", the heater keeps its order`);
      // `schedule` with no point in force writes nothing, but a stale flame is
      // no truer for it.
      if (!regulated) {
        await retractStaleRunningState(gladys, device);
      }
      return;
    }
    if (regulated) {
      logger.info(`Thermostat schedule: room temperature unknown, the heater regulates alone (${logContext})`);
    }
    // Comfort, comfort -1 and -2 are all comfort chosen on the module itself,
    // which holds them as comfort (C.1.1): writing the order comfort is set to
    // over them would undo that choice within a minute — plain comfort over a
    // -1 pressed, or -1 over a plain comfort pressed when comfort sends -1.
    // Only when the heater regulates: under Gladys, comfort is just "heat", and
    // the temperature is Gladys's to decide.
    if (keepDerivedComfort && isComfortOrder(order) && isComfortOrder(carriedBefore) && order !== carriedBefore) {
      logger.debug(`Thermostat schedule: pilot-wire keeps the comfort ${carriedBefore} pressed (${context})`);
      order = carriedBefore;
    }
  }
  const carried = await writePilotWireOrder(
    gladys,
    config.pilot_wire_feature,
    order,
    context,
    selfWritten || new Map(),
  );
  if (carried === null || carried === undefined) {
    return;
  }
  // A heater regulating on its own setpoint may or may not be drawing current:
  // nothing Gladys reads tells, so it says nothing rather than guess — beyond
  // retracting a stale flame. Stopped, it is idle either way.
  if (!regulated && !stop) {
    await retractStaleRunningState(gladys, device);
    return;
  }
  // A write that failed leaves the previous order in force: the heater heats
  // only if the loop asks for it and that order lets it.
  const state =
    heating && !isStandbyOrder(carried) ? THERMOSTAT_OPERATING_STATE.HEATING : THERMOSTAT_OPERATING_STATE.IDLE;
  await saveOperatingState.call({ gladys }, device, state);
}

/**
 * @description The preset a manual hold stands for on a pilot-wire heater.
 *
 * A hold is a setpoint, and the wire takes no temperature. A preset picked by
 * hand holds that preset's own setpoint, so the preset the thermostat carries is
 * the answer whenever the two agree. A turn of the dial holds any value: it
 * becomes the order whose preset setpoint is nearest, a tie going to the warmer
 * one — someone asking for 19.5 °C between eco at 18 and comfort at 21 is
 * asking for warmth. Off is never held: picking it stores no setpoint, and the
 * preset path below sends it.
 * @param {{ setpoint: number }} hold - The manual hold.
 * @param {string|null} currentPreset - The preset the thermostat carries.
 * @param {object} config - Thermostat config object.
 * @returns {string} The preset to drive the heater with.
 * @example
 * pilotWirePresetForHold({ setpoint: 20 }, 'schedule', config); // 'comfort'
 */
function pilotWirePresetForHold(hold, currentPreset, config) {
  if (PRESETS_BY_PRIORITY.includes(currentPreset) && getSetpointForPreset(currentPreset, config) === hold.setpoint) {
    return currentPreset;
  }
  let nearest = null;
  let nearestDistance = Infinity;
  ['frost', 'eco', 'comfort'].forEach((preset) => {
    const distance = Math.abs(getSetpointForPreset(preset, config) - hold.setpoint);
    if (distance <= nearestDistance) {
      nearest = preset;
      nearestDistance = distance;
    }
  });
  return nearest;
}

/**
 * @description Drive a pilot-wire heater on a manual hold.
 *
 * When the heater regulates, the hold is turned into the order it stands for,
 * and a derived comfort the heater carries is kept when the hold asks for
 * comfort (see drivePilotWire). When Gladys regulates, the hold is regulated on
 * its own setpoint: a turn of the dial to 19.5 °C is then 19.5 °C, not the
 * nearest preset's.
 * @param {object} gladys - Gladys instance.
 * @param {object} device - The thermostat device.
 * @param {object} config - Thermostat config object.
 * @param {{ setpoint: number }} hold - The manual hold.
 * @param {string|null} currentPreset - The preset the thermostat carries.
 * @param {string} logContext - What this write is for, for the log line.
 * @param {Map<string, number>|null} selfWritten - Marks of the values this service wrote, if kept.
 * @returns {Promise<void>}
 * @example
 * await driveHeldPilotWire(gladys, device, config, { setpoint: 21 }, 'comfort', 'manual', new Map());
 */
async function driveHeldPilotWire(gladys, device, config, hold, currentPreset, logContext, selfWritten) {
  const heldPreset = pilotWirePresetForHold(hold, currentPreset, config);
  await drivePilotWire(gladys, device, config, heldPreset, logContext, selfWritten, {
    setpoint: hold.setpoint,
    keepDerivedComfort: true,
  });
}

/**
 * @description Regulate a single thermostat device: window check, manual mode,
 * schedule/preset resolution and switch actuation.
 * @param {object} gladys - Gladys instance.
 * @param {object} device - Thermostat device.
 * @param {number} dayOfWeek - Current day (0=Monday … 6=Sunday).
 * @param {number} currentMinutes - Current time in minutes since midnight.
 * @param {string} [serviceId] - This service's id, used to scope the runtime variables.
 * @param {Map<string, number>} [selfWritten] - Marks of the setpoints this service wrote.
 * @param {Map<string, string>} [announced] - The programme preset last announced for each thermostat.
 * @param {Map<string, number>} [selfWrittenPowers] - Marks of the powers this service wrote.
 * @param {Set<string>} [runningUnits] - The units a running thermostat switches (runningUnitFeatures).
 * @returns {Promise<void>}
 * @example
 * await regulateDevice(gladys, device, 0, 480, serviceId);
 */
async function regulateDevice(
  gladys,
  device,
  dayOfWeek,
  currentMinutes,
  serviceId = null,
  selfWritten = null,
  announced = null,
  selfWrittenPowers = null,
  runningUnits = null,
) {
  const config = getDeviceConfig(device);
  if (!config) {
    logger.warn(`Thermostat schedule: no config found for device "${device && device.name}"`);
    return;
  }
  const external = isExternal(config);

  // A virtual thermostat owns its setpoint feature; an external one has none,
  // and is identified by the feature of the real device it drives. Either way
  // the selector is what keys the runtime variables and what the widget holds,
  // so the rest of the loop is written once for both.
  const thermostatFeature = external ? null : getThermostatFeature(device);
  const selector = external ? config.target_feature : thermostatFeature && thermostatFeature.selector;
  if (!selector) {
    logger.debug('Thermostat schedule: device has no setpoint to regulate, skipping');
    return;
  }
  // getDeviceConfig always fills this in from THERMOSTAT_MODE or the shared default.
  const { default_mode: mode } = config;

  // Window open check: if any configured window sensor is open, cut the switch and stop here.
  if (config.window_features.length > 0) {
    const openWindow = await findOpenWindow(gladys, config.window_features);
    if (openWindow) {
      logger.info(`Thermostat schedule: window open (${openWindow}) for ${selector}`);
      if (external) {
        // Nothing to cut: the real thermostat holds the contact. Writing the
        // frost-protection setpoint is what stops it heating, and its mode is
        // turned off too when it exposes one — a thermostat left in `heating`
        // fires again as soon as the room drops below the frost setpoint,
        // window open or not. The schedule restores both on the next pass
        // once the window closes.
        await stopExternalThermostat(gladys, config, `window open, ${selector}`, selfWritten, selfWrittenPowers);
      } else if (config.pilot_wire_feature) {
        // A pilot-wire heater is stopped by the order, not by cutting its
        // supply: the wire is a command line, not the power feed. Frost
        // protection rather than off, as the external path writes the frost
        // setpoint: off also turns the heater's own frost guard off, for a
        // window left open on a winter night. A heater stopped already keeps
        // its off: the window must not raise it to frost protection, then
        // drop it back to off once closed.
        await drivePilotWire(
          gladys,
          device,
          config,
          'off',
          `window open, ${selector}`,
          selfWritten,
          isStopped(device) ? {} : { order: PILOT_WIRE_MODE.FROST_PROTECTION },
        );
      } else if (config.switch_feature) {
        await actuateSwitch(gladys, config.switch_feature, false, `window open, ${selector}`);
        await saveOperatingState.call({ gladys }, device, THERMOSTAT_OPERATING_STATE.IDLE);
      }
      return;
    }
  }

  // Stopped by hand: the machine is off, which outranks the programme. Without
  // this the pass triggered by the stop itself would resolve the schedule's
  // preset and start the heating again within seconds — the stop would undo
  // itself. It holds until a mode is written back, or for a stop made on the
  // unit, until the programme's next point.
  const lifted = await liftRemoteStop(gladys, device, config);
  if (!lifted && isStopped(device)) {
    logger.debug(`Thermostat schedule: ${selector} is stopped, leaving it alone`);
    await saveActivePreset.call({ gladys }, device, 'off');
    if (external && runningUnits && runningUnits.has(unitFeature(config))) {
      // Another thermostat runs this unit: it is the one to switch it.
      logger.debug(`Thermostat schedule: ${selector} is stopped, its unit is another thermostat's to run`);
    } else if (external) {
      await stopExternalThermostat(gladys, config, `mode=off, ${selector}`, selfWritten, selfWrittenPowers);
    } else if (config.pilot_wire_feature) {
      await drivePilotWire(gladys, device, config, 'off', `mode=off, ${selector}`, selfWritten);
    } else if (config.switch_feature) {
      await actuateSwitch(gladys, config.switch_feature, false, `mode=off, ${selector}`);
      await saveOperatingState.call({ gladys }, device, THERMOSTAT_OPERATING_STATE.IDLE);
    }
    return;
  }

  // The preset the thermostat carries, and the hold armed on it: both are on the
  // device now — the preset as a feature, the hold as params — so neither costs
  // a variable round-trip, and a scene can read and write them.
  // A lift hands a thermostat on a programme back to it, which the device read
  // before the lift does not say yet.
  const handedBack = lifted && (await followsSchedule(device.id));
  let currentPreset = handedBack ? 'schedule' : getPreset(device);
  const hold = handedBack ? null : getManualHold(device);

  // Manual hold: regulate on the held setpoint until it expires.
  let manualJustExpired = false;
  if (hold) {
    let manualUntil = hold.until;
    // A hold taken while the device followed no schedule is permanent by design.
    // If a schedule is attached afterwards, that hold would never expire and the
    // schedule would never take over, while the widget — which only renders the
    // countdown when an expiry is set — would display the schedule banner with
    // no way to cancel. Arming the expiry here makes the device behave exactly
    // like one scheduled from the start.
    if (!manualUntil && (await followsSchedule(device.id))) {
      // No configured duration means "until the next schedule point", but this
      // hold predates the schedule and has no point to aim at yet: the shared
      // default is what arms it, and the next hold taken will follow the slots.
      const duration = config.manual_duration === null ? DEFAULT_MANUAL_DURATION_MINUTES : config.manual_duration;
      manualUntil = Date.now() + duration * 60 * 1000;
      await setManualHold.call({ gladys }, device, hold.setpoint, manualUntil);
      logger.info(
        `Thermostat schedule: permanent manual hold on ${selector} now follows a schedule, ` +
          `expiry armed until ${new Date(manualUntil).toISOString()}`,
      );
    }
    if (manualUntil && Date.now() > manualUntil) {
      logger.info(`Thermostat schedule: manual hold expired for ${selector}, reverting to schedule`);
      await clearManualHold.call({ gladys }, device);
      // Hand the thermostat back to its programme rather than to the preset the
      // hold was on: the preset feature has to read `schedule` again, or the
      // next pass would take that stale preset for a deliberate choice and stop
      // following the programme for good.
      await savePreset.call({ gladys }, device, 'schedule');
      currentPreset = 'schedule';
      manualJustExpired = true;
      // Fall through — the schedule/preset is applied below
    } else {
      const manualSetpoint = hold.setpoint;
      // A preset picked by hand is held this way, and it is the one in force. A
      // hold taken on the dial names no preset: the feature keeps the last one.
      await saveActivePreset.call({ gladys }, device, currentPreset);
      if (external) {
        // The real thermostat regulates itself: hand it the held setpoint and
        // let it decide when to fire. There is no room sensor to read and no
        // hysteresis to run — running one here would fight the device's own.
        // The power and the mode are handed back first: a setpoint written to a
        // thermostat still switched off by a previous `off` preset would change nothing.
        await startExternalThermostat(gladys, config, `manual, ${selector}`, selfWrittenPowers);
        // The hold is stored in the unit it was set in, which on an external
        // thermostat is the real feature's own: the widget dial reads that
        // feature's unit, and a change made on the device arrives in it too.
        // Passing null says so, so it is written through untouched.
        await writeExternalSetpoint(
          gladys,
          config.target_feature,
          manualSetpoint,
          null,
          `manual, ${selector}`,
          selfWritten,
        );
        return;
      }
      // The setpoint the thermostat is aiming for, on its own feature. A hold is
      // armed by every preset the user picks, so this is the ordinary case rather
      // than an edge one: leaving the feature behind means scenes, MQTT and
      // HomeKit read a setpoint the thermostat stopped regulating on (B.3).
      if (manualSetpoint !== null && thermostatFeature.last_value !== manualSetpoint) {
        try {
          await gladys.device.saveState(thermostatFeature, manualSetpoint);
        } catch (e) {
          logger.warn(`Thermostat schedule: Failed to update setpoint: ${e.message}`);
        }
      }
      // A pilot-wire heater takes an order, not a setpoint: the hold is turned
      // into the order it stands for. Picking a preset by hand arms a hold, so
      // without this branch no preset chosen in the widget ever reached the
      // heater — the switch below is the only actuator this path drove.
      if (config.pilot_wire_feature) {
        await driveHeldPilotWire(
          gladys,
          device,
          config,
          hold,
          currentPreset,
          `manual, setpoint=${manualSetpoint}, ${selector}`,
          selfWritten,
        );
        return;
      }
      if (manualSetpoint !== null && config.switch_feature && config.temperature_features.length > 0) {
        const manualTemp = await readAverageTemperature(gladys, config.temperature_features, config.temp_unit);
        const sw = await getFeatureBySelector(gladys, config.switch_feature);
        if (sw && manualTemp !== null) {
          const shouldBeActive = computeSwitchActive(
            manualTemp,
            manualSetpoint,
            mode,
            config,
            sw.feature.last_value === 1,
            Date.now(),
            selector,
          );
          await actuateSwitch(
            gladys,
            config.switch_feature,
            shouldBeActive,
            `manual, setpoint=${manualSetpoint}, temp=${manualTemp}, ${selector}`,
          );
          // Same reason as on the schedule path: what the loop decided is said on
          // a standard feature rather than left to be inferred from the switch.
          let manualState = THERMOSTAT_OPERATING_STATE.IDLE;
          if (shouldBeActive) {
            manualState = mode === 'cooling' ? THERMOSTAT_OPERATING_STATE.COOLING : THERMOSTAT_OPERATING_STATE.HEATING;
          }
          await saveOperatingState.call({ gladys }, device, manualState);
        }
      }
      return;
    }
  }

  // Resolve the target preset from the schedule this thermostat follows, then
  // fall back on the current preset. Which schedule it follows is a relation
  // (t_thermostat_schedule_device), not a device param and not a dashboard
  // setting: a private dashboard can never drive the regulation of the house.
  let targetPreset = null;
  const link = await db.ThermostatScheduleDevice.findOne({
    where: { device_id: device.id },
    include: [
      {
        model: db.ThermostatSchedule,
        as: 'schedule',
        include: [{ model: db.ThermostatScheduleTransition, as: 'transitions' }],
      },
    ],
  });
  // The programme applies only while the thermostat asks to follow it: that is
  // what the `schedule` preset means. A preset the user picked — or a scene set
  // — is a decision that outranks the programme, and reading the schedule
  // regardless would overwrite it on the very next tick. A thermostat carrying
  // no preset at all has never been driven: it follows its schedule if it has
  // one, which is what a freshly attached programme should do.
  const followsProgramme = currentPreset === 'schedule' || currentPreset === null;
  let fromProgramme = false;
  if (followsProgramme && link && link.schedule) {
    // The last point at or before now, the week wrapping onto its last point:
    // there is no gap to fall through and no interval to reconstruct.
    const transition = findCurrentTransition(link.schedule.transitions, dayOfWeek, currentMinutes);
    targetPreset = transition ? transition.preset : null;
    fromProgramme = targetPreset !== null;
  }
  if (!targetPreset) {
    targetPreset = currentPreset || null;
  }
  if (!targetPreset) {
    logger.debug(`Thermostat schedule: no preset resolved for ${selector}, nothing to regulate`);
    return;
  }

  // `schedule` with no point in force: a schedule with no point, or none followed
  // any more — an empty programme, a scene writing Schedule, a hold expiring on
  // either. The programme names no temperature, so the thermostat keeps the one
  // it has: the real one keeps regulating on its own, and a virtual one on its
  // setpoint feature. Resolving `schedule` as a preset fell back on 20 °C, and
  // heated a room nobody had asked to heat. Detaching or deleting a schedule
  // goes further, and leaves the point that was in force (see scheduleDevice).
  // The preset is still pushed below: a hold expiring here has to tell the
  // widgets it is over.
  const keepsItsSetpoint = targetPreset === 'schedule';
  const hasSetpoint = !external && thermostatFeature.last_value !== null && thermostatFeature.last_value !== undefined;

  // Enforce the target setpoint, only when it changed. On a virtual thermostat
  // the setpoint is this service's own feature, so it is persisted directly; on
  // an external one it belongs to the real device, and the write is routed
  // through the core to the owning integration.
  let newSetpoint = null;
  if (!keepsItsSetpoint) {
    newSetpoint = getSetpointForPreset(targetPreset, config);
  } else if (hasSetpoint) {
    newSetpoint = thermostatFeature.last_value;
  }
  if (newSetpoint !== null && !external && thermostatFeature.last_value !== newSetpoint) {
    try {
      await gladys.device.saveState(thermostatFeature, newSetpoint);
    } catch (e) {
      logger.warn(`Thermostat schedule: Failed to update setpoint: ${e.message}`);
    }
  }

  // Notify the preset when it changed, and also when leaving manual mode:
  // dashboards then display the manual preset, so they need the current one
  // pushed back even though the stored value never moved.
  //
  // A preset the programme resolved is only announced, never stored: the feature
  // has to keep reading `schedule`, or the next pass would take that resolved
  // preset for a deliberate choice, `followsProgramme` would turn false and the
  // thermostat would stay frozen on the first point it ever applied. What the
  // programme currently means is already served by the schedule's `current`,
  // which is what the widget reads.
  //
  // While the feature reads `schedule`, it never equals the resolved preset, so
  // that comparison alone announced — and logged — the same preset every minute
  // for every thermostat on a programme. What was last announced is kept per
  // thermostat instead, and only a change of the point in force is pushed.
  if (fromProgramme) {
    const alreadyAnnounced = announced && announced.get(device.selector) === targetPreset;
    if (!alreadyAnnounced || manualJustExpired) {
      announcePreset.call({ gladys }, device, targetPreset);
      if (announced) {
        announced.set(device.selector, targetPreset);
      }
      logger.info(`Thermostat schedule: preset "${targetPreset}" applied to ${selector}`);
    }
  } else {
    // Off the programme: the next time it is followed, its point is new again.
    if (announced) {
      announced.delete(device.selector);
    }
    if (currentPreset !== targetPreset || manualJustExpired) {
      await savePreset.call({ gladys }, device, targetPreset, manualJustExpired);
      logger.info(`Thermostat schedule: preset "${targetPreset}" applied to ${selector}`);
    }
  }

  // What is in force, on a feature a scene can start on: the announcement above
  // only reaches the dashboards, and the preset feature keeps reading
  // `schedule`. `schedule` itself writes nothing — no point is in force.
  await saveActivePreset.call({ gladys }, device, targetPreset);

  if (keepsItsSetpoint && !hasSetpoint) {
    logger.debug(`Thermostat schedule: no point in force for ${selector}, it keeps its setpoint`);
    return;
  }

  if (external) {
    // The real thermostat runs its own heuristic off this setpoint, so there is
    // nothing left to decide here: no hysteresis, no TPI, no switch. `off` puts
    // the device's mode on OFF when it exposes one, and always writes the
    // frost-protection setpoint — the only way to say "stop" that every
    // thermostat understands, mode feature or not.
    if (targetPreset === 'off') {
      await stopExternalThermostat(gladys, config, `preset="off", ${selector}`, selfWritten, selfWrittenPowers);
      return;
    }
    // Coming back from an `off` slot, the device is still switched off: the
    // power and the mode have to be handed back before the setpoint means anything.
    await startExternalThermostat(gladys, config, `preset="${targetPreset}", ${selector}`, selfWrittenPowers);
    if (newSetpoint !== null) {
      await writeExternalSetpoint(
        gladys,
        config.target_feature,
        newSetpoint,
        config.temp_unit,
        `preset="${targetPreset}", ${selector}`,
        selfWritten,
      );
    }
    return;
  }

  // A pilot-wire heater takes an order, not a setpoint: drivePilotWire turns
  // the preset into one, or regulates on the room sensor when Gladys does.
  // `schedule` with no point in force names no order: the heater keeps the one
  // it carries, unless Gladys regulates on the setpoint it kept.
  if (config.pilot_wire_feature) {
    await drivePilotWire(gladys, device, config, targetPreset, `preset="${targetPreset}", ${selector}`, selfWritten, {
      setpoint: newSetpoint,
    });
    return;
  }

  if (!config.switch_feature) {
    logger.debug(`Thermostat schedule: no switch_feature configured for ${selector}, cannot actuate switch`);
    return;
  }

  if (targetPreset === 'off') {
    await actuateSwitch(gladys, config.switch_feature, false, `preset=off, ${selector}`);
    await saveOperatingState.call({ gladys }, device, THERMOSTAT_OPERATING_STATE.IDLE);
    return;
  }

  if (config.temperature_features.length === 0) {
    logger.warn(`Thermostat schedule: no temperature sensor configured for ${selector}, cannot compute switch state`);
    return;
  }

  // Each probe that cannot be read is left out: this never rejects.
  const currentTemp = await readAverageTemperature(gladys, config.temperature_features, config.temp_unit);
  if (currentTemp === null) {
    logger.warn(
      `Thermostat schedule: no temperature reading for ${config.temperature_features.join(', ')}, ` +
        'cannot compute switch state',
    );
    return;
  }

  const sw = await getFeatureBySelector(gladys, config.switch_feature);
  if (!sw) {
    logger.warn(`Thermostat schedule: switch device/feature not found for selector="${config.switch_feature}"`);
    return;
  }
  const shouldBeActive = computeSwitchActive(
    currentTemp,
    newSetpoint,
    mode,
    config,
    sw.feature.last_value === 1,
    Date.now(),
    selector,
  );
  await actuateSwitch(
    gladys,
    config.switch_feature,
    shouldBeActive,
    `preset="${targetPreset}", temp=${currentTemp}, setpoint=${newSetpoint}, ${selector}`,
  );
  // Say on a standard feature what the loop just decided, rather than leaving
  // every client to infer it from the switch: a virtual thermostat knows whether
  // it is heating, and HomeKit and the rest of the house can read it here.
  let operatingState = THERMOSTAT_OPERATING_STATE.IDLE;
  if (shouldBeActive) {
    operatingState = mode === 'cooling' ? THERMOSTAT_OPERATING_STATE.COOLING : THERMOSTAT_OPERATING_STATE.HEATING;
  }
  await saveOperatingState.call({ gladys }, device, operatingState);
}

/**
 * @description Regulate all thermostats. Called every minute by the service interval.
 * Resolves the target preset (schedule slot, or current preset when no schedule),
 * updates the setpoint/preset when they changed, and actuates the switch
 * (hysteresis or TPI). The server is the single control authority.
 * @returns {Promise<void>}
 * @example
 * await thermostatHandler.applySchedules();
 */
async function applySchedules() {
  try {
    const thermostatDevices = await this.gladys.device.get({ service: 'thermostat' });
    if (!thermostatDevices || thermostatDevices.length === 0) {
      logger.debug('Thermostat schedule: no thermostat devices found');
      return;
    }
    logger.debug(`Thermostat schedule: found ${thermostatDevices.length} thermostat device(s)`);

    // Schedules are wall-clock times in the house, and official Gladys images run
    // in UTC: read the day and time in the configured timezone, like scenes do.
    const timezone =
      (await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE).catch(() => null)) || DEFAULT_TIMEZONE;
    const { dayOfWeek, currentMinutes } = getCurrentDayAndMinutes(new Date(), timezone);

    const runningUnits = runningUnitFeatures(thermostatDevices);

    await Promise.all(
      thermostatDevices.map(async (device) => {
        try {
          const { serviceId, selfWrittenSetpoints, announcedPresets, selfWrittenPowers } = this;
          await regulateDevice(
            this.gladys,
            device,
            dayOfWeek,
            currentMinutes,
            serviceId,
            selfWrittenSetpoints,
            announcedPresets,
            selfWrittenPowers,
            runningUnits,
          );
        } catch (e) {
          logger.warn(`Thermostat schedule: Failed to regulate device: ${e.message}`);
        }
      }),
    );
  } catch (e) {
    logger.warn(`Thermostat applySchedules error: ${e.message}`);
  }
}

module.exports = {
  applySchedules,
  DEFAULT_TIMEZONE,
  getThermostatFeature,
  writeExternalSetpoint,
  convertSetpointToFeatureUnit,
  writeExternalMode,
  stopExternalThermostat,
  startExternalThermostat,
  runningUnitFeatures,
  unitFeature,
  drivePilotWire,
  driveHeldPilotWire,
  pilotWirePresetForHold,
  presetForPilotWireOrder,
  pilotWireOrderForPreset,
  getRunningMode,
  readTemperatureInThermostatUnit,
  readAverageTemperature,
  findOpenWindow,
  phaseOffset,
  regulateDevice,
  parseEnd,
  findMatchingPreset,
  getSetpointForPreset,
  computeSwitchActive,
};
