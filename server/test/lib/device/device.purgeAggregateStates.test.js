const { expect } = require('chai');
const EventEmitter = require('events');
const { fake } = require('sinon');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.purgeAggregateStates', () => {
  it('should purgeAggregateStates', async () => {
    const variable = {
      getValue: fake.resolves(30),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    const devicePurged = await device.purgeAggregateStates();
    expect(devicePurged).to.equal(true);
  });
  it('should not purgeAggregateStates, invalid date', async () => {
    const variable = {
      getValue: fake.resolves('NOT A DATE'),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    const devicePurged = await device.purgeAggregateStates();
    expect(devicePurged).to.equal(false);
  });
  it('should not purgeAggregateStates, null', async () => {
    const variable = {
      getValue: fake.resolves(null),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    const devicePurged = await device.purgeAggregateStates();
    expect(devicePurged).to.equal(false);
  });
  it('should not purgeAggregateStates, date = -1', async () => {
    const variable = {
      getValue: fake.resolves('-1'),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    const devicePurged = await device.purgeAggregateStates();
    expect(devicePurged).to.equal(false);
  });
});
