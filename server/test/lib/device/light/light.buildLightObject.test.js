const { expect } = require('chai');
const EventEmitter = require('events');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const Device = require('../../../../lib/device');
const StateManager = require('../../../../lib/state');
const Job = require('../../../../lib/job');

const event = new EventEmitter();
const job = new Job(event);

describe('Light.buildLightObject', () => {
  it('should should build light object with binary deviceFeature', async () => {
    const stateManager = new StateManager(event);
    const deviceManager = new Device(event, {}, stateManager, {}, {}, {}, job);
    const device = {
      id: '78ffc050-71c4-4dfe-8f3b-4b153e79c457',
      selector: 'test',
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
        },
      ],
    };
    const light = deviceManager.lightManager.buildLightObject(device);
    expect(light)
      .to.have.property('turnOn')
      .and.be.instanceOf(Function);
    expect(light)
      .to.have.property('turnOff')
      .and.be.instanceOf(Function);
  });
});
