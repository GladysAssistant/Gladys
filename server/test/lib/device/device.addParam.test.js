const { expect } = require('chai');
const EventEmitter = require('events');
const Device = require('../../../lib/device');
const StateManager = require('../../../lib/state');
const Job = require('../../../lib/job');

const event = new EventEmitter();

describe('Device.addParam', () => {
  it('should add one param', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'test-device', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Philips Hue',
      selector: 'test-device',
      features: [],
      params: [
        {
          name: 'SENSIBILITY',
          value: 1,
        },
      ],
    });
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    const newDevice = await device.addParam('test-device', {
      name: 'NEW_VALUE',
      value: '10',
    });
    expect(newDevice).to.have.property('name', 'Philips Hue');
    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice).to.have.property('params');
    const newDeviceParam = newDevice.params.find((p) => p.name === 'NEW_VALUE');
    expect(newDeviceParam).to.have.property('value', '10');
  });
  it('should update existing param', async () => {
    const stateManager = new StateManager(event);
    stateManager.setState('device', 'test-device', {
      id: '7f85c2f8-86cc-4600-84db-6c074dadb4e8',
      name: 'Philips Hue',
      selector: 'test-device',
      features: [],
      params: [
        {
          id: 'c24b1f96-69d7-4e6e-aa44-f14406694c59',
          name: 'TEST_PARAM',
          value: '1',
        },
      ],
    });
    const job = new Job(event);
    const device = new Device(event, {}, stateManager, {}, {}, {}, job);
    const newDevice = await device.addParam('test-device', {
      name: 'TEST_PARAM',
      value: '1000',
    });
    expect(newDevice).to.have.property('name', 'Philips Hue');
    expect(newDevice).to.have.property('selector', 'test-device');
    expect(newDevice).to.have.property('params');
    const newDeviceParam = newDevice.params.find((p) => p.name === 'TEST_PARAM');
    expect(newDeviceParam).to.have.property('value', '1000');
  });
});
