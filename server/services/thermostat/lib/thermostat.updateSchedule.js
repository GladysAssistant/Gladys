const db = require('../../../models');
const logger = require('../../../utils/logger');
const { validateSchedule } = require('../../../utils/thermostatValidateSchedule');
const { SCHEDULE_STOP_PARAM } = require('./thermostat.state');
const { getScheduleBySelector, getCurrentPoint } = require('./thermostat.getSchedules');
const {
  stopForEmptiedProgramme,
  liftScheduleStop,
  loadThermostat,
  forEachFollower,
} = require('./thermostat.scheduleDevice');

/**
 * @description Update a thermostat schedule: rename it, replace its transition
 * points, move it to another house, or any combination. A field left out of the
 * payload is untouched.
 *
 * A schedule only moves house while **no thermostat follows it**: the ones that
 * do live in the house it is leaving, and would end up following a programme
 * from somewhere else — which is exactly what tying a schedule to a house was
 * meant to prevent.
 * @param {string} selector - Schedule selector.
 * @param {object} scheduleData - Updated data: { name, house, transitions }.
 * @returns {Promise<object>} Updated schedule.
 * @example
 * await thermostatHandler.updateSchedule('week', { name: 'New name' });
 */
async function updateSchedule(selector, scheduleData) {
  logger.info(`Thermostat: Updating schedule "${selector}"`);

  const schedule = await db.ThermostatSchedule.findOne({ where: { selector } });
  if (!schedule) {
    throw new Error(`Schedule not found: ${selector}`);
  }

  // PATCH semantics: an absent field is left alone, so the payload is validated
  // against the schedule as it stands rather than against a bare object — a
  // rename must not wipe the points, and a points-only write must not have to
  // resend the name.
  const merged = {
    name: scheduleData && scheduleData.name !== undefined ? scheduleData.name : schedule.name,
    transitions:
      scheduleData && scheduleData.transitions !== undefined
        ? scheduleData.transitions
        : await db.ThermostatScheduleTransition.findAll({ where: { schedule_id: schedule.id } }),
  };
  const validated = validateSchedule(merged);
  const replaceTransitions = Boolean(scheduleData && scheduleData.transitions !== undefined);

  let houseId = schedule.house_id;
  if (scheduleData && scheduleData.house) {
    const house = await db.House.findOne({ where: { selector: scheduleData.house } });
    if (!house) {
      throw new Error(`House not found: ${scheduleData.house}`);
    }
    if (house.id !== schedule.house_id) {
      const followers = await db.ThermostatScheduleDevice.count({ where: { schedule_id: schedule.id } });
      if (followers > 0) {
        throw new Error(`Schedule is followed by a thermostat: ${selector}`);
      }
      houseId = house.id;
    }
  }

  // Uniqueness is per house, so a move is checked against the house it moves to.
  const duplicate = await db.ThermostatSchedule.findOne({
    where: { house_id: houseId, name: validated.name },
  });
  if (duplicate && duplicate.id !== schedule.id) {
    throw new Error(`A schedule with the name "${validated.name}" already exists`);
  }

  // Emptied, the programme leaves its followers with no point in force, and they
  // keep their setpoint (C, step 3). On an Off point that setpoint is the one
  // the previous point left — an Off point writes none — so the heating started
  // again. The point in force is read before the points go.
  const emptied = replaceTransitions && validated.transitions.length === 0;
  const pointBefore = emptied ? await getCurrentPoint(schedule.id) : null;

  // Replace name + points atomically: a failure mid-way must not lose the
  // existing programme.
  try {
    await db.sequelize.transaction(async (transaction) => {
      await schedule.update({ name: validated.name, house_id: houseId }, { transaction });

      if (replaceTransitions) {
        await db.ThermostatScheduleTransition.destroy({ where: { schedule_id: schedule.id }, transaction });

        if (validated.transitions.length > 0) {
          await db.ThermostatScheduleTransition.bulkCreate(
            validated.transitions.map(({ day_of_week: dayOfWeek, time, preset }) => ({
              schedule_id: schedule.id,
              day_of_week: dayOfWeek,
              time,
              preset,
            })),
            { transaction },
          );
        }
      }
    });
  } catch (e) {
    // The duplicate check above is not atomic: a concurrent create or rename can
    // take the name between the check and this update. Report the race the same
    // way, so the caller sees one message whichever check caught it.
    if (e.name === 'SequelizeUniqueConstraintError') {
      throw new Error(`A schedule with the name "${validated.name}" already exists`);
    }
    throw e;
  }

  if (replaceTransitions) {
    const followers = await db.ThermostatScheduleDevice.findAll({ where: { schedule_id: schedule.id }, raw: true });
    const followerIds = followers.map((link) => link.device_id);
    if (emptied) {
      // Its followers stay on it, so an Off point stops them, visibly, as a
      // detach does — a hold over that point included. Any other point already
      // left its temperature on the setpoint feature.
      if (pointBefore && pointBefore.preset === 'off') {
        await forEachFollower.call(
          this,
          followerIds,
          stopForEmptiedProgramme,
          'stop a follower of the emptied programme',
        );
      }
    } else {
      // Points again: the stops the programme left behind are its own to lift.
      // Only the followers carrying the mark are loaded, not every one of them
      // on every save of the points.
      const marked = await db.DeviceParam.findAll({
        where: { device_id: followerIds, name: SCHEDULE_STOP_PARAM, value: 'true' },
        attributes: ['device_id'],
        raw: true,
      });
      await forEachFollower.call(
        this,
        marked.map((param) => param.device_id),
        async (deviceId) => liftScheduleStop.call(this, await loadThermostat(deviceId)),
        'start a follower of the programme again',
      );
    }
    this.triggerApplySchedules();
  }

  return getScheduleBySelector(selector);
}

module.exports = { updateSchedule };
