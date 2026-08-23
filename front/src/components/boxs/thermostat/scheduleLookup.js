import { findMatchingSlot, getCurrentDayAndMinutes } from '../../../../../server/utils/thermostatSchedule';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';

/**
 * Read the Gladys timezone, the one the server resolves schedule slots in. The
 * browser's own timezone is not it: a phone abroad, or a laptop left on another
 * zone, would show a different slot than the one actually heating the house.
 * Returns null when it cannot be read, so the caller degrades to the browser.
 */
export const fetchTimezone = async httpClient => {
  try {
    const response = await httpClient.get(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.TIMEZONE}`);
    return (response && response.value) || null;
  } catch (e) {
    return null;
  }
};

/**
 * Fetch one schedule by selector. Returns null when it cannot be read, so a
 * schedule deleted behind the widget's back degrades to "no schedule" rather
 * than leaving a stale banner.
 */
export const fetchSchedule = async (httpClient, scheduleSelector) => {
  if (!scheduleSelector) {
    return null;
  }
  try {
    const schedules = await httpClient.get('/api/v1/service/thermostat/schedule');
    if (!Array.isArray(schedules)) {
      return null;
    }
    return schedules.find(schedule => schedule.selector === scheduleSelector) || null;
  } catch (e) {
    return null;
  }
};

/**
 * The slot covering the current time, overnight slots included. Day and minute
 * come from the shared server helper, read in the Gladys timezone, so the widget
 * and the regulation loop always agree on which slot is active.
 */
export const getCurrentSlot = (schedule, timezone = null) => {
  if (!schedule || !schedule.slots) {
    return null;
  }
  const { dayOfWeek, yesterdayOfWeek, currentMinutes } = getCurrentDayAndMinutes(new Date(), timezone);
  return findMatchingSlot(
    schedule.slots.filter(slot => slot.day_of_week === dayOfWeek),
    schedule.slots.filter(slot => slot.day_of_week === yesterdayOfWeek),
    currentMinutes
  );
};

/**
 * The preset the schedule asks for right now, or null when no slot covers this
 * time or the slot names a preset this widget does not know.
 */
export const resolvePresetFromSchedule = async (httpClient, scheduleSelector, knownPresets, timezone = null) => {
  const schedule = await fetchSchedule(httpClient, scheduleSelector);
  const slot = getCurrentSlot(schedule, timezone);
  if (!slot || !slot.preset) {
    return null;
  }
  return knownPresets.includes(slot.preset) ? slot.preset : null;
};
