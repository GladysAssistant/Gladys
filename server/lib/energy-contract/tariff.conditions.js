const { isInTimeRanges } = require('./tariff.time');

/**
 * @description Tell whether a compiled season (MMDD numbers) contains a month-day.
 * A season whose "to" precedes its "from" crosses 1 January.
 * @param {object} season - Compiled season { from, to }.
 * @param {number} monthDay - MMDD number of the evaluated day.
 * @returns {boolean} True when the day is in the season (inclusive bounds).
 * @example
 * isInSeason({ from: 1101, to: 331 }, 115); // true (15 January)
 */
function isInSeason(season, monthDay) {
  if (season.from <= season.to) {
    return monthDay >= season.from && monthDay <= season.to;
  }
  return monthDay >= season.from || monthDay <= season.to;
}

/**
 * @description Evaluate the value-based calendar condition of a rule.
 * @param {object} condition - Compiled condition { key: Set of string values }.
 * @param {Function} getCalendarValue - Returns the calendar value for the interval, or undefined.
 * @param {boolean} negated - True for not_calendar.
 * @returns {boolean} The condition result.
 * @example
 * matchesCalendarCondition({ tempo: new Set(['red']) }, () => 'red', false); // true
 */
function matchesCalendarCondition(condition, getCalendarValue, negated) {
  return Object.keys(condition).every((key) => {
    const value = getCalendarValue(key);
    const present = value !== undefined && value !== null && condition[key].has(String(value));
    return negated ? !present : present;
  });
}

/**
 * @description Evaluate every compiled condition of a rule except `tier`, which is
 * about the energy range and is handled by the consumption evaluation.
 * @param {object} when - Compiled conditions (undefined = always true).
 * @param {object} context - The interval context: local, getCalendarValue, maxPowerKw.
 * @returns {boolean} True when every condition holds.
 * @example
 * matchesConditions(compiledWhen, { local, getCalendarValue, maxPowerKw: 3 });
 */
function matchesConditions(when, context) {
  if (when === undefined) {
    return true;
  }
  const { local, getCalendarValue, maxPowerKw } = context;
  if (when.time !== undefined && !isInTimeRanges(when.time, local.minutes)) {
    return false;
  }
  if (when.weekdays !== undefined && !when.weekdays.has(local.weekday)) {
    return false;
  }
  if (when.months !== undefined && !when.months.has(local.month)) {
    return false;
  }
  if (when.season !== undefined && !isInSeason(when.season, local.monthDay)) {
    return false;
  }
  if (when.dates !== undefined) {
    if (local.date < when.dates.from) {
      return false;
    }
    if (when.dates.to !== undefined && local.date > when.dates.to) {
      return false;
    }
  }
  if (when.calendar !== undefined && !matchesCalendarCondition(when.calendar, getCalendarValue, false)) {
    return false;
  }
  if (when.not_calendar !== undefined && !matchesCalendarCondition(when.not_calendar, getCalendarValue, true)) {
    return false;
  }
  if (when.power_threshold !== undefined && !(maxPowerKw > when.power_threshold.above_kw)) {
    return false;
  }
  return true;
}

module.exports = {
  isInSeason,
  matchesCalendarCondition,
  matchesConditions,
};
