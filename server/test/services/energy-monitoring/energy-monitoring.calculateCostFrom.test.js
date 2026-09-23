const sinon = require('sinon').createSandbox();
const { expect } = require('chai');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const historicalTempoData = require('./data/tempo_mock');

dayjs.extend(utc);
dayjs.extend(timezone);

const { fake } = sinon;
const db = require('../../../models');
const EnergyMonitoring = require('../../../services/energy-monitoring/lib');
const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const {
  buildManager,
  addMeterPower,
  contractPayload,
  insertConsumption,
  TEMPO_TARIFF,
  METER_DEVICE_ID,
  METER_FEATURE_ID,
  TEST_SERVICE_ID,
} = require('../../lib/energy-contract/manager/helpers');
const {
  findConsumptionCostPairs,
  getEffectiveStart,
} = require('../../../services/energy-monitoring/lib/energy-monitoring.calculateCostFrom');

const POWER_PLUG_ID = 'cf43f956-2f49-4cf9-a7e2-690a014de66e';
const PLUG_CONSUMPTION_ID = '27488546-e1b8-4cb9-bd75-e20526a94a99';
const PLUG_COST_ID = '1f4133be-b86c-4a97-9cc8-585fadb74006';
const TEMPO_CALENDAR = {
  key: 'tempo',
  granularity: 'day',
  timezone: 'Europe/Paris',
  day_starts_at: '06:00',
  values: ['blue', 'white', 'red'],
};

const feature = (overrides) => ({
  read_only: true,
  has_feedback: false,
  min: 0,
  max: 1000,
  category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  ...overrides,
});

describe('EnergyMonitoring.calculateCostFrom', () => {
  let gladys;
  let energyContract;
  let device;
  let meter;
  let energyMonitoring;
  const costStates = (selector = 'power-plug-consumption-cost') =>
    device.getDeviceFeatureStates(selector, new Date('2020-01-01T00:00:00.000Z'), new Date('2030-01-01T00:00:00.000Z'));

  beforeEach(async () => {
    ({ energyContract, device, meter } = await buildManager());
    gladys = {
      device,
      energyContract,
      event: { on: fake.returns(null) },
      job: { updateProgress: fake.returns(null), wrapper: (name, func) => func },
    };
    // a power plug whose consumption is a child of the meter
    await device.create({
      id: POWER_PLUG_ID,
      service_id: TEST_SERVICE_ID,
      name: 'Power plug',
      external_id: 'power-plug',
      features: [
        feature({
          id: PLUG_CONSUMPTION_ID,
          selector: 'power-plug-consumption',
          external_id: 'power-plug-consumption',
          name: 'Power plug Consumption',
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: METER_FEATURE_ID,
        }),
        feature({
          id: PLUG_COST_ID,
          selector: 'power-plug-consumption-cost',
          external_id: 'power-plug-consumption-cost',
          name: 'Power plug Consumption Cost',
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          energy_parent_id: PLUG_CONSUMPTION_ID,
        }),
      ],
    });
    energyMonitoring = new EnergyMonitoring(gladys, '43732e67-6669-4a95-83d6-38c50b835387');
  });
  afterEach(() => sinon.restore());

  it('should price the consumption of the meter and its children with the active contract', async () => {
    await energyContract.create(contractPayload({ valid_from: '2025-01-01' }));
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 10, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 20, created_at: new Date('2025-08-28T15:30:00.000Z') },
    ]);
    await insertConsumption([{ value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') }]);
    await energyMonitoring.calculateCostFrom(new Date('2025-08-28T00:00:00.000Z'));
    const states = await costStates();
    expect(states).to.have.lengthOf(2);
    // 0.2 per kWh + the subscription of 12/month spread over August (31 days * 48 intervals)
    expect(states[0].value).to.equal(10 * 0.2 + 0.008065);
    expect(states[1].value).to.equal(20 * 0.2 + 0.008065);
    const meterStates = await costStates('electrical-meter-cost');
    expect(meterStates).to.have.lengthOf(1);
    expect(gladys.job.updateProgress.called).to.equal(false);
    // a run with a job id reports its progress
    await energyMonitoring.calculateCostFrom(new Date('2025-08-28T00:00:00.000Z'), 'job-id');
    expect(gladys.job.updateProgress.callCount).to.equal(2);
  });

  it('should compute nothing for a meter without contract', async () => {
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 10, created_at: new Date('2025-08-28T15:00:00.000Z') },
    ]);
    await energyMonitoring.calculateCostFrom(new Date('2025-08-28T00:00:00.000Z'));
    expect(await costStates()).to.have.lengthOf(0);
  });

  it('should only recalculate the devices in options.deviceIds or the meters in electricMeterDeviceIds', async () => {
    await energyContract.create(contractPayload());
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 10, created_at: new Date('2025-08-28T15:00:00.000Z') },
    ]);
    const date = new Date('2025-08-28T00:00:00.000Z');
    await energyMonitoring.calculateCostFrom(date, null, { deviceIds: [METER_DEVICE_ID] });
    expect(await costStates()).to.have.lengthOf(0);
    await energyMonitoring.calculateCostFrom(date, null, { electricMeterDeviceIds: ['other-meter'] });
    expect(await costStates()).to.have.lengthOf(0);
    await energyMonitoring.calculateCostFrom(date, null, { electricMeterDeviceIds: [METER_DEVICE_ID] });
    expect(await costStates()).to.have.lengthOf(1);
  });

  it('should not price an interval outside every contract and pick the contract by date', async () => {
    await energyContract.create(contractPayload({ valid_from: '2020-01-01', valid_to: '2020-12-31' }));
    await energyContract.create(
      contractPayload({
        name: 'New',
        valid_from: '2025-09-01',
        tariff: {
          tariff_version: 1,
          components: [{ key: 'e', kind: 'consumption', rules: [], fallback: { price: 0.5 } }],
        },
      }),
    );
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 10, created_at: new Date('2025-08-28T15:00:00.000Z') },
      // 2025-09-01 00:00 Paris is 2025-08-31 22:00 UTC: this interval starts at 22:30 Paris on the 31st
      { value: 10, created_at: new Date('2025-08-31T21:00:00.000Z') },
      { value: 10, created_at: new Date('2025-08-31T22:30:00.000Z') },
    ]);
    await energyMonitoring.calculateCostFrom(new Date('2025-08-01T00:00:00.000Z'));
    const states = await costStates();
    expect(states).to.have.lengthOf(1);
    expect(states[0].value).to.equal(5);
    expect(new Date(states[0].created_at).toISOString()).to.equal('2025-08-31T22:30:00.000Z');
  });

  it('should convert Watt-hour states and daily consumption features', async () => {
    await energyContract.create(
      contractPayload({
        tariff: {
          tariff_version: 1,
          components: [{ key: 'e', kind: 'consumption', rules: [], fallback: { price: 0.18 } }],
        },
      }),
    );
    await device.create({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      service_id: TEST_SERVICE_ID,
      name: 'Daily meter',
      external_id: 'daily-meter',
      features: [
        feature({
          id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          selector: 'daily-consumption',
          external_id: 'daily-consumption',
          name: 'Daily consumption (Wh)',
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
          unit: DEVICE_FEATURE_UNITS.WATT_HOUR,
          energy_parent_id: METER_FEATURE_ID,
        }),
        feature({
          id: 'c3d4e5f6-a789-0123-cdef-234567890abc',
          selector: 'daily-consumption-cost',
          external_id: 'daily-consumption-cost',
          name: 'Daily consumption cost',
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION_COST,
          energy_parent_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        }),
      ],
    });
    await db.duckDbBatchInsertState('b2c3d4e5-f6a7-8901-bcde-f12345678901', [
      { value: 5000, created_at: new Date('2025-08-28T15:00:00.000Z') },
    ]);
    await energyMonitoring.calculateCostFrom(new Date('2025-08-28T00:00:00.000Z'));
    const states = await costStates('daily-consumption-cost');
    expect(states).to.have.lengthOf(1);
    expect(states[0].value).to.equal(0.9);
  });

  it('should price a Tempo contract with the calendar published by the internal provider', async () => {
    await energyContract.declareCalendar(TEMPO_CALENDAR, TEST_SERVICE_ID);
    await energyContract.publishCalendarEntries(
      'tempo',
      historicalTempoData
        .filter((d) => d.created_at >= '2025-01-01')
        .map((d) => ({ date: d.created_at, value: d.day_type })),
      { provider_service_id: TEST_SERVICE_ID, skip_recalculation: true },
    );
    await energyContract.create(contractPayload({ name: 'Tempo', tariff: TEMPO_TARIFF, valid_from: '2025-01-01' }));
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      // RED day (2025-01-03), off peak then peak
      { value: 10, created_at: dayjs.tz('2025-01-03T05:30:00.000Z', 'Europe/Paris').toDate() },
      { value: 10, created_at: dayjs.tz('2025-01-03T10:30:00.000Z', 'Europe/Paris').toDate() },
      // BLUE day (2025-01-05), peak then off peak
      { value: 10, created_at: dayjs.tz('2025-01-05T15:30:00.000Z', 'Europe/Paris').toDate() },
      { value: 10, created_at: dayjs.tz('2025-01-05T22:30:00.000Z', 'Europe/Paris').toDate() },
    ]);
    await energyMonitoring.calculateCostFrom(new Date('2025-01-01T00:00:00.000Z'));
    const states = await costStates();
    expect(states.map((s) => s.value)).to.deep.equal([1.568, 7.562, 1.609, 1.296]);
  });

  it('should recompute a tiered contract from the start of its accumulation period', async () => {
    const contract = await energyContract.create(
      contractPayload({
        name: 'Tiered',
        timezone: 'UTC',
        tariff: {
          tariff_version: 1,
          components: [
            {
              key: 'e',
              kind: 'consumption',
              rules: [{ when: { tier: { cumulative: 'day', from_kwh: 0, to_kwh: 10 } }, price: 0.1 }],
              fallback: { price: 1 },
            },
          ],
        },
      }),
    );
    const compiled = energyContract.getCompiledTariff(contract);
    expect(getEffectiveStart(contract, compiled, new Date('2025-08-28T15:00:00.000Z')).toISOString()).to.equal(
      '2025-08-28T00:00:00.000Z',
    );
    expect(
      getEffectiveStart(contract, { hasTier: false }, new Date('2025-08-28T15:00:00.000Z')).toISOString(),
    ).to.equal('2025-08-28T15:00:00.000Z');
    const monthly = { ...contract, billing_period_start_day: 5 };
    expect(
      getEffectiveStart(
        monthly,
        { hasTier: true, tierScopes: ['month', 'billing_period'] },
        new Date('2025-08-28T15:00:00.000Z'),
      ).toISOString(),
    ).to.equal('2025-08-01T00:00:00.000Z');
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 8, created_at: new Date('2025-08-28T10:00:00.000Z') },
      { value: 4, created_at: new Date('2025-08-28T15:00:00.000Z') },
    ]);
    // asked from 14:00: the day is recomputed from midnight so the second interval is in tier 2
    await energyMonitoring.calculateCostFrom(new Date('2025-08-28T14:00:00.000Z'));
    const states = await costStates();
    expect(states.map((s) => s.value)).to.deep.equal([0.8, 0.2 + 2]);
  });

  it('should apply the demand charges of an elapsed billing period only', async () => {
    await energyContract.create(
      contractPayload({
        name: 'Demand',
        timezone: 'UTC',
        valid_from: '2020-01-01',
        tariff: {
          tariff_version: 1,
          components: [
            { key: 'e', kind: 'consumption', rules: [], fallback: { price: 0 } },
            { key: 'demand', kind: 'demand', price: 10, per: 'billing_period', aggregation: 'max' },
          ],
        },
      }),
    );
    const now = Date.now();
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 2, created_at: new Date('2025-08-28T15:30:00.000Z') },
      { value: 1, created_at: new Date(now - 30 * 60 * 1000) },
    ]);
    await energyMonitoring.calculateCostFrom(new Date('2025-08-01T00:00:00.000Z'));
    const states = await costStates();
    expect(states).to.have.lengthOf(3);
    // August is closed: 4 kW peak * 10 spread pro rata over the two intervals
    expect(states[0].value + states[1].value).to.equal(40);
    // the current period is not charged
    expect(states[2].value).to.equal(0);
  });

  it('should read the peaks of the demand charges on the historized power feature of the meter', async () => {
    await energyContract.create(
      contractPayload({
        name: 'Demand',
        timezone: 'UTC',
        valid_from: '2020-01-01',
        tariff: {
          tariff_version: 1,
          components: [
            { key: 'e', kind: 'consumption', rules: [], fallback: { price: 0 } },
            { key: 'demand', kind: 'demand', price: 10, per: 'billing_period', aggregation: 'max' },
          ],
        },
      }),
    );
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 2, created_at: new Date('2025-08-28T15:30:00.000Z') },
      { value: 1, created_at: new Date(Date.now() - 30 * 60 * 1000) },
    ]);
    // a 6 kW peak in the first interval (14:30 to 15:00), the second one keeps its 4 kW average
    await addMeterPower(device, meter, [
      { value: 6000, created_at: new Date('2025-08-28T14:40:00.000Z') },
      { value: 1000, created_at: new Date('2025-08-28T14:50:00.000Z') },
    ]);
    // a second device on the same meter: the peaks are loaded once per run
    await device.create({
      id: 'df43f956-2f49-4cf9-a7e2-690a014de66e',
      service_id: TEST_SERVICE_ID,
      name: 'Second plug',
      external_id: 'second-plug',
      features: [
        feature({
          id: '37488546-e1b8-4cb9-bd75-e20526a94a99',
          selector: 'second-plug-consumption',
          external_id: 'second-plug-consumption',
          name: 'Second plug Consumption',
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: METER_FEATURE_ID,
        }),
        feature({
          id: '2f4133be-b86c-4a97-9cc8-585fadb74006',
          selector: 'second-plug-consumption-cost',
          external_id: 'second-plug-consumption-cost',
          name: 'Second plug Consumption Cost',
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION_COST,
          energy_parent_id: '37488546-e1b8-4cb9-bd75-e20526a94a99',
        }),
      ],
    });
    const getMeterPowerPeaks = sinon.spy(energyContract, 'getMeterPowerPeaks');
    await energyMonitoring.calculateCostFrom(new Date('2025-08-01T00:00:00.000Z'));
    const states = await costStates();
    expect(states).to.have.lengthOf(3);
    expect(states[0].value + states[1].value).to.equal(60);
    expect(getMeterPowerPeaks.callCount).to.equal(1);
  });

  it('should keep the previous costs when the pricing fails', async () => {
    await energyContract.create(contractPayload({ name: 'Flat', timezone: 'UTC', valid_from: '2020-01-01' }));
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
    ]);
    await db.duckDbBatchInsertState(PLUG_COST_ID, [{ value: 99, created_at: new Date('2025-08-28T15:00:00.000Z') }]);
    sinon.stub(energyContract, 'priceContractIntervals').rejects(new Error('integration down'));
    const error = sinon.stub(logger, 'error');
    const result = await energyMonitoring.calculateCostFrom(new Date('2025-08-01T00:00:00.000Z'));
    expect(error.callCount).to.equal(1);
    // reported to the callers that must retry (the pending recalculation of the migration)
    expect(result.failures).to.equal(1);
    const states = await costStates();
    expect(states.map((s) => s.value)).to.deep.equal([99]);
  });

  it('should not widen the run window for a tiered contract that is expired', async () => {
    await energyContract.create(
      contractPayload({
        name: 'Old tiered',
        timezone: 'UTC',
        valid_from: '2020-01-01',
        valid_to: '2024-12-31',
        tariff: {
          tariff_version: 1,
          components: [
            {
              key: 'e',
              kind: 'consumption',
              rules: [{ when: { tier: { cumulative: 'month', from_kwh: 0, to_kwh: 10 } }, price: 0.1 }],
              fallback: { price: 1 },
            },
          ],
        },
      }),
    );
    await energyContract.create(
      contractPayload({
        name: 'Flat',
        timezone: 'UTC',
        valid_from: '2025-01-01',
        tariff: {
          tariff_version: 1,
          components: [{ key: 'e', kind: 'consumption', rules: [], fallback: { price: 0.2 } }],
        },
      }),
    );
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 8, created_at: new Date('2025-08-28T10:00:00.000Z') },
      { value: 4, created_at: new Date('2025-08-28T15:00:00.000Z') },
    ]);
    // a cost already stored before the run window: an expired tier must not recompute it
    await db.duckDbBatchInsertState(PLUG_COST_ID, [{ value: 99, created_at: new Date('2025-08-28T10:00:00.000Z') }]);
    await energyMonitoring.calculateCostFrom(new Date('2025-08-28T14:00:00.000Z'));
    const states = await costStates();
    expect(states.map((s) => s.value)).to.deep.equal([99, 0.8]);
  });

  it('should carry the month accumulation over a billing period starting mid-month', async () => {
    await energyContract.create(
      contractPayload({
        name: 'Month tier',
        timezone: 'UTC',
        valid_from: '2020-01-01',
        billing_period_start_day: 15,
        tariff: {
          tariff_version: 1,
          components: [
            {
              key: 'e',
              kind: 'consumption',
              rules: [{ when: { tier: { cumulative: 'month', from_kwh: 0, to_kwh: 10 } }, price: 0.1 }],
              fallback: { price: 1 },
            },
          ],
        },
      }),
    );
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 8, created_at: new Date('2025-08-14T10:00:00.000Z') },
      { value: 4, created_at: new Date('2025-08-16T10:00:00.000Z') },
      { value: 4, created_at: new Date('2025-09-16T10:00:00.000Z') },
    ]);
    await energyMonitoring.calculateCostFrom(new Date('2025-08-01T00:00:00.000Z'));
    const states = await costStates();
    // 8 kWh in tier 1, then 2 in tier 1 and 2 above: the billing period of the 15th does not
    // restart the month; the September interval starts a new month
    expect(states.map((s) => Math.round(s.value * 100) / 100)).to.deep.equal([0.8, 2.2, 0.4]);
  });

  it('should not carry the month accumulation over a skipped billing period', async () => {
    await energyContract.create(
      contractPayload({
        name: 'Month tier',
        timezone: 'UTC',
        valid_from: '2020-01-01',
        billing_period_start_day: 15,
        tariff: {
          tariff_version: 1,
          components: [
            {
              key: 'e',
              kind: 'consumption',
              rules: [{ when: { tier: { cumulative: 'month', from_kwh: 0, to_kwh: 10 } }, price: 0.1 }],
              fallback: { price: 1 },
            },
          ],
        },
      }),
    );
    // the Jul 15 - Aug 14 period, nothing in Aug 15 - Sep 14, then the Sep 15 - Oct 14 one
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 8, created_at: new Date('2025-08-14T10:00:00.000Z') },
      { value: 4, created_at: new Date('2025-10-10T10:00:00.000Z') },
    ]);
    await energyMonitoring.calculateCostFrom(new Date('2025-08-01T00:00:00.000Z'));
    const states = await costStates();
    expect(states.map((s) => Math.round(s.value * 100) / 100)).to.deep.equal([0.8, 0.4]);
  });

  it('should leave the intervals of an unavailable delegated integration without a cost', async () => {
    await energyContract.create(
      contractPayload({
        name: 'Agile',
        pricing_mode: 'delegated',
        provider_service_id: TEST_SERVICE_ID,
        tariff: { tariff_version: 1, components: [{ key: 's', kind: 'fixed', amount: 1, per: 'day' }] },
      }),
    );
    energyContract.externalIntegration = {
      priceEnergyContract: fake.rejects(new Error('EXTERNAL_INTEGRATION_NOT_CONNECTED')),
    };
    const warn = sinon.stub(logger, 'warn');
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
    ]);
    await energyMonitoring.calculateCostFrom(new Date('2025-08-28T00:00:00.000Z'));
    expect(await costStates()).to.have.lengthOf(0);
    expect(warn.args.some(([message]) => /left without a cost/.test(message))).to.equal(true);
  });

  it('should count the fallback warnings of a calendar price', async () => {
    await energyContract.declareCalendar({ key: 'spot', granularity: 'thirty_minutes' }, TEST_SERVICE_ID);
    await energyContract.create(
      contractPayload({
        name: 'Spot',
        tariff: {
          tariff_version: 1,
          calendars: ['spot'],
          components: [
            { key: 'e', kind: 'consumption', rules: [{ price_from_calendar: 'spot' }], fallback: { price: 0.3 } },
          ],
        },
      }),
    );
    const warn = sinon.stub(logger, 'warn');
    await db.duckDbBatchInsertState(PLUG_CONSUMPTION_ID, [
      { value: 1, created_at: new Date('2025-08-28T15:00:00.000Z') },
    ]);
    await energyMonitoring.calculateCostFrom(new Date('2025-08-28T00:00:00.000Z'));
    expect((await costStates())[0].value).to.equal(0.3);
    expect(
      warn.args.some(([message]) => /1 interval\(s\) priced by a fallback \(calendar_missing\)/.test(message)),
    ).to.equal(true);
  });

  it('should skip the features without a cost feature, a broken hierarchy and log errors', async () => {
    await energyContract.create(contractPayload());
    await device.create({
      id: 'e1b2c3d4-e5f6-7890-abcd-ef1234567891',
      service_id: TEST_SERVICE_ID,
      name: 'No cost',
      external_id: 'no-cost',
      features: [
        feature({
          id: 'f2c3d4e5-f6a7-8901-bcde-f12345678902',
          selector: 'no-cost-consumption',
          external_id: 'no-cost-consumption',
          name: 'Consumption',
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
          energy_parent_id: METER_FEATURE_ID,
        }),
        feature({
          id: 'f2c3d4e5-f6a7-8901-bcde-f12345678903',
          selector: 'no-cost-daily',
          external_id: 'no-cost-daily',
          name: 'Daily',
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
          energy_parent_id: METER_FEATURE_ID,
        }),
      ],
    });
    const plug = device.stateManager.get('deviceById', POWER_PLUG_ID);
    expect(findConsumptionCostPairs(plug)).to.have.lengthOf(1);
    expect(
      findConsumptionCostPairs(device.stateManager.get('deviceById', 'e1b2c3d4-e5f6-7890-abcd-ef1234567891')),
    ).to.deep.equal([]);
    // an error on one device does not stop the run
    const error = sinon.stub(logger, 'error');
    const getDeviceFeatureStates = sinon.stub(device, 'getDeviceFeatureStates').rejects(new Error('boom'));
    await energyMonitoring.calculateCostFrom(new Date('2025-08-28T00:00:00.000Z'));
    expect(error.callCount).to.be.above(0);
    getDeviceFeatureStates.restore();
    // broken hierarchy: the meter feature the plug consumption points to is gone
    const warn = sinon.stub(logger, 'warn');
    device.stateManager.deleteState('deviceFeatureById', METER_FEATURE_ID);
    await energyMonitoring.calculateCostFrom(new Date('2025-08-28T00:00:00.000Z'));
    expect(warn.args.some(([message]) => /no valid root electric meter found/.test(message))).to.equal(true);
  });
});
