const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const Zigbee2mqttManager = proxyquire('../../../../services/zigbee2mqtt/lib', {});

const event = {
  emit: fake.resolves(null),
};

const container = {
  id: 'docker-test',
};

const gladys = {
  event,
  variable: {
    setValue: fake.resolves(true),
    getValue: fake.resolves(true),
  },
  system: {
    getContainers: fake.resolves([container]),
    stopContainer: fake.resolves(true),
    isDocker: fake.resolves(true),
    getNetworkMode: fake.resolves('host'),
    restartContainer: fake.resolves(true),
  },
  service: {
    getService: fake.returns({
      list: fake.resolves([
        {
          path: '/dev/ttyUSB0',
        },
      ]),
    }),
  },
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt init', () => {
  // PREPARE
  const zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);

  beforeEach(() => {
    sinon.reset();
    zigbee2mqttManager.dockerBased = false;
    zigbee2mqttManager.networkModeValid = false;
    zigbee2mqttManager.z2mEnabled = false;
    zigbee2mqttManager.usbConfigured = false;
    zigbee2mqttManager.getConfiguration = fake.resolves(true);
    zigbee2mqttManager.connect = fake.resolves(true);
  });

  it('it should fail because not a Docker System', async () => {
    // PREPARE
    zigbee2mqttManager.gladys.system.isDocker = fake.resolves(false);
    // EXECUTE
    try {
      await zigbee2mqttManager.init();
      assert.fail();
    } catch (e) {
      assert.match(e.message, 'SYSTEM_NOT_RUNNING_DOCKER');
    }
    // ASSERT
    assert.match(zigbee2mqttManager.dockerBased, false);
    zigbee2mqttManager.gladys.system.isDocker = fake.resolves(true);
  });

  it('it should fail because not a host network', async () => {
    // PREPARE
    zigbee2mqttManager.gladys.system.getNetworkMode = fake.resolves('container');
    // EXECUTE
    try {
      await zigbee2mqttManager.init();
      assert.fail();
    } catch (e) {
      assert.match(e.message, 'DOCKER_BAD_NETWORK');
    }
    // ASSERT
    assert.match(zigbee2mqttManager.networkModeValid, false);
    zigbee2mqttManager.gladys.system.getNetworkMode = fake.resolves('host');
  });

  it('it should put z2m disabled, first service launch', async () => {
    // PREPARE
    zigbee2mqttManager.gladys.variable.getValue = sinon.stub();
    zigbee2mqttManager.gladys.variable.getValue
      .onFirstCall()
      .resolves(null)
      .onSecondCall()
      .resolves('/dev/ttyUSB0')
      .onThirdCall()
      .resolves('mqtt_password');
    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.calledWith(zigbee2mqttManager.gladys.variable.setValue, 'ZIGBEE2MQTT_ENABLED', false, serviceId);
    assert.match(zigbee2mqttManager.z2mEnabled, false);
  });

  it('it should put z2m enabled from database', async () => {
    // PREPARE
    zigbee2mqttManager.gladys.variable.getValue = sinon.stub();
    zigbee2mqttManager.gladys.variable.getValue
      .onFirstCall()
      .resolves(true)
      .onSecondCall()
      .resolves('/dev/ttyUSB0')
      .onThirdCall()
      .resolves('mqtt_password');
    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.match(zigbee2mqttManager.z2mEnabled, true);
  });

  it('it should Zigbee2mqtt USB dongle not attached', async () => {
    // PREPARE
    zigbee2mqttManager.gladys.variable.getValue = sinon.stub();
    zigbee2mqttManager.gladys.variable.getValue
      .onFirstCall()
      .resolves(true)
      .onSecondCall()
      .resolves(null);
    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.match(zigbee2mqttManager.z2mEnabled, false);
  });

  it('it should Zigbee2mqtt USB dongle detached, z2m', async () => {
    // PREPARE
    zigbee2mqttManager.gladys.variable.getValue = sinon.stub();
    zigbee2mqttManager.gladys.variable.getValue
      .onFirstCall()
      .resolves(true)
      .onSecondCall()
      .resolves('/dev/ttyUSB1');
    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.match(zigbee2mqttManager.z2mEnabled, false);
  });

  it('it should mqttPassword already existing', async () => {
    // PREPARE
    zigbee2mqttManager.gladys.variable.getValue = sinon.stub();
    zigbee2mqttManager.gladys.variable.getValue
      .onFirstCall()
      .resolves(true)
      .onSecondCall()
      .resolves('/dev/ttyUSB0')
      .onThirdCall()
      .resolves('mqtt_password');
    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.match(zigbee2mqttManager.z2mEnabled, true);
    assert.notCalled(zigbee2mqttManager.gladys.variable.setValue);
  });

  it('it should mqttPassword creation', async () => {
    // PREPARE
    zigbee2mqttManager.gladys.variable.getValue = sinon.stub();
    zigbee2mqttManager.gladys.variable.getValue
      .onFirstCall()
      .resolves(true)
      .onSecondCall()
      .resolves('/dev/ttyUSB0')
      .onThirdCall()
      .resolves(null);
    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.match(zigbee2mqttManager.z2mEnabled, false);
    assert.calledWithExactly(zigbee2mqttManager.gladys.variable.setValue, 'ZIGBEE2MQTT_ENABLED', false, serviceId);
  });

  it('it should connect', async () => {
    // PREPARE
    zigbee2mqttManager.gladys.variable.getValue = sinon.stub();
    zigbee2mqttManager.gladys.variable.getValue
      .onFirstCall()
      .resolves(true)
      .onSecondCall()
      .resolves('/dev/ttyUSB0')
      .onThirdCall()
      .resolves('mqtt_password');
    // EXECUTE
    await zigbee2mqttManager.init();
    // ASSERT
    assert.match(zigbee2mqttManager.z2mEnabled, true);
    assert.calledOnce(zigbee2mqttManager.connect);
  });
});
