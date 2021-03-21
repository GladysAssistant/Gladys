const EventEmitter = require('events');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');

const event = new EventEmitter();

chai.use(chaiAsPromised);

describe('Device scenario', () => {
  it('should throw an error, service does not exist', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => null,
    };
    const device = new Device(event, {}, stateManager, service);
    const promise = device.scenario(
      {
        service: {
          name: 'doesnotexist',
        },
        external_id: 'test',
      },
      {},
      {
        duration: 0,
        targetBrightness: 50,
      },
    );
    return chai.assert.isRejected(promise, 'Service doesnotexist was not found.');
  });
  it('should throw an error, function setValue not found', async () => {
    const stateManager = new StateManager(event);
    const service = {
      getService: () => {},
    };
    const device = new Device(event, {}, stateManager, service);
    const promise = device.scenario(
      {
        service: {
          name: 'my-service',
        },
        external_id: 'test',
      },
      {},
      {
        duration: 0,
        targetBrightness: 50,
      },
    );
    return chai.assert.isRejected(promise, 'Function device.scenario in service my-service does not exist.');
  });
});
