const EventEmitter = require('events');
const { assert } = require('chai');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const ServiceManager = require('../../../lib/service');

const event = new EventEmitter();

describe('Device.destroy', () => {
  it('should destroy device', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager);
    device.devicesByPollFrequency[60000] = [
      {
        selector: 'test-device',
      },
    ];
    await device.destroy('test-device');
  });
  it('should return device not found', async () => {
    const stateManager = new StateManager(event);
    const serviceManager = new ServiceManager({}, stateManager);
    const device = new Device(event, {}, stateManager, serviceManager);
    const promise = device.destroy('doesnotexist');
    return assert.isRejected(promise);
  });
});
