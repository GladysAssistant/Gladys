const EventEmitter = require('events');
const { fake } = require('sinon');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.onPurgeStatesEvent', () => {
  it('should clean all states', async () => {
    const variable = {
      getValue: fake.resolves(30),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    await device.onPurgeStatesEvent();
  });
});
