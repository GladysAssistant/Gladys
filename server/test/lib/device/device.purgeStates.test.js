const { expect } = require('chai');
const EventEmitter = require('events');
const { fake } = require('sinon');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Device', () => {
  it('should purgeStates', async () => {
    const variable = {
      getValue: fake.resolves(30),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    const devicePurged = await device.purgeStates();
    expect(devicePurged).to.equal(true);
  });
  it('should not purgeStates, invalid date', async () => {
    const variable = {
      getValue: fake.resolves('NOT A DATE'),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    const devicePurged = await device.purgeStates();
    expect(devicePurged).to.equal(false);
  });
  it('should not purgeStates, date = -1', async () => {
    const variable = {
      getValue: fake.resolves('-1'),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable, job);
    const devicePurged = await device.purgeStates();
    expect(devicePurged).to.equal(false);
  });
});
