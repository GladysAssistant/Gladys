const EventEmitter = require('events');
const { expect } = require('chai');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');

const event = new EventEmitter();

describe('Camera.get', () => {
  it('should return list of cameras', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {});
    const cameras = await deviceManager.camera.get();
    expect(cameras).to.be.instanceOf(Array);
    cameras.forEach((camera) => {
      expect(camera).to.have.property('name');
      expect(camera).to.have.property('selector');
      expect(camera).to.have.property('features');
      expect(camera).to.have.property('room');
    });
  });
});
