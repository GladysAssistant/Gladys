const db = require('../../../models');
const logger = require('../../../utils/logger');

/**
 * @description Resolve a schedule and a thermostat by selector, checking the
 * device is one this service owns and that it lives in the schedule's house.
 * @param {string} scheduleSelector - Schedule selector.
 * @param {string} deviceSelector - Thermostat selector.
 * @returns {Promise<{ schedule: object, device: object }>} The resolved rows.
 * @example
 * const { schedule, device } = await resolveScheduleAndDevice('week', 'living-room');
 */
async function resolveScheduleAndDevice(scheduleSelector, deviceSelector) {
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
  if (!device.room || device.room.house_id !== schedule.house_id) {
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
  const { schedule, device } = await resolveScheduleAndDevice(scheduleSelector, deviceSelector);

  logger.info(`Thermostat: "${deviceSelector}" no longer follows schedule "${scheduleSelector}"`);
  await db.ThermostatScheduleDevice.destroy({ where: { device_id: device.id, schedule_id: schedule.id } });
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

module.exports = {
  attachScheduleToDevice,
  detachScheduleFromDevice,
  resolveScheduleAndDevice,
  followsSchedule,
};
