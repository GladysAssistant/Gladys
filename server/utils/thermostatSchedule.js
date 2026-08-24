const DAY_MINUTES = 24 * 60; // 1440

/**
 * @description Convert a "HH:MM" time string to minutes from midnight.
 * @param {string} time - Time string in HH:MM format.
 * @returns {number} Minutes from midnight.
 * @example
 * timeToMinutes('08:30'); // 510
 */
const timeToMinutes = (time) => {
  if (!time) {
    return 0;
  }
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

/**
 * @description Convert minutes from midnight to a "HH:MM" time string.
 * Values exceeding DAY_MINUTES wrap around.
 * @param {number} mins - Minutes from midnight (may exceed 1440).
 * @returns {string} Time string in HH:MM format.
 * @example
 * minutesToTime(510); // '08:30'
 */
const minutesToTime = (mins) => {
  const m = ((mins % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/**
 * @description Apply a new or edited slot into a day's existing slot list.
 * Overlapping slots are trimmed/dropped and the predecessor is extended to close gaps.
 * A newEnd exceeding DAY_MINUTES generates an overflow slot for the next day.
 * @param {Array} existingDaySlots - Current slots for this day.
 * @param {number} dayOfWeek - Target day (0=Monday … 6=Sunday).
 * @param {number} newStart - Slot start in minutes from midnight.
 * @param {number} newEnd - Slot end in minutes (may exceed 1440 for overnight).
 * @param {string} newPreset - Preset name for the new slot.
 * @param {string|number} newKey - Unique key for the new slot.
 * @param {string|number|null} excludeKey - Key of the slot being replaced (edit), or null.
 * @returns {{ fixedSlots: Array, overflowSlot: object|null }} Adjusted slots and optional overflow.
 * @example
 * applySlotToDay([], 3, 480, 600, 'comfort', 'k1', null);
 */
const applySlotToDay = (existingDaySlots, dayOfWeek, newStart, newEnd, newPreset, newKey, excludeKey) => {
  const clampedEnd = Math.min(newEnd, DAY_MINUTES);
  const overflowMins = newEnd > DAY_MINUTES ? newEnd - DAY_MINUTES : 0;

  const slots = excludeKey ? existingDaySlots.filter((s) => s.key !== excludeKey) : existingDaySlots;

  const sortedByEnd = slots.slice().sort((a, b) => {
    const aEnd = timeToMinutes(a.end_time) || DAY_MINUTES;
    const bEnd = timeToMinutes(b.end_time) || DAY_MINUTES;
    return aEnd - bEnd;
  });

  let predecessorKey = null;
  let predecessorEnd = -1;
  sortedByEnd.forEach((s) => {
    const sEnd = timeToMinutes(s.end_time) || DAY_MINUTES;
    if (sEnd <= newStart && sEnd > predecessorEnd) {
      predecessorEnd = sEnd;
      predecessorKey = s.key;
    }
  });

  const adjusted = [];
  slots.forEach((s) => {
    const sStart = timeToMinutes(s.start_time);
    const sEndRaw = timeToMinutes(s.end_time);
    const sEnd = sEndRaw === 0 ? DAY_MINUTES : sEndRaw;

    if (sEnd <= newStart || sStart >= clampedEnd) {
      if (s.key === predecessorKey && sEnd < newStart) {
        adjusted.push({ ...s, end_time: minutesToTime(newStart) });
      } else {
        adjusted.push(s);
      }
    } else if (sStart < newStart && sEnd > clampedEnd) {
      adjusted.push({ ...s, end_time: minutesToTime(newStart) });
      adjusted.push({ ...s, start_time: minutesToTime(clampedEnd), key: `split-${s.key}` });
    } else if (sStart < newStart) {
      adjusted.push({ ...s, end_time: minutesToTime(newStart) });
    } else if (sEnd > clampedEnd) {
      adjusted.push({ ...s, start_time: minutesToTime(clampedEnd) });
    }
  });

  adjusted.push({
    day_of_week: dayOfWeek,
    start_time: minutesToTime(newStart),
    end_time: minutesToTime(clampedEnd),
    preset: newPreset,
    key: newKey,
  });

  const overflowSlot =
    overflowMins > 0
      ? {
          start_time: '00:00',
          end_time: minutesToTime(overflowMins),
          preset: newPreset,
          key: `overflow-${newKey}`,
        }
      : null;

  return { fixedSlots: adjusted, overflowSlot };
};

/**
 * @description Merge fixed day slots and optional overflow into the global slots array.
 * The overflow covers [00:00, overflowEnd] on the next day: slots it overlaps are
 * trimmed to start at its end, and only those fully covered are dropped. Deleting
 * every slot that starts at 00:00 would silently lose a morning slot that merely
 * began at midnight.
 * @param {Array} allSlots - All slots across all days.
 * @param {number} dayOfWeek - The day whose slots were rebuilt.
 * @param {Array} taggedFixed - Rebuilt slots for dayOfWeek (already tagged with day_of_week).
 * @param {object|null} overflowSlot - Overflow slot for the next day, or null.
 * @returns {Array} Updated full slots array.
 * @example
 * // Replace all slots for day 0, no overflow:
 * mergeIntoSlots(allSlots, 0, fixedSlots, null);
 */
const mergeIntoSlots = (allSlots, dayOfWeek, taggedFixed, overflowSlot) => {
  if (!overflowSlot) {
    return [...allSlots.filter((s) => s.day_of_week !== dayOfWeek), ...taggedFixed];
  }
  const nextDay = (dayOfWeek + 1) % 7;
  const overflowEnd = timeToMinutes(overflowSlot.end_time) || DAY_MINUTES;
  const nextDayKept = [];
  allSlots
    .filter((s) => s.day_of_week === nextDay)
    .forEach((s) => {
      const sStart = timeToMinutes(s.start_time);
      const sEndRaw = timeToMinutes(s.end_time);
      const sEnd = sEndRaw === 0 ? DAY_MINUTES : sEndRaw;
      if (sStart >= overflowEnd) {
        // Starts after the overflow: untouched.
        nextDayKept.push(s);
        return;
      }
      if (sEnd > overflowEnd) {
        // Partially covered: keep the tail rather than dropping the whole slot.
        nextDayKept.push({ ...s, start_time: minutesToTime(overflowEnd) });
      }
      // Fully covered by the overflow: dropped.
    });
  const otherDays = allSlots.filter((s) => s.day_of_week !== dayOfWeek && s.day_of_week !== nextDay);
  return [...otherDays, ...taggedFixed, ...nextDayKept, { ...overflowSlot, day_of_week: nextDay }];
};

/**
 * @description Read a day's slots as the user entered them, re-joining a slot that
 * crosses midnight with the 00:00 piece it left on the next day.
 *
 * `applySlotToDay` stores an overnight slot as two rows — 22:30→00:00 on the day
 * itself, 00:00→06:30 on the next one — because a row belongs to exactly one day.
 * That split is invisible to the regulation loop, which reads yesterday's slots
 * too, but any operation working on "this day" sees only half of it. Copying a
 * day from its rows alone therefore drops the morning half and, when the next day
 * is itself a copy target, overwrites it.
 *
 * The pairing cannot use the `overflow-` key prefix: keys are render-only handles,
 * stripped on save and regenerated on load, so a reopened schedule has none. It is
 * recovered from the geometry instead — a slot ending at midnight, and a slot
 * starting at midnight on the next day with the same preset.
 * @param {Array} allSlots - All slots across all days.
 * @param {number} dayOfWeek - The day to read (0=Monday … 6=Sunday).
 * @returns {Array} The day's slots, overnight ones carrying an `end_time` past 1440.
 * @example
 * // 22:30→00:00 on day 0 plus 00:00→06:30 on day 1 reads back as one 22:30→06:30 slot
 * readDayAsEntered(slots, 0);
 */
const readDayAsEntered = (allSlots, dayOfWeek) => {
  const nextDay = (dayOfWeek + 1) % 7;
  const daySlots = allSlots.filter((s) => s.day_of_week === dayOfWeek);
  const nextDaySlots = allSlots.filter((s) => s.day_of_week === nextDay);
  return daySlots.map((slot) => {
    const endsAtMidnight = timeToMinutes(slot.end_time) === 0;
    if (!endsAtMidnight) {
      return slot;
    }
    // A slot ending at midnight only overflows when the next day opens at
    // midnight on the same preset. Anything else is a plain evening slot.
    const overflow = nextDaySlots.find(
      (s) => timeToMinutes(s.start_time) === 0 && s.preset === slot.preset && timeToMinutes(s.end_time) !== 0,
    );
    if (!overflow) {
      return slot;
    }
    return { ...slot, end_time: overflow.end_time, overnight: true };
  });
};

/**
 * @description Copy one day's slots onto other days, preserving overnight slots.
 * Each target is rebuilt from the source read as entered, so a night crossing
 * midnight lands on the target as the same pair of rows the editor would have
 * produced there: the evening piece on the target, the morning piece on the day
 * after it.
 *
 * Targets are applied one after another through `applySlotToDay`/`mergeIntoSlots`
 * rather than assigned wholesale, so that when consecutive days are copied the
 * overflow written onto a day is trimmed by that day's own slots instead of
 * silently surviving or clobbering them.
 * @param {Array} allSlots - All slots across all days.
 * @param {number} sourceDay - Day to copy from.
 * @param {Array<number>} targetDays - Days to copy onto.
 * @param {Function} makeKey - Returns a fresh unique key for a created slot.
 * @returns {Array} The updated slots array.
 * @example
 * copyDayOntoDays(slots, 0, [1, 2, 3], () => Math.random());
 */
const copyDayOntoDays = (allSlots, sourceDay, targetDays, makeKey) => {
  const sourceSlots = readDayAsEntered(allSlots, sourceDay)
    .slice()
    .sort((a, b) => {
      return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
    });
  // The source is read once, up front: applying a target may rewrite the source
  // day itself (copying Monday onto Sunday overflows back onto Monday).
  //
  // Every target is cleared before any is filled. Clearing them one at a time
  // would wipe the overflow the previous target just wrote onto this one, which
  // is the very bug this function exists to fix.
  let result = allSlots.filter((s) => !targetDays.includes(s.day_of_week));
  // Clearing the targets also dropped the overflow the source itself spills onto
  // the day after it, when that day is a target. The source keeps its own rows,
  // so replaying it onto itself is what puts that piece back.
  const daysToFill = targetDays.includes((sourceDay + 1) % 7) ? [...targetDays, sourceDay] : targetDays;
  daysToFill.forEach((targetDay) => {
    sourceSlots.forEach((slot) => {
      const start = timeToMinutes(slot.start_time);
      const rawEnd = timeToMinutes(slot.end_time) || DAY_MINUTES;
      // An overnight slot was re-joined above: its end belongs to the next day.
      const end = slot.overnight ? rawEnd + DAY_MINUTES : rawEnd;
      const existing = result.filter((s) => s.day_of_week === targetDay);
      const { fixedSlots, overflowSlot } = applySlotToDay(
        existing,
        targetDay,
        start,
        end,
        slot.preset,
        makeKey(),
        null,
      );
      const taggedFixed = fixedSlots.map((s) => ({ ...s, day_of_week: targetDay }));
      result = mergeIntoSlots(result, targetDay, taggedFixed, overflowSlot);
    });
  });
  return result;
};

/**
 * @description Parse an end time string, treating 00:00 as end of day (1440 minutes).
 * @param {string} timeStr - Time string in HH:MM format.
 * @returns {number} Minutes since midnight, 1440 if 00:00.
 * @example
 * parseEnd('00:00'); // 1440
 */
const parseEnd = (timeStr) => {
  const v = timeToMinutes(timeStr);
  return v === 0 ? DAY_MINUTES : v;
};

const WEEKDAY_INDEX = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

/**
 * @description Return the current day-of-week (Monday=0) and minutes since midnight,
 * read in the given timezone. Official Gladys images run in UTC, so relying on the
 * process timezone would shift every schedule slot by the local UTC offset.
 * Falls back to the process timezone when the zone name is unknown.
 * @param {Date} [now] - Reference date, defaults to the current time.
 * @param {string} [timezone] - IANA timezone name, e.g. 'Europe/Paris'.
 * @returns {{ dayOfWeek: number, yesterdayOfWeek: number, currentMinutes: number }} Current position in the week.
 * @example
 * getCurrentDayAndMinutes(new Date('2026-08-21T08:30:00Z'), 'Europe/Paris');
 */
const getCurrentDayAndMinutes = (now = new Date(), timezone = null) => {
  let weekday = null;
  let hours = null;
  let minutes = null;
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(now);
      const get = (type) => parts.find((part) => part.type === type).value;
      const parsedWeekday = WEEKDAY_INDEX[get('weekday')];
      // Intl renders midnight as hour 24 in some ICU versions
      const parsedHours = parseInt(get('hour'), 10) % 24;
      const parsedMinutes = parseInt(get('minute'), 10);
      weekday = parsedWeekday;
      hours = parsedHours;
      minutes = parsedMinutes;
    } catch (e) {
      // Unknown timezone: fall back to the process timezone below
    }
  }
  if (weekday === null) {
    weekday = (now.getDay() + 6) % 7; // Monday=0 ... Sunday=6
    hours = now.getHours();
    minutes = now.getMinutes();
  }
  return {
    dayOfWeek: weekday,
    yesterdayOfWeek: (weekday + 6) % 7,
    currentMinutes: hours * 60 + minutes,
  };
};

/**
 * @description Find the slot covering the current time, handling slots that cross midnight.
 * Checked in order: today's normal slots, today's overnight slots (start day part),
 * then yesterday's overnight slots (which spill into today).
 * @param {Array} todaySlots - Slots for the current day.
 * @param {Array} yesterdaySlots - Slots for the previous day.
 * @param {number} currentMinutes - Current time in minutes since midnight.
 * @returns {object|null} The matching slot, or null when no slot covers this time.
 * @example
 * findMatchingSlot(todaySlots, yesterdaySlots, 480);
 */
const findMatchingSlot = (todaySlots, yesterdaySlots, currentMinutes) => {
  // Today's normal slots (start < end, same day)
  const matchedToday = todaySlots.find((slot) => {
    const slotStart = timeToMinutes(slot.start_time);
    const slotEnd = parseEnd(slot.end_time);
    return slotEnd > slotStart && currentMinutes >= slotStart && currentMinutes < slotEnd;
  });
  if (matchedToday) {
    return matchedToday;
  }

  // Today's overnight slots (end < start): covers start → 23:59 on the start day
  const matchedOvernightStart = todaySlots.find((slot) => {
    const slotStart = timeToMinutes(slot.start_time);
    const slotEnd = timeToMinutes(slot.end_time);
    return slotEnd < slotStart && currentMinutes >= slotStart;
  });
  if (matchedOvernightStart) {
    return matchedOvernightStart;
  }

  // Yesterday's overnight slots: covers 00:00 → end on the following day
  const matchedOvernightEnd = yesterdaySlots.find((slot) => {
    const slotStart = timeToMinutes(slot.start_time);
    const slotEnd = timeToMinutes(slot.end_time);
    return slotEnd < slotStart && currentMinutes < slotEnd;
  });
  return matchedOvernightEnd || null;
};

/**
 * @description Find the preset active at the current time in a list of slots.
 * @param {Array} todaySlots - Slots for the current day.
 * @param {Array} yesterdaySlots - Slots for the previous day.
 * @param {number} currentMinutes - Current time in minutes since midnight.
 * @returns {string|null} Matched preset, or null when no slot covers this time.
 * @example
 * findMatchingPreset(todaySlots, yesterdaySlots, 480); // 'comfort'
 */
const findMatchingPreset = (todaySlots, yesterdaySlots, currentMinutes) => {
  const slot = findMatchingSlot(todaySlots, yesterdaySlots, currentMinutes);
  return slot ? slot.preset : null;
};

module.exports = {
  applySlotToDay,
  mergeIntoSlots,
  readDayAsEntered,
  copyDayOntoDays,
  timeToMinutes,
  minutesToTime,
  parseEnd,
  getCurrentDayAndMinutes,
  findMatchingSlot,
  findMatchingPreset,
  DAY_MINUTES,
};
