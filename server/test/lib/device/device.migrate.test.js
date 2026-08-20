const EventEmitter = require('events');
const { assert, expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert: sinonAssert } = sinon;
const uuid = require('uuid');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');
const Job = require('../../../lib/job');
const db = require('../../../models');

const event = new EventEmitter();
const job = new Job(event);

const SEEDED_SERVICE_ID = 'a810b8db-6d04-4697-bed3-c4b72c996279';
const SEEDED_ROOM_ID = '2398c689-8b47-43cc-ad32-e98d9be098b5';
const SEEDED_USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

const buildFeature = (deviceId, name, category, type, extra = {}) => ({
  id: uuid.v4(),
  name,
  selector: name,
  external_id: name,
  category,
  type,
  read_only: false,
  has_feedback: false,
  keep_history: true,
  min: 0,
  max: 100,
  device_id: deviceId,
  ...extra,
});

const countDuckDbStates = async (featureId) => {
  const [{ count }] = await db.duckDbReadConnectionAllAsync(
    'SELECT COUNT(*) AS count FROM t_device_feature_state WHERE device_feature_id = CAST(? AS UUID)',
    featureId,
  );
  return Number(count);
};

describe('Device.migrate', () => {
  let deviceManager;
  let sceneManagerFake;
  let destinationService;
  let sourceDevice;
  let destinationDevice;
  let sourceTempFeature;
  let sourceBinaryFeature;
  let destinationTempFeature;

  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    deviceManager = new Device(event, {}, stateManager, serviceManager, {}, {}, job);
    sceneManagerFake = { update: fake.resolves(null) };
    deviceManager.sceneManager = sceneManagerFake;

    destinationService = await db.Service.create({
      name: 'migration-destination-service',
      selector: `migration-destination-service-${uuid.v4()}`,
      version: '0.1.0',
    });
    sourceDevice = await db.Device.create({
      name: 'Migration source',
      selector: 'migration-source',
      external_id: 'migration-source',
      service_id: SEEDED_SERVICE_ID,
      room_id: SEEDED_ROOM_ID,
    });
    destinationDevice = await db.Device.create({
      name: 'Migration destination',
      selector: 'migration-destination',
      external_id: 'migration-destination',
      service_id: destinationService.id,
      room_id: null,
    });
    sourceTempFeature = await db.DeviceFeature.create(
      buildFeature(sourceDevice.id, 'migration-source-temp', 'temperature-sensor', 'decimal', {
        last_value: 21,
        last_value_changed: new Date('2024-06-01T00:00:00.000Z'),
      }),
    );
    sourceBinaryFeature = await db.DeviceFeature.create(
      buildFeature(sourceDevice.id, 'migration-source-binary', 'light', 'binary', {
        energy_parent_id: sourceTempFeature.id,
      }),
    );
    destinationTempFeature = await db.DeviceFeature.create(
      buildFeature(destinationDevice.id, 'migration-destination-temp', 'temperature-sensor', 'decimal'),
    );
    await db.DeviceFeature.create(
      buildFeature(destinationDevice.id, 'migration-destination-binary', 'light', 'binary'),
    );
  });

  afterEach(async () => {
    await db.EnergyPrice.destroy({ where: { selector: 'migration-energy-price' } });
    await db.Scene.destroy({ where: { selector: ['migration-scene', 'migration-scene-untouched'] } });
    await db.Dashboard.destroy({ where: { selector: 'migration-dashboard' } });
    await db.Device.destroy({ where: { selector: ['migration-source', 'migration-destination', 'migration-child'] } });
    await db.Service.destroy({ where: { id: destinationService.id } });
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
  });

  it('should move history, rewrite scenes/dashboards, inherit room and destroy the source', async () => {
    await db.duckDbBatchInsertState(sourceTempFeature.id, [
      { value: 20, created_at: new Date('2024-01-01T00:00:00.000Z') },
      { value: 21, created_at: new Date('2024-01-02T00:00:00.000Z') },
      { value: 22, created_at: new Date('2024-01-03T00:00:00.000Z') },
    ]);
    // Unmapped source feature: its history is deleted, not moved
    await db.duckDbBatchInsertState(sourceBinaryFeature.id, [
      { value: 1, created_at: new Date('2024-01-01T00:00:00.000Z') },
    ]);
    // SQLite leftovers of a pre-DuckDB-migration install
    await db.DeviceFeatureState.create({ value: 20, device_feature_id: sourceTempFeature.id });
    await db.DeviceFeatureStateAggregate.create({ value: 20, type: 'daily', device_feature_id: sourceTempFeature.id });
    // Energy child on another device, pointing at the mapped source feature
    const childDevice = await db.Device.create({
      name: 'Migration child',
      selector: 'migration-child',
      external_id: 'migration-child',
      service_id: SEEDED_SERVICE_ID,
    });
    const childFeature = await db.DeviceFeature.create(
      buildFeature(childDevice.id, 'migration-child-power', 'switch', 'energy', {
        energy_parent_id: sourceTempFeature.id,
      }),
    );
    // Energy price contract using the source device as electric meter
    const energyPrice = await db.EnergyPrice.create({
      name: 'Migration energy price',
      selector: 'migration-energy-price',
      start_date: '2024-01-01',
      contract: 'base',
      price_type: 'consumption',
      price: 2000,
      currency: 'EUR',
      electric_meter_device_id: sourceDevice.id,
    });
    const scene = await db.Scene.create({
      name: 'Migration scene',
      selector: 'migration-scene',
      icon: 'fe fe-bell',
      actions: [
        [{ type: 'device.set-value', device_feature: 'migration-source-temp', value: 20 }],
        [
          {
            type: 'condition.if-then-else',
            if: [{ type: 'device.get-value', device_feature: 'migration-source-temp' }],
            then: [[{ type: 'light.turn-on', devices: ['migration-source'] }]],
            else: [[{ type: 'message.send-camera', camera: 'migration-source', user: 'john' }]],
          },
        ],
      ],
      triggers: [
        { type: 'device.new-state', device_feature: 'migration-source-temp', operator: '=', value: 20 },
        {
          type: 'device.new-state',
          device_features: ['migration-source-temp', 'some-other-feature'],
          operator: '=',
          value: 20,
        },
      ],
    });
    await db.Scene.create({
      name: 'Migration scene untouched',
      selector: 'migration-scene-untouched',
      icon: 'fe fe-bell',
      actions: [[{ type: 'light.turn-on', devices: ['some-other-device'] }]],
      triggers: null,
    });
    const dashboard = await db.Dashboard.create({
      name: 'Migration dashboard',
      selector: 'migration-dashboard',
      user_id: SEEDED_USER_ID,
      type: 'main',
      visibility: 'private',
      // legacy column shape on purpose: creation normalizes it to sections,
      // and the migration must rewrite inside the section shape
      boxes: [
        [
          {
            type: 'chart',
            device_features: ['migration-source-temp', 'some-other-feature'],
            device_feature_names: ['My temp', 'Other'],
            title: 'Temp',
          },
          { type: 'devices', device_features: ['migration-source-binary'] },
          {
            type: 'chips',
            chips: [{ chip_type: 'device-feature', device_feature: 'migration-source-temp' }],
          },
          {
            type: 'house-view',
            image: 'gallery:house-solar',
            pins: [{ x_pct: 10, y_pct: 20, device_feature: 'migration-source-temp' }],
          },
          {
            type: 'scene',
            scenes: ['some-scene'],
            scene_status_features: { 'some-scene': 'migration-source-temp' },
          },
          {
            type: 'actions',
            actions: [{ action_type: 'device-feature', device_feature: 'migration-source-temp', value: 1 }],
          },
        ],
      ],
    });

    const result = await deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
      features_mapping: { 'migration-source-temp': 'migration-destination-temp' },
    });

    expect(result).to.deep.equal({
      success: true,
      duck_db_states_migrated: 3,
      scenes_updated: ['migration-scene'],
      dashboards_updated: ['migration-dashboard'],
    });
    // History moved to the destination feature, none left on the source
    expect(await countDuckDbStates(destinationTempFeature.id)).to.equal(3);
    expect(await countDuckDbStates(sourceTempFeature.id)).to.equal(0);
    expect(await countDuckDbStates(sourceBinaryFeature.id)).to.equal(0);
    // SQLite leftovers deleted
    expect(await db.DeviceFeatureState.count({ where: { device_feature_id: sourceTempFeature.id } })).to.equal(0);
    expect(await db.DeviceFeatureStateAggregate.count({ where: { device_feature_id: sourceTempFeature.id } })).to.equal(
      0,
    );
    // Source device destroyed
    expect(await db.Device.findOne({ where: { selector: 'migration-source' } })).to.equal(null);
    // Destination inherited the source's room
    const refreshedDestination = await db.Device.findOne({ where: { id: destinationDevice.id } });
    expect(refreshedDestination.room_id).to.equal(SEEDED_ROOM_ID);
    expect(deviceManager.stateManager.get('device', 'migration-destination').room_id).to.equal(SEEDED_ROOM_ID);
    // Last value copied (destination had none)
    const refreshedFeature = await db.DeviceFeature.findOne({ where: { id: destinationTempFeature.id } });
    expect(refreshedFeature.last_value).to.equal(21);
    expect(new Date(refreshedFeature.last_value_changed).toISOString()).to.equal('2024-06-01T00:00:00.000Z');
    // Energy child re-pointed to the destination feature
    const refreshedChild = await db.DeviceFeature.findOne({ where: { id: childFeature.id } });
    expect(refreshedChild.energy_parent_id).to.equal(destinationTempFeature.id);
    // Energy price contract re-pointed to the destination device
    const refreshedEnergyPrice = await db.EnergyPrice.findOne({ where: { id: energyPrice.id } });
    expect(refreshedEnergyPrice.electric_meter_device_id).to.equal(destinationDevice.id);
    // Scene rewritten through the scene manager (RAM resync path)
    sinonAssert.calledOnceWithExactly(sceneManagerFake.update, 'migration-scene', {
      actions: [
        [{ type: 'device.set-value', device_feature: 'migration-destination-temp', value: 20 }],
        [
          {
            type: 'condition.if-then-else',
            if: [{ type: 'device.get-value', device_feature: 'migration-destination-temp' }],
            then: [[{ type: 'light.turn-on', devices: ['migration-destination'] }]],
            else: [[{ type: 'message.send-camera', camera: 'migration-destination', user: 'john' }]],
          },
        ],
      ],
      triggers: [
        { type: 'device.new-state', device_feature: 'migration-destination-temp', operator: '=', value: 20 },
        {
          type: 'device.new-state',
          device_features: ['migration-destination-temp', 'some-other-feature'],
          operator: '=',
          value: 20,
        },
      ],
    });
    // Dashboard rewritten in DB inside the normalized section shape,
    // positional companion arrays untouched
    const refreshedDashboard = await db.Dashboard.findOne({ where: { id: dashboard.id } });
    expect(refreshedDashboard.boxes).to.deep.equal([
      {
        columns: [
          [
            {
              type: 'chart',
              device_features: ['migration-destination-temp', 'some-other-feature'],
              device_feature_names: ['My temp', 'Other'],
              title: 'Temp',
            },
            { type: 'devices', device_features: ['migration-source-binary'] },
            {
              type: 'chips',
              chips: [{ chip_type: 'device-feature', device_feature: 'migration-destination-temp' }],
            },
            {
              type: 'house-view',
              image: 'gallery:house-solar',
              pins: [{ x_pct: 10, y_pct: 20, device_feature: 'migration-destination-temp' }],
            },
            {
              type: 'scene',
              scenes: ['some-scene'],
              scene_status_features: { 'some-scene': 'migration-destination-temp' },
            },
            {
              type: 'actions',
              actions: [{ action_type: 'device-feature', device_feature: 'migration-destination-temp', value: 1 }],
            },
          ],
        ],
      },
    ]);
    // Scene in DB untouched by the migration itself (the fake scene manager owns persistence)
    const untouchedScene = await db.Scene.findOne({ where: { id: scene.id } });
    expect(untouchedScene.selector).to.equal('migration-scene');
  });

  it('should only move states older than the destination oldest state', async () => {
    await db.Device.update({ room_id: SEEDED_ROOM_ID }, { where: { id: destinationDevice.id } });
    await db.DeviceFeature.update(
      { last_value: 25, last_value_changed: new Date('2025-01-01T00:00:00.000Z') },
      { where: { id: destinationTempFeature.id } },
    );
    // The source binary feature has no last_value_changed: nothing must be copied
    await db.DeviceFeature.update({ last_value: 1 }, { where: { selector: 'migration-destination-binary' } });
    await db.duckDbBatchInsertState(sourceTempFeature.id, [
      { value: 20, created_at: new Date('2024-01-01T00:00:00.000Z') },
      { value: 21, created_at: new Date('2024-03-01T00:00:00.000Z') },
      { value: 22, created_at: new Date('2024-05-01T00:00:00.000Z') },
    ]);
    await db.duckDbBatchInsertState(destinationTempFeature.id, [
      { value: 30, created_at: new Date('2024-02-01T00:00:00.000Z') },
      { value: 31, created_at: new Date('2024-04-01T00:00:00.000Z') },
    ]);

    const result = await deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
      features_mapping: {
        'migration-source-temp': 'migration-destination-temp',
        'migration-source-binary': 'migration-destination-binary',
      },
    });

    // Only the state older than 2024-02-01 moved; overlap states deleted
    expect(result.duck_db_states_migrated).to.equal(1);
    expect(await countDuckDbStates(destinationTempFeature.id)).to.equal(3);
    expect(await countDuckDbStates(sourceTempFeature.id)).to.equal(0);
    // Destination is fresher: last value not overwritten
    const refreshedFeature = await db.DeviceFeature.findOne({ where: { id: destinationTempFeature.id } });
    expect(refreshedFeature.last_value).to.equal(25);
    // Source binary has no last_value_changed: destination binary untouched
    const refreshedBinary = await db.DeviceFeature.findOne({ where: { selector: 'migration-destination-binary' } });
    expect(refreshedBinary.last_value).to.equal(1);
    // Destination already had a room: kept
    const refreshedDestination = await db.Device.findOne({ where: { id: destinationDevice.id } });
    expect(refreshedDestination.room_id).to.equal(SEEDED_ROOM_ID);
    sinonAssert.notCalled(sceneManagerFake.update);
  });

  it('should move the whole history in slices, with one cutoff per feature', async () => {
    // One state per month on the source features
    const sourceTempStates = [...Array(12)].map((value, month) => ({
      value: 20 + month,
      created_at: new Date(Date.UTC(2024, month, 1)),
    }));
    const sourceBinaryStates = [...Array(12)].map((value, month) => ({
      value: month % 2,
      created_at: new Date(Date.UTC(2024, month, 15)),
    }));
    await db.duckDbBatchInsertState(sourceTempFeature.id, sourceTempStates);
    await db.duckDbBatchInsertState(sourceBinaryFeature.id, sourceBinaryStates);
    // The two destination features have their own cutoff: the temperature one already has
    // history since July, the binary one has none and takes everything.
    await db.duckDbBatchInsertState(destinationTempFeature.id, [
      { value: 30, created_at: new Date(Date.UTC(2024, 6, 1)) },
    ]);
    const destinationBinaryFeature = await db.DeviceFeature.findOne({
      where: { selector: 'migration-destination-binary' },
    });
    // Small enough to force one slice per state: the slice bounds, the first slice
    // (no lower bound) and the last one (no upper bound) are all exercised.
    deviceManager.DUCKDB_STATES_MIGRATE_STATES_PER_SLICE = 1;
    deviceManager.DUCKDB_STATES_MIGRATE_MIN_PAUSE_IN_MS = 0;
    deviceManager.DUCKDB_STATES_MIGRATE_PAUSE_FACTOR = 0;

    const result = await deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
      features_mapping: {
        'migration-source-temp': 'migration-destination-temp',
        'migration-source-binary': 'migration-destination-binary',
      },
    });

    // 6 temperature states before July + the 12 binary states
    expect(result.duck_db_states_migrated).to.equal(18);
    expect(await countDuckDbStates(destinationTempFeature.id)).to.equal(7);
    expect(await countDuckDbStates(destinationBinaryFeature.id)).to.equal(12);
    expect(await countDuckDbStates(sourceTempFeature.id)).to.equal(0);
    expect(await countDuckDbStates(sourceBinaryFeature.id)).to.equal(0);
    // The moved values are the right ones, in the right order
    const movedStates = await db.duckDbReadConnectionAllAsync(
      'SELECT value FROM t_device_feature_state WHERE device_feature_id = CAST(? AS UUID) ORDER BY created_at',
      destinationTempFeature.id,
    );
    expect(movedStates.map((state) => state.value)).to.deep.equal([20, 21, 22, 23, 24, 25, 30]);
    // The job reports how many states were moved, live
    const migrationJob = await db.Job.findOne({ where: { type: 'device-migrate' }, order: [['created_at', 'DESC']] });
    expect(migrationJob.data.states_migrated).to.equal(18);
  });

  it('should cap each statement when every state shares the same timestamp', async () => {
    // Degenerate history: no time spread at all, so the time slices cannot split anything
    // and everything falls into the last (unbounded) slice. The cardinality cap is then
    // the only thing keeping a statement small.
    const sameDate = new Date('2024-01-01T00:00:00.000Z');
    await db.duckDbBatchInsertState(
      sourceTempFeature.id,
      [...Array(20)].map(() => ({ value: 20, created_at: sameDate })),
    );
    // Unmapped feature on the same timestamp: its history is deleted, not moved, so the
    // capped DELETE has to repeat too, not only the capped UPDATE.
    await db.duckDbBatchInsertState(
      sourceBinaryFeature.id,
      [...Array(11)].map(() => ({ value: 1, created_at: sameDate })),
    );
    const CAP = 3;
    deviceManager.DUCKDB_STATES_MIGRATE_STATES_PER_SLICE = CAP;
    deviceManager.DUCKDB_STATES_MIGRATE_MIN_PAUSE_IN_MS = 0;
    deviceManager.DUCKDB_STATES_MIGRATE_PAUSE_FACTOR = 0;
    // Assert the property rather than the SQL text: no single write statement may report
    // more than CAP affected rows. Final counts alone would also pass uncapped.
    const realWrite = db.duckDbWriteConnectionAllAsync;
    const affectedRowCounts = [];
    db.duckDbWriteConnectionAllAsync = async (query, ...params) => {
      const result = await realWrite(query, ...params);
      if (result && result[0] && result[0].Count !== undefined) {
        affectedRowCounts.push({ query, count: Number(result[0].Count) });
      }
      return result;
    };

    let result;
    try {
      result = await deviceManager.migrate('migration-source', {
        destination_device_selector: 'migration-destination',
        features_mapping: { 'migration-source-temp': 'migration-destination-temp' },
      });
    } finally {
      db.duckDbWriteConnectionAllAsync = realWrite;
    }

    expect(result.duck_db_states_migrated).to.equal(20);
    expect(await countDuckDbStates(destinationTempFeature.id)).to.equal(20);
    expect(await countDuckDbStates(sourceTempFeature.id)).to.equal(0);
    expect(await countDuckDbStates(sourceBinaryFeature.id)).to.equal(0);
    // Both write paths had to repeat, and none of them ever exceeded the cap
    const updates = affectedRowCounts.filter((statement) => statement.query.includes('UPDATE'));
    const deletes = affectedRowCounts.filter((statement) => statement.query.includes('DELETE'));
    expect(updates.filter((statement) => statement.count === CAP).length).to.be.at.least(6);
    expect(deletes.filter((statement) => statement.count === CAP).length).to.be.at.least(3);
    expect(Math.max(...affectedRowCounts.map((statement) => statement.count))).to.equal(CAP);
  });

  it('should move a state published by the source device while the last slice was draining', async () => {
    await db.duckDbBatchInsertState(sourceTempFeature.id, [
      { value: 20, created_at: new Date('2024-01-01T00:00:00.000Z') },
      { value: 21, created_at: new Date('2024-06-01T00:00:00.000Z') },
      { value: 22, created_at: new Date('2024-12-01T00:00:00.000Z') },
    ]);
    deviceManager.DUCKDB_STATES_MIGRATE_STATES_PER_SLICE = 1;
    deviceManager.DUCKDB_STATES_MIGRATE_MIN_PAUSE_IN_MS = 0;
    deviceManager.DUCKDB_STATES_MIGRATE_PAUSE_FACTOR = 0;
    // The old integration is still polling: a state lands after the last slice was
    // drained. The destination feature has no history, so the mapping asks to keep it.
    const realUpdateProgress = deviceManager.job.updateProgress.bind(deviceManager.job);
    let lateStateWritten = false;
    deviceManager.job.updateProgress = async (...args) => {
      const returnedValue = await realUpdateProgress(...args);
      if (!lateStateWritten && args[1] === 40) {
        lateStateWritten = true;
        await db.duckDbBatchInsertState(sourceTempFeature.id, [
          { value: 99, created_at: new Date('2025-01-01T00:00:00.000Z') },
        ]);
      }
      return returnedValue;
    };

    let result;
    try {
      result = await deviceManager.migrate('migration-source', {
        destination_device_selector: 'migration-destination',
        features_mapping: { 'migration-source-temp': 'migration-destination-temp' },
      });
    } finally {
      deviceManager.job.updateProgress = realUpdateProgress;
    }

    expect(lateStateWritten).to.equal(true);
    // Moved, not deleted, and counted
    expect(result.duck_db_states_migrated).to.equal(4);
    expect(await countDuckDbStates(destinationTempFeature.id)).to.equal(4);
    expect(await countDuckDbStates(sourceTempFeature.id)).to.equal(0);
    const movedStates = await db.duckDbReadConnectionAllAsync(
      'SELECT value FROM t_device_feature_state WHERE device_feature_id = CAST(? AS UUID) ORDER BY created_at',
      destinationTempFeature.id,
    );
    expect(movedStates.map((state) => state.value)).to.deep.equal([20, 21, 22, 99]);
  });

  it('should sweep a state back-dated into an already processed slice', async () => {
    await db.duckDbBatchInsertState(sourceTempFeature.id, [
      { value: 20, created_at: new Date('2024-01-01T00:00:00.000Z') },
      { value: 21, created_at: new Date('2024-06-01T00:00:00.000Z') },
      { value: 22, created_at: new Date('2024-12-01T00:00:00.000Z') },
    ]);
    deviceManager.DUCKDB_STATES_MIGRATE_STATES_PER_SLICE = 1;
    deviceManager.DUCKDB_STATES_MIGRATE_MIN_PAUSE_IN_MS = 0;
    deviceManager.DUCKDB_STATES_MIGRATE_PAUSE_FACTOR = 0;
    // The point of the sweep: `destroy` refuses to delete a device that still has states,
    // and it counts them before the migration gets a chance to clean up. Zero tolerance
    // here, so a single state left behind fails the migration instead of passing silently.
    deviceManager.MAX_NUMBER_OF_STATES_ALLOWED_TO_DELETE_DEVICE = 0;
    // The source device is still alive while the migration runs: simulate a state written
    // with a past timestamp, right after the slice covering that timestamp was processed.
    const realUpdateProgress = deviceManager.job.updateProgress.bind(deviceManager.job);
    let backDatedStateWritten = false;
    deviceManager.job.updateProgress = async (...args) => {
      const returnedValue = await realUpdateProgress(...args);
      if (!backDatedStateWritten && args[1] > 5) {
        backDatedStateWritten = true;
        await db.duckDbBatchInsertState(sourceTempFeature.id, [
          { value: 99, created_at: new Date('2024-01-01T12:00:00.000Z') },
        ]);
      }
      return returnedValue;
    };

    try {
      await deviceManager.migrate('migration-source', {
        destination_device_selector: 'migration-destination',
        features_mapping: { 'migration-source-temp': 'migration-destination-temp' },
      });
    } finally {
      deviceManager.job.updateProgress = realUpdateProgress;
    }

    expect(backDatedStateWritten).to.equal(true);
    // The back-dated state is dropped, not moved, but nothing is left on the source: the
    // destroy at the end of the migration would refuse to run otherwise.
    expect(await countDuckDbStates(sourceTempFeature.id)).to.equal(0);
    expect(await countDuckDbStates(destinationTempFeature.id)).to.equal(3);
    expect(await db.Device.findOne({ where: { selector: 'migration-source' } })).to.equal(null);
  });

  it('should delete the whole history when nothing is mapped', async () => {
    // "Migrate without history": the user maps no feature at all, the source history is
    // dropped rather than moved, and no UPDATE is ever built.
    await db.duckDbBatchInsertState(sourceTempFeature.id, [
      { value: 20, created_at: new Date('2024-01-01T00:00:00.000Z') },
      { value: 21, created_at: new Date('2024-02-01T00:00:00.000Z') },
    ]);
    deviceManager.DUCKDB_STATES_MIGRATE_MIN_PAUSE_IN_MS = 0;

    const result = await deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
      features_mapping: {},
    });

    expect(result.duck_db_states_migrated).to.equal(0);
    expect(await countDuckDbStates(sourceTempFeature.id)).to.equal(0);
    expect(await countDuckDbStates(destinationTempFeature.id)).to.equal(0);
    expect(await db.Device.findOne({ where: { selector: 'migration-source' } })).to.equal(null);
  });

  it('should report a zero count when the mapped features have no history', async () => {
    const result = await deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
      features_mapping: { 'migration-source-temp': 'migration-destination-temp' },
    });

    expect(result.duck_db_states_migrated).to.equal(0);
    // The count is published up front, so the jobs page shows "0 states moved" rather
    // than nothing at all when the history move returns early.
    const migrationJob = await db.Job.findOne({ where: { type: 'device-migrate' }, order: [['created_at', 'DESC']] });
    expect(migrationJob.data.states_migrated).to.equal(0);
  });

  it('should migrate a device without features and with an empty mapping', async () => {
    await db.DeviceFeature.destroy({ where: { device_id: sourceDevice.id } });
    const result = await deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
    });
    expect(result).to.deep.equal({
      success: true,
      duck_db_states_migrated: 0,
      scenes_updated: [],
      dashboards_updated: [],
    });
    expect(await db.Device.findOne({ where: { selector: 'migration-source' } })).to.equal(null);
    // The in-flight guard must be released after a successful run
    expect(deviceManager.migrationsInProgress.size).to.equal(0);
  });

  it('should reject when destination_device_selector is missing', async () => {
    const promise = deviceManager.migrate('migration-source', {});
    await assert.isRejected(promise, 'destination_device_selector is required');
    // The in-flight guard must be released even after a failed run
    expect(deviceManager.migrationsInProgress.size).to.equal(0);
  });

  it('should reject a concurrent migration of the same source device', async () => {
    deviceManager.migrationsInProgress.add('migration-source');
    const promise = deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
    });
    await assert.isRejected(promise, 'A migration is already in progress for device migration-source');
  });

  it('should reject a concurrent migration towards the same destination device', async () => {
    // Another migration is running towards this destination: its feature
    // snapshot would go stale if a second one started
    deviceManager.migrationsInProgress.add('migration-destination');
    const promise = deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
    });
    await assert.isRejected(promise, 'A migration is already in progress for device migration-destination');
  });

  it('should reject when the source device does not exist', async () => {
    const promise = deviceManager.migrate('does-not-exist', {
      destination_device_selector: 'migration-destination',
    });
    await assert.isRejected(promise, 'Device not found');
  });

  it('should reject when the destination device does not exist', async () => {
    const promise = deviceManager.migrate('migration-source', {
      destination_device_selector: 'does-not-exist',
    });
    await assert.isRejected(promise, 'Destination device not found');
  });

  it('should reject when source and destination are the same device', async () => {
    const promise = deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-source',
    });
    await assert.isRejected(promise, 'Source and destination devices must be different');
  });

  it('should reject when the destination belongs to the same service', async () => {
    await db.Device.update({ service_id: SEEDED_SERVICE_ID }, { where: { id: destinationDevice.id } });
    const promise = deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
    });
    await assert.isRejected(promise, 'Destination device must belong to another service');
  });

  it('should reject when a mapping key is not a source feature', async () => {
    const promise = deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
      features_mapping: { 'not-a-source-feature': 'migration-destination-temp' },
    });
    await assert.isRejected(promise, 'Feature not-a-source-feature does not belong to device migration-source');
  });

  it('should reject when a mapping value is not a destination feature', async () => {
    const promise = deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
      features_mapping: { 'migration-source-temp': 'not-a-destination-feature' },
    });
    await assert.isRejected(
      promise,
      'Feature not-a-destination-feature does not belong to device migration-destination',
    );
  });

  it('should reject when a destination feature is used twice', async () => {
    const promise = deviceManager.migrate('migration-source', {
      destination_device_selector: 'migration-destination',
      features_mapping: {
        'migration-source-temp': 'migration-destination-temp',
        'migration-source-binary': 'migration-destination-temp',
      },
    });
    await assert.isRejected(promise, 'Feature migration-destination-temp is used twice as a destination');
  });
});
