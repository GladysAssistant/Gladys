const { assert, fake } = require('sinon');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

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

describe('Device.init', () => {
  it('should init device', async () => {
    const stateManager = new StateManager(event);
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job, brain);
    device.migrateFromSQLiteToDuckDb = fake.returns(null);

    await device.init();
    assert.called(device.migrateFromSQLiteToDuckDb);
  });
});
