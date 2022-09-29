const EventEmitter = require('events');
const { fake } = require('sinon');
const { assert } = require('chai');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

const testService = {
  device: {
    poll: fake.resolves(true),
  },
};

const testServiceBroken = {
  device: {
    poll: fake.rejects(true),
  },
};

describe('Device', () => {
  it('should poll device', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => testService,
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    await device.poll({
      service: {
        name: 'test',
      },
    });
  });
  it('should poll device with error', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => testServiceBroken,
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    await device.poll({
      service: {
        name: 'test',
      },
    });
  });
  it('should not poll device, service does not exist', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const promise = device.poll({
      service: {
        name: 'doesnotexist',
      },
    });
    return assert.isRejected(promise, 'Service doesnotexist was not found.');
  });
  it('should not poll device, service does not have a poll function', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => ({}),
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const promise = device.poll({
      service: {
        name: 'doesnotexist',
      },
    });
    return assert.isRejected(promise, 'Service doesnotexist does not have a device.poll function.');
  });
});
