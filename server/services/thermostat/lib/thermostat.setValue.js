const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { DEFAULT_MANUAL_DURATION_MINUTES } = require('../../../utils/thermostatConstants');
const { buildParamsConfig, toNumber, isExternal, getFeatureBySelector } = require('./thermostat.deviceConfig');
const { writeExternalMode, getRunningMode } = require('./thermostat.applySchedules');

/**
 * @description Set a thermostat device feature value (for example the setpoint).
 * This is the path taken by scenes (`device.set-value`), by the generic device
 * API and by the widget. Persisting the value alone would not survive: the next
 * regulation pass re-applies the scheduled preset and overwrites it within a
 * minute. So an external write is treated as a manual override, exactly like
 * turning the dial on the widget.
 *
 * The widget also uses this path to write back the *scheduled* setpoint when a
 * manual hold ends. That write must not re-arm the override it is clearing, so
 * `manual` can be turned off: the value is then persisted alone, exactly like a
 * plain `saveState`. It defaults to true, which is what scenes and the generic
 * device API mean when they write a setpoint.
 *
 * On a manual write, the expiry is only armed when the device follows a
 * schedule: that is the only case where something would otherwise take the
 * setpoint over. Without a schedule the hold is permanent, like on a physical
 * thermostat — arming a timer there would silently revert to the stored preset
 * after a few minutes, with no countdown banner to announce it (the widget only
 * renders one for a scheduled thermostat).
 * @param {object} device - The device object.
 * @param {object} deviceFeature - The device feature to update.
 * @param {number} value - The new value.
 * @param {boolean} [manual] - Whether this write is a manual override. Default true.
 * @returns {Promise<void>}
 * @example
 * await service.device.setValue(device, deviceFeature, 21.5);
 */
async function setValue(device, deviceFeature, value, manual = true) {
  const config = buildParamsConfig(device) || {};
  // On a virtual thermostat the setpoint feature is this service's own, so the
  // value is simply persisted. On an external one it belongs to the real device
  // (Netatmo, Zigbee, Matter, MQTT...), and persisting it alone would update
  // every Gladys screen while the thermostat itself never hears about it: the
  // write has to go through the core, which routes it to the owning
  // integration. Without this the setpoint only reached the device on the next
  // regulation tick, up to a minute later.
  if (isExternal(config) && config.target_feature === deviceFeature.selector) {
    // The core routes a write on `device.service.name`, so it has to be handed
    // the device that *owns* the feature — the Netatmo, the Zigbee coordinator,
    // the MQTT bridge. Passing this service's own thermostat device would route
    // the write straight back into this function, endlessly.
    const owner = await getFeatureBySelector(this.gladys, deviceFeature.selector);
    if (owner) {
      // A thermostat left switched off by an `off` preset ignores a setpoint:
      // asking for 21 °C on a device whose mode is OFF changes the number on
      // its screen and nothing else. Hand the mode back first, so the setpoint
      // this write carries actually means something.
      if (config.mode_feature) {
        await writeExternalMode(
          this.gladys,
          config.mode_feature,
          getRunningMode(config),
          `setValue ${value}, ${deviceFeature.selector}`,
        );
      }
      // Mark it before writing: the device echoes the new value back as a
      // NEW_STATE, and the listener must not mistake our own write for a change
      // made on the thermostat itself.
      this.selfWrittenSetpoints.set(deviceFeature.selector, value);
      try {
        await this.gladys.device.setValue(owner.device, owner.feature, value);
      } catch (e) {
        // The write never reached the device, so no echo will come: a mark left
        // behind would make the listener swallow a real change to that same
        // value later on. The error still propagates — the caller (a scene, the
        // API, the widget) must know the setpoint was not applied.
        this.selfWrittenSetpoints.delete(deviceFeature.selector);
        throw e;
      }
    } else {
      logger.warn(`Thermostat: external target feature not found for selector="${deviceFeature.selector}"`);
    }
  } else {
    await this.gladys.device.saveState(deviceFeature, value);
  }

  if (!manual) {
    // Returning to the schedule: the caller has already cleared the manual flag,
    // and re-arming it here would leave the device in manual mode in the database
    // while every open widget displays the schedule — until the expiry silently
    // dropped it again, minutes later.
    logger.info(`Thermostat: scheduled setpoint ${value} written on ${deviceFeature.selector}`);
    this.triggerApplySchedules();
    return;
  }

  const featureKey = deviceFeature.selector.toUpperCase().replace(/-/g, '_');
  const manualVarKey = `THERMOSTAT_${featureKey}_MANUAL_MODE`;
  const manualUntilKey = `THERMOSTAT_${featureKey}_MANUAL_UNTIL`;
  const manualSetpointKey = `THERMOSTAT_${featureKey}_MANUAL_SETPOINT`;
  const durationMinutes = toNumber(config.manual_duration, DEFAULT_MANUAL_DURATION_MINUTES);
  // An empty string clears any expiry left by a previous schedule-backed hold:
  // the regulation loop only expires the override when this variable is set.
  const manualUntil = config.active_schedule ? String(Date.now() + durationMinutes * 60 * 1000) : '';

  await this.gladys.variable.setValue(manualSetpointKey, JSON.stringify({ setpoint: value }), this.serviceId);
  await this.gladys.variable.setValue(manualUntilKey, manualUntil, this.serviceId);
  await this.gladys.variable.setValue(manualVarKey, 'true', this.serviceId);

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.THERMOSTAT.MANUAL_MODE_UPDATED,
    payload: { key: manualVarKey, value: 'true' },
  });

  logger.info(
    `Thermostat: external setValue on ${deviceFeature.selector} held as manual setpoint ${value}` +
      `${manualUntil ? ` until ${new Date(Number(manualUntil)).toISOString()}` : ' (no schedule, no expiry)'}`,
  );
  this.triggerApplySchedules();
}

module.exports = { setValue };
