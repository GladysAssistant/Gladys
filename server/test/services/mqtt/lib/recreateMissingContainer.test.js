const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');

const { assert, fake } = sinon;

const { MockedMqttClient } = require('../mocks.test');
const { CONFIGURATION, DEFAULT } = require('../../../../services/mqtt/lib/constants');

const recreateMissingContainer = proxyquire('../../../../services/mqtt/lib/recreateMissingContainer', {
  util: {
    // Fake promisify to resolve it directly
    promisify: () => () => {},
  },
});

const MqttHandler = proxyquire('../../../../services/mqtt/lib', {
  './recreateMissingContainer': recreateMissingContainer,
});

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

// Configuration read from the database restored on a new machine: the embedded broker
// was configured by Gladys, but its container does not exist on this machine
const restoredConfiguration = {
  mqttUrl: 'mqtt://localhost',
  mqttUsername: 'gladys',
  mqttPassword: 'stored-password',
  useEmbeddedBroker: true,
  dockerBased: true,
  brokerContainerAvailable: false,
  networkModeValid: true,
  mosquittoVersion: DEFAULT.MOSQUITTO_VERSION,
};

describe('mqttHandler.recreateMissingContainer', () => {
  let gladys;
  let mqttHandler;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
      variable: {
        getValue: fake.resolves(null),
        setValue: fake.resolves(null),
      },
      system: {
        getContainers: fake.resolves([]),
        getNetworkMode: fake.resolves('host'),
        getGladysBasePath: fake.resolves({ basePathOnHost: '/var/lib/gladysassistant' }),
        pull: fake.resolves(null),
        createContainer: fake.resolves({ id: 'new-broker' }),
        restartContainer: fake.resolves(null),
        exec: fake.resolves(true),
      },
    };
    mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    // Writes in /var/lib/gladysassistant/mosquitto
    mqttHandler.configureContainer = fake.resolves(null);
    mqttHandler.saveConfiguration = fake.resolves(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should recreate the missing broker with the stored credentials', async () => {
    const result = await mqttHandler.recreateMissingContainer({ ...restoredConfiguration });

    expect(result).to.deep.eq({
      ...restoredConfiguration,
      brokerContainerAvailable: true,
      mosquittoVersion: DEFAULT.MOSQUITTO_VERSION,
    });

    // Looked up before deciding to recreate, then by installContainer itself
    assert.calledTwice(gladys.system.getContainers);
    assert.alwaysCalledWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['eclipse-mosquitto'] },
    });
    assert.calledOnceWithExactly(gladys.system.pull, 'eclipse-mosquitto:2.0.15');
    assert.calledOnce(mqttHandler.configureContainer);
    assert.calledOnce(gladys.system.createContainer);
    expect(gladys.system.createContainer.firstCall.args[0].Labels).to.deep.eq({ 'io.gladysassistant.service': 'mqtt' });
    expect(gladys.system.createContainer.firstCall.args[0].HostConfig.Binds).to.deep.eq([
      '/var/lib/gladysassistant/mosquitto:/mosquitto/config',
    ]);

    // Started to run mosquitto_passwd, then restarted to load the password file
    assert.calledTwice(gladys.system.restartContainer);
    assert.alwaysCalledWithExactly(gladys.system.restartContainer, 'new-broker');
    assert.calledOnceWithExactly(gladys.system.exec, 'new-broker', {
      Cmd: ['mosquitto_passwd', '-b', DEFAULT.PASSWORD_FILE_PATH, 'gladys', 'stored-password'],
    });
    assert.callOrder(gladys.system.createContainer, gladys.system.restartContainer, gladys.system.exec);
    expect(gladys.system.restartContainer.secondCall.calledAfter(gladys.system.exec.firstCall)).to.equal(true);

    // The stored credentials are kept: no new password is generated nor saved
    assert.notCalled(mqttHandler.saveConfiguration);
    assert.calledOnceWithExactly(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_MOSQUITTO_VERSION,
      DEFAULT.MOSQUITTO_VERSION,
      serviceId,
    );
  });

  it('should do nothing when the broker container is available', async () => {
    const configuration = { ...restoredConfiguration, brokerContainerAvailable: true };

    const result = await mqttHandler.recreateMissingContainer(configuration);

    expect(result).to.equal(configuration);
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.createContainer);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should do nothing when the embedded broker is not used', async () => {
    // External broker, not on Docker, or Gladys not on the host network
    const configuration = { ...restoredConfiguration, useEmbeddedBroker: false };

    const result = await mqttHandler.recreateMissingContainer(configuration);

    expect(result).to.equal(configuration);
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.createContainer);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should do nothing when Gladys never configured the embedded broker', async () => {
    // useEmbeddedBroker is true by default on the host network, even when MQTT was never configured
    const configuration = {
      ...restoredConfiguration,
      mqttUrl: null,
      mqttUsername: null,
      mqttPassword: null,
      mosquittoVersion: null,
    };

    const result = await mqttHandler.recreateMissingContainer(configuration);

    expect(result).to.equal(configuration);
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.createContainer);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should do nothing when no credentials are stored', async () => {
    const withoutUsername = { ...restoredConfiguration, mqttUsername: null };
    const withoutPassword = { ...restoredConfiguration, mqttPassword: null };

    expect(await mqttHandler.recreateMissingContainer(withoutUsername)).to.equal(withoutUsername);
    expect(await mqttHandler.recreateMissingContainer(withoutPassword)).to.equal(withoutPassword);

    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.createContainer);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should leave untouched a user container carrying our name', async () => {
    gladys.system.getContainers = fake.resolves([{ id: 'user-broker', name: '/eclipse-mosquitto', image: 'nginx' }]);
    gladys.system.removeContainer = fake.resolves(null);
    const configuration = { ...restoredConfiguration };

    const result = await mqttHandler.recreateMissingContainer(configuration);

    expect(result).to.equal(configuration);
    assert.calledOnce(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);
    assert.notCalled(gladys.system.pull);
    assert.notCalled(gladys.system.createContainer);
    assert.notCalled(gladys.system.restartContainer);
    assert.notCalled(gladys.system.exec);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should not crash when the broker cannot be recreated', async () => {
    gladys.system.pull = fake.rejects(new Error('network unreachable'));
    const configuration = { ...restoredConfiguration };

    const result = await mqttHandler.recreateMissingContainer(configuration);

    expect(result).to.equal(configuration);
    assert.notCalled(gladys.system.createContainer);
    assert.notCalled(gladys.system.exec);
    assert.notCalled(mqttHandler.saveConfiguration);
    assert.notCalled(gladys.variable.setValue);
  });
});
