const { timeToMinutes } = require('./thermostatSchedule');

// A range whose preset is this one is not a temperature to reach but the absence
// of one: it is stored as a transition point that stops the thermostat, and read
// back as "nothing scheduled here" rather than as a range of its own.
const STOP_PRESET = 'off';

/**
 * @description Turn a schedule's transition points into the ranges an editor
 * shows: a start, an end and a preset. A point holds until the next one, so the
 * end of a range is simply where the following point begins; a point that stops
 * the thermostat closes the range before it and opens none.
 *
 * Ranges are a *view*. They are never stored: the database holds points, which
 * is what keeps a night one row rather than two halves cut at midnight, and what
 * makes gaps and overlaps unrepresentable. Only the editor speaks in ranges,
 * because that is how people think about a heating programme — "comfort from 6
 * to 9", not "a comfort point at 6".
 * @param {Array} transitions - The schedule's points: { day_of_week, time, preset }.
 * @returns {Array} Ranges: { day_of_week, start_time, end_time, preset, ends_next_day }.
 * @example
 * transitionsToRanges([{ day_of_week: 0, time: '06:00', preset: 'comfort' }]);
 */
function transitionsToRanges(transitions) {
  if (!transitions || transitions.length === 0) {
    return [];
  }
  // Ordered as the week runs, so "the next point" is the next entry — including
  // the wrap from Sunday night back onto Monday morning.
  const sorted = [...transitions].sort(
    (a, b) => a.day_of_week - b.day_of_week || timeToMinutes(a.time) - timeToMinutes(b.time),
  );

  const ranges = [];
  sorted.forEach((transition, index) => {
    if (transition.preset === STOP_PRESET) {
      // A stop closes whatever ran before it. It is not a range.
      return;
    }
    const next = sorted[(index + 1) % sorted.length];
    const startMinutes = timeToMinutes(transition.time);
    const endMinutes = timeToMinutes(next.time);
    // The single-point case: the range runs all the way round the week back onto
    // itself, which reads as a full day rather than an empty one.
    const wrapsWholeWeek = sorted.length === 1;
    const endsNextDay = wrapsWholeWeek || next.day_of_week !== transition.day_of_week || endMinutes <= startMinutes;
    ranges.push({
      day_of_week: transition.day_of_week,
      start_time: transition.time,
      end_time: wrapsWholeWeek ? transition.time : next.time,
      preset: transition.preset,
      ends_next_day: endsNextDay,
    });
  });
  return ranges;
}

/**
 * @description Turn the ranges an editor holds back into transition points.
 *
 * Each range opens a point at its start, and closes with a stop at its end —
 * unless another range starts exactly there, in which case that range's point
 * does the closing and no stop is needed.
 *
 * **What is not covered by a range is a stop.** A thermostat follows the last
 * point before now, so leaving a stretch uncovered would have it keep whatever
 * ran before — a programme whose effect depends on the thermostat's history.
 * Closing every range makes the programme say the same thing whatever happened
 * before it, which is what the editor draws as hatching.
 * @param {Array} ranges - Ranges: { day_of_week, start_time, end_time, preset }.
 * @returns {Array} Transition points: { day_of_week, time, preset }.
 * @example
 * rangesToTransitions([{ day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' }]);
 */
function rangesToTransitions(ranges) {
  if (!ranges || ranges.length === 0) {
    return [];
  }
  // A point is keyed by the moment it falls: two ranges meeting at 09:00 give one
  // point there, the opening one, never a stop that would cut the programme.
  const opens = new Map();
  const closes = new Map();
  const key = (day, time) => `${day}-${time}`;

  ranges.forEach((range) => {
    const startKey = key(range.day_of_week, range.start_time);
    opens.set(startKey, { day_of_week: range.day_of_week, time: range.start_time, preset: range.preset });

    // Where the range ends. An end at or before its start runs past midnight, so
    // the stop belongs to the following day — the same wrap the points model
    // already has, expressed once here instead of in every editor operation.
    const startMinutes = timeToMinutes(range.start_time);
    const endMinutes = timeToMinutes(range.end_time);
    const endsNextDay = endMinutes <= startMinutes;
    const endDay = endsNextDay ? (range.day_of_week + 1) % 7 : range.day_of_week;
    // Midnight is `00:00` of the following day, never `24:00`: an end at or
    // before the start already sent endDay forward, so the time stands as typed.
    closes.set(key(endDay, range.end_time), {
      day_of_week: endDay,
      time: range.end_time,
      preset: STOP_PRESET,
    });
  });

  // An opening always wins over a closing at the same moment: back-to-back ranges
  // must not be separated by a stop.
  const transitions = [...opens.values()];
  closes.forEach((close, closeKey) => {
    if (!opens.has(closeKey)) {
      transitions.push(close);
    }
  });

  const sorted = transitions.sort(
    (a, b) => a.day_of_week - b.day_of_week || timeToMinutes(a.time) - timeToMinutes(b.time),
  );

  // The week wraps, so the last point of the week is what holds at Monday 00:00.
  // When that is a range still running, the start of the week inherits a preset
  // nobody put there, on a stretch the editor draws as uncovered. A stop at the
  // top of the week closes it.
  //
  // Whether Monday morning is covered is decided by the ranges, not by the last
  // point: a Sunday night ending Monday at 06:30 covers it and needs no stop,
  // even though its own point is the last of the week and opens a range.
  const coversMondayMorning = ranges.some((range) => {
    const crossesMidnight = timeToMinutes(range.end_time) <= timeToMinutes(range.start_time);
    if (crossesMidnight) {
      // Sunday's night reaches into Monday; any other day's reaches the day after.
      return range.day_of_week === 6;
    }
    return range.day_of_week === 0 && timeToMinutes(range.start_time) === 0;
  });
  if (!coversMondayMorning) {
    sorted.unshift({ day_of_week: 0, time: '00:00', preset: STOP_PRESET });
  }

  return sorted;
}

module.exports = { transitionsToRanges, rangesToTransitions, STOP_PRESET };
