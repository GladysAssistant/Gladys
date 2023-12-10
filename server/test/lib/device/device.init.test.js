const { assert, fake } = require('sinon');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const { EVENTS } = require('../../../utils/constants');
const Job = require('../../../lib/job');

const event = {
  emit: fake.returns(null),
  on: fake.returns(null),
};

const brain = {
  addNamedEntity: fake.returns(null),
};

describe('Device.init', () => {
  it('should init device', async () => {
    const stateManager = new StateManager(event);
    const service = {};
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job, brain);

    await device.init(true);
    assert.calledWith(event.emit, EVENTS.DEVICE.CALCULATE_HOURLY_AGGREGATE);
  });
});
