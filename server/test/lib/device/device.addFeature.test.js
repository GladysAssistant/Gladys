const { expect } = require('chai');
const EventEmitter = require('events');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();
const service = {
  getService: () => {},
};

describe('Device.addFeature', () => {
  it('should add one feature', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'test-device', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Philips Hue',
      selector: 'test-device',
      features: [
        {
          id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
          name: 'On/Off',
          external_id: 'philips-hue:1:binary',
          category: 'light',
          type: 'binary',
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 1,
        },
      ],
      params: [],
    });
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const newDevice = await device.addFeature('test-device', {
      name: 'On/Off',
      external_id: 'philips-hue:1:new',
      category: 'light',
      type: 'binary',
      read_only: false,
      keep_history: true,
      has_feedback: false,
      min: 0,
      max: 1,
    });
    expect(newDevice).to.have.property('name', 'Philips Hue');
    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice).to.have.property('features');
    expect(newDevice).to.have.property('params');
    const newDeviceFeature = newDevice.features.find((f) => f.external_id === 'philips-hue:1:new');
    expect(newDeviceFeature).to.have.property('name', 'On/Off');
  });
  it('should update one feature but not the name/selector', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'test-device', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Philips Hue',
      selector: 'test-device',
      features: [
        {
          id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
          name: 'On/Off',
          selector: 'philips-hue-binary',
          external_id: 'philips-hue:1:binary',
          category: 'light',
          type: 'binary',
          read_only: false,
          keep_history: true,
          has_feedback: false,
          min: 0,
          max: 1,
        },
      ],
      params: [],
    });
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const newDevice = await device.addFeature('test-device', {
      name: 'NEW NAME, SHOULD NOT BE UPDATED',
      external_id: 'philips-hue:1:binary',
      category: 'light',
      type: 'binary',
      read_only: false,
      keep_history: true,
      has_feedback: false,
      min: 0,
      max: 1,
    });
    expect(newDevice).to.have.property('name', 'Philips Hue');
    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice).to.have.property('features');
    expect(newDevice).to.have.property('params');
    const newDeviceFeature = newDevice.features.find((f) => f.external_id === 'philips-hue:1:binary');
    expect(newDeviceFeature).to.have.property('name', 'On/Off');
    expect(newDeviceFeature).to.have.property('selector', 'philips-hue-binary');
  });
});
