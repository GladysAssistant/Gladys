const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const {
  buildManager,
  addMeterPower,
  contractPayload,
  insertConsumption,
  BASE_TARIFF,
  METER_DEVICE_ID,
  TEST_SERVICE_ID,
} = require('./helpers');
const { buildSyntheticIntervals, sumCosts } = require('../../../../lib/energy-contract/contract.preview');

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

describe('energyContract: preview and current price', () => {
  let energyContract;
  let device;
  let meter;
  beforeEach(async () => {
    ({ energyContract, device, meter } = await buildManager({ timezone: 'UTC' }));
  });

  describe('preview', () => {
    it('should price the real intervals of the meter and return totals and samples', async () => {
      await insertConsumption([
        { value: 1, created_at: new Date('2026-01-12T12:30:00Z') },
        { value: 2, created_at: new Date('2026-01-12T13:00:00Z') },
      ]);
      const result = await energyContract.preview({
        tariff: BASE_TARIFF,
        currency: 'EUR',
        from: '2026-01-12T00:00:00Z',
        to: '2026-01-13T00:00:00Z',
        electric_meter_device_id: METER_DEVICE_ID,
      });
      expect(result).to.include({ intervals: 2, kwh: 3, synthetic: false, currency: 'EUR' });
      // 12 per month over January = 0.008065 per interval
      expect(result.components).to.deep.equal({ energy: 0.6, subscription: 0.01613 });
      expect(result.total).to.equal(0.61613);
      expect(result.samples).to.have.lengthOf(2);
      // the unit price is the energy price: the subscription share of the interval is not in it
      expect(result.samples[0]).to.include({ starts_at: '2026-01-12T12:00:00.000Z', kwh: 1, unit_price: 0.2 });
      expect(result.warnings).to.deep.equal({});
    });

    it('should use a synthetic profile when the meter has no data, and defaults for the window', async () => {
      const result = await energyContract.preview({ tariff: BASE_TARIFF, electric_meter_device_id: METER_DEVICE_ID });
      expect(result.synthetic).to.equal(true);
      expect(result.intervals).to.be.within(7 * 48, 7 * 48 + 1);
      expect(result.kwh).to.equal(result.intervals * 0.5);
      expect(result.currency).to.equal(null);
      const noMeter = await energyContract.preview({ tariff: BASE_TARIFF, from: '2026-01-01', to: '2026-01-02' });
      expect(noMeter.intervals).to.equal(48);
    });

    it('should pass the real cumulative of a tiered tariff', async () => {
      await insertConsumption([
        { value: 1.5, created_at: new Date('2026-01-12T00:30:00Z') },
        { value: 1, created_at: new Date('2026-01-12T12:30:00Z') },
        { value: 1, created_at: new Date('2026-01-12T13:00:00Z') },
      ]);
      const result = await energyContract.preview({
        tariff: TIER_TARIFF,
        from: '2026-01-12T12:00:00Z',
        to: '2026-01-12T14:00:00Z',
        electric_meter_device_id: METER_DEVICE_ID,
        timezone: 'UTC',
      });
      // 1.5 kWh already consumed today: 0.5 kWh at 0.1 then 1.5 kWh at 0.2
      expect(result.components.energy).to.equal(0.35);
      // the first interval straddles the two tiers: labelled by the last rule applied
      expect(result.samples.map((s) => s.label)).to.deep.equal(['tier 2', 'tier 2']);
    });

    it('should count the calendar warnings', async () => {
      await energyContract.declareCalendar({ key: 'spot', granularity: 'thirty_minutes' }, TEST_SERVICE_ID);
      const result = await energyContract.preview({
        tariff: {
          tariff_version: 1,
          calendars: ['spot'],
          components: [
            { key: 'energy', kind: 'consumption', rules: [{ price_from_calendar: 'spot' }], fallback: { price: 0.3 } },
          ],
        },
        from: '2026-01-12T00:00:00Z',
        to: '2026-01-12T01:00:00Z',
      });
      expect(result.warnings).to.deep.equal({ calendar_missing: 2 });
      expect(result.total).to.equal(0.3);
    });

    it('should reject invalid parameters', async () => {
      await expect(energyContract.preview(null)).to.be.rejectedWith('tariff: is required');
      await expect(energyContract.preview({ tariff: BASE_TARIFF, pricing_mode: 'delegated' })).to.be.rejectedWith(
        /cannot be previewed/,
      );
      await expect(energyContract.preview({ tariff: BASE_TARIFF, timezone: 'Nope/Nope' })).to.be.rejectedWith(
        /IANA timezone/,
      );
      await expect(energyContract.preview({ tariff: BASE_TARIFF, from: 'x' })).to.be.rejectedWith(
        /from: must be a date/,
      );
      await expect(
        energyContract.preview({ tariff: BASE_TARIFF, from: '2026-01-02', to: '2026-01-01' }),
      ).to.be.rejectedWith(/from: must be a date before to/);
      await expect(
        energyContract.preview({ tariff: BASE_TARIFF, from: '2026-01-01', to: '2026-03-01' }),
      ).to.be.rejectedWith(/limited to 31 days/);
      await expect(
        energyContract.preview({
          tariff: BASE_TARIFF,
          electric_meter_device_id: 'd1fe2ab9-8c50-4053-ac40-83421f899c00',
        }),
      ).to.be.rejectedWith('ELECTRIC_METER_DEVICE_NOT_FOUND');
      await expect(energyContract.preview({ tariff: { tariff_version: 1, components: [] } })).to.be.rejectedWith(
        /tariff\.components/,
      );
    });

    it('should build synthetic intervals aligned on slots and sum costs', () => {
      const intervals = buildSyntheticIntervals(new Date('2026-01-01T00:10:00Z'), new Date('2026-01-01T01:00:00Z'));
      expect(intervals.map((i) => i.starts_at)).to.deep.equal(['2026-01-01T00:00:00.000Z', '2026-01-01T00:30:00.000Z']);
      expect(
        sumCosts([
          { cost: 0.1, components: { a: 0.1 } },
          { cost: 0.2, components: { a: 0.1, b: 0.1 } },
        ]),
      ).to.deep.equal({
        total: 0.3,
        components: { a: 0.2, b: 0.1 },
      });
    });
  });

  describe('getCurrent', () => {
    it('should return the current price of a rules contract with the real cumulative and last peak', async () => {
      await energyContract.create(contractPayload({ name: 'Tiered', tariff: TIER_TARIFF, timezone: 'UTC' }));
      const at = new Date('2026-01-12T12:40:00Z').getTime();
      await insertConsumption([
        { value: 1.5, created_at: new Date('2026-01-12T00:30:00Z') },
        { value: 1, created_at: new Date('2026-01-12T12:30:00Z') },
      ]);
      const current = await energyContract.getCurrent('tiered', { at });
      expect(current).to.include({ currency: 'EUR', unit: 'kWh', price: 0.2, label: 'tier 2' });
      expect(current.cumulative).to.deep.equal({ day: 2.5, month: 2.5, billing_period: 2.5 });
      // the accumulation is a snapshot: no time-based change ahead for a flat tiered tariff
      expect(current.valid_until).to.equal(null);
      expect(current.contract.selector).to.equal('tiered');
    });

    it('should read the peak of the last interval on the historized power feature', async () => {
      await energyContract.create(
        contractPayload({
          name: 'Threshold',
          timezone: 'UTC',
          tariff: {
            tariff_version: 1,
            components: [
              {
                key: 'energy',
                kind: 'consumption',
                rules: [{ label: 'above 3 kW', when: { power_threshold: { above_kw: 3 } }, price: 0.5 }],
                fallback: { label: 'flat', price: 0.2 },
              },
            ],
          },
        }),
      );
      const at = new Date('2026-01-12T12:40:00Z').getTime();
      // 1 kWh on the last interval: 2 kW on average, below the threshold
      await insertConsumption([{ value: 1, created_at: new Date('2026-01-12T12:30:00Z') }]);
      expect(await energyContract.getCurrent('threshold', { at })).to.include({ price: 0.2, label: 'flat' });
      // a 5 kW peak recorded during that interval (12:00 to 12:30)
      await addMeterPower(device, meter, [{ value: 5000, created_at: new Date('2026-01-12T12:10:00Z') }]);
      expect(await energyContract.getCurrent('threshold', { at })).to.include({ price: 0.5, label: 'above 3 kW' });
      // an unknown meter has no power feature: no peak
      const none = await energyContract.getMeterPowerPeaks('unknown-device', new Date(at), new Date(at), 'UTC');
      expect(none.size).to.equal(0);
    });

    it('should key the power peaks on the local 30-minute slots and read kVA as kilo', async () => {
      // Asia/Kathmandu is UTC+05:45: the local slots start at :15 and :45 UTC
      await energyContract.create(
        contractPayload({
          name: 'Nepal',
          timezone: 'Asia/Kathmandu',
          tariff: {
            tariff_version: 1,
            components: [
              {
                key: 'energy',
                kind: 'consumption',
                rules: [{ label: 'above 3 kW', when: { power_threshold: { above_kw: 3 } }, price: 0.5 }],
                fallback: { label: 'flat', price: 0.2 },
              },
            ],
          },
        }),
      );
      const at = new Date('2026-01-12T12:50:00Z').getTime();
      // the last interval starts at 12:15 UTC (18:00 local)
      await insertConsumption([{ value: 1, created_at: new Date('2026-01-12T12:45:00Z') }]);
      // a 5 kVA peak at 12:20 UTC belongs to that interval, not to the UTC 12:00 slot
      await addMeterPower(
        device,
        meter,
        [{ value: 5, created_at: new Date('2026-01-12T12:20:00Z') }],
        'kilovolt-ampere',
      );
      expect(await energyContract.getCurrent('nepal', { at })).to.include({ price: 0.5, label: 'above 3 kW' });
    });

    it('should relay a delegated contract to the integration and cache the answer 5 minutes', async () => {
      const contract = await energyContract.create(
        contractPayload({
          name: 'Agile',
          pricing_mode: 'delegated',
          provider_service_id: TEST_SERVICE_ID,
          tariff: { tariff_version: 1, components: [{ key: 'fee', kind: 'fixed', amount: 1, per: 'day' }] },
          timezone: 'UTC',
          billing_period_start_day: 10,
        }),
      );
      const getEnergyContractCurrent = sinon.fake.resolves({
        price: 0.15,
        valid_until: null,
        next_price: null,
      });
      energyContract.externalIntegration = { getEnergyContractCurrent };
      const at = new Date('2026-01-12T12:40:00Z').getTime();
      const current = await energyContract.getCurrent('agile', { at });
      expect(current).to.include({ price: 0.15, currency: 'EUR' });
      const [passedContract, payload] = getEnergyContractCurrent.firstCall.args;
      expect(passedContract.id).to.equal(contract.id);
      expect(payload.billing_period).to.deep.equal({
        starts_at: '2026-01-10T00:00:00.000Z',
        ends_at: '2026-02-10T00:00:00.000Z',
      });
      expect(payload.cumulative).to.deep.equal({ day: 0, month: 0, billing_period: 0 });
      expect(payload.max_power_kw).to.equal(0);
      await energyContract.getCurrent('agile', { at });
      expect(getEnergyContractCurrent.callCount).to.equal(1);
      energyContract.currentPriceCache.get(contract.id).expires_at = 0;
      await energyContract.getCurrent('agile', { at });
      expect(getEnergyContractCurrent.callCount).to.equal(2);
    });

    it('should default to now', async () => {
      await energyContract.create(contractPayload({ timezone: 'UTC', valid_from: '2020-01-01' }));
      const current = await energyContract.getCurrent('edf-base');
      expect(current.price).to.equal(0.2);
    });
  });
});
