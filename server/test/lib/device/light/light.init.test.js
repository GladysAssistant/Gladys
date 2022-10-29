const EventEmitter = require('events');
const { expect } = require('chai');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Light', () => {
  it('should get all lights and store them in the stateManager', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {}, {}, {}, job);
    const lights = await deviceManager.lightManager.init();
    lights.forEach((light) => {
      expect(light).to.have.property('id');
      expect(light).to.have.property('selector');
      expect(light).to.have.property('features');
      expect(light).to.have.property('service');
      expect(light).to.have.property('room');
    });
  });
});
