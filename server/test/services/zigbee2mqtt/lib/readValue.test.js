const { assert } = require('chai');

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt');

const discoveredDevices = require('./payloads/mqtt_devices_get.json');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

// A model Zigbee2mqtt does not know, with the generic definition it deduced from its clusters
// (docs/specs/zigbee2mqtt-pairing.md, E.2): controlled and read like any other once in Gladys
const genericDevice = {
  friendly_name: '0xa4c138000000f00d',
  ieee_address: '0xa4c138000000f00d',
  supported: false,
  interview_state: 'SUCCESSFUL',
  definition: {
    model: 'TS0001',
    vendor: '_TZ3000_abcd',
    description: 'Automatically generated definition',
    exposes: [
      {
        type: 'switch',
        features: [{ type: 'binary', name: 'state', property: 'state', access: 7, value_on: 'ON', value_off: 'OFF' }],
      },
    ],
  },
};

describe('zigbee2mqtt readValue', () => {
  let zigbee2MqttService;

  beforeEach(() => {
    zigbee2MqttService = Zigbee2MqttService(gladys, serviceId);

    discoveredDevices
      .filter((d) => d.supported)
      .forEach((device) => {
        zigbee2MqttService.device.discoveredDevices[device.friendly_name] = device;
      });
  });

  it('should throw an error, expose not found', () => {
    try {
      zigbee2MqttService.device.readValue('0x00158d00045b2740', 'unknown', true);
      assert.fail();
    } catch (e) {
      assert.equal(e.message, `Zigbee2mqqt expose not found on device "0x00158d00045b2740" with property "unknown".`);
    }
  });

  it('should read the state of a device Zigbee2mqtt does not support through its generic definition', () => {
    zigbee2MqttService.device.discoveredDevices[genericDevice.friendly_name] = genericDevice;
    const result = zigbee2MqttService.device.readValue(genericDevice.friendly_name, 'state', 'ON');
    assert.equal(result, 1);
  });

  it('should throw an error, mapping not found', () => {
    try {
      zigbee2MqttService.device.readValue('0x00158d00045b2740', 'alarm', 'ON');
      assert.fail();
    } catch (e) {
      assert.equal(e.message, `Zigbee2mqqt don't handle value "ON" for property "alarm".`);
    }
  });

  it('should return binary 1', () => {
    const result = zigbee2MqttService.device.readValue('0x00158d00045b2740', 'alarm', true);
    assert.deepEqual(result, 1);
  });

  it('should return binary 0', () => {
    const result = zigbee2MqttService.device.readValue('0x00158d00045b2740', 'alarm', false);
    assert.deepEqual(result, 0);
  });

  it('should return binary OPEN on parent type', () => {
    const result = zigbee2MqttService.device.readValue('0x00158d00045b2740', 'alarm', false);
    assert.deepEqual(result, 0);
  });
});
