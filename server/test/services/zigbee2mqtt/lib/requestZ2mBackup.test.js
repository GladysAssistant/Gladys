const sinon = require('sinon');

const { fake, assert } = sinon;

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt/lib');

const gladys = {};
const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt requestZ2mBackup', () => {
  // PREPARE
  let zigbee2MqttManager;

  beforeEach(() => {
    zigbee2MqttManager = new Zigbee2MqttService(gladys, mqttLibrary, serviceId);
    zigbee2MqttManager.mqttClient = {
      publish: fake.resolves(true),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('send mqtt request', async () => {
    // EXECUTE
    zigbee2MqttManager.requestZ2mBackup();
    // ASSERT
    assert.calledOnceWithExactly(zigbee2MqttManager.mqttClient.publish, 'zigbee2mqtt/bridge/request/backup');
  });
});
