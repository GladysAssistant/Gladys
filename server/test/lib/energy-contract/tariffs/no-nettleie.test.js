const { expect } = require('chai');
const { price, interval, createCalendarLookup } = require('./helpers');

// Norway, spot price plus the capacity-based grid tariff ("nettleie"): the mean of the three highest
// hourly peaks of the month, on distinct days.
const tariff = {
  tariff_version: 1,
  calendars: ['spot-no'],
  components: [
    { key: 'energy', kind: 'consumption', fallback: { price_from_calendar: 'spot-no' } },
    { key: 'capacity', kind: 'demand', price: 100, per: 'month', aggregation: 'top3_average' },
  ],
};
const oslo = { timezone: 'Europe/Oslo' };
const day = (d, hour, power, spot) => ({
  starts_at: Date.UTC(2026, 0, d, hour),
  kwh: power / 2,
  max_power_kw: power,
  spot,
});

describe('tariffs: Norway spot and capacity grid tariff', () => {
  it('should average the three highest daily peaks of the month', () => {
    const intervals = [
      day(12, 10, 2, 0.5),
      day(12, 11, 3, 0.6),
      day(13, 10, 5, 0.7),
      day(14, 10, 4, 0.8),
      day(15, 10, 1, 0.9),
      day(16, 10, 6, 1),
    ];
    const calendars = createCalendarLookup(
      { 'spot-no': { granularity: 'thirty_minutes' } },
      intervals.map((i) => ({ calendar_key: 'spot-no', starts_at: i.starts_at, value: i.spot })),
    );
    const { costs } = price(
      tariff,
      oslo,
      intervals.map((i) => interval(new Date(i.starts_at).toISOString(), i.kwh, { max_power_kw: i.max_power_kw })),
      {
        calendars,
        closed_period: true,
      },
    );
    // (6 + 5 + 4) / 3 = 5 kW × 100 = 500, over six equal intervals
    costs.forEach((c) => expect(c.components.capacity).to.be.closeTo(500 / 6, 1e-6));
    expect(costs[0].components.energy).to.be.closeTo(1 * 0.5, 1e-9);
  });
});
