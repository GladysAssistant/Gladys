const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const db = require('../../../../models');
const logger = require('../../../../utils/logger');
const {
  buildManager,
  insertConsumption,
  contractPayload,
  TEMPO_TARIFF,
  METER_DEVICE_ID,
  TEST_SERVICE_ID,
} = require('./helpers');

const ms = (iso) => new Date(iso).getTime();
const prices = (result) => result.slots.map((slot) => [slot.starts_at, slot.price, slot.label]);

const BASE_ENERGY_TARIFF = {
  tariff_version: 1,
  components: [
    { key: 'energy', kind: 'consumption', rules: [], fallback: { label: 'Base', price: 0.2 } },
    { key: 'vat', kind: 'tax', rate: 20, applies_to: ['energy'] },
    // never in an energy price
    { key: 'subscription', kind: 'fixed', amount: 12, per: 'month' },
  ],
};
const PEAK_OFF_PEAK_TARIFF = {
  tariff_version: 1,
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [{ label: 'HP', when: { time: [['06:00', '22:00']] }, price: 0.25 }],
      fallback: { label: 'HC', price: 0.18 },
    },
  ],
};
const TIER_TARIFF = {
  tariff_version: 1,
  components: [
    {
      key: 'energy',
      kind: 'consumption',
      rules: [{ label: 'tier 1', when: { tier: { cumulative: 'day', from_kwh: 0, to_kwh: 2 } }, price: 0.1 }],
      fallback: { label: 'tier 2', price: 0.2 },
    },
  ],
};
const TEMPO = {
  key: 'tempo',
  granularity: 'day',
  timezone: 'Europe/Paris',
  day_starts_at: '06:00',
  values: ['blue', 'white', 'red'],
};
const SPOT = { key: 'spot-fi', granularity: 'fifteen_minutes', timezone: 'Europe/Helsinki', currency: 'EUR' };
// a spot price with no fallback value: an unpublished quarter has no price
const SPOT_TARIFF = {
  tariff_version: 1,
  calendars: ['spot-fi'],
  components: [{ key: 'energy', kind: 'consumption', rules: [], fallback: { price_from_calendar: 'spot-fi' } }],
};

describe('energyContract.getMeterPrices', () => {
  let energyContract;
  beforeEach(async () => {
    ({ energyContract } = await buildManager());
  });
  afterEach(async () => {
    sinon.restore();
    await db.EnergyContract.destroy({ where: {} });
    await db.TariffCalendar.destroy({ where: {} });
  });

  it('should give the energy price per 30-minute slot, taxes included and the subscription left out', async () => {
    await energyContract.create(contractPayload({ tariff: BASE_ENERGY_TARIFF, timezone: 'Europe/Paris' }));
    // a window starting mid-slot: the slot containing `from` comes first
    const result = await energyContract.getMeterPrices(METER_DEVICE_ID, {
      from: ms('2026-01-12T05:10:00Z'),
      to: ms('2026-01-12T06:30:00Z'),
    });
    expect(result).to.deep.equal({
      currency: 'EUR',
      slots: [
        { starts_at: '2026-01-12T05:00:00.000Z', ends_at: '2026-01-12T05:30:00.000Z', price: 0.24, label: 'Base' },
        { starts_at: '2026-01-12T05:30:00.000Z', ends_at: '2026-01-12T06:00:00.000Z', price: 0.24, label: 'Base' },
        { starts_at: '2026-01-12T06:00:00.000Z', ends_at: '2026-01-12T06:30:00.000Z', price: 0.24, label: 'Base' },
      ],
    });
  });

  it('should align the slots on the local clock of the contract', async () => {
    // Asia/Kathmandu is UTC+05:45: the local half-hours start at :15 and :45 UTC
    await energyContract.create(contractPayload({ tariff: PEAK_OFF_PEAK_TARIFF, timezone: 'Asia/Kathmandu' }));
    const result = await energyContract.getMeterPrices(METER_DEVICE_ID, {
      from: ms('2026-01-12T00:00:00Z'),
      to: ms('2026-01-12T00:30:00Z'),
    });
    // 05:30 local is off-peak, 06:00 local (00:15 UTC) is peak
    expect(prices(result)).to.deep.equal([
      ['2026-01-11T23:45:00.000Z', 0.18, 'HC'],
      ['2026-01-12T00:15:00.000Z', 0.25, 'HP'],
    ]);
  });

  it('should give 46 slots on the spring clock change and follow the local time ranges', async () => {
    await energyContract.create(contractPayload({ tariff: PEAK_OFF_PEAK_TARIFF, timezone: 'Europe/Paris' }));
    // the local day of 29 March 2026 in Paris lasts 23 hours
    const result = await energyContract.getMeterPrices(METER_DEVICE_ID, {
      from: ms('2026-03-28T23:00:00Z'),
      to: ms('2026-03-29T22:00:00Z'),
    });
    expect(result.slots).to.have.lengthOf(46);
    const byStart = new Map(result.slots.map((slot) => [slot.starts_at, slot]));
    // 01:30 UTC is 03:30 local (after the jump): off-peak; 04:00 UTC is 06:00 local: peak
    expect(byStart.get('2026-03-29T01:30:00.000Z')).to.include({ price: 0.18, label: 'HC' });
    expect(byStart.get('2026-03-29T03:30:00.000Z')).to.include({ price: 0.18, label: 'HC' });
    expect(byStart.get('2026-03-29T04:00:00.000Z')).to.include({ price: 0.25, label: 'HP' });
    expect(byStart.get('2026-03-29T19:30:00.000Z')).to.include({ price: 0.25, label: 'HP' });
    expect(byStart.get('2026-03-29T20:00:00.000Z')).to.include({ price: 0.18, label: 'HC' });
  });

  it('should follow a contract change inside the window and give null where no contract applies', async () => {
    await energyContract.create(
      contractPayload({
        name: 'Old',
        tariff: PEAK_OFF_PEAK_TARIFF,
        timezone: 'UTC',
        valid_from: '2025-01-01',
        valid_to: '2026-01-11',
      }),
    );
    await energyContract.create(
      contractPayload({ name: 'New', tariff: BASE_ENERGY_TARIFF, timezone: 'UTC', valid_from: '2026-01-13' }),
    );
    const result = await energyContract.getMeterPrices(METER_DEVICE_ID, {
      from: ms('2026-01-11T23:00:00Z'),
      to: ms('2026-01-13T01:00:00Z'),
    });
    const byStart = new Map(result.slots.map((slot) => [slot.starts_at, slot]));
    expect(result.slots).to.have.lengthOf(52);
    expect(byStart.get('2026-01-11T23:30:00.000Z')).to.include({ price: 0.18, label: 'HC' });
    // 12 January: between the two contracts, an unknown price and no label
    expect(byStart.get('2026-01-12T00:00:00.000Z')).to.deep.equal({
      starts_at: '2026-01-12T00:00:00.000Z',
      ends_at: '2026-01-12T00:30:00.000Z',
      price: null,
    });
    expect(byStart.get('2026-01-12T12:00:00.000Z').price).to.equal(null);
    expect(byStart.get('2026-01-13T00:00:00.000Z')).to.include({ price: 0.24, label: 'Base' });
  });

  it('should leave null the slots of a contract in another currency than the latest one', async () => {
    await energyContract.create(
      contractPayload({
        name: 'Old',
        currency: 'CHF',
        timezone: 'UTC',
        valid_from: '2025-01-01',
        valid_to: '2026-01-12',
      }),
    );
    await energyContract.create(contractPayload({ name: 'New', timezone: 'UTC', valid_from: '2026-01-13' }));
    const result = await energyContract.getMeterPrices(METER_DEVICE_ID, {
      from: ms('2026-01-12T23:30:00Z'),
      to: ms('2026-01-13T00:30:00Z'),
    });
    expect(result.currency).to.equal('EUR');
    expect(prices(result)).to.deep.equal([
      ['2026-01-12T23:30:00.000Z', null, undefined],
      ['2026-01-13T00:00:00.000Z', 0.2, undefined],
    ]);
  });

  it('should read the calendar of a Tempo contract', async () => {
    await energyContract.declareCalendar(TEMPO, TEST_SERVICE_ID);
    await energyContract.publishCalendarEntries('tempo', [{ date: '2026-01-12', value: 'red' }], {
      provider_service_id: TEST_SERVICE_ID,
      skip_recalculation: true,
    });
    await energyContract.create(contractPayload({ name: 'Tempo', tariff: TEMPO_TARIFF, timezone: 'Europe/Paris' }));
    const result = await energyContract.getMeterPrices(METER_DEVICE_ID, {
      from: ms('2026-01-12T04:30:00Z'),
      to: ms('2026-01-12T05:30:00Z'),
    });
    // the red day starts at 06:00 local (05:00 UTC): blue off-peak before, red peak after
    expect(prices(result)).to.deep.equal([
      ['2026-01-12T04:30:00.000Z', 0.1296, 'Blue off-peak'],
      ['2026-01-12T05:00:00.000Z', 0.7562, 'Red peak'],
    ]);
  });

  it('should give 15-minute slots on a 15-minute spot calendar, null where no price is published', async () => {
    await energyContract.declareCalendar(SPOT, TEST_SERVICE_ID);
    await energyContract.publishCalendarEntries(
      'spot-fi',
      [
        { starts_at: '2026-01-12T05:00:00Z', price: 0.1 },
        { starts_at: '2026-01-12T05:15:00Z', price: 0.12 },
      ],
      { provider_service_id: TEST_SERVICE_ID, skip_recalculation: true },
    );
    await energyContract.create(contractPayload({ name: 'Spot', tariff: SPOT_TARIFF, timezone: 'Europe/Helsinki' }));
    const result = await energyContract.getMeterPrices(METER_DEVICE_ID, {
      from: ms('2026-01-12T05:00:00Z'),
      to: ms('2026-01-12T05:45:00Z'),
    });
    expect(result.slots).to.deep.equal([
      { starts_at: '2026-01-12T05:00:00.000Z', ends_at: '2026-01-12T05:15:00.000Z', price: 0.1 },
      { starts_at: '2026-01-12T05:15:00.000Z', ends_at: '2026-01-12T05:30:00.000Z', price: 0.12 },
      { starts_at: '2026-01-12T05:30:00.000Z', ends_at: '2026-01-12T05:45:00.000Z', price: null },
    ]);
  });

  it('should price a tiered tariff with the real accumulations of the meter, slot after slot', async () => {
    sinon.useFakeTimers({ now: ms('2026-01-12T12:10:00Z'), toFake: ['Date'] });
    await energyContract.create(contractPayload({ name: 'Tiered', tariff: TIER_TARIFF, timezone: 'UTC' }));
    await insertConsumption([
      // 1.5 kWh before the window, then 1 kWh in its first interval: the allowance of 2 is crossed
      { value: 1.5, created_at: new Date('2026-01-12T00:30:00Z') },
      { value: 1, created_at: new Date('2026-01-12T11:00:00Z') },
    ]);
    const result = await energyContract.getMeterPrices(METER_DEVICE_ID, {
      from: ms('2026-01-12T10:30:00Z'),
      to: ms('2026-01-13T00:30:00Z'),
    });
    const byStart = new Map(result.slots.map((slot) => [slot.starts_at, slot]));
    expect(byStart.get('2026-01-12T10:30:00.000Z')).to.include({ price: 0.1, label: 'tier 1' });
    expect(byStart.get('2026-01-12T11:00:00.000Z')).to.include({ price: 0.2, label: 'tier 2' });
    // the future slots keep the accumulation of now, until it restarts at midnight
    expect(byStart.get('2026-01-12T23:30:00.000Z')).to.include({ price: 0.2, label: 'tier 2' });
    expect(byStart.get('2026-01-13T00:00:00.000Z')).to.include({ price: 0.1, label: 'tier 1' });
  });

  it('should feed the filtered counter of a counts_when tier only with the matching slots', async () => {
    sinon.useFakeTimers({ now: ms('2026-01-12T12:00:00Z'), toFake: ['Date'] });
    await energyContract.declareCalendar(
      { key: 'peaks', granularity: 'thirty_minutes', values: ['peak'] },
      TEST_SERVICE_ID,
    );
    await energyContract.publishCalendarEntries('peaks', [{ starts_at: '2026-01-12T00:00:00Z', value: 'peak' }], {
      provider_service_id: TEST_SERVICE_ID,
      skip_recalculation: true,
    });
    await energyContract.create(
      contractPayload({
        name: 'Counted',
        timezone: 'UTC',
        tariff: {
          tariff_version: 1,
          calendars: ['peaks'],
          components: [
            {
              key: 'energy',
              kind: 'consumption',
              rules: [
                { label: 'peak', when: { calendar: { peaks: 'peak' } }, price: 0.5 },
                {
                  label: 'tier 1',
                  when: {
                    tier: {
                      cumulative: 'day',
                      from_kwh: 0,
                      to_kwh: 2,
                      counts_when: { not_calendar: { peaks: 'peak' } },
                    },
                  },
                  price: 0.1,
                },
              ],
              fallback: { label: 'tier 2', price: 0.2 },
            },
          ],
        },
      }),
    );
    await insertConsumption([
      { value: 1.5, created_at: new Date('2026-01-12T00:30:00Z') },
      { value: 1, created_at: new Date('2026-01-12T01:00:00Z') },
    ]);
    const result = await energyContract.getMeterPrices(METER_DEVICE_ID, {
      from: ms('2026-01-12T00:00:00Z'),
      to: ms('2026-01-12T01:30:00Z'),
    });
    // 2.5 kWh today, but the 1.5 of the peak slot are not counted: still in the allowance
    expect(prices(result)).to.deep.equal([
      ['2026-01-12T00:00:00.000Z', 0.5, 'peak'],
      ['2026-01-12T00:30:00.000Z', 0.1, 'tier 1'],
      ['2026-01-12T01:00:00.000Z', 0.1, 'tier 1'],
    ]);
  });

  it('should count half of an interval in each 15-minute slot of a tiered tariff', async () => {
    sinon.useFakeTimers({ now: ms('2026-01-12T12:00:00Z'), toFake: ['Date'] });
    await energyContract.declareCalendar(SPOT, TEST_SERVICE_ID);
    await energyContract.create(
      contractPayload({
        name: 'Tiered spot',
        timezone: 'UTC',
        tariff: {
          tariff_version: 1,
          calendars: ['spot-fi'],
          components: [
            {
              key: 'energy',
              kind: 'consumption',
              rules: [{ label: 'tier 1', when: { tier: { cumulative: 'day', from_kwh: 0, to_kwh: 1 } }, price: 0.1 }],
              fallback: { label: 'tier 2', price: 0.2 },
            },
            { key: 'spot', kind: 'consumption', rules: [], fallback: { price_from_calendar: 'spot-fi', offset: 0 } },
          ],
        },
      }),
    );
    await energyContract.publishCalendarEntries(
      'spot-fi',
      ['00', '15', '30', '45'].map((minutes) => ({ starts_at: `2026-01-12T05:${minutes}:00Z`, price: 0 })),
      { provider_service_id: TEST_SERVICE_ID, skip_recalculation: true },
    );
    // 1.6 kWh between 05:00 and 05:30: 0.8 per quarter, the allowance of 1 is crossed during the
    // second one (the whole interval counted in the first quarter would put the second in tier 2)
    await insertConsumption([{ value: 1.6, created_at: new Date('2026-01-12T05:30:00Z') }]);
    const result = await energyContract.getMeterPrices(METER_DEVICE_ID, {
      from: ms('2026-01-12T05:00:00Z'),
      to: ms('2026-01-12T05:45:00Z'),
    });
    expect(prices(result)).to.deep.equal([
      ['2026-01-12T05:00:00.000Z', 0.1, 'tier 1'],
      ['2026-01-12T05:15:00.000Z', 0.1, 'tier 1'],
      ['2026-01-12T05:30:00.000Z', 0.2, 'tier 2'],
    ]);
  });

  describe('delegated contract', () => {
    const DELEGATED = {
      name: 'Agile',
      pricing_mode: 'delegated',
      provider_service_id: TEST_SERVICE_ID,
      tariff: { tariff_version: 1, components: [{ key: 'fee', kind: 'fixed', amount: 1, per: 'day' }] },
      timezone: 'UTC',
    };

    it('should price the current slot, and the next ones until valid_until, through the integration', async () => {
      sinon.useFakeTimers({ now: ms('2026-01-12T12:40:00Z'), toFake: ['Date'] });
      await energyContract.create(contractPayload(DELEGATED));
      const getEnergyContractCurrent = sinon.fake.resolves({
        price: 0.15,
        valid_until: '2026-01-12T14:00:00.000Z',
        next_price: 0.3,
      });
      energyContract.externalIntegration = { getEnergyContractCurrent };
      const result = await energyContract.getMeterPrices(METER_DEVICE_ID, {
        from: ms('2026-01-12T11:30:00Z'),
        to: ms('2026-01-12T14:30:00Z'),
      });
      expect(prices(result)).to.deep.equal([
        ['2026-01-12T11:30:00.000Z', null, undefined],
        ['2026-01-12T12:00:00.000Z', null, undefined],
        ['2026-01-12T12:30:00.000Z', 0.15, undefined],
        ['2026-01-12T13:00:00.000Z', 0.15, undefined],
        ['2026-01-12T13:30:00.000Z', 0.15, undefined],
        ['2026-01-12T14:00:00.000Z', null, undefined],
      ]);
      expect(getEnergyContractCurrent.callCount).to.equal(1);
    });

    it('should only price the current slot without valid_until, and nothing when the integration fails', async () => {
      sinon.useFakeTimers({ now: ms('2026-01-12T12:40:00Z'), toFake: ['Date'] });
      const contract = await energyContract.create(contractPayload(DELEGATED));
      energyContract.externalIntegration = {
        getEnergyContractCurrent: sinon.fake.resolves({ price: 0.15, valid_until: null, next_price: null }),
      };
      const window = { from: ms('2026-01-12T12:30:00Z'), to: ms('2026-01-12T13:30:00Z') };
      expect(prices(await energyContract.getMeterPrices(METER_DEVICE_ID, window))).to.deep.equal([
        ['2026-01-12T12:30:00.000Z', 0.15, undefined],
        ['2026-01-12T13:00:00.000Z', null, undefined],
      ]);
      energyContract.currentPriceCache.delete(contract.id);
      energyContract.externalIntegration = { getEnergyContractCurrent: sinon.fake.rejects(new Error('timeout')) };
      const warn = sinon.stub(logger, 'warn');
      expect(prices(await energyContract.getMeterPrices(METER_DEVICE_ID, window))).to.deep.equal([
        ['2026-01-12T12:30:00.000Z', null, undefined],
        ['2026-01-12T13:00:00.000Z', null, undefined],
      ]);
      expect(warn.firstCall.args[0]).to.contain('timeout');
    });

    it('should never ask the integration for a window in the past or a contract not active now', async () => {
      sinon.useFakeTimers({ now: ms('2026-01-20T12:40:00Z'), toFake: ['Date'] });
      await energyContract.create(contractPayload({ ...DELEGATED, valid_to: '2026-01-15' }));
      await energyContract.create(contractPayload({ name: 'Base', timezone: 'UTC', valid_from: '2026-01-16' }));
      const getEnergyContractCurrent = sinon.fake.resolves({ price: 0.15, valid_until: null, next_price: null });
      energyContract.externalIntegration = { getEnergyContractCurrent };
      const past = await energyContract.getMeterPrices(METER_DEVICE_ID, {
        from: ms('2026-01-12T12:00:00Z'),
        to: ms('2026-01-12T13:00:00Z'),
      });
      expect(past.slots.map((slot) => slot.price)).to.deep.equal([null, null]);
      const acrossTheChange = await energyContract.getMeterPrices(METER_DEVICE_ID, {
        from: ms('2026-01-15T23:30:00Z'),
        to: ms('2026-01-20T13:00:00Z'),
      });
      expect(acrossTheChange.slots[0].price).to.equal(null);
      expect(acrossTheChange.slots[1].price).to.equal(0.2);
      expect(getEnergyContractCurrent.callCount).to.equal(0);
    });
  });

  it('should refuse a meter without consumption contract', async () => {
    await expect(
      energyContract.getMeterPrices(METER_DEVICE_ID, {
        from: ms('2026-01-12T00:00:00Z'),
        to: ms('2026-01-12T01:00:00Z'),
      }),
    ).to.be.rejectedWith('ELECTRIC_METER_HAS_NO_CONTRACT');
    // a production contract does not price the consumption of its meter
    await db.EnergyContract.create({ ...contractPayload({ name: 'Solar' }), direction: 'production', timezone: 'UTC' });
    await expect(
      energyContract.getMeterPrices(METER_DEVICE_ID, {
        from: ms('2026-01-12T00:00:00Z'),
        to: ms('2026-01-12T01:00:00Z'),
      }),
    ).to.be.rejectedWith('ELECTRIC_METER_HAS_NO_CONTRACT');
  });
});
