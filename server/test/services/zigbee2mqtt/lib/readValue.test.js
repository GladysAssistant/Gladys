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
