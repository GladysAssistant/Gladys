const { assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const Zigbee2MqttService = proxyquire('../../../../services/zigbee2mqtt', {});

const gladys = {};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt getPermitJoin', () => {
  // PREPARE
  const zigbee2MqttService = Zigbee2MqttService(gladys, serviceId);
  zigbee2MqttService.device.z2mPermitJoin = true;

  it('get permitJoin', async () => {
    // EXECUTE
    const result = await zigbee2MqttService.device.getPermitJoin();
    // ASSERT
    assert.equal(result, true);
  });
});
