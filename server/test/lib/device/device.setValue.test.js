const EventEmitter = require('events');
// const { fake } = require('sinon');
const { assert } = require('chai');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');

const event = new EventEmitter();

/* const testService = {
  light: {
    turnOn: fake.resolves(true),
  },
}; */

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
      1,
    );
    return assert.isRejected(promise, 'Service doesnotexist was not found.');
  });
  it('should throw an error, function setValue not found', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => {},
    };
    const device = new Device(event, {}, stateManager, service);
    const promise = device.setValue(
      {
        service: {
          name: 'my-service',
        },
        external_id: 'test',
      },
      {},
      1,
    );
    return assert.isRejected(promise, 'Function device.setValue in service my-service does not exist.');
  });
});
