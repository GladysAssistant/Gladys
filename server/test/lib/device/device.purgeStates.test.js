const { expect } = require('chai');
const EventEmitter = require('events');
const { fake } = require('sinon');

const Device = require('../../../lib/device');

const StateManager = require('../../../lib/state');

const event = new EventEmitter();

describe('Device', () => {
  it('should purgeStates', async () => {
    const variable = {
      getValue: fake.resolves(30),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable);
    const devicePurged = await device.purgeStates();
    expect(devicePurged).to.equal(true);
  });
  it.only('should purgeStatesAggregates', async () => {
    const variable = {
      getValue: fake.resolves(30),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable);
    const newDevice = await device.create({
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Test device',
      selector: 'test-device',
      external_id: 'test-device-external',
      service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279',
      features: [
        {
          name: 'New device feature',
          selector: 'new-device-feature',
          external_id: 'hue:binary:1',
          category: 'temperature',
          type: 'decimal',
          keep_history: false,
          read_only: false,
          has_feedback: false,
          min: 0,
          max: 100,
        },
      ],
    });
    const devicePurged = await device.purgeStatesAggregates(newDevice.features[0]);
    expect(devicePurged).to.equal(true);
  });
  it('should not purgeStates, invalid date', async () => {
    const variable = {
      getValue: fake.resolves('NOT A DATE'),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable);
    const devicePurged = await device.purgeStates();
    expect(devicePurged).to.equal(false);
  });
  it('should not purgeStates, date = -1', async () => {
    const variable = {
      getValue: fake.resolves('-1'),
    };
    const stateManager = new StateManager(event);
    const service = {};
    const device = new Device(event, {}, stateManager, service, {}, variable);
    const devicePurged = await device.purgeStates();
    expect(devicePurged).to.equal(false);
  });
});
