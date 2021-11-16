const { expect } = require('chai');

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt');

const gladys = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt getDiscoveredDevices', () => {
  // PREPARE
  const zigbee2MqttService = Zigbee2MqttService(gladys, serviceId);

  it('get discovered devices', async () => {
    // EXECUTE
    const devices = zigbee2MqttService.device.getDiscoveredDevices();
    // ASSERT
    expect(devices).deep.eq([]);
  });
});
