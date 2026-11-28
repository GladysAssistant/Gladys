const { assert } = require('chai');

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt');

const discoveredDevice = require('./payloads/single_mqtt_device.json');

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

  it('no expose on a device without definition, Zigbee2mqtt not supporting it', () => {
    // Its interview not over, or a model Zigbee2mqtt 1 does not know: listed with `definition: null`
    zigbee2MqttService.device.discoveredDevices.unknown = {
      friendly_name: 'unknown',
      supported: false,
      definition: null,
    };
    const result = zigbee2MqttService.device.findMatchingExpose('unknown', 'state');
    assert.equal(result, undefined);
  });

  it('expose of the generic definition of a device Zigbee2mqtt does not support', () => {
    const state = { type: 'binary', name: 'state', property: 'state', access: 7, value_on: 'ON', value_off: 'OFF' };
    zigbee2MqttService.device.discoveredDevices.generic = {
      friendly_name: 'generic',
      supported: false,
      definition: {
        description: 'Automatically generated definition',
        exposes: [{ type: 'switch', features: [state] }],
      },
    };
    const result = zigbee2MqttService.device.findMatchingExpose('generic', 'state');
    assert.deepEqual(result, state);
  });

  it('expose discovered', () => {
    const expected = {
      type: 'binary',
      name: 'state',
      property: 'state',
      access: 3,
      value_on: 'ON',
      value_off: 'OFF',
    };
    const result = zigbee2MqttService.device.findMatchingExpose('0x00158d00045b2740', 'state');
    assert.deepEqual(result, expected);
  });
});
