const { fake } = require('sinon');
const { expect } = require('chai');
const uuid = require('uuid');

const db = require('../../../models');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Variable = require('../../../lib/variable');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

const event = {
  emit: fake.returns(null),
  on: fake.returns(null),
};

const brain = {
  addNamedEntity: fake.returns(null),
};
const service = {
  getService: () => {},
};

const insertStates = async () => {
  const queryInterface = db.sequelize.getQueryInterface();
  const deviceFeatureStateToInsert = [];
  const now = new Date();
  for (let i = 1; i <= 1000; i += 1) {
    const date = new Date(now.getFullYear() - 1, 10, i).toISOString();
    deviceFeatureStateToInsert.push({
      id: uuid.v4(),
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: i,
      created_at: date,
      updated_at: date,
    });
  }
  await queryInterface.bulkInsert('t_device_feature_state', deviceFeatureStateToInsert);
};

describe('Device.migrateFromSQLiteToDuckDb', () => {
  const variable = new Variable(event);
  beforeEach(async () => {
    await insertStates();
    await variable.destroy(SYSTEM_VARIABLE_NAMES.DUCKDB_MIGRATED);
  });
  it('should migrate with success', async () => {
    const stateManager = new StateManager(event);
    const job = {
      updateProgress: fake.resolves(null),
      wrapper: (jobType, func) => func,
    };
    const device = new Device(event, {}, stateManager, service, {}, variable, job, brain);
    await device.migrateFromSQLiteToDuckDb('2997ec9f-7a3e-4083-a183-f8b9b15d5bec', 500);
    const res = await db.duckDbReadConnectionAllAsync(
      'SELECT COUNT(*) as nb_states FROM t_device_feature_state WHERE device_feature_id = $1;',
      ['ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4'],
    );
    expect(res).to.deep.equal([{ nb_states: 1000n }]);
    // Second call will not migrate (already migrated)
    await device.migrateFromSQLiteToDuckDb('2997ec9f-7a3e-4083-a183-f8b9b15d5bec', 500);
  });
  it('should migrate 2 times if the first time was interrupted', async () => {
    const stateManager = new StateManager(event);
    const job = {
      updateProgress: fake.resolves(null),
      wrapper: (jobType, func) => func,
    };
    const device = new Device(event, {}, stateManager, service, {}, variable, job, brain);
    await device.migrateFromSQLiteToDuckDb('2997ec9f-7a3e-4083-a183-f8b9b15d5bec', 500);
    await variable.destroy(SYSTEM_VARIABLE_NAMES.DUCKDB_MIGRATED);
    await device.migrateFromSQLiteToDuckDb('2997ec9f-7a3e-4083-a183-f8b9b15d5bec', 500);
    const res = await db.duckDbReadConnectionAllAsync(
      'SELECT COUNT(*) as nb_states FROM t_device_feature_state WHERE device_feature_id = $1;',
      ['ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4'],
    );
    expect(res).to.deep.equal([{ nb_states: 1000n }]);
  });
});
