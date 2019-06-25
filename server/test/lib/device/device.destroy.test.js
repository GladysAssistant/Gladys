const EventEmitter = require('events');
const { assert } = require('chai');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('Device.destroy', () => {
  it('should destroy device', async () => {
    const stateManager = new StateManager(event);
    const device = new Device(event, {}, stateManager, {});
    await device.destroy('test-device');
  });
  it('should return device not found', async () => {
    const stateManager = new StateManager(event);
    const device = new Device(event, {}, stateManager, {});
    const promise = device.destroy('doesnotexist');
    return assert.isRejected(promise);
  });
});
