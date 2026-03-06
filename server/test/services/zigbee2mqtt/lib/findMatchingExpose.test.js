const { assert } = require('chai');

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt');

const discoveredDevice = require('./payloads/single_mqtt_device.json');
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
    const expectedExpose = {
      type: 'binary',
      name: 'state',
      property: 'state',
      access: 3,
      value_on: 'ON',
      value_off: 'OFF',
    };
    const result = zigbee2MqttService.device.findMatchingExpose('0x00158d00045b2740', 'state');
    assert.deepEqual(result.expose, expectedExpose);
    assert.equal(result.parent, undefined);
  });

  it('expose discovered with parent on cover position', () => {
    const result = zigbee2MqttService.device.findMatchingExpose('0x00158d00045b2740', 'position');
    assert.equal(result.expose.property, 'position');
    assert.equal(result.expose.type, 'numeric');
    assert.equal(result.parent, undefined);
  });

  it('expose discovered with composite parent (warning mode)', () => {
    const sirenDevice = discoveredDevices.find((d) => d.friendly_name === '0x00158d00045b2741');
    zigbee2MqttService.device.discoveredDevices[sirenDevice.friendly_name] = sirenDevice;
    const result = zigbee2MqttService.device.findMatchingExpose('0x00158d00045b2741', 'mode');
    assert.equal(result.expose.property, 'mode');
    assert.equal(result.expose.type, 'enum');
    assert.isDefined(result.parent);
    assert.equal(result.parent.property, 'warning');
    assert.equal(result.parent.type, 'composite');
  });

  it('expose discovered with composite parent (warning strobe)', () => {
    const sirenDevice = discoveredDevices.find((d) => d.friendly_name === '0x00158d00045b2741');
    zigbee2MqttService.device.discoveredDevices[sirenDevice.friendly_name] = sirenDevice;
    const result = zigbee2MqttService.device.findMatchingExpose('0x00158d00045b2741', 'strobe');
    assert.equal(result.expose.property, 'strobe');
    assert.equal(result.expose.type, 'binary');
    assert.isDefined(result.parent);
    assert.equal(result.parent.property, 'warning');
  });
});
