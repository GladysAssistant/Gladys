const db = require('../../../models');
const logger = require('../../../utils/logger');
const {
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
  SYSTEM_VARIABLE_NAMES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
} = require('../../../utils/constants');
const { toNumber, getDeviceConfig, getFeatureBySelector } = require('./thermostat.deviceConfig');
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
 * @returns {Promise<void>}
 * @example
 * await regulateDevice(gladys, device, 0, 480, serviceId);
 */
async function regulateDevice(gladys, device, dayOfWeek, currentMinutes, serviceId = null) {
  const thermostatFeature = getThermostatFeature(device);
  if (!thermostatFeature) {
    logger.debug('Thermostat schedule: device has no target-temperature feature, skipping');
    return;
  }
  const { selector } = thermostatFeature;
  const featureKey = selector.toUpperCase().replace(/-/g, '_');
  const presetVarKey = `THERMOSTAT_${featureKey}_PRESET`;
  const manualVarKey = `THERMOSTAT_${featureKey}_MANUAL_MODE`;

  const config = getDeviceConfig(device);
  if (!config) {
    logger.warn(`Thermostat schedule: no config found for ${selector}`);
    return;
  }
  // getDeviceConfig always fills this in from THERMOSTAT_MODE or the shared default.
  const { default_mode: mode } = config;

  // Window open check: if a window sensor is configured and open, cut the switch and stop here.
  if (config.window_feature) {
    try {
      const win = await getFeatureBySelector(gladys, config.window_feature);
      if (win && win.feature.last_value === 0) {
        logger.info(`Thermostat schedule: window open for ${selector}, switch OFF`);
        if (config.switch_feature) {
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
    const manualUntil = manualUntilVal ? parseInt(manualUntilVal, 10) : null;
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
      if (manualSetpoint !== null && config.switch_feature && config.temperature_feature) {
        const tmp = await getFeatureBySelector(gladys, config.temperature_feature);
        const sw = await getFeatureBySelector(gladys, config.switch_feature);
        if (tmp && sw && tmp.feature.last_value !== null) {
          const shouldBeActive = computeSwitchActive(
            tmp.feature.last_value,
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
            `manual, setpoint=${manualSetpoint}, temp=${tmp.feature.last_value}, ${selector}`,
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

  // Enforce the target setpoint on the thermostat feature, only when it changed.
  const newSetpoint = getSetpointForPreset(targetPreset, config);
  if (newSetpoint !== null && thermostatFeature.last_value !== newSetpoint) {
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
    currentTemp = tmp ? tmp.feature.last_value : null;
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
          await regulateDevice(this.gladys, device, dayOfWeek, currentMinutes, this.serviceId);
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
  phaseOffset,
  regulateDevice,
  parseEnd,
  findMatchingPreset,
  getSetpointForPreset,
  computeSwitchActive,
};
