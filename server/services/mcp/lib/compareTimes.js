const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Europe/Paris';
const TIME_PATTERN = /^(\d{1,2})[:hH](\d{2})(?::\d{2})?$/;

/**
 * @description Parse HH:mm or HHhmm into minutes since midnight.
 * @param {string} timeValue - Time string.
 * @returns {number|null} Minutes since midnight or null when invalid.
 * @example
 * parseTimeToMinutes('14:22');
 */
function parseTimeToMinutes(timeValue) {
  if (!timeValue || typeof timeValue !== 'string') {
    return null;
  }

  const match = timeValue.trim().match(TIME_PATTERN);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * @description Format minutes since midnight as HH:mm.
 * @param {number} minutes - Minutes since midnight.
 * @returns {string} Formatted time.
 * @example
 * formatMinutesAsTime(862);
 */
function formatMinutesAsTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * @description Check whether a time falls within a range (inclusive bounds).
 * @param {number} referenceMinutes - Reference time in minutes.
 * @param {number} startMinutes - Range start in minutes.
 * @param {number} endMinutes - Range end in minutes.
 * @returns {boolean} True when reference is inside the range.
 * @example
 * isTimeWithinRange(720, 690, 795);
 */
function isTimeWithinRange(referenceMinutes, startMinutes, endMinutes) {
  if (startMinutes <= endMinutes) {
    return referenceMinutes >= startMinutes && referenceMinutes <= endMinutes;
  }

  return referenceMinutes >= startMinutes || referenceMinutes <= endMinutes;
}

/**
 * @description Compare times using deterministic logic instead of model reasoning.
 * @param {object} params - Comparison parameters.
 * @param {string} [params.timezone] - IANA timezone.
 * @param {Date} [params.now] - Reference date, mainly for tests.
 * @param {string} [params.reference_time] - Optional HH:mm reference time.
 * @param {'in_ranges'|'before'|'after'|'same'} params.operator - Comparison operator.
 * @param {Array<{start: string, end: string}>} [params.ranges] - Ranges for in_ranges mode.
 * @param {string} [params.compare_to] - Second time for before/after/same modes.
 * @returns {object} Comparison result.
 * @example
 * compareTimes({ operator: 'in_ranges', ranges: [{ start: '17:00', end: '22:00' }], reference_time: '14:22' });
 */
function compareTimes({
  timezone: timezoneName = DEFAULT_TIMEZONE,
  now = new Date(),
  reference_time: referenceTime,
  operator,
  ranges = [],
  compare_to: compareTo,
}) {
  const referenceDate = dayjs(now).tz(timezoneName);
  const referenceMinutes = referenceTime
    ? parseTimeToMinutes(referenceTime)
    : referenceDate.hour() * 60 + referenceDate.minute();

  if (referenceMinutes === null) {
    throw new Error(`Invalid reference_time "${referenceTime}". Use HH:mm or HHhmm.`);
  }

  const baseResult = {
    timezone: timezoneName,
    reference_datetime: referenceDate.format('dddd YYYY-MM-DD HH:mm'),
    reference_time: formatMinutesAsTime(referenceMinutes),
    operator,
  };

  if (operator === 'in_ranges') {
    const parsedRanges = ranges.map(({ start, end }) => {
      const startMinutes = parseTimeToMinutes(start);
      const endMinutes = parseTimeToMinutes(end);
      if (startMinutes === null || endMinutes === null) {
        throw new Error(`Invalid range "${start}-${end}". Use HH:mm or HHhmm.`);
      }

      return {
        start,
        end,
        start_minutes: startMinutes,
        end_minutes: endMinutes,
        contains_reference: isTimeWithinRange(referenceMinutes, startMinutes, endMinutes),
      };
    });

    const matchingRange = parsedRanges.find((range) => range.contains_reference) ?? null;
    const nextRange =
      parsedRanges
        .filter((range) => range.start_minutes > referenceMinutes)
        .sort((a, b) => a.start_minutes - b.start_minutes)[0] ?? null;

    return {
      ...baseResult,
      result: Boolean(matchingRange),
      matching_range: matchingRange
        ? {
            start: matchingRange.start,
            end: matchingRange.end,
          }
        : null,
      ranges_checked: parsedRanges.map(({ start, end }) => ({ start, end })),
      next_range: nextRange
        ? {
            start: nextRange.start,
            end: nextRange.end,
          }
        : null,
    };
  }

  const compareToMinutes = parseTimeToMinutes(compareTo);
  if (compareToMinutes === null) {
    throw new Error(`Invalid compare_to "${compareTo}". Use HH:mm or HHhmm.`);
  }

  let result;
  if (operator === 'before') {
    result = referenceMinutes < compareToMinutes;
  } else if (operator === 'after') {
    result = referenceMinutes > compareToMinutes;
  } else if (operator === 'same') {
    result = referenceMinutes === compareToMinutes;
  } else {
    throw new Error(`Unsupported operator "${operator}".`);
  }

  return {
    ...baseResult,
    compare_to: formatMinutesAsTime(compareToMinutes),
    result,
    difference_minutes: referenceMinutes - compareToMinutes,
  };
}

module.exports = {
  compareTimes,
  parseTimeToMinutes,
  isTimeWithinRange,
  formatMinutesAsTime,
};
