const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const variable = {
  getValue: fake.resolves(null),
};

const VERBOSE_FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
const QUIET_FEATURE_ID = 'ce9dc798-b09f-4e51-8c16-311cdebf97cd';
const OTHER_DEVICE_FEATURE_ID = 'a6e5a6ec-2f2e-4b3b-9d6a-9c4f1f1b0e11';
const DELETED_FEATURE_ID = '0d6b2d0b-6c8e-4d2a-8d4c-3a8a4c5b6d77';
const FEATURE_OF_DELETED_DEVICE_ID = '3c6f1e2a-7b4d-4f5e-9a8b-1c2d3e4f5a6b';

const buildStates = (count, from) =>
  Array.from({ length: count }, (value, index) => ({
    value: index,
    created_at: new Date(from.getTime() + index * 1000),
  }));

const buildStateManager = () => {
  const stateManager = new StateManager(event);
  stateManager.setState('deviceById', 'device-1', { id: 'device-1', selector: 'plug' });
  stateManager.setState('deviceById', 'device-2', { id: 'device-2', selector: 'sensor' });
  stateManager.setState('deviceFeatureById', VERBOSE_FEATURE_ID, { id: VERBOSE_FEATURE_ID, device_id: 'device-1' });
  stateManager.setState('deviceFeatureById', QUIET_FEATURE_ID, { id: QUIET_FEATURE_ID, device_id: 'device-1' });
  stateManager.setState('deviceFeatureById', OTHER_DEVICE_FEATURE_ID, {
    id: OTHER_DEVICE_FEATURE_ID,
    device_id: 'device-2',
  });
  stateManager.setState('deviceFeatureById', FEATURE_OF_DELETED_DEVICE_ID, {
    id: FEATURE_OF_DELETED_DEVICE_ID,
    device_id: 'deleted-device',
  });
  return stateManager;
};

describe('Device.getStatesStats', function Describe() {
  this.timeout(15000);
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });
  afterEach(() => {
    sinon.restore();
  });

  it('should count the states of the period per device and per feature, most verbose first', async () => {
    // one state per second from there: the verbose features stay within the period
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await db.duckDbBatchInsertState(VERBOSE_FEATURE_ID, buildStates(8640, threeHoursAgo));
    await db.duckDbBatchInsertState(QUIET_FEATURE_ID, buildStates(10, oneHourAgo));
    // states older than the period are not counted
    await db.duckDbBatchInsertState(QUIET_FEATURE_ID, buildStates(5000, twoDaysAgo));
    await db.duckDbBatchInsertState(OTHER_DEVICE_FEATURE_ID, buildStates(8639, threeHoursAgo));
    await db.duckDbBatchInsertState(DELETED_FEATURE_ID, buildStates(3, oneHourAgo));
    await db.duckDbBatchInsertState(FEATURE_OF_DELETED_DEVICE_ID, buildStates(2, oneHourAgo));

    const device = new Device(event, {}, buildStateManager(), {}, {}, variable, job);
    const statesStats = await device.getStatesStats();

    expect(statesStats).to.deep.equal({
      period_in_hours: 24,
      verbose_device_feature_min_states: 8640,
      // the states of deleted features and devices are still in the database
      total_states: 8640 + 10 + 8639 + 3 + 2,
      devices: [
        {
          device_id: 'device-1',
          states: 8650,
          is_verbose: true,
          features: [
            { device_feature_id: VERBOSE_FEATURE_ID, states: 8640, is_verbose: true },
            { device_feature_id: QUIET_FEATURE_ID, states: 10, is_verbose: false },
          ],
        },
        {
          device_id: 'device-2',
          states: 8639,
          is_verbose: false,
          features: [{ device_feature_id: OTHER_DEVICE_FEATURE_ID, states: 8639, is_verbose: false }],
        },
      ],
    });
  });

  it('should return empty stats when no state was saved in the period', async () => {
    const device = new Device(event, {}, buildStateManager(), {}, {}, variable, job);
    const statesStats = await device.getStatesStats();
    expect(statesStats).to.deep.equal({
      period_in_hours: 24,
      verbose_device_feature_min_states: 8640,
      total_states: 0,
      devices: [],
    });
  });

  ['America/New_York', 'Europe/Paris'].forEach((timezone) => {
    it(`should count exactly the last 24 hours with the ${timezone} timezone`, async () => {
      const setTimezone = `SET timezone = '${timezone}';`;
      await db.duckDbReadConnectionAllAsync(setTimezone);
      await db.duckDbWriteConnectionAllAsync(setTimezone);
      try {
        await db.duckDbInsertState(VERBOSE_FEATURE_ID, 1, new Date(Date.now() - 23 * 60 * 60 * 1000));
        await db.duckDbInsertState(VERBOSE_FEATURE_ID, 2, new Date(Date.now() - 25 * 60 * 60 * 1000));
        const device = new Device(event, {}, buildStateManager(), {}, {}, variable, job);
        const statesStats = await device.getStatesStats();
        expect(statesStats.total_states).to.equal(1);
      } finally {
        await db.duckDbReadConnectionAllAsync('RESET timezone;');
        await db.duckDbWriteConnectionAllAsync('RESET timezone;');
      }
    });
  });

  it('should share one count between callers asking at the same time', async () => {
    const querySpy = sinon.spy(db, 'duckDbReadConnectionAllAsync');
    const device = new Device(event, {}, buildStateManager(), {}, {}, variable, job);
    const [firstStats, secondStats] = await Promise.all([device.getStatesStats(), device.getStatesStats()]);
    sinon.assert.calledOnce(querySpy);
    expect(secondStats).to.equal(firstStats);
    expect(device.statesStatsInFlight).to.equal(null);
  });

  it('should count again after a failed count', async () => {
    const queryStub = sinon.stub(db, 'duckDbReadConnectionAllAsync');
    queryStub.onFirstCall().rejects(new Error('DuckDB error'));
    queryStub.onSecondCall().resolves([{ device_feature_id: VERBOSE_FEATURE_ID, states: 3n }]);
    const device = new Device(event, {}, buildStateManager(), {}, {}, variable, job);
    let error;
    try {
      await device.getStatesStats();
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(Error);
    expect(device.statesStatsInFlight).to.equal(null);
    expect(device.statesStatsCache).to.equal(null);
    const statesStats = await device.getStatesStats();
    expect(statesStats.total_states).to.equal(3);
  });

  it('should start the cache duration once the count is done', async () => {
    const clock = sinon.useFakeTimers({ now: 1000000, toFake: ['Date'] });
    const countDuration = 10 * 60 * 1000;
    sinon.stub(db, 'duckDbReadConnectionAllAsync').callsFake(async () => {
      clock.tick(countDuration);
      return [];
    });
    const device = new Device(event, {}, buildStateManager(), {}, {}, variable, job);
    await device.getStatesStats();
    expect(device.statesStatsCache.computedAt).to.equal(1000000 + countDuration);
  });

  it('should serve a recent result from the cache, and count again once it expired', async () => {
    const device = new Device(event, {}, buildStateManager(), {}, {}, variable, job);
    const firstStats = await device.getStatesStats();
    expect(firstStats.total_states).to.equal(0);

    await db.duckDbBatchInsertState(VERBOSE_FEATURE_ID, buildStates(3, new Date(Date.now() - 60 * 1000)));
    const querySpy = sinon.spy(db, 'duckDbReadConnectionAllAsync');
    const cachedStats = await device.getStatesStats();
    expect(cachedStats).to.equal(firstStats);
    sinon.assert.notCalled(querySpy);

    device.statesStatsCache.computedAt = Date.now() - device.STATES_STATS_CACHE_DURATION_IN_MS - 1;
    const freshStats = await device.getStatesStats();
    sinon.assert.calledOnce(querySpy);
    expect(freshStats.total_states).to.equal(3);
  });
});
