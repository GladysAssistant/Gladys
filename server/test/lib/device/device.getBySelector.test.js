const EventEmitter = require('events');
const { expect } = require('chai');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Device.getBySelector', () => {
  it('should return device', () => {
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'test-device', {
      name: 'test',
    });
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    const oneDevice = device.getBySelector('test-device');
    expect(oneDevice).to.deep.equal({
      name: 'test',
    });
  });
  it('should return device', () => {
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'test-device', {
      name: 'test',
    });
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    expect(() => device.getBySelector('not-found')).to.throw('Device not found');
  });
});
