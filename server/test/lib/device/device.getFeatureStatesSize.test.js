const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const db = require('../../../models');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const { NotFoundError } = require('../../../utils/coreErrors');

const event = new EventEmitter();
const job = new Job(event);

const variable = {
  getValue: fake.resolves(null),
};

const POWER_FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';
const SWITCH_FEATURE_ID = 'ce9dc798-b09f-4e51-8c16-311cdebf97cd';
const EMPTY_FEATURE_ID = 'a6e5a6ec-2f2e-4b3b-9d6a-9c4f1f1b0e11';

const buildStates = (count) =>
  Array.from({ length: count }, (value, index) => ({
    value: index,
    created_at: new Date(Date.now() - index * 1000),
  }));

const buildDevice = () => {
  const stateManager = new StateManager(event);
  stateManager.setState('deviceFeature', 'plug-power', { id: POWER_FEATURE_ID, selector: 'plug-power' });
  stateManager.setState('deviceFeature', 'plug-switch', { id: SWITCH_FEATURE_ID, selector: 'plug-switch' });
  stateManager.setState('deviceFeature', 'plug-empty', { id: EMPTY_FEATURE_ID, selector: 'plug-empty' });
  return new Device(event, {}, stateManager, {}, {}, variable, job);
};

const getDatabaseSizeInBytes = async () => {
  const [{ used_bytes: usedBytes }] = await db.duckDbReadConnectionAllAsync(
    'SELECT block_size * used_blocks AS used_bytes FROM pragma_database_size() WHERE database_name = current_database()',
  );
  return Number(usedBytes);
};

describe('Device.getFeatureStatesSize', function Describe() {
  this.timeout(15000);
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });
  afterEach(() => {
    sinon.restore();
  });

  it('should return the states of the feature and its share of the database size', async () => {
    await db.duckDbBatchInsertState(POWER_FEATURE_ID, buildStates(300));
    await db.duckDbBatchInsertState(SWITCH_FEATURE_ID, buildStates(100));
    const device = buildDevice();

    const powerStatesSize = await device.getFeatureStatesSize('plug-power');
    const databaseSizeInBytes = await getDatabaseSizeInBytes();
    expect(powerStatesSize).to.deep.equal({
      device_feature_selector: 'plug-power',
      states: 300,
      estimated_size_in_bytes: Math.round(0.75 * databaseSizeInBytes),
    });

    const emptyStatesSize = await device.getFeatureStatesSize('plug-empty');
    expect(emptyStatesSize).to.deep.equal({
      device_feature_selector: 'plug-empty',
      states: 0,
      estimated_size_in_bytes: 0,
    });
  });

  it('should return an empty size when the history is empty', async () => {
    const device = buildDevice();
    const statesSize = await device.getFeatureStatesSize('plug-power');
    expect(statesSize).to.deep.equal({
      device_feature_selector: 'plug-power',
      states: 0,
      estimated_size_in_bytes: 0,
    });
  });

  it('should reject an unknown feature', async () => {
    const device = buildDevice();
    let error;
    try {
      await device.getFeatureStatesSize('unknown-feature');
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(NotFoundError);
  });

  it('should count all features in one scan, shared between callers and kept in cache', async () => {
    await db.duckDbBatchInsertState(POWER_FEATURE_ID, buildStates(3));
    const querySpy = sinon.spy(db, 'duckDbReadConnectionAllAsync');
    const device = buildDevice();

    const [powerStatesSize, switchStatesSize] = await Promise.all([
      device.getFeatureStatesSize('plug-power'),
      device.getFeatureStatesSize('plug-switch'),
    ]);
    expect(powerStatesSize.states).to.equal(3);
    expect(switchStatesSize.states).to.equal(0);
    // one count of the states and one read of the database size
    sinon.assert.calledTwice(querySpy);
    expect(device.featuresStatesSizeInFlight).to.equal(null);

    await device.getFeatureStatesSize('plug-power');
    sinon.assert.calledTwice(querySpy);

    device.featuresStatesSizeCache.computedAt = Date.now() - device.FEATURES_STATES_SIZE_CACHE_DURATION_IN_MS - 1;
    await device.getFeatureStatesSize('plug-power');
    expect(querySpy.callCount).to.equal(4);
  });

  it('should count again after a failed count', async () => {
    const queryStub = sinon.stub(db, 'duckDbReadConnectionAllAsync');
    queryStub.onCall(0).rejects(new Error('DuckDB error'));
    queryStub.onCall(1).resolves([{ device_feature_id: POWER_FEATURE_ID, states: 4n }]);
    queryStub.onCall(2).resolves([{ used_bytes: 1000n }]);
    const device = buildDevice();
    let error;
    try {
      await device.getFeatureStatesSize('plug-power');
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(Error);
    expect(device.featuresStatesSizeInFlight).to.equal(null);
    expect(device.featuresStatesSizeCache).to.equal(null);

    const statesSize = await device.getFeatureStatesSize('plug-power');
    expect(statesSize).to.deep.equal({
      device_feature_selector: 'plug-power',
      states: 4,
      estimated_size_in_bytes: 1000,
    });
  });

  it('should not show the purged states of a feature', async () => {
    await db.duckDbBatchInsertState(POWER_FEATURE_ID, buildStates(5));
    const device = buildDevice();
    device.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH = 1;
    expect((await device.getFeatureStatesSize('plug-power')).states).to.equal(5);

    await device.purgeStatesByFeatureId(POWER_FEATURE_ID);

    expect(device.featuresStatesSizeCache).to.equal(null);
    expect((await device.getFeatureStatesSize('plug-power')).states).to.equal(0);
  });
});
