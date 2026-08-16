const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const Device = require('../../../lib/device');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const DOOR_FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
const WINDOW_FEATURE_ID = 'ce9dc798-b09f-4e51-8c16-311cdebf97cd';
const NEVER_REPORTED_FEATURE_ID = 'bb1af3b9-f87d-4d9c-b5be-958cd9d28900';

const ONE_MINUTE_IN_MS = 60 * 1000;
const ONE_DAY_IN_MS = 24 * 60 * ONE_MINUTE_IN_MS;

describe('Device.getLastStateChanges', function Describe() {
  this.timeout(15000);

  let deviceInstance;
  let now;
  let deviceFeaturesBySelector;

  const minutesAgo = (minutes) => new Date(now.getTime() - minutes * ONE_MINUTE_IN_MS);
  const daysAgo = (days) => new Date(now.getTime() - days * ONE_DAY_IN_MS);

  beforeEach(async () => {
    now = new Date();
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    deviceFeaturesBySelector = {
      door: {
        id: DOOR_FEATURE_ID,
        keep_history: true,
        last_value_changed: minutesAgo(1),
      },
      window: {
        id: WINDOW_FEATURE_ID,
        keep_history: true,
        last_value_changed: daysAgo(2),
      },
      'no-history': {
        id: NEVER_REPORTED_FEATURE_ID,
        keep_history: false,
        last_value_changed: minutesAgo(1),
      },
    };
    const stateManager = {
      get: (entity, selector) => deviceFeaturesBySelector[selector] || null,
    };
    const variable = {
      getValue: fake.resolves(null),
    };
    deviceInstance = new Device(event, {}, stateManager, {}, {}, variable, job);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should return an empty object when no selector is given', async () => {
    const lastStateChanges = await deviceInstance.getLastStateChanges([]);
    expect(lastStateChanges).to.deep.equal({});
  });

  it('should ignore unknown features and features without history', async () => {
    const lastStateChanges = await deviceInstance.getLastStateChanges(['unknown-feature', 'no-history']);
    expect(lastStateChanges).to.deep.equal({});
  });

  it('should return the date of the last value change, not the date of the last state report', async () => {
    await db.duckDbBatchInsertState(DOOR_FEATURE_ID, [
      { value: 0, created_at: minutesAgo(50) },
      // The sensor re-published the same value: this is not a state change
      { value: 0, created_at: minutesAgo(40) },
      { value: 1, created_at: minutesAgo(30) },
      { value: 1, created_at: minutesAgo(20) },
    ]);
    const lastStateChanges = await deviceInstance.getLastStateChanges(['door']);
    expect(lastStateChanges).to.deep.equal({ door: minutesAgo(30) });
  });

  it('should return the last change of each requested feature', async () => {
    await db.duckDbBatchInsertState(DOOR_FEATURE_ID, [
      { value: 0, created_at: minutesAgo(50) },
      { value: 1, created_at: minutesAgo(30) },
    ]);
    await db.duckDbBatchInsertState(WINDOW_FEATURE_ID, [
      { value: 1, created_at: minutesAgo(45) },
      { value: 0, created_at: minutesAgo(10) },
    ]);
    const lastStateChanges = await deviceInstance.getLastStateChanges(['door', 'window']);
    expect(lastStateChanges).to.deep.equal({
      door: minutesAgo(30),
      window: minutesAgo(10),
    });
  });

  it('should widen the search window until the change is found', async () => {
    await db.duckDbBatchInsertState(DOOR_FEATURE_ID, [
      { value: 0, created_at: daysAgo(60) },
      { value: 1, created_at: daysAgo(40) },
      { value: 1, created_at: minutesAgo(5) },
    ]);
    const lastStateChanges = await deviceInstance.getLastStateChanges(['door']);
    expect(lastStateChanges).to.deep.equal({ door: daysAgo(40) });
  });

  it('should find a change older than the widest bounded window', async () => {
    await db.duckDbBatchInsertState(DOOR_FEATURE_ID, [
      { value: 0, created_at: daysAgo(500) },
      { value: 1, created_at: daysAgo(400) },
    ]);
    const lastStateChanges = await deviceInstance.getLastStateChanges(['door']);
    expect(lastStateChanges).to.deep.equal({ door: daysAgo(400) });
  });

  it('should return null when the value never changed', async () => {
    await db.duckDbBatchInsertState(DOOR_FEATURE_ID, [
      { value: 1, created_at: minutesAgo(50) },
      { value: 1, created_at: minutesAgo(10) },
    ]);
    const lastStateChanges = await deviceInstance.getLastStateChanges(['door']);
    expect(lastStateChanges).to.deep.equal({ door: null });
  });

  it('should return null when the feature has no state at all', async () => {
    const lastStateChanges = await deviceInstance.getLastStateChanges(['door']);
    expect(lastStateChanges).to.deep.equal({ door: null });
  });

  it('should anchor the search on now when no feature ever reported a value', async () => {
    deviceFeaturesBySelector.door.last_value_changed = null;
    await db.duckDbBatchInsertState(DOOR_FEATURE_ID, [
      { value: 0, created_at: minutesAgo(50) },
      { value: 1, created_at: minutesAgo(20) },
    ]);
    const lastStateChanges = await deviceInstance.getLastStateChanges(['door']);
    expect(lastStateChanges).to.deep.equal({ door: minutesAgo(20) });
  });

  it('should anchor the search on now when the most recent activity is in the future', async () => {
    deviceFeaturesBySelector.door.last_value_changed = new Date(now.getTime() + ONE_DAY_IN_MS);
    await db.duckDbBatchInsertState(DOOR_FEATURE_ID, [
      { value: 0, created_at: minutesAgo(50) },
      { value: 1, created_at: minutesAgo(20) },
    ]);
    const lastStateChanges = await deviceInstance.getLastStateChanges(['door']);
    expect(lastStateChanges).to.deep.equal({ door: minutesAgo(20) });
  });
});
