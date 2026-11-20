const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;
const { expect } = require('chai');
const { BadParameters, ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt setPermitJoin', () => {
  // PREPARE
  let zigbee2MqttManager;
  let gladys;
  let mqttClient;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      event: {
        emit: fake.resolves(null),
      },
    };
    mqttClient = {
      publish: fake.resolves(true),
    };

    zigbee2MqttManager = new Zigbee2MqttService(gladys, {}, serviceId);
    zigbee2MqttManager.z2mPermitJoin = false;
    zigbee2MqttManager.mqttClient = mqttClient;
    zigbee2MqttManager.zigbee2mqttConnected = true;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should refuse when Gladys is not connected to the broker of Zigbee2mqtt', async () => {
    // PREPARE
    zigbee2MqttManager.mqttClient = null;
    // EXECUTE
    const promise = zigbee2MqttManager.setPermitJoin(true);
    // ASSERT
    await expect(promise).to.be.rejectedWith(ServiceNotConfiguredError);
    assert.notCalled(gladys.event.emit);
  });

  it('should refuse when Zigbee2mqtt does not answer on its broker', async () => {
    // PREPARE
    zigbee2MqttManager.zigbee2mqttConnected = false;
    // EXECUTE
    const promise = zigbee2MqttManager.setPermitJoin(true);
    // ASSERT
    await expect(promise).to.be.rejectedWith(BadParameters, 'ZIGBEE2MQTT_NOT_ANSWERING');
    assert.notCalled(mqttClient.publish);
    assert.notCalled(gladys.event.emit);
  });

  it('should ask to allow, then to forbid, from what Zigbee2mqtt told when toggled', async () => {
    // EXECUTE
    await zigbee2MqttManager.setPermitJoin();
    // ASSERT
    assert.calledOnceWithExactly(
      mqttClient.publish,
      'zigbee2mqtt/bridge/request/permit_join',
      JSON.stringify({ value: true, time: 254 }),
    );
    // Told by Zigbee2mqtt only, once it answers
    assert.notCalled(gladys.event.emit);
    expect(zigbee2MqttManager.z2mPermitJoin).to.equal(false);
    // PREPARE: Zigbee2mqtt answered that joining is allowed
    zigbee2MqttManager.z2mPermitJoin = true;
    // EXECUTE
    await zigbee2MqttManager.setPermitJoin();
    // ASSERT
    assert.calledWithExactly(
      mqttClient.publish,
      'zigbee2mqtt/bridge/request/permit_join',
      JSON.stringify({ value: false, time: 0 }),
    );
    assert.notCalled(gladys.event.emit);
  });

  it('should allow joining when asked to, even when already allowed', async () => {
    // PREPARE
    zigbee2MqttManager.z2mPermitJoin = true;
    // EXECUTE
    await zigbee2MqttManager.setPermitJoin(true);
    // ASSERT
    assert.calledOnceWithExactly(
      mqttClient.publish,
      'zigbee2mqtt/bridge/request/permit_join',
      JSON.stringify({ value: true, time: 254 }),
    );
    assert.notCalled(gladys.event.emit);
  });

  it('should forbid joining when asked to, even when already forbidden', async () => {
    // EXECUTE
    await zigbee2MqttManager.setPermitJoin(false);
    // ASSERT
    assert.calledOnceWithExactly(
      mqttClient.publish,
      'zigbee2mqtt/bridge/request/permit_join',
      JSON.stringify({ value: false, time: 0 }),
    );
  });
});
