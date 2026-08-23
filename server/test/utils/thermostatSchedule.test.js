const { expect } = require('chai');
const {
  applySlotToDay,
  mergeIntoSlots,
  timeToMinutes,
  minutesToTime,
  parseEnd,
  getCurrentDayAndMinutes,
  findMatchingSlot,
  findMatchingPreset,
  DAY_MINUTES,
} = require('../../utils/thermostatSchedule');

describe('thermostatSchedule.applySlotToDay', () => {
  it('should assign the correct day_of_week when no existing slots (bug fix)', () => {
    const { fixedSlots } = applySlotToDay([], 3, 480, 600, 'comfort', 'k1', null);
    expect(fixedSlots).to.have.lengthOf(1);
    expect(fixedSlots[0].day_of_week).to.equal(3);
  });

  it('should assign day_of_week=0 correctly when targeting Monday', () => {
    const { fixedSlots } = applySlotToDay([], 0, 480, 600, 'eco', 'k2', null);
    expect(fixedSlots[0].day_of_week).to.equal(0);
  });

  it('should add slot with correct start/end times', () => {
    const { fixedSlots } = applySlotToDay([], 1, 8 * 60, 12 * 60, 'comfort', 'k3', null);
    expect(fixedSlots[0].start_time).to.equal('08:00');
    expect(fixedSlots[0].end_time).to.equal('12:00');
    expect(fixedSlots[0].preset).to.equal('comfort');
  });

  it('should truncate an existing slot that overlaps at the start', () => {
    const existing = [{ key: 'a', day_of_week: 2, start_time: '06:00', end_time: '10:00', preset: 'eco' }];
    const { fixedSlots } = applySlotToDay(existing, 2, 8 * 60, 12 * 60, 'comfort', 'k4', null);
    const eco = fixedSlots.find((s) => s.preset === 'eco');
    expect(eco).to.not.equal(undefined);
    expect(eco.end_time).to.equal('08:00');
  });

  it('should truncate an existing slot that overlaps at the end', () => {
    const existing = [{ key: 'b', day_of_week: 2, start_time: '10:00', end_time: '14:00', preset: 'away' }];
    const { fixedSlots } = applySlotToDay(existing, 2, 8 * 60, 12 * 60, 'comfort', 'k5', null);
    const away = fixedSlots.find((s) => s.preset === 'away');
    expect(away).to.not.equal(undefined);
    expect(away.start_time).to.equal('12:00');
  });

  it('should split an existing slot that fully contains the new slot', () => {
    const existing = [{ key: 'c', day_of_week: 4, start_time: '06:00', end_time: '20:00', preset: 'eco' }];
    const { fixedSlots } = applySlotToDay(existing, 4, 8 * 60, 12 * 60, 'comfort', 'k6', null);
    const ecoParts = fixedSlots.filter((s) => s.preset === 'eco');
    expect(ecoParts).to.have.lengthOf(2);
    expect(ecoParts[0].end_time).to.equal('08:00');
    expect(ecoParts[1].start_time).to.equal('12:00');
  });

  it('should drop a slot fully covered by the new slot', () => {
    const existing = [{ key: 'd', day_of_week: 5, start_time: '09:00', end_time: '11:00', preset: 'frost' }];
    const { fixedSlots } = applySlotToDay(existing, 5, 8 * 60, 12 * 60, 'comfort', 'k7', null);
    const frost = fixedSlots.find((s) => s.preset === 'frost');
    expect(frost).to.equal(undefined);
  });

  it('should produce an overflow slot when newEnd exceeds DAY_MINUTES', () => {
    const { fixedSlots, overflowSlot } = applySlotToDay([], 6, 23 * 60, 25 * 60, 'night', 'k8', null);
    expect(fixedSlots[0].end_time).to.equal('00:00');
    expect(overflowSlot).to.not.equal(undefined);
    expect(overflowSlot.start_time).to.eq('00:00');
    expect(overflowSlot.end_time).to.eq('01:00');
  });

  it('should not produce overflow when newEnd is exactly DAY_MINUTES', () => {
    const { overflowSlot } = applySlotToDay([], 0, 22 * 60, 24 * 60, 'night', 'k9', null);
    expect(overflowSlot).to.equal(null);
  });
});

describe('thermostatSchedule.mergeIntoSlots', () => {
  it('should replace slots for the target day only', () => {
    const all = [
      { day_of_week: 0, start_time: '08:00', end_time: '12:00', preset: 'eco', key: 'x1' },
      { day_of_week: 1, start_time: '08:00', end_time: '12:00', preset: 'away', key: 'x2' },
    ];
    const newSlots = [{ day_of_week: 0, start_time: '09:00', end_time: '17:00', preset: 'comfort', key: 'x3' }];
    const result = mergeIntoSlots(all, 0, newSlots, null);
    expect(result.filter((s) => s.day_of_week === 0)).to.have.lengthOf(1);
    expect(result.filter((s) => s.day_of_week === 0)[0].key).to.equal('x3');
    expect(result.filter((s) => s.day_of_week === 1)).to.have.lengthOf(1);
  });

  it('should replace a next-day slot fully covered by the overflow', () => {
    const all = [
      { day_of_week: 1, start_time: '00:00', end_time: '02:00', preset: 'frost', key: 'y1' },
      { day_of_week: 1, start_time: '06:00', end_time: '08:00', preset: 'eco', key: 'y2' },
    ];
    const fixed = [{ day_of_week: 0, start_time: '22:00', end_time: '00:00', preset: 'night', key: 'y3' }];
    const overflow = { start_time: '00:00', end_time: '02:00', preset: 'night', key: 'overflow-y3' };
    const result = mergeIntoSlots(all, 0, fixed, overflow);
    const day1 = result.filter((s) => s.day_of_week === 1);
    expect(day1).to.have.lengthOf(2);
    expect(day1.find((s) => s.preset === 'night')).to.not.equal(undefined);
    expect(day1.find((s) => s.key === 'y1')).to.equal(undefined);
    expect(day1.find((s) => s.key === 'y2')).to.not.equal(undefined);
  });

  it('should trim a next-day slot the overflow only partially covers', () => {
    // The morning slot starts at midnight but runs past the overflow: trimming it
    // is right, dropping it would silently lose the rest of the morning.
    const all = [{ day_of_week: 1, start_time: '00:00', end_time: '08:00', preset: 'eco', key: 'y1' }];
    const fixed = [{ day_of_week: 0, start_time: '22:00', end_time: '00:00', preset: 'night', key: 'y3' }];
    const overflow = { start_time: '00:00', end_time: '02:00', preset: 'night', key: 'overflow-y3' };

    const result = mergeIntoSlots(all, 0, fixed, overflow);

    const day1 = result.filter((s) => s.day_of_week === 1);
    const eco = day1.find((s) => s.key === 'y1');
    expect(eco).to.not.equal(undefined);
    expect(eco.start_time).to.equal('02:00');
    expect(eco.end_time).to.equal('08:00');
  });

  it('should leave a next-day slot starting after the overflow untouched', () => {
    const all = [{ day_of_week: 1, start_time: '06:00', end_time: '08:00', preset: 'eco', key: 'y2' }];
    const fixed = [{ day_of_week: 0, start_time: '22:00', end_time: '00:00', preset: 'night', key: 'y3' }];
    const overflow = { start_time: '00:00', end_time: '02:00', preset: 'night', key: 'overflow-y3' };

    const result = mergeIntoSlots(all, 0, fixed, overflow);

    const eco = result.filter((s) => s.day_of_week === 1).find((s) => s.key === 'y2');
    expect(eco).to.not.equal(undefined);
    expect(eco.start_time).to.equal('06:00');
  });

  it('should trim a next-day slot that runs to midnight', () => {
    // end_time '00:00' means end of day, not minute zero.
    const all = [{ day_of_week: 1, start_time: '00:00', end_time: '00:00', preset: 'eco', key: 'y4' }];
    const fixed = [{ day_of_week: 0, start_time: '22:00', end_time: '00:00', preset: 'night', key: 'y3' }];
    const overflow = { start_time: '00:00', end_time: '02:00', preset: 'night', key: 'overflow-y3' };

    const result = mergeIntoSlots(all, 0, fixed, overflow);

    const eco = result.filter((s) => s.day_of_week === 1).find((s) => s.key === 'y4');
    expect(eco).to.not.equal(undefined);
    expect(eco.start_time).to.equal('02:00');
  });

  it('should treat an overflow ending at 00:00 as covering the whole next day', () => {
    // Defensive: end_time '00:00' on the overflow itself means end of day.
    const all = [{ day_of_week: 1, start_time: '06:00', end_time: '08:00', preset: 'eco', key: 'y5' }];
    const fixed = [{ day_of_week: 0, start_time: '22:00', end_time: '00:00', preset: 'night', key: 'y3' }];
    const overflow = { start_time: '00:00', end_time: '00:00', preset: 'night', key: 'overflow-y3' };

    const result = mergeIntoSlots(all, 0, fixed, overflow);

    const day1 = result.filter((s) => s.day_of_week === 1);
    expect(day1).to.have.lengthOf(1);
    expect(day1[0].preset).to.equal('night');
  });

  it('overflow on Sunday (day 6) should roll to day 0', () => {
    const all = [];
    const fixed = [{ day_of_week: 6, start_time: '23:00', end_time: '00:00', preset: 'night', key: 'z1' }];
    const overflow = { start_time: '00:00', end_time: '01:00', preset: 'night', key: 'overflow-z1' };
    const result = mergeIntoSlots(all, 6, fixed, overflow);
    const day0 = result.filter((s) => s.day_of_week === 0);
    expect(day0).to.have.lengthOf(1);
    expect(day0[0].preset).to.equal('night');
  });
});

describe('thermostatSchedule.timeToMinutes', () => {
  it('should convert a HH:MM string', () => {
    expect(timeToMinutes('08:30')).to.equal(510);
  });

  it('should treat a missing time as midnight', () => {
    expect(timeToMinutes('')).to.equal(0);
    expect(timeToMinutes(null)).to.equal(0);
    expect(timeToMinutes(undefined)).to.equal(0);
  });

  it('should tolerate a time without minutes', () => {
    expect(timeToMinutes('08')).to.equal(480);
  });
});

describe('thermostatSchedule.minutesToTime', () => {
  it('should format minutes since midnight', () => {
    expect(minutesToTime(510)).to.equal('08:30');
    expect(minutesToTime(0)).to.equal('00:00');
  });

  it('should wrap values beyond a day', () => {
    expect(minutesToTime(DAY_MINUTES + 60)).to.equal('01:00');
  });

  it('should wrap negative values', () => {
    expect(minutesToTime(-60)).to.equal('23:00');
  });
});

describe('thermostatSchedule.parseEnd', () => {
  it('should treat 00:00 as the end of the day', () => {
    expect(parseEnd('00:00')).to.equal(DAY_MINUTES);
  });

  it('should parse a normal end time', () => {
    expect(parseEnd('22:15')).to.equal(1335);
  });
});

describe('thermostatSchedule.getCurrentDayAndMinutes', () => {
  // 2026-08-21 is a Friday: day 4 with Monday=0.
  const reference = new Date('2026-08-21T06:30:00Z');

  it('should read the clock in the given timezone', () => {
    const { dayOfWeek, currentMinutes } = getCurrentDayAndMinutes(reference, 'Europe/Paris');

    expect(dayOfWeek).to.equal(4);
    // 06:30 UTC is 08:30 in Paris in August (UTC+2)
    expect(currentMinutes).to.equal(8 * 60 + 30);
  });

  it('should give a different wall clock in another timezone', () => {
    const { currentMinutes } = getCurrentDayAndMinutes(reference, 'UTC');

    expect(currentMinutes).to.equal(6 * 60 + 30);
  });

  it('should roll over to the previous day when the timezone is behind', () => {
    // 2026-08-21 00:30 UTC is still Thursday 20:30 in New York
    const { dayOfWeek, currentMinutes } = getCurrentDayAndMinutes(new Date('2026-08-21T00:30:00Z'), 'America/New_York');

    expect(dayOfWeek).to.equal(3);
    expect(currentMinutes).to.equal(20 * 60 + 30);
  });

  it('should expose yesterday for overnight slots', () => {
    expect(getCurrentDayAndMinutes(reference, 'Europe/Paris').yesterdayOfWeek).to.equal(3);
  });

  it('should wrap yesterday around the week on a Monday', () => {
    // 2026-08-24 is a Monday
    const { dayOfWeek, yesterdayOfWeek } = getCurrentDayAndMinutes(new Date('2026-08-24T09:00:00Z'), 'Europe/Paris');

    expect(dayOfWeek).to.equal(0);
    expect(yesterdayOfWeek).to.equal(6);
  });

  it('should render midnight as minute 0', () => {
    const { currentMinutes } = getCurrentDayAndMinutes(new Date('2026-08-21T00:00:00Z'), 'UTC');

    expect(currentMinutes).to.equal(0);
  });

  it('should fall back to the process timezone on an unknown zone', () => {
    const { dayOfWeek, currentMinutes } = getCurrentDayAndMinutes(reference, 'Not/AZone');

    expect(dayOfWeek).to.equal((reference.getDay() + 6) % 7);
    expect(currentMinutes).to.equal(reference.getHours() * 60 + reference.getMinutes());
  });

  it('should fall back to the process timezone when none is given', () => {
    const { currentMinutes } = getCurrentDayAndMinutes(reference);

    expect(currentMinutes).to.equal(reference.getHours() * 60 + reference.getMinutes());
  });

  it('should default to now when no date is given', () => {
    expect(getCurrentDayAndMinutes()).to.have.all.keys('dayOfWeek', 'yesterdayOfWeek', 'currentMinutes');
  });
});

describe('thermostatSchedule.findMatchingSlot', () => {
  const slot = (start, end, preset) => ({ start_time: start, end_time: end, preset });

  it('should match a normal slot of the day', () => {
    const found = findMatchingSlot([slot('07:00', '09:00', 'comfort')], [], 8 * 60);

    expect(found.preset).to.equal('comfort');
  });

  it('should exclude the end boundary', () => {
    expect(findMatchingSlot([slot('07:00', '09:00', 'comfort')], [], 9 * 60)).to.equal(null);
  });

  it('should include the start boundary', () => {
    expect(findMatchingSlot([slot('07:00', '09:00', 'comfort')], [], 7 * 60).preset).to.equal('comfort');
  });

  it('should match an overnight slot on its starting day', () => {
    const found = findMatchingSlot([slot('22:00', '06:00', 'night')], [], 23 * 60);

    expect(found.preset).to.equal('night');
  });

  it("should match yesterday's overnight slot after midnight", () => {
    const found = findMatchingSlot([], [slot('22:00', '06:00', 'night')], 2 * 60);

    expect(found.preset).to.equal('night');
  });

  it("should not match yesterday's overnight slot once it ended", () => {
    expect(findMatchingSlot([], [slot('22:00', '06:00', 'night')], 7 * 60)).to.equal(null);
  });

  it('should prefer a normal slot over an overnight one', () => {
    const found = findMatchingSlot([slot('07:00', '09:00', 'comfort'), slot('22:00', '06:00', 'night')], [], 8 * 60);

    expect(found.preset).to.equal('comfort');
  });

  it('should return null when nothing covers the time', () => {
    expect(findMatchingSlot([slot('07:00', '09:00', 'comfort')], [], 12 * 60)).to.equal(null);
  });

  it('should handle a slot ending at midnight', () => {
    expect(findMatchingSlot([slot('22:00', '00:00', 'night')], [], 23 * 60).preset).to.equal('night');
  });
});

describe('thermostatSchedule.findMatchingPreset', () => {
  it('should return the preset of the matching slot', () => {
    const slots = [{ start_time: '07:00', end_time: '09:00', preset: 'comfort' }];

    expect(findMatchingPreset(slots, [], 8 * 60)).to.equal('comfort');
  });

  it('should return null when no slot matches', () => {
    expect(findMatchingPreset([], [], 8 * 60)).to.equal(null);
  });
});

describe('thermostatSchedule.applySlotToDay - overlap handling', () => {
  const slot = (key, start, end, preset = 'eco') => ({
    key,
    day_of_week: 0,
    start_time: start,
    end_time: end,
    preset,
  });

  it('should drop the slot being edited, identified by excludeKey', () => {
    const existing = [slot('a', '07:00', '09:00'), slot('b', '12:00', '14:00')];

    const { fixedSlots } = applySlotToDay(existing, 0, 12 * 60, 13 * 60, 'comfort', 'new', 'b');

    expect(fixedSlots.filter((s) => s.key === 'b')).to.have.lengthOf(0);
    expect(fixedSlots.filter((s) => s.key === 'a')).to.have.lengthOf(1);
  });

  it('should extend the immediate predecessor to close the gap', () => {
    const existing = [slot('a', '06:00', '07:00')];

    const { fixedSlots } = applySlotToDay(existing, 0, 8 * 60, 9 * 60, 'comfort', 'new', null);

    const predecessor = fixedSlots.find((s) => s.key === 'a');
    expect(predecessor.end_time).to.equal('08:00');
  });

  it('should pick the closest predecessor when several end before the new slot', () => {
    const existing = [slot('early', '04:00', '05:00'), slot('late', '06:00', '07:00')];

    const { fixedSlots } = applySlotToDay(existing, 0, 8 * 60, 9 * 60, 'comfort', 'new', null);

    expect(fixedSlots.find((s) => s.key === 'late').end_time).to.equal('08:00');
    expect(fixedSlots.find((s) => s.key === 'early').end_time).to.equal('05:00');
  });

  it('should leave a touching predecessor untouched', () => {
    const existing = [slot('a', '06:00', '08:00')];

    const { fixedSlots } = applySlotToDay(existing, 0, 8 * 60, 9 * 60, 'comfort', 'new', null);

    expect(fixedSlots.find((s) => s.key === 'a').end_time).to.equal('08:00');
  });

  it('should keep a slot starting after the new one', () => {
    const existing = [slot('a', '12:00', '14:00')];

    const { fixedSlots } = applySlotToDay(existing, 0, 8 * 60, 9 * 60, 'comfort', 'new', null);

    expect(fixedSlots.find((s) => s.key === 'a').start_time).to.equal('12:00');
  });

  it('should split a slot that fully contains the new one', () => {
    const existing = [slot('a', '06:00', '20:00')];

    const { fixedSlots } = applySlotToDay(existing, 0, 8 * 60, 9 * 60, 'comfort', 'new', null);

    const head = fixedSlots.find((s) => s.key === 'a');
    const tail = fixedSlots.find((s) => s.key === 'split-a');
    expect(head.end_time).to.equal('08:00');
    expect(tail.start_time).to.equal('09:00');
    expect(tail.end_time).to.equal('20:00');
  });

  it('should trim a slot overlapping the start of the new one', () => {
    const existing = [slot('a', '06:00', '08:30')];

    const { fixedSlots } = applySlotToDay(existing, 0, 8 * 60, 9 * 60, 'comfort', 'new', null);

    expect(fixedSlots.find((s) => s.key === 'a').end_time).to.equal('08:00');
  });

  it('should trim a slot overlapping the end of the new one', () => {
    const existing = [slot('a', '08:30', '12:00')];

    const { fixedSlots } = applySlotToDay(existing, 0, 8 * 60, 9 * 60, 'comfort', 'new', null);

    expect(fixedSlots.find((s) => s.key === 'a').start_time).to.equal('09:00');
  });

  it('should drop a slot entirely covered by the new one', () => {
    const existing = [slot('a', '08:15', '08:45')];

    const { fixedSlots } = applySlotToDay(existing, 0, 8 * 60, 9 * 60, 'comfort', 'new', null);

    expect(fixedSlots.find((s) => s.key === 'a')).to.equal(undefined);
  });

  it('should treat an existing slot ending at 00:00 as ending at midnight', () => {
    const existing = [slot('a', '22:00', '00:00')];

    const { fixedSlots } = applySlotToDay(existing, 0, 23 * 60, 23 * 60 + 30, 'comfort', 'new', null);

    const head = fixedSlots.find((s) => s.key === 'a');
    expect(head.end_time).to.equal('23:00');
    expect(fixedSlots.find((s) => s.key === 'split-a').start_time).to.equal('23:30');
  });

  it('should produce an overflow slot for a new slot crossing midnight', () => {
    const { fixedSlots, overflowSlot } = applySlotToDay([], 0, 22 * 60, DAY_MINUTES + 6 * 60, 'night', 'new', null);

    expect(fixedSlots[0].end_time).to.equal('00:00');
    expect(overflowSlot.start_time).to.equal('00:00');
    expect(overflowSlot.end_time).to.equal('06:00');
    expect(overflowSlot.preset).to.equal('night');
  });

  it('should not produce an overflow slot for a slot ending within the day', () => {
    const { overflowSlot } = applySlotToDay([], 0, 8 * 60, 9 * 60, 'comfort', 'new', null);

    expect(overflowSlot).to.equal(null);
  });
});

describe('thermostatSchedule.applySlotToDay - end of day sorting', () => {
  it('should treat several slots ending at 00:00 as ending at midnight when sorting', () => {
    const existing = [
      { key: 'a', day_of_week: 0, start_time: '20:00', end_time: '00:00', preset: 'night' },
      { key: 'b', day_of_week: 0, start_time: '06:00', end_time: '00:00', preset: 'eco' },
    ];

    const { fixedSlots } = applySlotToDay(existing, 0, 22 * 60, 23 * 60, 'comfort', 'new', null);

    // Both slots span the new one, so both are split around it
    expect(fixedSlots.filter((s) => s.key === 'split-a')).to.have.lengthOf(1);
    expect(fixedSlots.filter((s) => s.key === 'split-b')).to.have.lengthOf(1);
  });
});
