const { timeToMinutes, minutesToTime, DAY_MINUTES } = require('./thermostatSchedule');

// A range whose preset is this one is not a temperature to reach but the absence
// of one: it is stored as a transition point that stops the thermostat, and read
// back as "nothing scheduled here" rather than as a range of its own.
const STOP_PRESET = 'off';

/**
 * @description Turn a schedule's transition points into the ranges an editor
 * shows: a start, an end and a preset. A point holds until the next one, so the
 * end of a range is simply where the following point begins.
 *
 * A point that stops the thermostat is a range too, carrying the `off` preset.
 * Dropping it left a hole the editor could only draw as hatching, which read as
 * "nothing is set here" when it meant "the heating is off here" — the one state
 * the programme imposes that nobody could see in a list or edit.
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

    // An off range is already the stop: closing it would add a second `off`
    // point, which the next read turns into another range, and the schedule grows
    // by one row on every edit. Whatever follows it opens its own point.
    if (range.preset === STOP_PRESET) {
      return;
    }
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
  //
  // A range opening Monday at midnight covers it whatever its end: a whole Monday
  // (`00:00 → 00:00`) reads as crossing midnight, and once added a stop at the
  // same moment as its own point — two points on one minute, which the unique
  // index refuses.
  const coversMondayMorning = ranges.some((range) => {
    if (range.day_of_week === 0 && timeToMinutes(range.start_time) === 0) {
      return true;
    }
    const crossesMidnight = timeToMinutes(range.end_time) <= timeToMinutes(range.start_time);
    if (crossesMidnight) {
      // Sunday's night reaches into Monday; any other day's reaches the day after.
      return range.day_of_week === 6;
    }
    return false;
  });
  if (!coversMondayMorning) {
    sorted.unshift({ day_of_week: 0, time: '00:00', preset: STOP_PRESET });
  }

  return sorted;
}

/**
 * @description Whether a range covers its whole day, from midnight to the next
 * midnight. An end equal to the start runs 24 hours, so `00:00 → 00:00` is the
 * day itself — what the editor's "All day" option writes, and how it reads one
 * back.
 * @param {object} range - A range: { start_time, end_time }.
 * @returns {boolean} True for a range covering its day entirely.
 * @example
 * isAllDayRange({ start_time: '00:00', end_time: '00:00' }); // true
 */
function isAllDayRange(range) {
  return Boolean(range) && range.start_time === '00:00' && range.end_time === '00:00';
}

/**
 * @description Merge the ranges of the same preset that touch into one.
 *
 * Two of them show as two identical lines — 06:30-17:00 Comfort, then
 * 17:00-22:30 Comfort — while the points model stores a single stretch, so the
 * editor would be saying something the schedule does not.
 *
 * Walks the week in order so a chain of three merges in one pass, and follows a
 * range across midnight onto the next day — the night and the morning that
 * continue it are one stretch.
 *
 * **Never past 24 hours.** A range has a start and an end on a clock, so it can
 * say at most one full day: a merged Monday 08:00 → Tuesday 20:00 could only be
 * written `08:00 → 20:00`, which reads as twelve hours, and the whole of Tuesday
 * was lost on save. Two all-day frost ranges on Saturday and Sunday are the
 * common case. Such neighbours stay two ranges, one under each day.
 * @param {Array} ranges - Ranges: { day_of_week, start_time, end_time, preset }.
 * @returns {Array} The ranges, touching ones of the same preset merged.
 * @example
 * mergeTouchingRanges([
 *   { day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' },
 *   { day_of_week: 0, start_time: '09:00', end_time: '12:00', preset: 'comfort' },
 * ]);
 */
function mergeTouchingRanges(ranges) {
  const WEEK = 7 * DAY_MINUTES;
  const openAt = (range) => range.day_of_week * DAY_MINUTES + timeToMinutes(range.start_time);
  const closeAt = (range) => {
    const start = openAt(range);
    const end = range.day_of_week * DAY_MINUTES + timeToMinutes(range.end_time);
    return end <= start ? end + DAY_MINUTES : end;
  };
  // The two may only be one range if, together, they still fit in a day.
  const fitsInADay = (first, second) =>
    closeAt(second) + (closeAt(second) < openAt(first) ? WEEK : 0) - openAt(first) <= DAY_MINUTES;
  const sorted = [...ranges].sort((a, b) => openAt(a) - openAt(b));
  const merged = [];
  sorted.forEach((range) => {
    const previous = merged[merged.length - 1];
    // The week wraps, so a range opening exactly where the previous one closes
    // is its continuation — including the one that closes past midnight.
    if (
      previous &&
      previous.preset === range.preset &&
      closeAt(previous) === openAt(range) &&
      fitsInADay(previous, range)
    ) {
      merged[merged.length - 1] = { ...previous, end_time: range.end_time };
      return;
    }
    merged.push(range);
  });
  // The last range of the week may run into the first, which the pass above
  // cannot see: they are at the two ends of the list.
  if (merged.length > 1) {
    const last = merged[merged.length - 1];
    const first = merged[0];
    if (last.preset === first.preset && closeAt(last) % WEEK === openAt(first) && fitsInADay(last, first)) {
      merged[0] = { ...last, end_time: first.end_time };
      merged.pop();
    }
  }
  return merged;
}

/**
 * @description The day/minute stretches a range occupies. One for a range inside
 * its day, two for one crossing midnight: the tail of its own day, then the head
 * of the next.
 * @param {object} range - A range: { day_of_week, start_time, end_time }.
 * @returns {Array} Spans: { day, start, end }, in minutes of that day.
 * @example
 * rangeSpans({ day_of_week: 0, start_time: '22:30', end_time: '06:30' });
 */
function rangeSpans(range) {
  const start = timeToMinutes(range.start_time);
  const end = timeToMinutes(range.end_time);
  if (end > start) {
    return [{ day: range.day_of_week, start, end }];
  }
  const spans = [{ day: range.day_of_week, start, end: DAY_MINUTES }];
  if (end > 0) {
    spans.push({ day: (range.day_of_week + 1) % 7, start: 0, end });
  }
  return spans;
}

/**
 * @description Make room for a new range by trimming what it covers, rather than
 * refusing it.
 *
 * On a real schedule every day is already covered — the night runs to the next
 * morning — so there is no free gap to add into, and "comfort from 12 to 14" was
 * refused as an overlap. Trimming is the gesture the user meant: what the new
 * range covers gives way.
 *
 * A range the new one sits inside is split in two; one it merely clips is
 * shortened on that side; one it swallows entirely disappears. A range crossing
 * midnight is handled through its day/minute spans, so a night is trimmed on the
 * day it is stored on — and what is left of it past midnight is put back on the
 * day it falls on. Kept on the night's own day, a Tuesday 04:00 → 06:30 tail was
 * written as Monday 04:00 → 06:30, and an all-day Monday turned the Tuesday
 * morning into a Monday 00:00 range that the editor then dropped as a duplicate
 * start.
 * @param {Array} ranges - The ranges in place: { key, day_of_week, start_time, end_time, preset }.
 * @param {object} candidate - The range being added: { day_of_week, start_time, end_time }.
 * @param {string|number|null} [ignoredKey] - The range being edited, which never trims itself.
 * @returns {Array} The ranges, trimmed around the candidate (which is not included).
 * @example
 * trimRangesAround(ranges, { day_of_week: 0, start_time: '12:00', end_time: '14:00' });
 */
function trimRangesAround(ranges, candidate, ignoredKey = null) {
  const candidateSpans = rangeSpans(candidate);
  const covers = (day, start, end) =>
    candidateSpans.some((span) => span.day === day && span.start < end && start < span.end);

  const result = [];
  ranges.forEach((range) => {
    if (range.key === ignoredKey) {
      result.push(range);
      return;
    }
    const start = timeToMinutes(range.start_time);
    const rawEnd = timeToMinutes(range.end_time);
    // An overnight range is measured past midnight, so a single interval
    // describes it; the covering test below maps it back onto its days.
    const end = rawEnd <= start ? rawEnd + DAY_MINUTES : rawEnd;
    if (!rangeSpans(range).some((span) => covers(span.day, span.start, span.end))) {
      result.push(range);
      return;
    }
    // Where the new range falls inside this one's own timeline.
    const cutStart = candidateSpans.reduce((acc, span) => {
      const absolute = span.day === range.day_of_week ? span.start : span.start + DAY_MINUTES;
      return absolute > start && absolute < end ? Math.min(acc, absolute) : acc;
    }, Infinity);
    const cutEnd = candidateSpans.reduce((acc, span) => {
      const absolute = span.day === range.day_of_week ? span.end : span.end + DAY_MINUTES;
      return absolute > start && absolute < end ? Math.max(acc, absolute) : acc;
    }, -Infinity);

    if (cutStart !== Infinity && cutStart > start) {
      // An end at or before the start reads as the next day, so the head of a
      // night cut after midnight is written as typed.
      result.push({ ...range, end_time: minutesToTime(cutStart) });
    }
    if (cutEnd !== -Infinity && cutEnd < end) {
      result.push({
        ...range,
        key: `${range.key}-tail-${cutEnd}`,
        day_of_week: cutEnd >= DAY_MINUTES ? (range.day_of_week + 1) % 7 : range.day_of_week,
        start_time: minutesToTime(cutEnd),
        end_time: range.end_time,
      });
    }
    // Neither head nor tail survives: the new range swallows this one whole.
  });
  return result;
}

/**
 * @description Delete a range and hand its time to the range before it, rather
 * than leaving a gap.
 *
 * A gap is not nothing: `rangesToTransitions` stores it as an Off point, so
 * deleting the 08:30-17:00 eco range used to write `08:30 off` and cut the
 * heating until 17:00. Stopping the heating is something the user asks for with
 * the Off preset; it is never a side effect of a deletion.
 *
 * The predecessor is found on the week's own timeline, so it may sit on an
 * earlier day — the night before, or Sunday for a Monday morning range. When
 * there is none (the only range of the week), the schedule is simply empty.
 *
 * The removed stretch is taken over by a range of the predecessor's preset, which
 * the merge then joins to it. Stretching the predecessor itself could take it past
 * 24 hours — deleting Tuesday after an all-day Monday wrote Monday `00:00 →
 * 00:00`, and Tuesday came out stopped.
 * @param {Array} ranges - The ranges in place: { key, day_of_week, start_time, end_time, preset }.
 * @param {string|number} key - The key of the range to delete.
 * @returns {Array} The remaining ranges, merged.
 * @example
 * removeRangeAndFill(ranges, 'k1');
 */
function removeRangeAndFill(ranges, key) {
  const removed = ranges.find((range) => range.key === key);
  const remaining = ranges.filter((range) => range.key !== key);
  if (!removed || remaining.length === 0) {
    return remaining;
  }
  // Minutes of the week each range opens and closes at, the end carried past the
  // week's end when it wraps so "ends where the removed one starts" can be
  // compared on one line.
  const WEEK = 7 * DAY_MINUTES;
  const openAt = (range) => range.day_of_week * DAY_MINUTES + timeToMinutes(range.start_time);
  const closeAt = (range) => {
    const start = openAt(range);
    const end = range.day_of_week * DAY_MINUTES + timeToMinutes(range.end_time);
    return end <= start ? end + DAY_MINUTES : end;
  };
  const removedStart = openAt(removed);
  // The range that ends where this one starts, or the closest one ending before
  // it — measured round the week, so Sunday night precedes Monday.
  let predecessor = remaining[0];
  let smallestDistance = Infinity;
  remaining.forEach((range) => {
    const distance = (((removedStart - closeAt(range)) % WEEK) + WEEK) % WEEK;
    if (distance < smallestDistance) {
      smallestDistance = distance;
      predecessor = range;
    }
  });
  // A gap before the removed range, if there was one, is closed by the
  // predecessor — as long as that keeps it within a day.
  const closesGap =
    smallestDistance > 0 && smallestDistance + closeAt(predecessor) - openAt(predecessor) <= DAY_MINUTES;
  const kept = remaining.map((range) =>
    closesGap && range.key === predecessor.key ? { ...range, end_time: removed.start_time } : range,
  );
  const filler = { ...removed, key: `${predecessor.key}-fill-${removed.key}`, preset: predecessor.preset };
  return mergeTouchingRanges([...kept, filler]);
}

module.exports = {
  transitionsToRanges,
  rangesToTransitions,
  isAllDayRange,
  mergeTouchingRanges,
  rangeSpans,
  trimRangesAround,
  removeRangeAndFill,
  STOP_PRESET,
};
