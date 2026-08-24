const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();
const uuid = require('uuid');

const { fake } = sinon;
const db = require('../../../models');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const insertSqliteStates = async () => {
  const queryInterface = db.sequelize.getQueryInterface();
  const date = new Date();
  await queryInterface.bulkInsert('t_device_feature_state', [
    {
      id: uuid.v4(),
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: 12,
      created_at: date,
      updated_at: date,
    },
  ]);
};

const insertSqliteStateAggregates = async () => {
  const queryInterface = db.sequelize.getQueryInterface();
  const date = new Date();
  await queryInterface.bulkInsert('t_device_feature_state_aggregate', [
    {
      id: uuid.v4(),
      type: 'hourly',
      device_feature_id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
      value: 12,
      created_at: date,
      updated_at: date,
    },
  ]);
};

describe('Device.getDuckDbMigrationState', () => {
  it('should return migration not done', async () => {
    const stateManager = new StateManager(event);
    const variable = {
      getValue: fake.resolves(null),
    };
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    const migrationState = await device.getDuckDbMigrationState();
    expect(migrationState).to.have.property('is_duck_db_migrated', false);
    expect(migrationState)
      .to.have.property('duck_db_device_count')
      .that.is.a('number');
    expect(migrationState).to.have.property('sqlite_db_device_state_count', 0);
    expect(migrationState).to.have.property('sqlite_db_device_state_aggregate_count', 0);
    expect(migrationState).to.have.property('is_migration_needed', false);
  });
  it('should return migration done', async () => {
    const stateManager = new StateManager(event);
    const variable = {
      getValue: fake.resolves('true'),
    };
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    const migrationState = await device.getDuckDbMigrationState();
    expect(migrationState).to.have.property('is_duck_db_migrated', true);
    expect(migrationState)
      .to.have.property('duck_db_device_count')
      .that.is.a('number');
    expect(migrationState).to.have.property('sqlite_db_device_state_count', 0);
    expect(migrationState).to.have.property('sqlite_db_device_state_aggregate_count', 0);
    expect(migrationState).to.have.property('is_migration_needed', false);
  });
  it('should return that a migration is needed when states remain in SQLite', async () => {
    await insertSqliteStates();
    const stateManager = new StateManager(event);
    const variable = {
      getValue: fake.resolves('true'),
    };
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    const migrationState = await device.getDuckDbMigrationState();
    expect(migrationState).to.have.property('is_duck_db_migrated', true);
    expect(migrationState).to.have.property('sqlite_db_device_state_count', 1);
    expect(migrationState).to.have.property('sqlite_db_device_state_aggregate_count', 0);
    expect(migrationState).to.have.property('is_migration_needed', true);
  });
  it('should return that a migration is needed when only aggregates remain in SQLite', async () => {
    await insertSqliteStateAggregates();
    const stateManager = new StateManager(event);
    const variable = {
      getValue: fake.resolves('true'),
    };
    const device = new Device(event, {}, stateManager, {}, {}, variable, job);
    const migrationState = await device.getDuckDbMigrationState();
    expect(migrationState).to.have.property('is_duck_db_migrated', true);
    expect(migrationState).to.have.property('sqlite_db_device_state_count', 0);
    expect(migrationState).to.have.property('sqlite_db_device_state_aggregate_count', 1);
    expect(migrationState).to.have.property('is_migration_needed', true);
  });
});
