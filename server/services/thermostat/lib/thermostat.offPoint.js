const logger = require('../../../utils/logger');
const { getPreset, getManualHold } = require('./thermostat.state');
const { getScheduleOfDevice } = require('./thermostat.scheduleDevice');
const { pointInForce } = require('./thermostat.getSchedules');

/**
 * @description Whether something takes the thermostat off its programme: a hold
 * still in force, or a preset picked with no hold. A hold past its end no longer
 * does, nor the preset it was armed for: the next pass drops both and hands the
 * thermostat back to the programme (regulateDevice), so it is the programme's
 * already. A hold with no end is in force — on a thermostat that follows a
 * programme, the pass arms one for it.
 * @param {object} device - The thermostat.
 * @returns {boolean} True when a hold or a picked preset is in force.
 * @example
 * offProgramme(device); // false on a thermostat following its programme
 */
function offProgramme(device) {
  const hold = getManualHold(device);
  if (hold) {
    return hold.until === null || hold.until >= Date.now();
  }
  const preset = getPreset(device);
  return preset !== null && preset !== 'schedule';
}

/**
 * @description Whether the programme the thermostat follows keeps it off right
 * now: nothing takes it off that programme (`offProgramme`) and the point in
 * force is Off. The single reading of an Off point for the start of a stopped
 * thermostat (setValue) and for a unit switched on from its remote
 * (onWindowOpen), so the two cannot disagree. The point is resolved from the
 * transitions the schedule is read with, in one query. A programme that cannot
 * be read is no Off point: the start powers the unit on, as any start did, and
 * a remote start is left to the pass.
 * @param {object} device - The thermostat.
 * @returns {Promise<boolean>} True on an Off point the thermostat follows.
 * @example
 * await programmeKeepsOff(device);
 */
async function programmeKeepsOff(device) {
  if (offProgramme(device)) {
    return false;
  }
  try {
    const schedule = await getScheduleOfDevice(device.id);
    const point = schedule ? await pointInForce(schedule.transitions || []) : null;
    return Boolean(point && point.preset === 'off');
  } catch (e) {
    logger.warn(`Thermostat: could not read the programme of ${device.selector}: ${e.message}`);
    return false;
  }
}

module.exports = { offProgramme, programmeKeepsOff };
