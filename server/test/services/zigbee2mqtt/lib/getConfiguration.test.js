const { assert: assertC } = require('chai');
const sinon = require('sinon');
const { fake, assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const Zigbee2MqttService = proxyquire('../../../../services/zigbee2mqtt', {});

const gladys = {
  variable: {
    getValue: fake.resolves('fake'),
    setValue: fake.resolves(true),
  },
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt getConfiguration', () => {
  // PREPARE
  let zigbee2MqttService;
  beforeEach(() => {
    zigbee2MqttService = Zigbee2MqttService(gladys, serviceId);
    sinon.reset();
  });

  it('get configuration z2m disabled', async () => {
    zigbee2MqttService.device.z2mEnabled = false;
    // EXECUTE
    const result = await zigbee2MqttService.device.getConfiguration();
    // ASSERT
    assert.calledThrice(gladys.variable.getValue);
    assertC.deepEqual(result, {
      mqttUrl: 'fake',
      mqttUsername: 'fake',
      mqttPassword: 'fake',
    });
  });

  it('get configuration z2m enabled running', async () => {
    zigbee2MqttService.device.z2mEnabled = true;
    zigbee2MqttService.device.installMqttContainer = fake.resolves(true);
    zigbee2MqttService.device.installZ2mContainer = fake.resolves(true);
    zigbee2MqttService.device.mqttRunning = true;
    zigbee2MqttService.device.zigbee2mqttRunning = true;
    // EXECUTE
    const result = await zigbee2MqttService.device.getConfiguration();
    // ASSERT
    assert.calledOnceWithExactly(gladys.variable.setValue, 'ZIGBEE2MQTT_ENABLED', true, serviceId);
    assertC.equal(zigbee2MqttService.device.z2mEnabled, true);
    assert.calledThrice(gladys.variable.getValue);
    assertC.deepEqual(result, {
      mqttUrl: 'fake',
      mqttUsername: 'fake',
      mqttPassword: 'fake',
    });
  });

  it('get configuration z2m enabled not running', async () => {
    zigbee2MqttService.device.z2mEnabled = true;
    zigbee2MqttService.device.installMqttContainer = fake.resolves(true);
    zigbee2MqttService.device.installZ2mContainer = fake.resolves(true);
    zigbee2MqttService.device.mqttRunning = false;
    zigbee2MqttService.device.zigbee2mqttRunning = false;
    // EXECUTE
    const result = await zigbee2MqttService.device.getConfiguration();
    // ASSERT
    assert.calledOnceWithExactly(gladys.variable.setValue, 'ZIGBEE2MQTT_ENABLED', false, serviceId);
    assertC.equal(zigbee2MqttService.device.z2mEnabled, false);
    assert.calledThrice(gladys.variable.getValue);
    assertC.deepEqual(result, {
      mqttUrl: 'fake',
      mqttUsername: 'fake',
      mqttPassword: 'fake',
    });
  });
});
