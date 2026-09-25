const { expect } = require('chai');

const { transitionsToRanges, rangesToTransitions } = require('../../utils/thermostatRanges');

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

    expect(ranges).to.deep.equal([
      { day_of_week: 0, start_time: '06:00', end_time: '09:00', preset: 'comfort', ends_next_day: false },
    ]);
  });

  it('should read back-to-back ranges', () => {
    const ranges = transitionsToRanges([
      { day_of_week: 0, time: '06:00', preset: 'comfort' },
      { day_of_week: 0, time: '09:00', preset: 'eco' },
      { day_of_week: 0, time: '22:00', preset: 'off' },
    ]);

    expect(ranges).to.have.lengthOf(2);
    expect(ranges[0]).to.include({ start_time: '06:00', end_time: '09:00', preset: 'comfort' });
    expect(ranges[1]).to.include({ start_time: '09:00', end_time: '22:00', preset: 'eco' });
  });

  it('should read a night as one range that ends the next day', () => {
    const ranges = transitionsToRanges([
      { day_of_week: 0, time: '22:30', preset: 'night' },
      { day_of_week: 1, time: '06:30', preset: 'off' },
    ]);

    expect(ranges).to.deep.equal([
      { day_of_week: 0, start_time: '22:30', end_time: '06:30', preset: 'night', ends_next_day: true },
    ]);
  });

  it('should read a lone point as a range that runs the whole week', () => {
    // Honest rather than empty: that is exactly what the thermostat does.
    const ranges = transitionsToRanges([{ day_of_week: 0, time: '06:00', preset: 'comfort' }]);

    expect(ranges).to.deep.equal([
      { day_of_week: 0, start_time: '06:00', end_time: '06:00', preset: 'comfort', ends_next_day: true },
    ]);
  });

  it('should show no range where the thermostat is stopped', () => {
    expect(transitionsToRanges([{ day_of_week: 0, time: '09:00', preset: 'off' }])).to.deep.equal([]);
  });

  it('should return nothing for no point', () => {
    expect(transitionsToRanges([])).to.deep.equal([]);
    expect(transitionsToRanges(null)).to.deep.equal([]);
  });
});

describe('thermostatRanges: round trip', () => {
  // What the editor does on every save and every reload: what comes back must be
  // what was typed, or a schedule would drift a little each time it is opened.
  const roundTrip = (ranges) => transitionsToRanges(rangesToTransitions(ranges));

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
});
