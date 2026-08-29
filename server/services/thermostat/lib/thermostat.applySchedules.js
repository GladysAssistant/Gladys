const db = require('../../../models');
const logger = require('../../../utils/logger');
const {
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
  SYSTEM_VARIABLE_NAMES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  THERMOSTAT_MODE,
} = require('../../../utils/constants');
const { celsiusToFahrenheit, fahrenheitToCelsius } = require('../../../utils/units');
const { toNumber, getDeviceConfig, getFeatureBySelector, isExternal } = require('./thermostat.deviceConfig');
const { parseEnd, findMatchingPreset, getCurrentDayAndMinutes } = require('../../../utils/thermostatSchedule');
const {
  DEFAULT_PRESET_TEMPS,
  FALLBACK_SETPOINT,
  DEFAULT_TPI_CYCLE_TIME,
  DEFAULT_TPI_PROPORTIONAL_BAND,
  DEFAULT_HYSTERESIS_START,
  DEFAULT_HYSTERESIS_STOP,
  MIN_TPI_CYCLE_TIME,
  MAX_TPI_CYCLE_TIME,
  MIN_TPI_PROPORTIONAL_BAND,
  MAX_TPI_PROPORTIONAL_BAND,
} = require('../../../utils/thermostatConstants');

const DEFAULT_TIMEZONE = 'Europe/Paris';

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
 * @param {string} thermostatUnit - Thermostat unit param, 'C' or 'F'.
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
    if (featureUnit === DEVICE_FEATURE_UNITS.FAHRENHEIT && thermostatUnit === 'C') {
      value = celsiusToFahrenheit(setpoint);
    } else if (featureUnit === DEVICE_FEATURE_UNITS.CELSIUS && thermostatUnit === 'F') {
      value = fahrenheitToCelsius(setpoint);
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
    // The device advertises the modes it accepts: a heating-only thermostat
    // declares max = 1 (OFF, HEATING) and rejects COOLING or AUTO. Asking for a
    // mode it does not support would be refused by the integration, so fall
    // back to the highest it does accept rather than write something invalid.
    const max = toNumber(found.feature.max, null);
    let value = mode;
    if (max !== null && value > max) {
      logger.info(`Thermostat schedule: mode ${value} above the device maximum ${max}, clamped (${logContext})`);
      value = max;
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
 * @description The THERMOSTAT_MODE value a running external thermostat should carry.
 * The thermostat's own `default_mode` param is the intent the user configured
 * ("this device heats" / "this device cools"), and it is what the mode feature
 * has to be handed back to once the heating resumes after an `off` slot.
 * @param {object} config - Thermostat config object.
 * @returns {number} A value from the THERMOSTAT_MODE enum.
 * @example
 * getRunningMode({ default_mode: 'cooling' }); // THERMOSTAT_MODE.COOLING
 */
function getRunningMode(config) {
  return config && config.default_mode === 'cooling' ? THERMOSTAT_MODE.COOLING : THERMOSTAT_MODE.HEATING;
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
  return DEFAULT_PRESET_TEMPS[preset] !== undefined ? DEFAULT_PRESET_TEMPS[preset] : FALLBACK_SETPOINT;
}

/**
 * @description Stop an external thermostat.
 *
 * Two things say "stop" to a real thermostat, and which one it understands
 * depends on the device: the operating mode, which almost none expose, and the
 * frost-protection setpoint, which every thermostat accepting a setpoint at all
 * understands. Both are written when both are configured — the mode is what
 * actually stops it, and the setpoint keeps the frost protection in place for a
 * device that would otherwise be left on its comfort target.
 * @param {object} gladys - Gladys instance.
 * @param {object} config - Thermostat config object.
 * @param {string} logContext - Context for the log lines.
 * @param {Map<string, number>} [selfWritten] - Marks of the setpoints this service wrote.
 * @returns {Promise<void>}
 * @example
 * await stopExternalThermostat(gladys, config, 'preset=off, salon');
 */
async function stopExternalThermostat(gladys, config, logContext, selfWritten) {
  const frostSetpoint = getSetpointForPreset('frost', config);
  if (frostSetpoint !== null) {
    await writeExternalSetpoint(
      gladys,
      config.target_feature,
      frostSetpoint,
      config.temp_unit,
      logContext,
      selfWritten,
    );
  }
  if (config.mode_feature) {
    await writeExternalMode(gladys, config.mode_feature, THERMOSTAT_MODE.OFF, logContext);
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
 * @description Read the switch feature and actuate it if its state differs from the desired one.
 * @param {object} gladys - Gladys instance.
 * @param {string} switchSelector - Switch feature selector.
 * @param {boolean} shouldBeActive - Desired state.
 * @param {string} logContext - Context string for logs.
 * @returns {Promise<void>}
 * @example
 * await actuateSwitch(gladys, 'heater-switch', true, 'preset=comfort');
 */
async function actuateSwitch(gladys, switchSelector, shouldBeActive, logContext) {
  try {
    const found = await getFeatureBySelector(gladys, switchSelector);
    if (!found) {
      logger.warn(`Thermostat schedule: switch device/feature not found for selector="${switchSelector}"`);
      return;
    }
    const currentSwitchOn = found.feature.last_value === 1;
    if (currentSwitchOn !== shouldBeActive) {
      await gladys.device.setValue(found.device, found.feature, shouldBeActive ? 1 : 0);
      logger.info(`Thermostat schedule: switch ${shouldBeActive ? 'ON' : 'OFF'} (${logContext})`);
    } else {
      logger.debug(`Thermostat schedule: switch already ${shouldBeActive ? 'ON' : 'OFF'} (${logContext})`);
    }
  } catch (e) {
    logger.warn(`Thermostat schedule: Failed to actuate switch: ${e.message}`);
  }
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
 * @returns {Promise<void>}
 * @example
 * await regulateDevice(gladys, device, 0, 480, serviceId);
 */
async function regulateDevice(gladys, device, dayOfWeek, currentMinutes, serviceId = null, selfWritten = null) {
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
  const featureKey = selector.toUpperCase().replace(/-/g, '_');
  const presetVarKey = `THERMOSTAT_${featureKey}_PRESET`;
  const manualVarKey = `THERMOSTAT_${featureKey}_MANUAL_MODE`;
  // getDeviceConfig always fills this in from THERMOSTAT_MODE or the shared default.
  const { default_mode: mode } = config;

  // Window open check: if a window sensor is configured and open, cut the switch and stop here.
  if (config.window_feature) {
    try {
      const win = await getFeatureBySelector(gladys, config.window_feature);
      if (win && win.feature.last_value === 0) {
        logger.info(`Thermostat schedule: window open for ${selector}`);
        if (external) {
          // Nothing to cut: the real thermostat holds the contact. Writing the
          // frost-protection setpoint is what stops it heating, and its mode is
          // turned off too when it exposes one — a thermostat left in `heating`
          // fires again as soon as the room drops below the frost setpoint,
          // window open or not. The schedule restores both on the next pass
          // once the window closes.
          await stopExternalThermostat(gladys, config, `window open, ${selector}`, selfWritten);
        } else if (config.switch_feature) {
          await actuateSwitch(gladys, config.switch_feature, false, `window open, ${selector}`);
        }
        return;
      }
    } catch (e) {
      logger.warn(`Thermostat schedule: Failed to read window sensor: ${e.message}`);
    }
  }

  const [currentPreset, manualVal] = await Promise.all([
    gladys.variable.getValue(presetVarKey, serviceId).catch(() => null),
    gladys.variable.getValue(manualVarKey, serviceId).catch(() => null),
  ]);

  // Manual mode: regulate on the manual setpoint until the timer expires.
  let manualJustExpired = false;
  if (manualVal === 'true') {
    const manualUntilKey = `THERMOSTAT_${featureKey}_MANUAL_UNTIL`;
    const manualUntilVal = await gladys.variable.getValue(manualUntilKey, serviceId).catch(() => null);
    let manualUntil = manualUntilVal ? parseInt(manualUntilVal, 10) : null;
    // A hold taken while the device followed no schedule is permanent by design
    // (setValue writes an empty expiry). If a schedule is attached afterwards,
    // that hold would never expire and the schedule would never take over, while
    // the widget — which only renders the manual banner when an expiry is set —
    // would display the schedule banner with no way to cancel. Arming the expiry
    // here makes the device behave exactly like one scheduled from the start.
    if (!manualUntil && config.active_schedule) {
      manualUntil = Date.now() + config.manual_duration * 60 * 1000;
      await gladys.variable.setValue(manualUntilKey, String(manualUntil), serviceId);
      logger.info(
        `Thermostat schedule: permanent manual hold on ${selector} now follows a schedule, ` +
          `expiry armed until ${new Date(manualUntil).toISOString()}`,
      );
      gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED,
        // The expiry rides along: an open widget holds `manualUntil: null` for a
        // permanent hold, and would otherwise keep rendering the schedule banner
        // with no cancel button until it is reloaded.
        payload: { key: manualVarKey, value: 'true', manualUntil: String(manualUntil) },
      });
    }
    if (manualUntil && Date.now() > manualUntil) {
      logger.info(`Thermostat schedule: manual timer expired for ${selector}, reverting to schedule`);
      await gladys.variable.setValue(manualVarKey, 'false', serviceId);
      await gladys.variable.setValue(manualUntilKey, '', serviceId);
      gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED,
        payload: { key: manualVarKey, value: 'false' },
      });
      manualJustExpired = true;
      // Fall through — the schedule/preset is applied below
    } else {
      // A manual hold on the `off` preset means the user asked for the heating to
      // stop, not for a setpoint to be held: the widget writes PRESET=off before
      // arming the hold, and scenes reach the same state through setValue. Without
      // this, the loop would regulate on the setpoint that was current *before*
      // Off was tapped and keep the heater running until the hold expires.
      if (currentPreset === 'off') {
        if (external) {
          await stopExternalThermostat(gladys, config, `manual preset=off, ${selector}`, selfWritten);
        } else if (config.switch_feature) {
          await actuateSwitch(gladys, config.switch_feature, false, `manual preset=off, ${selector}`);
        }
        return;
      }

      const manualSetpointRaw = await gladys.variable
        .getValue(`THERMOSTAT_${featureKey}_MANUAL_SETPOINT`, serviceId)
        .catch(() => null);
      let manualSetpoint = null;
      if (manualSetpointRaw) {
        try {
          const parsed = JSON.parse(manualSetpointRaw);
          manualSetpoint = toNumber(parsed && parsed.setpoint, null);
        } catch (e) {
          /* ignore */
        }
      }
      if (manualSetpoint !== null && external) {
        // The real thermostat regulates itself: hand it the held setpoint and
        // let it decide when to fire. There is no room sensor to read and no
        // hysteresis to run — running one here would fight the device's own.
        // The mode is handed back first: a setpoint written to a thermostat
        // still switched off by a previous `off` preset would change nothing.
        if (config.mode_feature) {
          await writeExternalMode(gladys, config.mode_feature, getRunningMode(config), `manual, ${selector}`);
        }
        await writeExternalSetpoint(
          gladys,
          config.target_feature,
          manualSetpoint,
          config.temp_unit,
          `manual, ${selector}`,
          selfWritten,
        );
        return;
      }
      if (manualSetpoint !== null && config.switch_feature && config.temperature_feature) {
        const tmp = await getFeatureBySelector(gladys, config.temperature_feature);
        const sw = await getFeatureBySelector(gladys, config.switch_feature);
        const manualTemp = tmp ? readTemperatureInThermostatUnit(tmp.feature, config.temp_unit) : null;
        if (tmp && sw && manualTemp !== null) {
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
        }
      }
      return;
    }
  }

  // Resolve the target preset: schedule slot first, then the current preset variable.
  // A thermostat without schedule (or between slots) keeps being regulated on its preset.
  // The active schedule is device-owned: dashboards only choose which thermostat to
  // display, so a private dashboard can never drive the regulation of the whole house.
  const scheduleSelector = config.active_schedule || null;

  let targetPreset = null;
  if (scheduleSelector) {
    const schedule = await db.ThermostatSchedule.findOne({
      where: { selector: scheduleSelector },
      include: [{ model: db.ThermostatScheduleSlot, as: 'slots' }],
    });
    if (schedule) {
      const slotsForToday = schedule.slots.filter((s) => s.day_of_week === dayOfWeek);
      const yesterdayOfWeek = (dayOfWeek + 6) % 7;
      const slotsForYesterday = schedule.slots.filter((s) => s.day_of_week === yesterdayOfWeek);
      targetPreset = findMatchingPreset(slotsForToday, slotsForYesterday, currentMinutes);
    }
  }
  if (!targetPreset) {
    targetPreset = currentPreset || null;
  }
  if (!targetPreset) {
    logger.debug(`Thermostat schedule: no preset resolved for ${selector}, nothing to regulate`);
    return;
  }

  // Enforce the target setpoint, only when it changed. On a virtual thermostat
  // the setpoint is this service's own feature, so it is persisted directly; on
  // an external one it belongs to the real device, and the write is routed
  // through the core to the owning integration.
  const newSetpoint = getSetpointForPreset(targetPreset, config);
  if (newSetpoint !== null && !external && thermostatFeature.last_value !== newSetpoint) {
    try {
      await gladys.device.saveState(thermostatFeature, newSetpoint);
    } catch (e) {
      logger.warn(`Thermostat schedule: Failed to update setpoint: ${e.message}`);
    }
  }

  // Persist + notify the preset when it changed, and also when leaving manual
  // mode: dashboards then display the manual preset, so they need the schedule
  // preset pushed back even though the stored value never moved.
  if (currentPreset !== targetPreset || manualJustExpired) {
    await gladys.variable.setValue(presetVarKey, targetPreset, serviceId);
    logger.info(`Thermostat schedule: preset "${targetPreset}" applied to ${selector}`);
    gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.PRESET_UPDATED,
      payload: { key: presetVarKey, value: targetPreset },
    });
  }

  if (external) {
    // The real thermostat runs its own heuristic off this setpoint, so there is
    // nothing left to decide here: no hysteresis, no TPI, no switch. `off` puts
    // the device's mode on OFF when it exposes one, and always writes the
    // frost-protection setpoint — the only way to say "stop" that every
    // thermostat understands, mode feature or not.
    if (targetPreset === 'off') {
      await stopExternalThermostat(gladys, config, `preset="off", ${selector}`, selfWritten);
      return;
    }
    // Coming back from an `off` slot, the device is still switched off: the
    // mode has to be handed back before the setpoint means anything.
    if (config.mode_feature) {
      await writeExternalMode(
        gladys,
        config.mode_feature,
        getRunningMode(config),
        `preset="${targetPreset}", ${selector}`,
      );
    }
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

  if (!config.switch_feature) {
    logger.debug(`Thermostat schedule: no switch_feature configured for ${selector}, cannot actuate switch`);
    return;
  }

  if (targetPreset === 'off') {
    await actuateSwitch(gladys, config.switch_feature, false, `preset=off, ${selector}`);
    return;
  }

  if (!config.temperature_feature) {
    logger.warn(`Thermostat schedule: no temperature_feature configured for ${selector}, cannot compute switch state`);
    return;
  }

  let currentTemp = null;
  try {
    const tmp = await getFeatureBySelector(gladys, config.temperature_feature);
    currentTemp = tmp ? readTemperatureInThermostatUnit(tmp.feature, config.temp_unit) : null;
  } catch (e) {
    logger.warn(`Thermostat schedule: Failed to read temperature: ${e.message}`);
    return;
  }
  if (currentTemp === null || currentTemp === undefined) {
    logger.warn(
      `Thermostat schedule: no temperature reading for ${config.temperature_feature}, cannot compute switch state`,
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

    await Promise.all(
      thermostatDevices.map(async (device) => {
        try {
          const { serviceId, selfWrittenSetpoints } = this;
          await regulateDevice(this.gladys, device, dayOfWeek, currentMinutes, serviceId, selfWrittenSetpoints);
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
  getThermostatFeature,
  writeExternalSetpoint,
  writeExternalMode,
  stopExternalThermostat,
  getRunningMode,
  readTemperatureInThermostatUnit,
  phaseOffset,
  regulateDevice,
  parseEnd,
  findMatchingPreset,
  getSetpointForPreset,
  computeSwitchActive,
};
