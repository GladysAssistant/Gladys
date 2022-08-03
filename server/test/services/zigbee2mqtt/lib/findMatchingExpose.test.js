const { assert } = require('chai');

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt');

const discoveredDevice = require('./payloads/single_mqtt_device.json');

const gladys = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt findMatchingExpose', () => {
  let zigbee2MqttService;

  beforeEach(() => {
    zigbee2MqttService = Zigbee2MqttService(gladys, serviceId);
    zigbee2MqttService.device.discoveredDevices[discoveredDevice.friendly_name] = discoveredDevice;
  });

  it('no device discovered on unknown device', () => {
    const result = zigbee2MqttService.device.findMatchingExpose('unknown', 'property');
    assert.equal(result, undefined);
  });

  it('no expose discovered on unknown property', () => {
    const result = zigbee2MqttService.device.findMatchingExpose('0x00158d00045b2740', 'property');
    assert.equal(result, undefined);
  });

  it('expose discovered', () => {
    const expected = {
      type: 'binary',
      name: 'state',
      property: 'state',
      parent_type: 'switch',
      access: 3,
      value_on: 'ON',
      value_off: 'OFF',
    };
    const result = zigbee2MqttService.device.findMatchingExpose('0x00158d00045b2740', 'state');
    assert.deepEqual(result, expected);
  });

  it('expose dicovered on child features', () => {
    const expected = {
      access: 7,
      description: 'Position of this cover',
      name: 'position',
      property: 'position',
      type: 'numeric',
      parent_type: 'cover',
      value_max: 100,
      value_min: 0,
    };
    const result = zigbee2MqttService.device.findMatchingExpose('0x00158d00045b2740', 'position');
    assert.deepEqual(result, expected);
  });
});
