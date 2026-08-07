const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;
const { MockedMqttClient } = require('../../mocks.test');
const MqttHandler = require('../../../../../services/mqtt/lib');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.getHomeAssistantDiscoveredDevices', () => {
  let mqttHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      stateManager: {
        get: fake.returns(null),
      },
    };
    mqttHandler = new MqttHandler(gladys, MockedMqttClient, SERVICE_ID);
    mqttHandler.haDiscoveredDevices = {
      'homeassistant:device-b': {
        identifier: 'device-b',
        info: { name: 'B device' },
        entities: {
          'sensor:temperature': { state_topic: 'b/temperature', device_class: 'temperature' },
        },
      },
      'homeassistant:device-a': {
        identifier: 'device-a',
        info: { name: 'A device' },
        entities: {
          'switch:relay': { command_topic: 'a/set' },
        },
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should return discovered devices sorted by name', () => {
    const devices = mqttHandler.getHomeAssistantDiscoveredDevices();
    expect(devices).to.have.lengthOf(2);
    expect(devices[0].name).to.equal('A device');
    expect(devices[1].name).to.equal('B device');
    expect(devices[0].features).to.have.lengthOf(1);
  });

  it('should merge with existing devices and filter them', () => {
    const existingDevice = {
      id: 'f2e7e876-2709-4288-a608-a0e4864a0764',
      name: 'My existing device',
      external_id: 'homeassistant:device-a',
      created_at: '2024-01-01',
      features: [
        {
          id: '4a2c1f92-3a5f-4e68-9d3c-1d1e17f32b0f',
          external_id: 'homeassistant:device-a:switch:relay',
          category: 'switch',
          type: 'binary',
        },
      ],
      params: [
        {
          name: 'ha_discovery_config:switch:relay',
          value: JSON.stringify({ command_topic: 'a/set' }),
        },
      ],
    };
    gladys.stateManager.get = fake((key, externalId) =>
      externalId === 'homeassistant:device-a' ? existingDevice : null,
    );

    const devices = mqttHandler.getHomeAssistantDiscoveredDevices({ filter_existing: 'true' });
    expect(devices).to.have.lengthOf(1);
    expect(devices[0].name).to.equal('B device');
  });
});
