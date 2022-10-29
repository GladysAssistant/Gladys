const EventEmitter = require('events');
// const { fake } = require('sinon');
const { assert } = require('chai');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Device', () => {
  it('should throw an error, service does not exist', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
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
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
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
