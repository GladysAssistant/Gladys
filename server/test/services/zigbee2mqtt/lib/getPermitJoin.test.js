const { assert } = require('chai');

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt/lib');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};
const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt getPermitJoin', () => {
  // PREPARE
  let zigbee2MqttManager;

  beforeEach(() => {
    zigbee2MqttManager = new Zigbee2MqttService(gladys, mqttLibrary, serviceId);
    zigbee2MqttManager.z2mPermitJoin = true;
  });

  it('get permitJoin', async () => {
    // EXECUTE
    const result = await zigbee2MqttManager.getPermitJoin();
    // ASSERT
    assert.equal(result, true);
  });
});
