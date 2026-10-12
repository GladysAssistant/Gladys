const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { BadParameters, NotFoundError } = require('../../../utils/coreErrors');
const { buildSupervisor, seedExternalService } = require('./testUtils.test');

const CONSUMPTION_EXTERNAL_ID = 'ext:ext-dev-open-meteo-demo:meter:consumption';
const DAILY_EXTERNAL_ID = 'ext:ext-dev-open-meteo-demo:meter:daily';

const buildFeature = (overrides = {}) => ({
  id: 'consumption-id',
  device_id: 'device-id',
  selector: 'meter-consumption',
  external_id: CONSUMPTION_EXTERNAL_ID,
  category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
  type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.THIRTY_MINUTES_CONSUMPTION,
  unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
  energy_parent_id: 'meter-feature-id',
  keep_history: true,
  ...overrides,
});

describe('externalIntegration.publishEnergyConsumption', () => {
  let externalIntegration;
  let stateManager;
  let energyContract;
  let device;
  let service;
  let timezone;

  beforeEach(async () => {
    service = await seedExternalService();
    ({ externalIntegration, stateManager, energyContract } = buildSupervisor());
    timezone = 'Europe/Paris';
    externalIntegration.variable = { getValue: fake(() => Promise.resolve(timezone)) };
    device = {
      getDeviceFeatureStates: fake.resolves([]),
      saveHistoricalState: fake.resolves(null),
      energySensorManager: { getRootElectricMeterDevice: fake.returns({ device_id: 'meter-device-id' }) },
    };
    externalIntegration.device = device;
    energyContract.requestMeterRecalculation = fake.resolves(null);
    stateManager.setState('deviceFeatureByExternalId', CONSUMPTION_EXTERNAL_ID, buildFeature());
    stateManager.setState(
      'deviceFeatureByExternalId',
      DAILY_EXTERNAL_ID,
      buildFeature({
        id: 'daily-id',
        selector: 'meter-daily',
        external_id: DAILY_EXTERNAL_ID,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.DAILY_CONSUMPTION,
      }),
    );
  });
  afterEach(() => {
    sinon.restore();
  });

  const publish = (body) => externalIntegration.publishEnergyConsumption(service, body);

  it('should upsert the 30-minutes states at the end of their interval and queue the meter recalculation', async () => {
    const result = await publish({
      device_feature_external_id: CONSUMPTION_EXTERNAL_ID,
      intervals: [
        { starts_at: '2026-01-12T05:30:00Z', kwh: 0.38 },
        { starts_at: '2026-01-12T05:00:00Z', kwh: 0.4 },
        // the last value given for an instant wins
        { starts_at: '2026-01-12T05:00:00Z', kwh: 0.42 },
      ],
    });
    expect(result).to.deep.equal({ count: 2, changed_from: new Date('2026-01-12T05:30:00Z') });
    sinonAssert.calledWith(
      device.getDeviceFeatureStates,
      'meter-consumption',
      new Date('2026-01-12T05:30:00Z'),
      new Date('2026-01-12T06:00:00Z'),
    );
    expect(device.saveHistoricalState.callCount).to.equal(2);
    expect(device.saveHistoricalState.firstCall.args.slice(1)).to.deep.equal([0.42, new Date('2026-01-12T05:30:00Z')]);
    expect(device.saveHistoricalState.secondCall.args.slice(1)).to.deep.equal([0.38, new Date('2026-01-12T06:00:00Z')]);
    sinonAssert.calledWith(
      energyContract.requestMeterRecalculation,
      'meter-device-id',
      new Date('2026-01-12T05:30:00Z'),
    );
  });

  it('should skip the unchanged states, convert into the feature unit and report nothing when nothing changed', async () => {
    stateManager.setState(
      'deviceFeatureByExternalId',
      CONSUMPTION_EXTERNAL_ID,
      buildFeature({ unit: DEVICE_FEATURE_UNITS.WATT_HOUR }),
    );
    device.getDeviceFeatureStates = fake.resolves([{ created_at: '2026-01-12T05:30:00.000Z', value: 420 }]);
    const result = await publish({
      device_feature_external_id: CONSUMPTION_EXTERNAL_ID,
      intervals: [
        { starts_at: '2026-01-12T05:00:00Z', kwh: 0.42 },
        { starts_at: '2026-01-12T05:30:00Z', kwh: 0.38 },
      ],
    });
    expect(result).to.deep.equal({ count: 2, changed_from: new Date('2026-01-12T06:00:00Z') });
    expect(device.saveHistoricalState.callCount).to.equal(1);
    expect(device.saveHistoricalState.firstCall.args.slice(1)).to.deep.equal([380, new Date('2026-01-12T06:00:00Z')]);
    // a republication of the same values writes nothing and queues nothing
    device.getDeviceFeatureStates = fake.resolves([
      { created_at: '2026-01-12T05:30:00.000Z', value: 420 },
      { created_at: '2026-01-12T06:00:00.000Z', value: 380 },
    ]);
    device.saveHistoricalState.resetHistory();
    energyContract.requestMeterRecalculation.resetHistory();
    const unchanged = await publish({
      device_feature_external_id: CONSUMPTION_EXTERNAL_ID,
      intervals: [
        { starts_at: '2026-01-12T05:00:00Z', kwh: 0.42 },
        { starts_at: '2026-01-12T05:30:00Z', kwh: 0.38 },
      ],
    });
    expect(unchanged).to.deep.equal({ count: 2, changed_from: null });
    expect(device.saveHistoricalState.callCount).to.equal(0);
    expect(energyContract.requestMeterRecalculation.callCount).to.equal(0);
  });

  it('should store a daily consumption at its local midnight, from a date or an aligned instant', async () => {
    const result = await publish({
      device_feature_external_id: DAILY_EXTERNAL_ID,
      intervals: [
        { date: '2026-01-12', kwh: 18.4 },
        { starts_at: '2026-01-12T23:00:00Z', kwh: 17.1 },
      ],
    });
    expect(result).to.deep.equal({ count: 2, changed_from: new Date('2026-01-11T23:00:00Z') });
    expect(device.saveHistoricalState.firstCall.args.slice(1)).to.deep.equal([18.4, new Date('2026-01-11T23:00:00Z')]);
    expect(device.saveHistoricalState.secondCall.args.slice(1)).to.deep.equal([17.1, new Date('2026-01-12T23:00:00Z')]);
    await expect(
      publish({
        device_feature_external_id: DAILY_EXTERNAL_ID,
        intervals: [{ starts_at: '2026-01-12T00:00:00Z', kwh: 1 }],
      }),
    ).to.be.rejectedWith(BadParameters, 'must be a local midnight of Europe/Paris');
    await expect(
      publish({ device_feature_external_id: CONSUMPTION_EXTERNAL_ID, intervals: [{ date: '2026-01-12', kwh: 1 }] }),
    ).to.be.rejectedWith(BadParameters, 'a 30-minute consumption takes starts_at');
  });

  it('should fall back to UTC without a configured timezone', async () => {
    timezone = null;
    await publish({
      device_feature_external_id: DAILY_EXTERNAL_ID,
      intervals: [{ date: '2026-01-12', kwh: 18.4 }],
    });
    expect(device.saveHistoricalState.firstCall.args[2]).to.deep.equal(new Date('2026-01-12T00:00:00Z'));
  });

  it('should write the states but not price them without a valid root meter', async () => {
    device.energySensorManager.getRootElectricMeterDevice = fake.returns(null);
    const result = await publish({
      device_feature_external_id: CONSUMPTION_EXTERNAL_ID,
      intervals: [{ starts_at: '2026-01-12T05:00:00Z', kwh: 0.42 }],
    });
    expect(result.changed_from).to.deep.equal(new Date('2026-01-12T05:30:00Z'));
    expect(device.saveHistoricalState.callCount).to.equal(1);
    expect(energyContract.requestMeterRecalculation.callCount).to.equal(0);
  });

  it('should refuse a feature outside the integration, not created, not a consumption, or fed by an index', async () => {
    await expect(publish(null)).to.be.rejectedWith(BadParameters, 'device_feature_external_id');
    await expect(publish({ intervals: [] })).to.be.rejectedWith(BadParameters, 'device_feature_external_id');
    await expect(
      publish({ device_feature_external_id: 'ext:other:meter:consumption', intervals: [] }),
    ).to.be.rejectedWith(BadParameters, 'must start with "ext:ext-dev-open-meteo-demo:"');
    await expect(
      publish({ device_feature_external_id: 'ext:ext-dev-open-meteo-demo:unknown', intervals: [] }),
    ).to.be.rejectedWith(NotFoundError, 'the device is not created');
    stateManager.setState(
      'deviceFeatureByExternalId',
      'ext:ext-dev-open-meteo-demo:temperature',
      buildFeature({
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      }),
    );
    await expect(
      publish({ device_feature_external_id: 'ext:ext-dev-open-meteo-demo:temperature', intervals: [] }),
    ).to.be.rejectedWith(BadParameters, 'must be a 30-minute or daily consumption feature');
    // the core's `_consumption` feature hangs off an index of the SAME device
    stateManager.setState('deviceFeatureById', 'index-id', {
      id: 'index-id',
      device_id: 'device-id',
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
    });
    stateManager.setState(
      'deviceFeatureByExternalId',
      'ext:ext-dev-open-meteo-demo:index_consumption',
      buildFeature({ energy_parent_id: 'index-id' }),
    );
    await expect(
      publish({ device_feature_external_id: 'ext:ext-dev-open-meteo-demo:index_consumption', intervals: [] }),
    ).to.be.rejectedWith(BadParameters, 'derived from a cumulative index');
  });

  it('should accept a consumption attached to the index of the main meter, on another device', async () => {
    // what the discovery does: the published consumption hangs off the main meter's energy
    // feature, which is usually a cumulative index
    stateManager.setState('deviceFeatureById', 'main-meter-index-id', {
      id: 'main-meter-index-id',
      device_id: 'main-meter-device-id',
      category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
      type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
    });
    stateManager.setState(
      'deviceFeatureByExternalId',
      CONSUMPTION_EXTERNAL_ID,
      buildFeature({ energy_parent_id: 'main-meter-index-id' }),
    );
    const result = await publish({
      device_feature_external_id: CONSUMPTION_EXTERNAL_ID,
      intervals: [{ starts_at: '2026-01-12T05:00:00Z', kwh: 0.42 }],
    });
    expect(result).to.deep.equal({ count: 1, changed_from: new Date('2026-01-12T05:30:00Z') });
    expect(device.saveHistoricalState.callCount).to.equal(1);
    sinonAssert.calledWith(
      energyContract.requestMeterRecalculation,
      'meter-device-id',
      new Date('2026-01-12T05:30:00Z'),
    );
  });

  it('should recompute the states written before a failed write, and report the write error', async () => {
    device.saveHistoricalState = fake((feature, value) =>
      value === 0.38 ? Promise.reject(new Error('duckdb write failed')) : Promise.resolve(null),
    );
    const intervals = [
      { starts_at: '2026-01-12T05:00:00Z', kwh: 0.42 },
      { starts_at: '2026-01-12T05:30:00Z', kwh: 0.38 },
    ];
    await expect(publish({ device_feature_external_id: CONSUMPTION_EXTERNAL_ID, intervals })).to.be.rejectedWith(
      'duckdb write failed',
    );
    sinonAssert.calledOnceWithExactly(
      energyContract.requestMeterRecalculation,
      'meter-device-id',
      new Date('2026-01-12T05:30:00Z'),
    );
    // the recalculation failing too never hides the write error
    energyContract.requestMeterRecalculation = fake.rejects(new Error('scheduler down'));
    await expect(publish({ device_feature_external_id: CONSUMPTION_EXTERNAL_ID, intervals })).to.be.rejectedWith(
      'duckdb write failed',
    );
    // nothing written before the failure: nothing to recompute
    device.saveHistoricalState = fake.rejects(new Error('duckdb write failed'));
    energyContract.requestMeterRecalculation = fake.resolves(null);
    await expect(publish({ device_feature_external_id: CONSUMPTION_EXTERNAL_ID, intervals })).to.be.rejectedWith(
      'duckdb write failed',
    );
    expect(energyContract.requestMeterRecalculation.callCount).to.equal(0);
  });

  it('should validate the intervals', async () => {
    const withIntervals = (intervals) => publish({ device_feature_external_id: CONSUMPTION_EXTERNAL_ID, intervals });
    await expect(withIntervals(undefined)).to.be.rejectedWith(BadParameters, 'intervals: must be a non-empty array');
    await expect(withIntervals([])).to.be.rejectedWith(BadParameters, 'intervals: must be a non-empty array');
    await expect(
      withIntervals(Array.from({ length: 2001 }, () => ({ starts_at: '2026-01-12T05:00:00Z', kwh: 1 }))),
    ).to.be.rejectedWith(BadParameters, 'at most 2000 intervals per call');
    await expect(withIntervals([null])).to.be.rejectedWith(BadParameters, 'intervals[0]: must be an object');
    await expect(withIntervals([{ starts_at: '2026-01-12T05:00:00Z', kwh: '1' }])).to.be.rejectedWith(
      BadParameters,
      'intervals[0].kwh: must be a finite positive number',
    );
    await expect(withIntervals([{ starts_at: '2026-01-12T05:00:00Z', kwh: -1 }])).to.be.rejectedWith(
      BadParameters,
      'intervals[0].kwh',
    );
    await expect(withIntervals([{ starts_at: '2026-01-12T05:00:00Z', kwh: Infinity }])).to.be.rejectedWith(
      BadParameters,
      'intervals[0].kwh',
    );
    await expect(withIntervals([{ kwh: 1 }])).to.be.rejectedWith(BadParameters, 'starts_at: must be an ISO date');
    await expect(withIntervals([{ starts_at: 'yesterday', kwh: 1 }])).to.be.rejectedWith(BadParameters, 'ISO date');
    await expect(withIntervals([{ starts_at: '2026-01-12T05:15:00Z', kwh: 1 }])).to.be.rejectedWith(
      BadParameters,
      'must be aligned on a 30-minute slot of Europe/Paris',
    );
    await expect(withIntervals([{ starts_at: '2026-01-12T05:00:30Z', kwh: 1 }])).to.be.rejectedWith(
      BadParameters,
      'aligned on a 30-minute slot',
    );
    await expect(withIntervals([{ date: 'not-a-date', kwh: 1 }])).to.be.rejectedWith(
      BadParameters,
      'intervals[0].date: must be a YYYY-MM-DD date',
    );
    const tooOld = new Date(Date.now() - 6 * 365 * 24 * 60 * 60 * 1000);
    tooOld.setUTCMinutes(0, 0, 0);
    await expect(withIntervals([{ starts_at: tooOld.toISOString(), kwh: 1 }])).to.be.rejectedWith(
      BadParameters,
      'at most 5 years ago',
    );
    const current = new Date();
    current.setUTCMinutes(current.getUTCMinutes() >= 30 ? 30 : 0, 0, 0);
    await expect(withIntervals([{ starts_at: current.toISOString(), kwh: 1 }])).to.be.rejectedWith(
      BadParameters,
      'the interval must be elapsed',
    );
    expect(device.saveHistoricalState.callCount).to.equal(0);
  });
});
