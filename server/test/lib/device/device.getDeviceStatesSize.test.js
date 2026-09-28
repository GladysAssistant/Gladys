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
const SENSOR_FEATURE_ID = 'a6e5a6ec-2f2e-4b3b-9d6a-9c4f1f1b0e11';

const buildStates = (count) =>
  Array.from({ length: count }, (value, index) => ({
    value: index,
    created_at: new Date(Date.now() - index * 1000),
  }));

const buildDevice = () => {
  const stateManager = new StateManager(event);
  stateManager.setState('device', 'plug', {
    selector: 'plug',
    features: [
      { id: POWER_FEATURE_ID, selector: 'plug-power' },
      { id: SWITCH_FEATURE_ID, selector: 'plug-switch' },
    ],
  });
  stateManager.setState('device', 'sensor', {
    selector: 'sensor',
    features: [{ id: SENSOR_FEATURE_ID, selector: 'sensor-temperature' }],
  });
  stateManager.setState('device', 'no-feature', { selector: 'no-feature' });
  return new Device(event, {}, stateManager, {}, {}, variable, job);
};

const getDatabaseSizeInBytes = async () => {
  const [{ used_bytes: usedBytes }] = await db.duckDbReadConnectionAllAsync(
    'SELECT block_size * used_blocks AS used_bytes FROM pragma_database_size() WHERE database_name = current_database()',
  );
  return Number(usedBytes);
};

describe('Device.getDeviceStatesSize', function Describe() {
  this.timeout(15000);
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });
  afterEach(() => {
    sinon.restore();
  });

  it('should return the states of each feature of the device and their share of the database size', async () => {
    await db.duckDbBatchInsertState(POWER_FEATURE_ID, buildStates(300));
    await db.duckDbBatchInsertState(SENSOR_FEATURE_ID, buildStates(100));
    const device = buildDevice();

    const statesSize = await device.getDeviceStatesSize('plug');
    const databaseSizeInBytes = await getDatabaseSizeInBytes();
    expect(statesSize).to.deep.equal({
      device_selector: 'plug',
      features: [
        {
          device_feature_selector: 'plug-power',
          states: 300,
          estimated_size_in_bytes: Math.round(0.75 * databaseSizeInBytes),
        },
        { device_feature_selector: 'plug-switch', states: 0, estimated_size_in_bytes: 0 },
      ],
    });
  });

  it('should return an empty size when the history is empty', async () => {
    const device = buildDevice();
    const statesSize = await device.getDeviceStatesSize('sensor');
    expect(statesSize).to.deep.equal({
      device_selector: 'sensor',
      features: [{ device_feature_selector: 'sensor-temperature', states: 0, estimated_size_in_bytes: 0 }],
    });
  });

  it('should return no feature for a device without features', async () => {
    const device = buildDevice();
    const statesSize = await device.getDeviceStatesSize('no-feature');
    expect(statesSize).to.deep.equal({ device_selector: 'no-feature', features: [] });
  });

  it('should reject an unknown device', async () => {
    const device = buildDevice();
    let error;
    try {
      await device.getDeviceStatesSize('unknown-device');
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(NotFoundError);
  });

  it('should count all devices in one scan, shared between callers and kept in cache', async () => {
    await db.duckDbBatchInsertState(POWER_FEATURE_ID, buildStates(3));
    await db.duckDbBatchInsertState(SENSOR_FEATURE_ID, buildStates(2));
    const querySpy = sinon.spy(db, 'duckDbReadConnectionAllAsync');
    const device = buildDevice();

    const [plugStatesSize, sensorStatesSize] = await Promise.all([
      device.getDeviceStatesSize('plug'),
      device.getDeviceStatesSize('sensor'),
    ]);
    expect(plugStatesSize.features[0].states).to.equal(3);
    expect(sensorStatesSize.features[0].states).to.equal(2);
    // one count of the states and one read of the database size
    sinon.assert.calledTwice(querySpy);
    expect(device.featuresStatesSizeInFlight).to.equal(null);

    await device.getDeviceStatesSize('plug');
    sinon.assert.calledTwice(querySpy);

    device.featuresStatesSizeCache.computedAt = Date.now() - device.FEATURES_STATES_SIZE_CACHE_DURATION_IN_MS - 1;
    await device.getDeviceStatesSize('plug');
    expect(querySpy.callCount).to.equal(4);
  });

  it('should count again after a failed count', async () => {
    const queryStub = sinon.stub(db, 'duckDbReadConnectionAllAsync');
    queryStub.onCall(0).rejects(new Error('DuckDB error'));
    queryStub.onCall(1).resolves([{ device_feature_id: SENSOR_FEATURE_ID, states: 4n }]);
    queryStub.onCall(2).resolves([{ used_bytes: 1000n }]);
    const device = buildDevice();
    let error;
    try {
      await device.getDeviceStatesSize('sensor');
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(Error);
    expect(device.featuresStatesSizeInFlight).to.equal(null);
    expect(device.featuresStatesSizeCache).to.equal(null);

    const statesSize = await device.getDeviceStatesSize('sensor');
    expect(statesSize).to.deep.equal({
      device_selector: 'sensor',
      features: [{ device_feature_selector: 'sensor-temperature', states: 4, estimated_size_in_bytes: 1000 }],
    });
  });

  it('should not show the purged states of a feature, without counting everything again', async () => {
    await db.duckDbBatchInsertState(POWER_FEATURE_ID, buildStates(5));
    await db.duckDbBatchInsertState(SENSOR_FEATURE_ID, buildStates(3));
    const device = buildDevice();
    device.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH = 1;
    expect((await device.getDeviceStatesSize('plug')).features[0].states).to.equal(5);

    await device.purgeStatesByFeatureId(POWER_FEATURE_ID);
    // a feature without any state leaves the counts as they are
    await device.purgeStatesByFeatureId(SWITCH_FEATURE_ID);

    const countSpy = sinon.spy(db, 'duckDbReadConnectionAllAsync');
    expect((await device.getDeviceStatesSize('plug')).features[0].states).to.equal(0);
    expect((await device.getDeviceStatesSize('sensor')).features[0].states).to.equal(3);
    expect(device.featuresStatesSizeCache.counts.totalStates).to.equal(3);
    sinon.assert.notCalled(countSpy);
  });

  it('should answer with a count a purge overtook, without keeping it in cache', async () => {
    const device = buildDevice();
    const queryStub = sinon.stub(db, 'duckDbReadConnectionAllAsync');
    queryStub.onCall(0).callsFake(async () => {
      // a purge ends while the states are being counted
      device.featuresStatesSizeGeneration += 1;
      return [{ device_feature_id: POWER_FEATURE_ID, states: 6n }];
    });
    queryStub.onCall(1).resolves([{ used_bytes: 600n }]);

    const statesSize = await device.getDeviceStatesSize('plug');
    expect(statesSize.features[0]).to.deep.equal({
      device_feature_selector: 'plug-power',
      states: 6,
      estimated_size_in_bytes: 600,
    });
    expect(device.featuresStatesSizeCache).to.equal(null);
  });
});
