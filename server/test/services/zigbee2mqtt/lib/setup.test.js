const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const Zigbee2MqttManager = require('../../../../services/zigbee2mqtt/lib');
const { ConflictError } = require('../../../../utils/coreErrors');

const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt setup', () => {
  // PREPARE
  let zigbee2MqttManager;
  let gladys;

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
        emit: fake(),
      },
      variable: {
        getValue: fake.resolves(null),
        setValue: fake.resolves('fake'),
        destroy: fake.resolves(null),
      },
    };

    zigbee2MqttManager = new Zigbee2MqttManager(gladys, mqttLibrary, serviceId);
    zigbee2MqttManager.runInstallation = fake.resolves(null);
  });

  afterEach(() => {
    clearTimeout(zigbee2MqttManager.installProgressTimer);
    sinon.reset();
  });

  it('should store USB configuration, and reload Z2M containers', async () => {
    // PREPARE
    const config = {
      ZIGBEE2MQTT_DRIVER_PATH: 'usb0',
      ZIGBEE_DONGLE_NAME: 'dongle-name',
      Z2M_TCP_PORT: 'tcpPort',
    };
    // EXECUTE
    await zigbee2MqttManager.setup(config);
    // ASSERT
    assert.callCount(gladys.variable.setValue, 3);
    assert.calledWithExactly(gladys.variable.setValue, 'ZIGBEE2MQTT_DRIVER_PATH', 'usb0', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'ZIGBEE_DONGLE_NAME', 'dongle-name', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_TCP_PORT', 'tcpPort', serviceId);

    assert.calledOnceWithExactly(zigbee2MqttManager.runInstallation);
  });

  it('should store configuration for external broker', async () => {
    // PREPARE
    const config = {
      Z2M_MQTT_MODE: 'external',
      GLADYS_MQTT_USERNAME: '',
      Z2M_TCP_PORT: null,
      Z2M_MQTT_URL: 'mqtt://localhost',
      GLADYS_MQTT_PASSWORD: 'password',
      ZIGBEE_DONGLE_NAME: null,
      ZIGBEE2MQTT_DRIVER_PATH: null,
    };
    // EXECUTE
    await zigbee2MqttManager.setup(config);
    // ASSERT
    assert.callCount(gladys.variable.setValue, 4);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_MQTT_URL', 'mqtt://localhost', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'GLADYS_MQTT_USERNAME', '', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'GLADYS_MQTT_PASSWORD', 'password', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_MQTT_MODE', 'external', serviceId);
    // Destroy variables
    assert.calledWithExactly(gladys.variable.destroy, 'Z2M_TCP_PORT', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'ZIGBEE_DONGLE_NAME', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'ZIGBEE2MQTT_DRIVER_PATH', serviceId);

    assert.calledOnceWithExactly(zigbee2MqttManager.runInstallation);
  });

  it('should store network coordinator configuration, and reload Z2M containers', async () => {
    // PREPARE
    const config = {
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_URL: '192.168.1.20:6638',
      Z2M_NETWORK_ADAPTER_TYPE: 'ember',
      ZIGBEE2MQTT_DRIVER_PATH: null,
      ZIGBEE_DONGLE_NAME: null,
    };
    // EXECUTE
    await zigbee2MqttManager.setup(config);
    // ASSERT
    assert.callCount(gladys.variable.setValue, 3);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_ADAPTER_MODE', 'network', serviceId);
    // The URL has been normalized
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_NETWORK_ADAPTER_URL', 'tcp://192.168.1.20:6638', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_NETWORK_ADAPTER_TYPE', 'ember', serviceId);
    // Destroy variables
    assert.calledWithExactly(gladys.variable.destroy, 'ZIGBEE2MQTT_DRIVER_PATH', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'ZIGBEE_DONGLE_NAME', serviceId);

    assert.calledOnceWithExactly(zigbee2MqttManager.runInstallation);
  });

  it('should not store an invalid network coordinator configuration', async () => {
    // PREPARE
    const config = {
      Z2M_ADAPTER_MODE: 'network',
      Z2M_NETWORK_ADAPTER_URL: 'not-an-url',
      Z2M_NETWORK_ADAPTER_TYPE: 'ember',
    };
    // EXECUTE
    try {
      await zigbee2MqttManager.setup(config);
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal(
        'Zigbee2mqtt: network coordinator URL "not-an-url" is invalid, expected format is "tcp://<host>:<port>"',
      );
    }
    // ASSERT
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(gladys.variable.destroy);
    assert.notCalled(zigbee2MqttManager.runInstallation);
    expect(zigbee2MqttManager.installation.state).to.equal('idle');
  });

  it('should answer at once, while the installation runs in the background', async () => {
    // PREPARE
    zigbee2MqttManager.runInstallation = fake.returns(new Promise(() => {}));
    // EXECUTE
    await zigbee2MqttManager.setup({ ZIGBEE2MQTT_DRIVER_PATH: 'usb0', ZIGBEE_DONGLE_NAME: 'dongle-name' });
    // ASSERT
    assert.calledOnce(zigbee2MqttManager.runInstallation);
    // Already running when the setup page reads it
    expect(zigbee2MqttManager.installation).to.include({ state: 'running', kind: 'install' });
  });

  [
    ['a USB dongle', { z2mDriverPath: 'usb0' }, 'switch'],
    ['an old installation without adapter mode', { z2mAdapterMode: null, z2mDriverPath: 'usb0' }, 'switch'],
    ['a network coordinator', { z2mAdapterMode: 'network', z2mNetworkAdapterUrl: 'tcp://192.168.1.20:6638' }, 'switch'],
    ['a network mode without coordinator', { z2mAdapterMode: 'network', z2mDriverPath: 'usb0' }, 'install'],
    ['no coordinator', { z2mAdapterMode: 'usb' }, 'install'],
  ].forEach(([label, configuration, kind]) => {
    it(`should ${kind} Zigbee2mqtt when ${label} was configured`, async () => {
      // PREPARE
      zigbee2MqttManager.getConfiguration = fake.resolves(configuration);
      // EXECUTE
      await zigbee2MqttManager.setup({ ZIGBEE2MQTT_DRIVER_PATH: 'usb1', ZIGBEE_DONGLE_NAME: 'dongle-name' });
      // ASSERT
      expect(zigbee2MqttManager.installation.kind).to.equal(kind);
    });
  });

  it('should refuse a setup while an installation runs', async () => {
    // PREPARE
    zigbee2MqttManager.startInstallation('install');
    // EXECUTE
    const promise = zigbee2MqttManager.setup({ ZIGBEE2MQTT_DRIVER_PATH: 'usb0', ZIGBEE_DONGLE_NAME: 'dongle-name' });
    // ASSERT
    await expect(promise).to.be.rejectedWith(ConflictError);
    // The running installation reads the stored setup
    assert.notCalled(gladys.variable.setValue);
    assert.notCalled(zigbee2MqttManager.runInstallation);
    expect(zigbee2MqttManager.installation.state).to.equal('running');
  });

  it('should end the installation when the setup fails to be stored', async () => {
    // PREPARE
    gladys.variable.setValue = fake.rejects(new Error('database is locked'));
    // EXECUTE
    const promise = zigbee2MqttManager.setup({ ZIGBEE2MQTT_DRIVER_PATH: 'usb0', ZIGBEE_DONGLE_NAME: 'dongle-name' });
    // ASSERT
    await expect(promise).to.be.rejectedWith('database is locked');
    assert.notCalled(zigbee2MqttManager.runInstallation);
    // Not left running, which would refuse every other setup
    expect(zigbee2MqttManager.installation.state).to.equal('failed');
    expect(zigbee2MqttManager.installation.error).to.deep.equal({ code: null, message: 'database is locked' });
  });

  it('should end the installation when its job fails to start', async () => {
    // PREPARE
    zigbee2MqttManager.runInstallation = fake.rejects(new Error('SQLITE_FULL'));
    // EXECUTE
    await zigbee2MqttManager.setup({ ZIGBEE2MQTT_DRIVER_PATH: 'usb0', ZIGBEE_DONGLE_NAME: 'dongle-name' });
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    // ASSERT
    expect(zigbee2MqttManager.installation.state).to.equal('failed');
    expect(zigbee2MqttManager.installation.error).to.deep.equal({ code: null, message: 'SQLITE_FULL' });
  });

  it('should keep the outcome told by a failed installation', async () => {
    // PREPARE
    const error = { code: 'ADAPTER_NO_RESPONSE', message: null };
    zigbee2MqttManager.runInstallation = fake(async () => {
      zigbee2MqttManager.installation.state = 'failed';
      zigbee2MqttManager.installation.error = error;
      throw new Error('Zigbee2mqtt failed to start: ADAPTER_NO_RESPONSE');
    });
    // EXECUTE
    await zigbee2MqttManager.setup({ ZIGBEE2MQTT_DRIVER_PATH: 'usb0', ZIGBEE_DONGLE_NAME: 'dongle-name' });
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
    // ASSERT
    expect(zigbee2MqttManager.installation.error).to.equal(error);
  });
});
