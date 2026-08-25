const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezonePlugin = require('dayjs/plugin/timezone');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(utc);
dayjs.extend(timezonePlugin);
dayjs.extend(customParseFormat);

// node-schedule expects the day of the week as a number, Sunday being 0.
const DAYS_OF_THE_WEEK_TO_NUMBER = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const ALL_DAYS_OF_THE_WEEK = Object.keys(DAYS_OF_THE_WEEK_TO_NUMBER);

/**
 * @description Convert a "HH:mm" string to a number of minutes since midnight.
 * @param {string} time - Time formatted as "HH:mm".
 * @returns {number} Number of minutes since midnight.
 * @example
 * timeToMinutes('14:30'); // 870
 */
function timeToMinutes(time) {
  return parseInt(time.substr(0, 2), 10) * 60 + parseInt(time.substr(3, 2), 10);
}

/**
 * @description Convert the days of the week of a range to the numbers expected by node-schedule.
 * An empty or missing list means "every day", like the "every-week" scheduler type.
 * @param {string[]} [daysOfTheWeek] - Days of the week, as lowercase english names.
 * @returns {number[]} Days of the week as numbers, Sunday being 0.
 * @example
 * daysOfTheWeekToNumbers(['monday']); // [1]
 */
function daysOfTheWeekToNumbers(daysOfTheWeek) {
  // An explicitly empty list is NOT "every day": the user unselected every day, and the
  // editor warns that the trigger will never fire. Only an absent list means every day,
  // like the "every-week" scheduler type.
  const days = daysOfTheWeek === undefined || daysOfTheWeek === null ? ALL_DAYS_OF_THE_WEEK : daysOfTheWeek;
  return days.map((day) => DAYS_OF_THE_WEEK_TO_NUMBER[day]).filter((day) => day !== undefined);
}

/**
 * @description Tell if a time range crosses midnight (its end is before its start).
 * Example: 22:00 -> 06:00.
 * @param {object} range - A time range with `start` and `end` formatted as "HH:mm".
 * @returns {boolean} True if the range ends on the next day.
 * @example
 * isOvernightRange({ start: '22:00', end: '06:00' }); // true
 */
function isOvernightRange(range) {
  return timeToMinutes(range.end) < timeToMinutes(range.start);
}

/**
 * @description Tell if a given moment falls inside one of the time ranges.
 *
 * A range is active from its start (included) to its end (excluded), so two consecutive
 * ranges ("10:00 -> 12:00" then "12:00 -> 14:00") never report the same minute twice.
 *
 * The days of the week always apply to the START of the range: an overnight range
 * "22:00 -> 06:00" configured on monday runs from monday 22:00 to tuesday 06:00. This
 * matches how the jobs are scheduled, so the state computed here and the one produced by
 * the scheduled jobs cannot disagree.
 * @param {object[]} timeRanges - The configured time ranges.
 * @param {object} now - A dayjs object, already in the timezone of the user.
 * @returns {boolean} True if the moment is inside one of the ranges.
 * @example
 * isInTimeRanges([{ start: '12:00', end: '14:30' }], dayjs());
 */
function isInTimeRanges(timeRanges, now) {
  if (!timeRanges || timeRanges.length === 0) {
    return false;
  }
  const nowInMinutes = now.hour() * 60 + now.minute();
  const today = now.day();
  // Day of the range which started yesterday and is still running (overnight ranges).
  const yesterday = (today + 6) % 7;

  return timeRanges.some((range) => {
    const startInMinutes = timeToMinutes(range.start);
    const endInMinutes = timeToMinutes(range.end);
    const days = daysOfTheWeekToNumbers(range.days_of_the_week);

    // A range with the same start and end covers nothing: scheduling it would fire
    // the start and the end of the range at the very same second.
    if (startInMinutes === endInMinutes) {
      return false;
    }

    if (isOvernightRange(range)) {
      // Either we are in the evening part (today, after the start),
      // or in the morning part of a range which started yesterday.
      return (
        (days.includes(today) && nowInMinutes >= startInMinutes) ||
        (days.includes(yesterday) && nowInMinutes < endInMinutes)
      );
    }

    return days.includes(today) && nowInMinutes >= startInMinutes && nowInMinutes < endInMinutes;
  });
}

/**
 * @description Build the ranges of a time-range trigger, with the days of the week resolved.
 *
 * The days are configured once for the whole trigger. Ranges saved by an earlier version
 * carried their own list, so it is used as a fallback: such a scene keeps running on the
 * days it was configured with, instead of silently falling back to "every day".
 * @param {object} trigger - A "time-range" scheduled trigger.
 * @returns {object[]} The ranges, each one carrying the days of the week to apply.
 * @example
 * resolveTriggerTimeRanges(trigger);
 */
function resolveTriggerTimeRanges(trigger) {
  const timeRanges = trigger.time_ranges || [];
  const legacyDays = timeRanges.map((range) => range.days_of_the_week).find((days) => days && days.length > 0);
  // An explicitly empty list means the user unselected every day: the UI warns the trigger
  // will never fire, and it must not be turned into "every day" behind their back. Only an
  // absent list falls back to the legacy per-range days, then to every day.
  const daysOfTheWeek = trigger.days_of_the_week || legacyDays;
  return timeRanges.map((range) => ({ ...range, days_of_the_week: daysOfTheWeek }));
}

module.exports = {
  ALL_DAYS_OF_THE_WEEK,
  resolveTriggerTimeRanges,
  DAYS_OF_THE_WEEK_TO_NUMBER,
  daysOfTheWeekToNumbers,
  isInTimeRanges,
  isOvernightRange,
  timeToMinutes,
};
