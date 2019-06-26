const EventEmitter = require('events');
const { fake } = require('sinon');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('Device', () => {
  it('should purgeStates', async () => {
    const variable = {
      getValue: () => fake.resolves(1),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable);
    await device.purgeStates();
  });
  it('should not purgeStates, invalid date', async () => {
    const variable = {
      getValue: () => fake.resolves('NOT A DATE'),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable);
    await device.purgeStates();
  });
});
