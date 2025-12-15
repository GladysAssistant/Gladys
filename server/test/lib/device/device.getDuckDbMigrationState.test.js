const EventEmitter = require('events');
const { expect } = require('chai');
const { fake } = require('sinon');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

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
  });
});
