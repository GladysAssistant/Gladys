const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { DEFAULT_MANUAL_DURATION_MINUTES } = require('../../../utils/thermostatConstants');
const { buildParamsConfig, toNumber } = require('./thermostat.deviceConfig');

/**
 * @description Set a thermostat device feature value (for example the setpoint).
 * This is the path taken by scenes (`device.set-value`) and by the generic device
 * API. Persisting the value alone would not survive: the next regulation pass
 * re-applies the scheduled preset and overwrites it within a minute. So an
 * external write is treated as a manual override, exactly like turning the dial
 * on the widget.
 *
 * The expiry is only armed when the device follows a schedule: that is the only
 * case where something would otherwise take the setpoint over. Without a
 * schedule the hold is permanent, like on a physical thermostat — arming a timer
 * there would silently revert to the stored preset after a few minutes, with no
 * countdown banner to announce it (the widget only renders one for a scheduled
 * thermostat).
 * @param {object} device - The device object.
 * @param {object} deviceFeature - The device feature to update.
 * @param {number} value - The new value.
 * @returns {Promise<void>}
 * @example
 * await service.device.setValue(device, deviceFeature, 21.5);
 */
async function setValue(device, deviceFeature, value) {
  await this.gladys.device.saveState(deviceFeature, value);

  const featureKey = deviceFeature.selector.toUpperCase().replace(/-/g, '_');
  const manualVarKey = `THERMOSTAT_${featureKey}_MANUAL_MODE`;
  const manualUntilKey = `THERMOSTAT_${featureKey}_MANUAL_UNTIL`;
  const manualSetpointKey = `THERMOSTAT_${featureKey}_MANUAL_SETPOINT`;
  const config = buildParamsConfig(device) || {};
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
