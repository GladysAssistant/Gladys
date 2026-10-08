const { expect } = require('chai');
const {
  isInSeason,
  matchesCalendarCondition,
  matchesConditions,
} = require('../../../lib/energy-contract/tariff.conditions');
const { compileConditions } = require('../../../lib/energy-contract/tariff.compile');
const { getLocalContext } = require('../../../lib/energy-contract/tariff.time');

// Monday 12 January 2026, 08:00 Paris
const local = getLocalContext(Date.UTC(2026, 0, 12, 7), 'Europe/Paris');
const context = (overrides = {}) => ({ local, getCalendarValue: () => undefined, maxPowerKw: 2, ...overrides });

describe('energy-contract tariff.conditions', () => {
  it('should evaluate seasons, crossing the year end or not', () => {
    expect(isInSeason({ from: 601, to: 930 }, 715)).to.equal(true);
    expect(isInSeason({ from: 601, to: 930 }, 601)).to.equal(true);
    expect(isInSeason({ from: 601, to: 930 }, 930)).to.equal(true);
    expect(isInSeason({ from: 601, to: 930 }, 1001)).to.equal(false);
    expect(isInSeason({ from: 1101, to: 331 }, 115)).to.equal(true);
    expect(isInSeason({ from: 1101, to: 331 }, 1215)).to.equal(true);
    expect(isInSeason({ from: 1101, to: 331 }, 715)).to.equal(false);
  });
  it('should evaluate calendar conditions on presence and membership', () => {
    const condition = { tempo: new Set(['red', 'white']) };
    expect(matchesCalendarCondition(condition, () => 'red', false)).to.equal(true);
    expect(matchesCalendarCondition(condition, () => 'blue', false)).to.equal(false);
    expect(matchesCalendarCondition(condition, () => undefined, false)).to.equal(false);
    expect(matchesCalendarCondition(condition, () => null, false)).to.equal(false);
    expect(matchesCalendarCondition(condition, () => 'red', true)).to.equal(false);
    expect(matchesCalendarCondition(condition, () => undefined, true)).to.equal(true);
    expect(matchesCalendarCondition({ level: new Set(['3']) }, () => 3, false)).to.equal(true);
  });
  it('should always match without conditions', () => {
    expect(matchesConditions(undefined, context())).to.equal(true);
  });
  it('should evaluate each condition', () => {
    expect(matchesConditions(compileConditions({ time: [['06:00', '22:00']] }), context())).to.equal(true);
    expect(matchesConditions(compileConditions({ time: [['22:00', '06:00']] }), context())).to.equal(false);
    expect(matchesConditions(compileConditions({ weekdays: ['mon'] }), context())).to.equal(true);
    expect(matchesConditions(compileConditions({ weekdays: ['sat', 'sun'] }), context())).to.equal(false);
    expect(matchesConditions(compileConditions({ months: [1, 2] }), context())).to.equal(true);
    expect(matchesConditions(compileConditions({ months: [7] }), context())).to.equal(false);
    expect(matchesConditions(compileConditions({ season: { from: '11-01', to: '03-31' } }), context())).to.equal(true);
    expect(matchesConditions(compileConditions({ season: { from: '06-01', to: '09-30' } }), context())).to.equal(false);
    expect(matchesConditions(compileConditions({ dates: { from: '2026-01-01' } }), context())).to.equal(true);
    expect(matchesConditions(compileConditions({ dates: { from: '2026-01-13' } }), context())).to.equal(false);
    expect(
      matchesConditions(compileConditions({ dates: { from: '2026-01-01', to: '2026-01-12' } }), context()),
    ).to.equal(true);
    expect(
      matchesConditions(compileConditions({ dates: { from: '2026-01-01', to: '2026-01-11' } }), context()),
    ).to.equal(false);
    const red = context({ getCalendarValue: () => 'red' });
    expect(matchesConditions(compileConditions({ calendar: { tempo: 'red' } }), red)).to.equal(true);
    expect(matchesConditions(compileConditions({ calendar: { tempo: ['blue', 'white'] } }), red)).to.equal(false);
    expect(matchesConditions(compileConditions({ not_calendar: { tempo: 'red' } }), red)).to.equal(false);
    expect(matchesConditions(compileConditions({ not_calendar: { tempo: 'blue' } }), red)).to.equal(true);
    expect(matchesConditions(compileConditions({ power_threshold: { above_kw: 1.5 } }), context())).to.equal(true);
    expect(matchesConditions(compileConditions({ power_threshold: { above_kw: 2 } }), context())).to.equal(false);
  });
  it('should combine conditions with AND and ignore the tier', () => {
    const when = compileConditions({
      time: [['06:00', '22:00']],
      weekdays: ['mon'],
      tier: { cumulative: 'day', from_kwh: 100 },
    });
    expect(matchesConditions(when, context())).to.equal(true);
    expect(matchesConditions(compileConditions({ time: [['06:00', '22:00']], weekdays: ['sun'] }), context())).to.equal(
      false,
    );
  });
});
