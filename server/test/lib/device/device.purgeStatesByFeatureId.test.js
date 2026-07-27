const { expect } = require('chai');
const EventEmitter = require('events');
const uuid = require('uuid');

const Device = require('../../../lib/device');
const db = require('../../../models');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');
const { JOB_TYPES } = require('../../../utils/constants');

const event = new EventEmitter();

const DEVICE_FEATURE_ID = 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4';

describe('device.purgeStatesByFeatureId', async function Describe() {
  this.timeout(5000);
  beforeEach(async () => {
    await db.duckDbWriteConnectionAllAsync('DELETE FROM t_device_feature_state');
    // States live in DuckDB since the migration
    const duckDbStatesToInsert = [];
    for (let i = 1; i <= 110; i += 1) {
      duckDbStatesToInsert.push({ value: i, created_at: new Date() });
    }
    await db.duckDbBatchInsertState(DEVICE_FEATURE_ID, duckDbStatesToInsert);
    // SQLite states are leftovers of an installation which has not run the migration yet
    const queryInterface = db.sequelize.getQueryInterface();
    const sqliteStatesToInsert = [];
    for (let i = 1; i <= 5; i += 1) {
      const date = new Date();
      sqliteStatesToInsert.push({
        id: uuid.v4(),
        device_feature_id: DEVICE_FEATURE_ID,
        value: i,
        created_at: date,
        updated_at: date,
      });
    }
    await queryInterface.bulkInsert('t_device_feature_state', sqliteStatesToInsert);
    await db.DeviceFeatureStateAggregate.create({
      type: 'daily',
      device_feature_id: DEVICE_FEATURE_ID,
      value: 12,
    });
    await db.DeviceFeatureStateAggregate.create({
      type: 'hourly',
      device_feature_id: DEVICE_FEATURE_ID,
      value: 12,
    });
    await db.DeviceFeatureStateAggregate.create({
      type: 'monthly',
      device_feature_id: DEVICE_FEATURE_ID,
      value: 12,
    });
  });
  it('should purge DuckDB states, SQLite leftover states and aggregates of a feature', async () => {
    const stateManager = new StateManager(event);
    const service = {};
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    device.STATES_TO_PURGE_PER_DEVICE_FEATURE_CLEAN_BATCH = 1;
    device.WAIT_TIME_BETWEEN_DEVICE_FEATURE_CLEAN_BATCH = 1;
    // Below this threshold the delete is a single statement: lower it so this
    // test exercises the time-sliced path
    device.DUCKDB_STATES_PURGE_SINGLE_DELETE_THRESHOLD = 10;
    const res = await device.purgeStatesByFeatureId(DEVICE_FEATURE_ID);
    expect(res).to.deep.equal({
      numberOfDeviceFeatureStateToDelete: 115,
      numberOfDeviceFeatureStateAggregateToDelete: 3,
    });
    const duckDbStates = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
      DEVICE_FEATURE_ID,
    );
    expect(duckDbStates).to.have.lengthOf(0);
    const states = await db.DeviceFeatureState.findAll({
      where: {
        device_feature_id: DEVICE_FEATURE_ID,
      },
    });
    expect(states).to.have.lengthOf(0);
    const statesAggregates = await db.DeviceFeatureStateAggregate.findAll({
      where: {
        device_feature_id: DEVICE_FEATURE_ID,
      },
    });
    expect(statesAggregates).to.have.lengthOf(0);
    // The job carries structured facts (displayed and translated by the front)
    const jobRecord = await db.Job.findOne({
      where: { type: JOB_TYPES.DEVICE_STATES_PURGE_SINGLE_FEATURE },
      order: [['created_at', 'DESC']],
    });
    expect(jobRecord.data).to.deep.equal({
      device_name: 'Test device',
      device_feature_name: 'Test device feature',
      duckdb_states_count: 110,
      sqlite_states_count: 5,
      aggregates_count: 3,
      step: 'deleting_aggregates',
    });
  });
  it('should purge a small feature with a single delete statement', async () => {
    const stateManager = new StateManager(event);
    const service = {};
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const TEMPERATURE_FEATURE_ID = 'bb1af3b9-f87d-4d9c-b5be-958cd9d28900';
    await db.duckDbBatchInsertState(TEMPERATURE_FEATURE_ID, [
      { value: 20, created_at: new Date('2025-08-28T15:00:00.000Z') },
      { value: 21, created_at: new Date('2025-08-28T15:01:00.000Z') },
    ]);
    // Default threshold: 2 states stay far below it, single-statement path
    const res = await device.purgeStatesByFeatureId(TEMPERATURE_FEATURE_ID);
    expect(res.numberOfDeviceFeatureStateToDelete).to.equal(2);
    const states = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
      TEMPERATURE_FEATURE_ID,
    );
    expect(states).to.have.lengthOf(0);
  });
  it('should do nothing on a feature without any state', async () => {
    const stateManager = new StateManager(event);
    const service = {};
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const res = await device.purgeStatesByFeatureId(uuid.v4());
    expect(res).to.deep.equal({
      numberOfDeviceFeatureStateToDelete: 0,
      numberOfDeviceFeatureStateAggregateToDelete: 0,
    });
    // States of other features are untouched
    const duckDbStates = await db.duckDbReadConnectionAllAsync(
      'SELECT * FROM t_device_feature_state WHERE device_feature_id = ?',
      DEVICE_FEATURE_ID,
    );
    expect(duckDbStates).to.have.lengthOf(110);
  });
});
