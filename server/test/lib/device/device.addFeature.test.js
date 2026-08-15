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
  it('should add a feature whose name is already taken by another feature', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'test-device', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Philips Hue',
      selector: 'test-device',
      features: [],
      params: [],
    });
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    // "test-device-feature" is already taken by the seeders: the selector
    // derived from this name must be disambiguated instead of failing
    const newDevice = await device.addFeature('test-device', {
      name: 'Test device feature',
      external_id: 'philips-hue:1:homonym',
      category: 'light',
      type: 'binary',
      read_only: false,
      keep_history: true,
      has_feedback: false,
      min: 0,
      max: 1,
    });
    const newDeviceFeature = newDevice.features.find((f) => f.external_id === 'philips-hue:1:homonym');
    expect(newDeviceFeature).to.have.property('selector', 'test-device-feature-3');
  });
  it('should stay a no-op when the payload declares no step', async () => {
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
          unit: null,
          min: 0,
          max: 1,
          // every feature carries step: null since the migration, while the
          // payloads of the existing integrations have no step key at all
          step: null,
        },
      ],
      params: [],
    });
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const newDevice = await device.addFeature('test-device', {
      name: 'On/Off',
      external_id: 'philips-hue:1:binary',
      category: 'light',
      type: 'binary',
      read_only: false,
      keep_history: true,
      has_feedback: false,
      min: 0,
      max: 1,
    });
    const feature = newDevice.features.find((f) => f.external_id === 'philips-hue:1:binary');
    expect(feature).to.have.property('id', 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4');
    expect(feature).to.have.property('step', null);
  });
  it('should update the step of an existing feature', async () => {
    const stateManager = new StateManager(event);
    // the seeded feature, so the update branch writes and reads back a real row
    stateManager.setState('device', 'test-device', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Philips Hue',
      selector: 'test-device',
      features: [
        {
          id: 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4',
          name: 'Test device feature',
          external_id: 'hue:binary:1',
          category: 'light',
          type: 'binary',
          read_only: false,
          keep_history: true,
          has_feedback: false,
          unit: null,
          min: 0,
          max: 1,
          step: null,
        },
      ],
      params: [],
    });
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const newDevice = await device.addFeature('test-device', {
      name: 'Test device feature',
      external_id: 'hue:binary:1',
      category: 'light',
      type: 'binary',
      read_only: false,
      keep_history: true,
      has_feedback: false,
      min: 0,
      max: 1,
      step: 0.5,
    });
    const feature = newDevice.features.find((f) => f.external_id === 'hue:binary:1');
    expect(feature).to.have.property('id', 'ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4');
    expect(feature).to.have.property('step', 0.5);
  });
  it('should refuse a step of 0', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'test-device', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Philips Hue',
      selector: 'test-device',
      features: [],
      params: [],
    });
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, service, {}, {}, job);
    const promise = device.addFeature('test-device', {
      name: 'Target temperature',
      external_id: 'philips-hue:1:setpoint',
      category: 'air-conditioning',
      type: 'target-temperature',
      read_only: false,
      keep_history: true,
      has_feedback: false,
      min: 16,
      max: 31,
      step: 0,
    });
    await expect(promise).to.be.rejectedWith('step must be greater than 0');
  });
});
