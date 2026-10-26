const { expect } = require('chai');

const {
  transitionsToRanges,
  rangesToTransitions,
  isAllDayRange,
  mergeTouchingRanges,
  trimRangesAround,
  copyDayRanges,
  removeRangeAndFill,
} = require('../../utils/thermostatRanges');

describe('thermostatRanges: ranges to transitions', () => {
  it('should close a lone range with a stop', () => {
    // Without the stop, "comfort from 6 to 9" would hold all week: the last
    // point runs until the next one, and there is no next one.
    const transitions = rangesToTransitions([
      { day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' },
    ]);

    expect(transitions).to.deep.equal([
      // The week wraps, so Monday morning would otherwise inherit the last range
      // of the week: uncovered means stopped, and that is said explicitly.
      { day_of_week: 0, time: '00:00', preset: 'off' },
      { day_of_week: 0, time: '06:00', preset: 'comfort' },
      { day_of_week: 0, time: '09:00', preset: 'off' },
    ]);
  });

  it('should not put a stop between two ranges that meet', () => {
    const transitions = rangesToTransitions([
      { day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' },
      { day_of_week: 0, start_time: '09:00', end_time: '22:00', preset: 'eco' },
    ]);

    expect(transitions).to.deep.equal([
      { day_of_week: 0, time: '00:00', preset: 'off' },
      { day_of_week: 0, time: '06:00', preset: 'comfort' },
      { day_of_week: 0, time: '09:00', preset: 'eco' },
      { day_of_week: 0, time: '22:00', preset: 'off' },
    ]);
  });

  it('should stop between two ranges with a gap', () => {
    const transitions = rangesToTransitions([
      { day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' },
      { day_of_week: 0, start_time: '18:00', end_time: '22:00', preset: 'comfort' },
    ]);

    expect(transitions).to.deep.equal([
      { day_of_week: 0, time: '00:00', preset: 'off' },
      { day_of_week: 0, time: '06:00', preset: 'comfort' },
      { day_of_week: 0, time: '09:00', preset: 'off' },
      { day_of_week: 0, time: '18:00', preset: 'comfort' },
      { day_of_week: 0, time: '22:00', preset: 'off' },
    ]);
  });

  it('should carry a night onto the next day', () => {
    // The whole point of storing points: one row, not two halves cut at midnight.
    const transitions = rangesToTransitions([
      { day_of_week: 0, start_time: '22:30', end_time: '06:30', preset: 'night' },
    ]);

    expect(transitions).to.deep.equal([
      { day_of_week: 0, time: '00:00', preset: 'off' },
      { day_of_week: 0, time: '22:30', preset: 'night' },
      { day_of_week: 1, time: '06:30', preset: 'off' },
    ]);
  });

  it('should wrap a Sunday night onto Monday', () => {
    const transitions = rangesToTransitions([
      { day_of_week: 6, start_time: '22:30', end_time: '06:30', preset: 'night' },
    ]);

    expect(transitions).to.deep.equal([
      { day_of_week: 0, time: '06:30', preset: 'off' },
      { day_of_week: 6, time: '22:30', preset: 'night' },
    ]);
  });

  it('should store a range ending at midnight as a stop at 00:00 the next day', () => {
    const transitions = rangesToTransitions([
      { day_of_week: 0, start_time: '18:00', end_time: '00:00', preset: 'comfort' },
    ]);

    expect(transitions).to.deep.equal([
      { day_of_week: 0, time: '00:00', preset: 'off' },
      { day_of_week: 0, time: '18:00', preset: 'comfort' },
      { day_of_week: 1, time: '00:00', preset: 'off' },
    ]);
  });

  it('should let a night meet the next morning without a stop', () => {
    const transitions = rangesToTransitions([
      { day_of_week: 0, start_time: '22:30', end_time: '06:30', preset: 'night' },
      { day_of_week: 1, start_time: '06:30', end_time: '09:00', preset: 'comfort' },
    ]);

    expect(transitions).to.deep.equal([
      { day_of_week: 0, time: '00:00', preset: 'off' },
      { day_of_week: 0, time: '22:30', preset: 'night' },
      { day_of_week: 1, time: '06:30', preset: 'comfort' },
      { day_of_week: 1, time: '09:00', preset: 'off' },
    ]);
  });

  it('should not stop the top of the week when a Sunday night covers it', () => {
    // The night already runs into Monday morning: a stop there would cut it.
    const transitions = rangesToTransitions([
      { day_of_week: 6, start_time: '22:30', end_time: '06:30', preset: 'night' },
    ]);

    expect(transitions.filter((t) => t.day_of_week === 0 && t.time === '00:00')).to.have.lengthOf(0);
  });

  it('should not stop the top of the week when a range starts at Monday midnight', () => {
    const transitions = rangesToTransitions([
      { day_of_week: 0, start_time: '00:00', end_time: '09:00', preset: 'comfort' },
    ]);

    expect(transitions[0]).to.deep.equal({ day_of_week: 0, time: '00:00', preset: 'comfort' });
  });

  it('should return nothing for no range', () => {
    expect(rangesToTransitions([])).to.deep.equal([]);
    expect(rangesToTransitions(null)).to.deep.equal([]);
  });
});

describe('thermostatRanges: transitions to ranges', () => {
  it('should read a range back from its two points', () => {
    const ranges = transitionsToRanges([
      { day_of_week: 0, time: '06:00', preset: 'comfort' },
      { day_of_week: 0, time: '09:00', preset: 'off' },
    ]);

    // The stop is a range too: it wraps the week back onto the comfort point.
    expect(ranges[0]).to.deep.equal({
      day_of_week: 0,
      start_time: '06:00',
      end_time: '09:00',
      preset: 'comfort',
      ends_next_day: false,
    });
    expect(ranges[1]).to.include({ start_time: '09:00', end_time: '06:00', preset: 'off' });
  });

  it('should read back-to-back ranges', () => {
    const ranges = transitionsToRanges([
      { day_of_week: 0, time: '06:00', preset: 'comfort' },
      { day_of_week: 0, time: '09:00', preset: 'eco' },
      { day_of_week: 0, time: '22:00', preset: 'off' },
    ]);

    expect(ranges).to.have.lengthOf(3);
    expect(ranges[0]).to.include({ start_time: '06:00', end_time: '09:00', preset: 'comfort' });
    expect(ranges[1]).to.include({ start_time: '09:00', end_time: '22:00', preset: 'eco' });
    // The stop closing the day is shown as the range it is.
    expect(ranges[2]).to.include({ start_time: '22:00', preset: 'off' });
  });

  it('should read a night as one range that ends the next day', () => {
    const ranges = transitionsToRanges([
      { day_of_week: 0, time: '22:30', preset: 'night' },
      { day_of_week: 1, time: '06:30', preset: 'off' },
    ]);

    expect(ranges[0]).to.deep.equal({
      day_of_week: 0,
      start_time: '22:30',
      end_time: '06:30',
      preset: 'night',
      ends_next_day: true,
    });
    expect(ranges[1]).to.include({ day_of_week: 1, start_time: '06:30', preset: 'off' });
  });

  it('should read a lone point as a range that runs the whole week', () => {
    // Honest rather than empty: that is exactly what the thermostat does.
    const ranges = transitionsToRanges([{ day_of_week: 0, time: '06:00', preset: 'comfort' }]);

    expect(ranges).to.deep.equal([
      { day_of_week: 0, start_time: '06:00', end_time: '06:00', preset: 'comfort', ends_next_day: true },
    ]);
  });

  it('should show a stop as a range of its own', () => {
    // A schedule that only stops the thermostat is a setting, not an empty one:
    // returning [] said it did nothing, and the editor drew an empty week.
    expect(transitionsToRanges([{ day_of_week: 0, time: '09:00', preset: 'off' }])).to.deep.equal([
      { day_of_week: 0, start_time: '09:00', end_time: '09:00', preset: 'off', ends_next_day: true },
    ]);
  });

  it('should return nothing for no point', () => {
    expect(transitionsToRanges([])).to.deep.equal([]);
    expect(transitionsToRanges(null)).to.deep.equal([]);
  });
});

describe('thermostatRanges: round trip', () => {
  // What the editor does on every save and every reload: what comes back must be
  // what was typed, or a schedule would drift a little each time it is opened.
  //
  // The off ranges are set aside: they are the uncovered stretches, which the
  // editor now shows as ranges of their own instead of drawing them as hatching.
  // What the user typed is what has to survive, and the tests below this one
  // cover the stops and the stability of the stored points.
  const roundTrip = (ranges) =>
    transitionsToRanges(rangesToTransitions(ranges)).filter((range) => range.preset !== 'off');

  it('should keep a weekday morning', () => {
    const ranges = [{ day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' }];

    expect(roundTrip(ranges)).to.deep.equal([{ ...ranges[0], ends_next_day: false }]);
  });

  it('should keep a full day of ranges', () => {
    const ranges = [
      { day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' },
      { day_of_week: 0, start_time: '09:00', end_time: '18:00', preset: 'eco' },
      { day_of_week: 0, start_time: '18:00', end_time: '22:30', preset: 'comfort' },
      { day_of_week: 0, start_time: '22:30', end_time: '06:00', preset: 'night' },
    ];

    const back = roundTrip(ranges);

    expect(back).to.have.lengthOf(4);
    expect(back.map((range) => range.preset)).to.deep.equal(['comfort', 'eco', 'comfort', 'night']);
    expect(back[3]).to.include({ start_time: '22:30', end_time: '06:00', ends_next_day: true });
  });

  it('should keep a gap between two ranges', () => {
    const ranges = [
      { day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' },
      { day_of_week: 0, start_time: '18:00', end_time: '22:00', preset: 'comfort' },
    ];

    const back = roundTrip(ranges);

    expect(back).to.have.lengthOf(2);
    expect(back[0]).to.include({ start_time: '06:00', end_time: '09:00' });
    expect(back[1]).to.include({ start_time: '18:00', end_time: '22:00' });
  });

  it('should keep a week where every day differs', () => {
    const ranges = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day_of_week: day,
      start_time: `0${day}:00`,
      end_time: `1${day}:00`,
      preset: 'comfort',
    }));

    expect(roundTrip(ranges)).to.have.lengthOf(7);
  });

  it('should show an uncovered stretch as an off range', () => {
    const ranges = [
      { day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' },
      { day_of_week: 0, start_time: '18:00', end_time: '22:00', preset: 'comfort' },
    ];

    const back = transitionsToRanges(rangesToTransitions(ranges));

    // The gap 09:00-18:00 is a stop, and the editor says so in a row of its own
    // rather than leaving a hole that reads as "nothing is set here".
    expect(back.some((range) => range.preset === 'off' && range.start_time === '09:00')).to.equal(true);
  });

  it('should not grow the schedule when it is edited again', () => {
    // A stop used to be closed by a stop of its own, which the next read turned
    // into another range: the schedule gained a row on every save.
    const transitions = [
      { day_of_week: 0, time: '06:00', preset: 'comfort' },
      { day_of_week: 0, time: '09:00', preset: 'off' },
    ];

    const once = rangesToTransitions(transitionsToRanges(transitions));
    const twice = rangesToTransitions(transitionsToRanges(once));

    expect(twice).to.deep.equal(once);
  });
});

describe('thermostatRanges: all day', () => {
  it('should store a whole Monday as one point and its stop', () => {
    // 00:00 → 00:00 reads as crossing midnight, and once got a stop at Monday
    // 00:00 as well as its own point there: two points on one minute, which the
    // unique index refuses.
    const transitions = rangesToTransitions([
      { day_of_week: 0, start_time: '00:00', end_time: '00:00', preset: 'frost' },
    ]);

    expect(transitions).to.deep.equal([
      { day_of_week: 0, time: '00:00', preset: 'frost' },
      { day_of_week: 1, time: '00:00', preset: 'off' },
    ]);
  });

  it('should store a whole Wednesday between two stops', () => {
    const transitions = rangesToTransitions([
      { day_of_week: 2, start_time: '00:00', end_time: '00:00', preset: 'comfort' },
    ]);

    expect(transitions).to.deep.equal([
      { day_of_week: 0, time: '00:00', preset: 'off' },
      { day_of_week: 2, time: '00:00', preset: 'comfort' },
      { day_of_week: 3, time: '00:00', preset: 'off' },
    ]);
  });

  it('should tell a whole day from any other range', () => {
    expect(isAllDayRange({ start_time: '00:00', end_time: '00:00' })).to.equal(true);
    expect(isAllDayRange({ start_time: '00:00', end_time: '23:59' })).to.equal(false);
    // 24 hours too, but from 08:00 to the next morning: not "the day".
    expect(isAllDayRange({ start_time: '08:00', end_time: '08:00' })).to.equal(false);
    expect(isAllDayRange(null)).to.equal(false);
  });

  it('should keep a whole weekend through a save and a reload', () => {
    const ranges = [
      { day_of_week: 5, start_time: '00:00', end_time: '00:00', preset: 'frost' },
      { day_of_week: 6, start_time: '00:00', end_time: '00:00', preset: 'frost' },
    ];

    const back = mergeTouchingRanges(transitionsToRanges(rangesToTransitions(mergeTouchingRanges(ranges)))).filter(
      (range) => range.preset !== 'off',
    );

    expect(back).to.have.lengthOf(2);
    expect(back[0]).to.include({ day_of_week: 5, start_time: '00:00', end_time: '00:00' });
    expect(back[1]).to.include({ day_of_week: 6, start_time: '00:00', end_time: '00:00' });
  });
});

describe('thermostatRanges: merging touching ranges', () => {
  it('should merge two ranges of the same preset that meet', () => {
    const merged = mergeTouchingRanges([
      { day_of_week: 0, start_time: '09:00', end_time: '12:00', preset: 'comfort' },
      { day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' },
    ]);

    expect(merged).to.deep.equal([{ day_of_week: 0, start_time: '06:00', end_time: '12:00', preset: 'comfort' }]);
  });

  it('should not merge two presets', () => {
    const ranges = [
      { day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' },
      { day_of_week: 0, start_time: '09:00', end_time: '12:00', preset: 'eco' },
    ];

    expect(mergeTouchingRanges(ranges)).to.deep.equal(ranges);
  });

  it('should follow a night into the next morning', () => {
    const merged = mergeTouchingRanges([
      { day_of_week: 0, start_time: '22:00', end_time: '00:00', preset: 'night' },
      { day_of_week: 1, start_time: '00:00', end_time: '06:00', preset: 'night' },
    ]);

    expect(merged).to.deep.equal([{ day_of_week: 0, start_time: '22:00', end_time: '06:00', preset: 'night' }]);
  });

  it('should merge Sunday night into Monday morning', () => {
    const merged = mergeTouchingRanges([
      { day_of_week: 0, start_time: '00:00', end_time: '06:00', preset: 'night' },
      { day_of_week: 6, start_time: '22:00', end_time: '00:00', preset: 'night' },
    ]);

    expect(merged).to.deep.equal([{ day_of_week: 6, start_time: '22:00', end_time: '06:00', preset: 'night' }]);
  });

  it('should not merge past 24 hours', () => {
    // Merged, Monday 08:00 → Tuesday 20:00 could only be written 08:00 → 20:00,
    // and the whole of Tuesday was lost on save.
    const ranges = [
      { day_of_week: 0, start_time: '08:00', end_time: '00:00', preset: 'comfort' },
      { day_of_week: 1, start_time: '00:00', end_time: '20:00', preset: 'comfort' },
    ];

    expect(mergeTouchingRanges(ranges)).to.deep.equal(ranges);
  });

  it('should not merge two whole days, Sunday into Monday included', () => {
    const ranges = [
      { day_of_week: 0, start_time: '00:00', end_time: '00:00', preset: 'frost' },
      { day_of_week: 6, start_time: '00:00', end_time: '00:00', preset: 'frost' },
    ];

    expect(mergeTouchingRanges(ranges)).to.deep.equal(ranges);
  });

  it('should merge up to exactly 24 hours', () => {
    const merged = mergeTouchingRanges([
      { day_of_week: 0, start_time: '20:00', end_time: '00:00', preset: 'comfort' },
      { day_of_week: 1, start_time: '00:00', end_time: '20:00', preset: 'comfort' },
    ]);

    expect(merged).to.deep.equal([{ day_of_week: 0, start_time: '20:00', end_time: '20:00', preset: 'comfort' }]);
  });
});

describe('thermostatRanges: trimming around a new range', () => {
  const night = { key: 'n', day_of_week: 0, start_time: '22:30', end_time: '06:30', preset: 'night' };
  const day = { key: 'd', day_of_week: 0, start_time: '06:30', end_time: '22:30', preset: 'eco' };

  it('should leave a range it does not cover', () => {
    expect(trimRangesAround([day], { day_of_week: 3, start_time: '12:00', end_time: '14:00' })).to.deep.equal([day]);
  });

  it('should split a range it sits inside', () => {
    expect(trimRangesAround([day], { day_of_week: 0, start_time: '12:00', end_time: '14:00' })).to.deep.equal([
      { ...day, end_time: '12:00' },
      { ...day, key: 'd-tail-840', start_time: '14:00' },
    ]);
  });

  it('should shorten a range it clips, on either side', () => {
    expect(trimRangesAround([day], { day_of_week: 0, start_time: '05:00', end_time: '08:00' })).to.deep.equal([
      { ...day, key: 'd-tail-480', start_time: '08:00' },
    ]);
    expect(trimRangesAround([day], { day_of_week: 0, start_time: '20:00', end_time: '23:00' })).to.deep.equal([
      { ...day, end_time: '20:00' },
    ]);
  });

  it('should drop a range it swallows', () => {
    expect(trimRangesAround([day], { day_of_week: 0, start_time: '06:00', end_time: '23:00' })).to.deep.equal([]);
  });

  it('should never trim the range being edited', () => {
    expect(trimRangesAround([day], { day_of_week: 0, start_time: '12:00', end_time: '14:00' }, 'd')).to.deep.equal([
      day,
    ]);
  });

  it('should keep the next morning of a night when the whole day is taken', () => {
    // The tail was written as Monday 00:00 → 06:30, then dropped by the editor
    // as a duplicate of the all-day range's start: Tuesday morning was stopped.
    expect(trimRangesAround([night], { day_of_week: 0, start_time: '00:00', end_time: '00:00' })).to.deep.equal([
      { ...night, key: 'n-tail-1440', day_of_week: 1, start_time: '00:00' },
    ]);
  });

  it('should put the tail of a night cut after midnight on the next day', () => {
    // Kept on Monday, Tuesday 04:00 → 06:30 was written as Monday 04:00 → 06:30.
    expect(trimRangesAround([night], { day_of_week: 1, start_time: '02:00', end_time: '04:00' })).to.deep.equal([
      { ...night, end_time: '02:00' },
      { ...night, key: 'n-tail-1680', day_of_week: 1, start_time: '04:00' },
    ]);
  });

  it('should ignore the part of a new range two days after the night', () => {
    // Tuesday 05:00 → 03:00 ends on Wednesday: read as Tuesday, that end cut the
    // night at midnight and left a tail overlapping the new range.
    expect(trimRangesAround([night], { day_of_week: 1, start_time: '05:00', end_time: '03:00' })).to.deep.equal([
      { ...night, end_time: '05:00' },
    ]);
  });

  it('should carry Sunday night onto Monday', () => {
    const sundayNight = { ...night, day_of_week: 6 };
    expect(trimRangesAround([sundayNight], { day_of_week: 6, start_time: '00:00', end_time: '00:00' })).to.deep.equal([
      { ...sundayNight, key: 'n-tail-1440', day_of_week: 0, start_time: '00:00' },
    ]);
  });
});

describe('thermostatRanges: a new range crossing midnight', () => {
  // Monday to Sunday: 06:30 comfort, 08:30 eco, 17:00 comfort, 22:30 night.
  const week = [0, 1, 2, 3, 4, 5, 6].flatMap((day) => [
    { key: `c1-${day}`, day_of_week: day, start_time: '06:30', end_time: '08:30', preset: 'comfort' },
    { key: `e-${day}`, day_of_week: day, start_time: '08:30', end_time: '17:00', preset: 'eco' },
    { key: `c2-${day}`, day_of_week: day, start_time: '17:00', end_time: '22:30', preset: 'comfort' },
    { key: `n-${day}`, day_of_week: day, start_time: '22:30', end_time: '06:30', preset: 'night' },
  ]);
  const onDays = (ranges, days) =>
    ranges.filter((range) => days.includes(range.day_of_week)).map(({ key, ...range }) => range);

  // Its own midnight was taken for an edge: Wednesday still opened on night, and
  // the frost only lasted until midnight.
  it('should take the whole of a night it covers, past its own midnight', () => {
    const trimmed = trimRangesAround(week, { day_of_week: 1, start_time: '22:30', end_time: '06:30' });

    expect(trimmed.find((range) => range.key === 'n-1')).to.equal(undefined);
    expect(onDays(trimmed, [2]).map((range) => range.start_time)).to.deep.equal(['06:30', '08:30', '17:00', '22:30']);
  });

  it('should cut the range before and after a night that runs past both', () => {
    const trimmed = trimRangesAround(week, { day_of_week: 1, start_time: '20:00', end_time: '07:00' });

    expect(onDays(trimmed, [1, 2])).to.deep.include.members([
      { day_of_week: 1, start_time: '17:00', end_time: '20:00', preset: 'comfort' },
      { day_of_week: 2, start_time: '07:00', end_time: '08:30', preset: 'comfort' },
    ]);
    // Neither the night nor the next morning's comfort runs under it any more.
    expect(trimmed.find((range) => range.key === 'n-1')).to.equal(undefined);
    expect(onDays(trimmed, [2]).some((range) => range.start_time === '06:30')).to.equal(false);
  });

  it('should take a Sunday night onto the Monday morning', () => {
    const trimmed = trimRangesAround(week, { day_of_week: 6, start_time: '22:00', end_time: '07:00' });

    expect(onDays(trimmed, [6]).find((range) => range.start_time === '17:00').end_time).to.equal('22:00');
    expect(
      onDays(trimmed, [0]).find((range) => range.preset === 'comfort' && range.end_time === '08:30'),
    ).to.deep.equal({
      day_of_week: 0,
      start_time: '07:00',
      end_time: '08:30',
      preset: 'comfort',
    });
  });
});

describe('thermostatRanges: copying a day', () => {
  const night = (day) => ({
    key: `n-${day}`,
    day_of_week: day,
    start_time: '22:30',
    end_time: '06:30',
    preset: 'night',
  });
  const comfort = (day) => ({
    key: `c-${day}`,
    day_of_week: day,
    start_time: '06:30',
    end_time: '22:30',
    preset: 'comfort',
  });
  const weekdays = [0, 1, 2, 3, 4].flatMap((day) => [comfort(day), night(day)]);
  const frostSaturday = { key: 'sat', day_of_week: 5, start_time: '00:00', end_time: '00:00', preset: 'frost' };

  // The night before was left running into the copied day: rangesToTransitions
  // closed it at 06:30 with a stop, and the heating was off for a whole day. The
  // target's own night was then dropped whole, so the next morning was off.
  it('should cut the night before a day copied whole, and keep its own night', () => {
    const copied = copyDayRanges([...weekdays, frostSaturday], 5, [2]);
    const points = rangesToTransitions(copied);

    expect(copied.find((range) => range.key === 'n-1')).to.deep.include({ start_time: '22:30', end_time: '00:00' });
    expect(points.filter((point) => point.day_of_week === 2)).to.deep.equal([
      { day_of_week: 2, time: '00:00', preset: 'frost' },
    ]);
    // Wednesday's own night runs on to Thursday 06:30, with no stop at midnight.
    expect(copied.find((range) => range.key === 'n-2-tail-1440')).to.deep.include({
      day_of_week: 3,
      start_time: '00:00',
      end_time: '06:30',
      preset: 'night',
    });
    expect(points.filter((point) => point.day_of_week === 3)[0]).to.deep.equal({
      day_of_week: 3,
      time: '00:00',
      preset: 'night',
    });
  });

  describe('on a full week', () => {
    // 06:30 Comfort, 08:30 Eco, 17:00 Comfort and 22:30 Night, every day.
    const week = [0, 1, 2, 3, 4, 5, 6].flatMap((day) => [
      { key: `a-${day}`, day_of_week: day, start_time: '06:30', end_time: '08:30', preset: 'comfort' },
      { key: `b-${day}`, day_of_week: day, start_time: '08:30', end_time: '17:00', preset: 'eco' },
      { key: `c-${day}`, day_of_week: day, start_time: '17:00', end_time: '22:30', preset: 'comfort' },
      { key: `d-${day}`, day_of_week: day, start_time: '22:30', end_time: '06:30', preset: 'night' },
    ]);
    const pointsOn = (ranges, day) =>
      rangesToTransitions(ranges)
        .filter((point) => point.day_of_week === day)
        .map((point) => `${point.time} ${point.preset}`);
    const withAllDayFrost = (day) => [
      ...trimRangesAround(week, { day_of_week: day, start_time: '00:00', end_time: '00:00' }),
      { key: 'holiday', day_of_week: day, start_time: '00:00', end_time: '00:00', preset: 'frost' },
    ];

    it('should give the same points as an all-day range added by hand', () => {
      const copied = copyDayRanges(withAllDayFrost(5), 5, [2]);
      const byHand = [
        ...trimRangesAround(withAllDayFrost(5), { day_of_week: 2, start_time: '00:00', end_time: '00:00' }),
        { key: 'by-hand', day_of_week: 2, start_time: '00:00', end_time: '00:00', preset: 'frost' },
      ];

      expect(pointsOn(copied, 2)).to.deep.equal(['00:00 frost']);
      expect(pointsOn(copied, 3)).to.deep.equal([
        '00:00 night',
        '06:30 comfort',
        '08:30 eco',
        '17:00 comfort',
        '22:30 night',
      ]);
      expect(rangesToTransitions(copied)).to.deep.equal(rangesToTransitions(byHand));
    });

    it('should leave the morning after the last of several target days', () => {
      const copied = copyDayRanges(withAllDayFrost(5), 5, [0, 1, 2, 3]);

      expect(pointsOn(copied, 4)[0]).to.equal('00:00 night');
    });

    it('should not depend on the order the target days were ticked', () => {
      const frostMorning = [
        ...trimRangesAround(week, { day_of_week: 2, start_time: '00:00', end_time: '06:30' }),
        { key: 'early', day_of_week: 2, start_time: '00:00', end_time: '06:30', preset: 'frost' },
      ];
      const thenFriday = copyDayRanges(frostMorning, 2, [3, 4]);
      const thenThursday = copyDayRanges(frostMorning, 2, [4, 3]);

      expect(pointsOn(thenFriday, 4)[0]).to.equal('00:00 frost');
      expect(rangesToTransitions(thenThursday)).to.deep.equal(rangesToTransitions(thenFriday));
    });

    // Friday shows Thursday's night until 06:30: a copy of it must too.
    it('should copy the night the source day inherits', () => {
      const copied = copyDayRanges(withAllDayFrost(5), 4, [5]);

      // Friday's night runs on: no point at midnight, and no stop either.
      expect(pointsOn(copied, 5)).to.deep.equal(['06:30 comfort', '08:30 eco', '17:00 comfort', '22:30 night']);
      expect(rangesToTransitions(copied)).to.deep.equal(rangesToTransitions(week));
    });

    it('should copy across the end of the week', () => {
      const copied = copyDayRanges(withAllDayFrost(2), 2, [6]);

      expect(pointsOn(copied, 6)).to.deep.equal(['00:00 frost']);
      expect(pointsOn(copied, 0)[0]).to.equal('00:00 night');
    });

    it('should ignore the source day among the targets', () => {
      expect(copyDayRanges(week, 2, [2, 2])).to.deep.equal(copyDayRanges(week, 2, []));
    });
  });

  it('should replace the ranges of every target day', () => {
    const copied = copyDayRanges([...weekdays, frostSaturday], 5, [0, 1], (day, index) => `x-${day}-${index}`);

    expect(copied.filter((range) => range.day_of_week === 0)).to.deep.equal([
      { key: 'x-0-0', day_of_week: 0, start_time: '00:00', end_time: '00:00', preset: 'frost' },
    ]);
    expect(copied.filter((range) => range.day_of_week === 1)).to.deep.equal([
      { key: 'x-1-0', day_of_week: 1, start_time: '00:00', end_time: '00:00', preset: 'frost' },
    ]);
  });

  it('should let a copied night take the next morning', () => {
    const lateSaturday = { key: 'sat-night', day_of_week: 5, start_time: '22:30', end_time: '08:00', preset: 'eco' };
    const copied = copyDayRanges([...weekdays, lateSaturday], 5, [1]);

    expect(copied.filter((range) => range.day_of_week === 1)).to.deep.equal([
      { key: 'copy-1-0', day_of_week: 1, start_time: '22:30', end_time: '08:00', preset: 'eco' },
    ]);
    // Wednesday's comfort gives way until the copied night ends.
    expect(copied.filter((range) => range.day_of_week === 2)).to.deep.include.members([
      { key: 'c-2-tail-480', day_of_week: 2, start_time: '08:00', end_time: '22:30', preset: 'comfort' },
    ]);
  });
});

describe('thermostatRanges: removing a range', () => {
  it('should do nothing for an unknown key', () => {
    const ranges = [{ key: 'a', day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' }];

    expect(removeRangeAndFill(ranges, 'z')).to.deep.equal(ranges);
  });

  it('should leave an empty schedule when the last range goes', () => {
    expect(
      removeRangeAndFill(
        [{ key: 'a', day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' }],
        'a',
      ),
    ).to.deep.equal([]);
  });

  it('should hand the time to the range before', () => {
    const ranges = [
      { key: 'a', day_of_week: 0, start_time: '06:30', end_time: '08:30', preset: 'comfort' },
      { key: 'b', day_of_week: 0, start_time: '08:30', end_time: '17:00', preset: 'eco' },
    ];

    expect(removeRangeAndFill(ranges, 'b')).to.deep.equal([
      { key: 'a', day_of_week: 0, start_time: '06:30', end_time: '17:00', preset: 'comfort' },
    ]);
  });

  it('should pick the closest range before, not the first one listed', () => {
    const ranges = [
      { key: 'b', day_of_week: 0, start_time: '08:00', end_time: '12:00', preset: 'eco' },
      { key: 'a', day_of_week: 0, start_time: '06:00', end_time: '08:00', preset: 'comfort' },
      { key: 'c', day_of_week: 0, start_time: '12:00', end_time: '18:00', preset: 'comfort' },
    ];

    expect(removeRangeAndFill(ranges, 'c')).to.deep.equal([
      { key: 'a', day_of_week: 0, start_time: '06:00', end_time: '08:00', preset: 'comfort' },
      { key: 'b', day_of_week: 0, start_time: '08:00', end_time: '18:00', preset: 'eco' },
    ]);
  });

  // A gap is a stop (rangesToTransitions): it is the range in force before the
  // removed one, and it is what extends.
  it('should leave the stop before the removed range to extend over it', () => {
    const ranges = [
      { key: 'a', day_of_week: 0, start_time: '06:00', end_time: '08:00', preset: 'comfort' },
      { key: 'b', day_of_week: 0, start_time: '10:00', end_time: '12:00', preset: 'eco' },
    ];

    expect(removeRangeAndFill(ranges, 'b')).to.deep.equal([ranges[0]]);
  });

  it('should keep the removed day covered after a whole day', () => {
    // Stretched, Monday read 00:00 → 00:00 again and Tuesday came out stopped.
    const ranges = [
      { key: 'mon', day_of_week: 0, start_time: '00:00', end_time: '00:00', preset: 'frost' },
      { key: 'tue', day_of_week: 1, start_time: '00:00', end_time: '00:00', preset: 'comfort' },
    ];

    expect(removeRangeAndFill(ranges, 'tue')).to.deep.equal([
      ranges[0],
      { key: 'mon-fill-tue', day_of_week: 1, start_time: '00:00', end_time: '00:00', preset: 'frost' },
    ]);
  });

  // Filled with comfort, Tuesday 10:00 → 12:00 heated after a night that stayed off.
  it('should not fill across a stop that runs overnight', () => {
    const ranges = [
      { key: 'a', day_of_week: 0, start_time: '06:00', end_time: '22:00', preset: 'comfort' },
      { key: 'b', day_of_week: 1, start_time: '10:00', end_time: '12:00', preset: 'eco' },
    ];

    expect(removeRangeAndFill(ranges, 'b')).to.deep.equal([ranges[0]]);
  });

  it('should fill from an off range like from any other', () => {
    const ranges = [
      { key: 'a', day_of_week: 0, start_time: '22:00', end_time: '10:00', preset: 'off' },
      { key: 'b', day_of_week: 1, start_time: '10:00', end_time: '12:00', preset: 'eco' },
    ];

    expect(removeRangeAndFill(ranges, 'b')).to.deep.equal([
      { key: 'a', day_of_week: 0, start_time: '22:00', end_time: '12:00', preset: 'off' },
    ]);
  });

  it('should find the predecessor on Sunday for a Monday morning range', () => {
    const ranges = [
      { key: 'm', day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort' },
      { key: 's', day_of_week: 6, start_time: '22:00', end_time: '06:00', preset: 'night' },
    ];

    expect(removeRangeAndFill(ranges, 'm')).to.deep.equal([
      { key: 's', day_of_week: 6, start_time: '22:00', end_time: '09:00', preset: 'night' },
    ]);
  });
});
