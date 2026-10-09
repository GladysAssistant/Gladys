const db = require('../../../models');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_TYPES, THERMOSTAT_MODE } = require('../../../utils/constants');
const { getFeature, getPreset, isStopped, getManualHold, setManualHold, savePreset } = require('./thermostat.state');
const { getCurrentPoint } = require('./thermostat.getSchedules');

/**
 * @description A thermostat with its features and params, as the state helpers
 * read them.
 * @param {string} deviceId - The thermostat's id.
 * @returns {Promise<object>} The device, as a plain object.
 * @example
 * await loadThermostat(device.id);
 */
async function loadThermostat(deviceId) {
  const row = await db.Device.findOne({
    where: { id: deviceId },
    include: [
      { model: db.DeviceFeature, as: 'features' },
      { model: db.DeviceParam, as: 'params' },
    ],
  });
  return row.get({ plain: true });
}

/**
 * @description Leave a thermostat that no longer follows a programme doing what
 * the programme had it do. Without it the thermostat kept `schedule` on its
 * preset feature with no point to resolve: what it would do then was nothing the
 * user could see — and at night, on an Off point, it started heating again on
 * the setpoint of the previous point.
 *
 * - On a point naming a preset, that preset is written on the feature: the
 *   widget lights it, and it stays tied to the preset's temperature.
 * - On an Off point, the thermostat is stopped: the widget shows it, with the
 *   button that starts it again.
 * - A hold running to the programme's next point has no point left to run to:
 *   like any hold taken on a thermostat with no schedule, it now lasts.
 *
 * A stopped thermostat, or one on a preset of its own, already does what it
 * shows, and is left alone. So is one whose schedule had no point in force.
 * @param {string} deviceId - The thermostat's id.
 * @param {object|null} current - The point that was in force, as getSchedules resolves it.
 * @returns {Promise<void>}
 * @example
 * await releaseFromProgramme.call(thermostatHandler, device.id, { preset: 'eco' });
 */
async function releaseFromProgramme(deviceId, current) {
  const device = await loadThermostat(deviceId);
  if (isStopped(device)) {
    return;
  }
  const hold = getManualHold(device);
  if (hold) {
    if (hold.until) {
      await setManualHold.call(this, device, hold.setpoint, null);
    }
    return;
  }
  const preset = getPreset(device);
  if ((preset !== 'schedule' && preset !== null) || !current) {
    return;
  }
  if (current.preset === 'off') {
    const modeFeature = getFeature(device, DEVICE_FEATURE_TYPES.THERMOSTAT.MODE);
    if (!modeFeature) {
      return;
    }
    await this.gladys.device.saveState(modeFeature, THERMOSTAT_MODE.OFF);
  } else {
    await savePreset.call(this, device, current.preset);
  }
  logger.info(`Thermostat: "${device.selector}" left on "${current.preset}", the point its programme was on`);
  this.triggerApplySchedules();
}

/**
 * @description Resolve a schedule and a thermostat by selector, checking the
 * device is one this service owns and, unless told otherwise, that it lives in
 * the schedule's house.
 * @param {string} scheduleSelector - Schedule selector.
 * @param {string} deviceSelector - Thermostat selector.
 * @param {object} [options] - Options.
 * @param {boolean} [options.checkHouse] - Require the device to be in the schedule's house.
 * @returns {Promise<{ schedule: object, device: object }>} The resolved rows.
 * @example
 * const { schedule, device } = await resolveScheduleAndDevice('week', 'living-room');
 */
async function resolveScheduleAndDevice(scheduleSelector, deviceSelector, { checkHouse = true } = {}) {
  const schedule = await db.ThermostatSchedule.findOne({ where: { selector: scheduleSelector } });
  if (!schedule) {
    throw new Error(`Schedule not found: ${scheduleSelector}`);
  }

  const device = await db.Device.findOne({
    where: { selector: deviceSelector },
    include: [
      { model: db.Service, as: 'service', attributes: ['name'] },
      { model: db.Room, as: 'room', attributes: ['house_id'] },
    ],
  });
  if (!device) {
    throw new Error(`Device not found: ${deviceSelector}`);
  }
  // Without this check any device could be attached to a schedule and would then
  // be written to once a minute by a regulation loop that does not own it.
  if (!device.service || device.service.name !== 'thermostat') {
    throw new Error(`Device is not a thermostat: ${deviceSelector}`);
  }
  // A schedule belongs to a house, and a thermostat belongs to one through its
  // room. A thermostat with no room has no house, so it cannot be placed.
  if (checkHouse && (!device.room || device.room.house_id !== schedule.house_id)) {
    throw new Error(`Device is not in the house of schedule "${scheduleSelector}": ${deviceSelector}`);
  }

  return { schedule, device };
}

/**
 * @description Make a thermostat follow a schedule, replacing the one it
 * followed. Idempotent: attaching a thermostat to the schedule it already
 * follows is a no-op rather than an error.
 * @param {string} scheduleSelector - Schedule selector.
 * @param {string} deviceSelector - Thermostat selector.
 * @returns {Promise<void>}
 * @example
 * await thermostatHandler.attachScheduleToDevice('week', 'living-room');
 */
async function attachScheduleToDevice(scheduleSelector, deviceSelector) {
  const { schedule, device } = await resolveScheduleAndDevice(scheduleSelector, deviceSelector);

  logger.info(`Thermostat: "${deviceSelector}" now follows schedule "${scheduleSelector}"`);
  // The primary key on device_id is what makes this a replacement rather than a
  // second schedule: one row per thermostat, whatever it followed before.
  await db.ThermostatScheduleDevice.upsert({ device_id: device.id, schedule_id: schedule.id });

  // Following a programme is what the `schedule` preset says, and the loop only
  // reads the programme while the feature carries it. A thermostat left on a
  // named preset — by a detach, a deleted schedule, or a choice made while it
  // followed none — ignored the schedule just attached, for good. A stop is left
  // as it is: it outranks any programme, and the widget offers the way back.
  await savePreset.call(this, await loadThermostat(device.id), 'schedule');
  // The widgets read which schedule a thermostat follows from the schedule list,
  // and the new point applies now rather than at the next minute tick.
  this.broadcastConfigUpdated();
  this.triggerApplySchedules();
}

/**
 * @description Stop a thermostat from following a schedule.
 * @param {string} scheduleSelector - Schedule selector.
 * @param {string} deviceSelector - Thermostat selector.
 * @returns {Promise<void>}
 * @example
 * await thermostatHandler.detachScheduleFromDevice('week', 'living-room');
 */
async function detachScheduleFromDevice(scheduleSelector, deviceSelector) {
  // The house is checked when a link is made, not when it is removed: a
  // thermostat moved to a room of another house, or left with no room, keeps the
  // link it had, and refusing to remove it left that link with no way out.
  const { schedule, device } = await resolveScheduleAndDevice(scheduleSelector, deviceSelector, {
    checkHouse: false,
  });

  logger.info(`Thermostat: "${deviceSelector}" no longer follows schedule "${scheduleSelector}"`);
  const removed = await db.ThermostatScheduleDevice.destroy({
    where: { device_id: device.id, schedule_id: schedule.id },
  });
  if (removed > 0) {
    await releaseFromProgramme.call(this, device.id, await getCurrentPoint(schedule.id));
    // The widgets read which schedule a thermostat follows from the schedule
    // list: without a reload they kept the banner of the one just left.
    this.broadcastConfigUpdated();
  }
}

/**
 * @description Whether a thermostat follows a schedule. It decides whether a
 * manual hold expires: with a programme something would otherwise take the
 * setpoint back, without one the hold is permanent like on a physical
 * thermostat.
 * @param {string} deviceId - The thermostat's id.
 * @returns {Promise<boolean>} True when the thermostat follows a schedule.
 * @example
 * await followsSchedule(device.id);
 */
async function followsSchedule(deviceId) {
  const count = await db.ThermostatScheduleDevice.count({ where: { device_id: deviceId } });
  return count > 0;
}

/**
 * @description The schedule a thermostat follows, with its transition points, or
 * null when it follows none. Used to end a hold on the next point rather than
 * after a fixed duration.
 * @param {string} deviceId - The thermostat's id.
 * @returns {Promise<object|null>} The schedule, transitions included.
 * @example
 * await getScheduleOfDevice(device.id);
 */
async function getScheduleOfDevice(deviceId) {
  const link = await db.ThermostatScheduleDevice.findOne({
    where: { device_id: deviceId },
    include: [
      {
        model: db.ThermostatSchedule,
        as: 'schedule',
        include: [{ model: db.ThermostatScheduleTransition, as: 'transitions' }],
      },
    ],
  });
  return link && link.schedule ? link.schedule : null;
}

module.exports = {
  attachScheduleToDevice,
  detachScheduleFromDevice,
  releaseFromProgramme,
  resolveScheduleAndDevice,
  followsSchedule,
  getScheduleOfDevice,
};
