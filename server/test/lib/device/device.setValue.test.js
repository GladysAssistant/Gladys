const EventEmitter = require('events');
const { fake } = require('sinon');
const { assert } = require('chai');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');

const event = new EventEmitter();

const testService = {
  light: {
    turnOn: fake.resolves(true),
  },
};

describe('Device', () => {
  it('should throw an error, service does not exist', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const device = new Device(event, {}, stateManager, service);
    const promise = device.setValue(
      {
        service: {
          name: 'doesnotexist',
        },
        external_id: 'test',
      },
      {},
      'light',
      'turnOn',
      1,
    );
    return assert.isRejected(promise, 'Service doesnotexist was not found.');
  });
  it('should throw an error, service is not able to control this category of device', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => testService,
    };
    const device = new Device(event, {}, stateManager, service);
    const promise = device.setValue(
      {
        service: {
          name: 'test',
        },
        external_id: 'test',
      },
      {},
      'doesnotexist',
      'turnOn',
      1,
    );
    return assert.isRejected(promise, 'Service test is not able to control device of category doesnotexist');
  });
  it('should throw an error, service does not have this function', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => testService,
    };
    const device = new Device(event, {}, stateManager, service);
    const promise = device.setValue(
      {
        service: {
          name: 'test',
        },
        external_id: 'test',
      },
      {},
      'light',
      'doesnotexist',
      1,
    );
    return assert.isRejected(promise, 'Function light.doesnotexist in service test does not exist.');
  });
});
