const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_TYPES, THERMOSTAT_MODE } = require('../../../utils/constants');
const { DEFAULT_MANUAL_DURATION_MINUTES } = require('../../../utils/thermostatConstants');
const { buildParamsConfig, toNumber, isExternal, getFeatureBySelector } = require('./thermostat.deviceConfig');
const {
  writeExternalMode,
  getRunningMode,
  stopExternalThermostat,
  getSetpointForPreset,
} = require('./thermostat.applySchedules');
const { getScheduleOfDevice } = require('./thermostat.scheduleDevice');
const { nextTransitionTimestamp } = require('../../../utils/thermostatSchedule');
const { presetName, savePreset, setManualHold, clearManualHold } = require('./thermostat.state');

/**
 * @description Write a setpoint where it belongs: on this service's own feature
 * for a virtual thermostat, on the real device for an external one.
 * @param {object} device - The thermostat device.
 * @param {object} deviceFeature - The setpoint feature being written.
 * @param {number} value - The setpoint.
 * @returns {Promise<void>}
 * @example
 * await writeSetpoint.call(this, device, feature, 21.5);
 */
async function writeSetpoint(device, deviceFeature, value) {
  const config = buildParamsConfig(device) || {};
  // On a virtual thermostat the setpoint feature is this service's own, so the
  // value is simply persisted. On an external one it belongs to the real device
  // (Netatmo, Zigbee, Matter, MQTT...), and persisting it alone would update
  // every Gladys screen while the thermostat itself never hears about it: the
  // write has to go through the core, which routes it to the owning integration.
  if (!isExternal(config) || config.target_feature !== deviceFeature.selector) {
    await this.gladys.device.saveState(deviceFeature, value);
    return;
  }
  // The core routes a write on `device.service.name`, so it has to be handed
  // the device that *owns* the feature — the Netatmo, the Zigbee coordinator,
  // the MQTT bridge. Passing this service's own thermostat device would route
  // the write straight back into this function, endlessly.
  const owner = await getFeatureBySelector(this.gladys, deviceFeature.selector);
  if (!owner) {
    logger.warn(`Thermostat: external target feature not found for selector="${deviceFeature.selector}"`);
    return;
  }
  // A thermostat left switched off ignores a setpoint: asking for 21 °C on a
  // device whose mode is OFF changes the number on its screen and nothing else.
  // Hand the mode back first, so the setpoint this write carries means something.
  if (config.mode_feature) {
    await writeExternalMode(
      this.gladys,
      config.mode_feature,
      getRunningMode(config),
      `setValue ${value}, ${deviceFeature.selector}`,
    );
  }
  // Mark it before writing: the device echoes the new value back as a NEW_STATE,
  // and the listener must not mistake our own write for a change made on the
  // thermostat itself.
  this.selfWrittenSetpoints.set(deviceFeature.selector, value);
  try {
    await this.gladys.device.setValue(owner.device, owner.feature, value);
  } catch (e) {
    // The write never reached the device, so no echo will come: a mark left
    // behind would make the listener swallow a real change to that same value
    // later on. The error still propagates — the caller (a scene, the API, the
    // widget) must know the setpoint was not applied.
    this.selfWrittenSetpoints.delete(deviceFeature.selector);
    throw e;
  }
}

/**
 * @description When a manual hold ends, or null when it is permanent.
 *
 * A hold expires only on a thermostat that follows a schedule: that is the only
 * case where something would otherwise take the setpoint back. Without a
 * schedule it is permanent, like on a physical thermostat — arming a timer there
 * would silently revert minutes later with nothing to announce it.
 *
 * With a schedule it runs **until the next transition point** by default, which
 * is the Tado and Netatmo behaviour and the one people expect: a temperature set
 * at 3pm holds until the evening point, rather than lapsing after an arbitrary
 * half hour. A device that sets THERMOSTAT_MANUAL_DURATION asks for that fixed
 * duration instead.
 * @param {object} device - The thermostat device.
 * @returns {Promise<number|null>} The expiry timestamp, or null.
 * @example
 * await holdExpiry(device);
 */
async function holdExpiry(device) {
  const link = await getScheduleOfDevice(device.id);
  if (!link) {
    return null;
  }
  const config = buildParamsConfig(device) || {};
  const configuredDuration = toNumber(config.manual_duration, null);
  if (configuredDuration !== null) {
    return Date.now() + configuredDuration * 60 * 1000;
  }
  const nextTransition = nextTransitionTimestamp(link.transitions);
  if (nextTransition !== null) {
    return nextTransition;
  }
  // A schedule with no point has nothing to hand the thermostat back to: fall
  // back on the shared duration rather than holding for ever.
  return Date.now() + DEFAULT_MANUAL_DURATION_MINUTES * 60 * 1000;
}

/**
 * @description Set a value on one of a thermostat's features. This is the
 * single write path: `device.set-value` in a scene, the generic device API and
 * the widget all land here, and each intent is a value on its own feature.
 *
 * - **target-temperature** holds that setpoint. Persisting it alone would not
 *   survive: the next regulation pass re-applies the scheduled preset and
 *   overwrites it within the minute, so a write from outside the loop is a
 *   manual hold.
 * - **preset** takes the thermostat off its programme and holds that preset's
 *   setpoint; `schedule` hands it back to the programme instead.
 * - **mode** stops the thermostat or starts it again.
 * @param {object} device - The device object.
 * @param {object} deviceFeature - The device feature to update.
 * @param {number} value - The new value.
 * @param {boolean} [manual] - Whether a setpoint write arms a hold. Default true.
 * @returns {Promise<void>}
 * @example
 * await service.device.setValue(device, presetFeature, THERMOSTAT_PRESET.AWAY);
 */
async function setValue(device, deviceFeature, value, manual = true) {
  if (deviceFeature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET) {
    const name = presetName(value);
    if (!name) {
      throw new Error(`Thermostat: unknown preset value ${value}`);
    }
    await savePreset.call(this, device, name);
    if (name === 'schedule') {
      // Back to the programme: the hold has to go, or the loop would keep
      // regulating on it and the schedule would never take over.
      await clearManualHold.call(this, device);
    } else {
      // A preset picked by hand is how a user steps off the programme for an
      // afternoon, so it arms a hold on that preset's setpoint. Without the
      // hold, the very next regulation pass would resolve the schedule's preset
      // and overwrite the choice within the minute.
      const config = buildParamsConfig(device) || {};
      await setManualHold.call(this, device, getSetpointForPreset(name, config), await holdExpiry(device));
    }
    logger.info(`Thermostat: preset ${name} set on ${device.selector}`);
    this.triggerApplySchedules();
    return;
  }

  if (deviceFeature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.MODE) {
    await this.gladys.device.saveState(deviceFeature, value);
    const config = buildParamsConfig(device) || {};
    if (Number(value) === THERMOSTAT_MODE.OFF) {
      // Stopping is not a preset with a setpoint: it cuts the switch on a
      // virtual thermostat, and stops the real one on an external device.
      if (isExternal(config)) {
        await stopExternalThermostat(this.gladys, config, `mode=off, ${device.selector}`, this.selfWrittenSetpoints);
      }
      await clearManualHold.call(this, device);
    }
    logger.info(`Thermostat: mode ${value} set on ${device.selector}`);
    this.triggerApplySchedules();
    return;
  }

  await writeSetpoint.call(this, device, deviceFeature, value);

  if (!manual) {
    // Returning to the schedule: the caller has already cleared the hold, and
    // re-arming it here would leave the device held in the database while every
    // open widget displays the schedule.
    logger.info(`Thermostat: scheduled setpoint ${value} written on ${deviceFeature.selector}`);
    this.triggerApplySchedules();
    return;
  }

  const until = await holdExpiry(device);
  await setManualHold.call(this, device, value, until);

  logger.info(
    `Thermostat: setValue on ${deviceFeature.selector} held as manual setpoint ${value}` +
      `${until ? ` until ${new Date(until).toISOString()}` : ' (no schedule, no expiry)'}`,
  );
  this.triggerApplySchedules();
}

module.exports = { setValue, writeSetpoint, holdExpiry };
