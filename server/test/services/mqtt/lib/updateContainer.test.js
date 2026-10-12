const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');

const { assert, fake } = sinon;

const { ConflictError } = require('../../../../utils/coreErrors');

const { MockedMqttClient } = require('../mocks.test');
const { CONFIGURATION, DEFAULT } = require('../../../../services/mqtt/lib/constants');

const installContainerMock = { installContainer: fake.resolves({ id: 'id' }) };
const saveConfiguration = proxyquire('../../../../services/mqtt/lib/saveConfiguration', {
  util: {
    // Fake promisify to revolve it directly
    promisify: () => () => {},
  },
});

const MqttHandler = proxyquire('../../../../services/mqtt/lib', {
  './installContainer': installContainerMock,
  './saveConfiguration': saveConfiguration,
});

const gladys = {
  variable: {
    setValue: fake.resolves(null),
  },
  system: {
    getContainers: fake.resolves([]),
    removeContainer: fake.resolves(null),
    restartContainer: fake.resolves(null),
  },
};
const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.updateContainer', () => {
  let mqttHandler;

  beforeEach(() => {
    mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should updateContainer: not Docker configured', async () => {
    const config = { brokerContainerAvailable: false };

    await mqttHandler.updateContainer(config);

    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);
    assert.notCalled(gladys.system.restartContainer);
    assert.notCalled(installContainerMock.installContainer);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should updateContainer: already up-to-date', async () => {
    const config = {
      brokerContainerAvailable: true,
      mosquittoVersion: DEFAULT.MOSQUITTO_VERSION,
    };

    await mqttHandler.updateContainer(config);

    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);
    assert.notCalled(gladys.system.restartContainer);
    assert.notCalled(installContainerMock.installContainer);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should updateContainer: no MQTT container found', async () => {
    const config = { brokerContainerAvailable: true };

    await mqttHandler.updateContainer(config);

    assert.calledOnce(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);
    assert.calledOnce(gladys.system.restartContainer);
    assert.calledOnce(installContainerMock.installContainer);

    assert.calledOnceWithExactly(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_MOSQUITTO_VERSION,
      DEFAULT.MOSQUITTO_VERSION,
      serviceId,
    );
  });

  it('should updateContainer: missing log limitation', async () => {
    const config = {
      brokerContainerAvailable: true,
      mosquittoVersion: '2',
    };
    gladys.system.getContainers = fake.resolves([
      { id: 'container', name: '/eclipse-mosquitto', labels: { 'io.gladysassistant.service': 'mqtt' } },
    ]);

    await mqttHandler.updateContainer(config);

    assert.calledOnce(gladys.system.getContainers);

    assert.calledOnce(gladys.system.removeContainer);
    assert.calledWith(gladys.system.removeContainer, 'container', { force: true });

    assert.calledOnce(gladys.system.restartContainer);

    assert.calledOnce(installContainerMock.installContainer);

    assert.calledOnceWithExactly(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_MOSQUITTO_VERSION,
      DEFAULT.MOSQUITTO_VERSION,
      serviceId,
    );
  });

  it('should updateContainer: never remove a user container carrying our name', async () => {
    const config = {
      brokerContainerAvailable: true,
      mosquittoVersion: '2',
    };
    gladys.system.getContainers = fake.resolves([{ id: 'user-container', name: '/eclipse-mosquitto', image: 'nginx' }]);
    gladys.system.inspectContainer = fake.resolves({ Config: { Image: 'nginx:alpine' } });

    let error;
    try {
      await mqttHandler.updateContainer(config);
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(ConflictError);
    assert.notCalled(gladys.system.removeContainer);
    assert.notCalled(installContainerMock.installContainer);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should updateContainer: leave alone an unlabeled broker Gladys never configured', async () => {
    // no stored version: Gladys never configured a broker, and the container has no label,
    // so it is a user broker created from the public image under our name
    const config = {
      brokerContainerAvailable: true,
      mosquittoVersion: null,
    };
    gladys.system.getContainers = fake.resolves([
      { id: 'user-broker', name: '/eclipse-mosquitto', image: 'eclipse-mosquitto:2' },
    ]);
    gladys.system.inspectContainer = fake.resolves({ Config: { Image: 'eclipse-mosquitto:2' } });

    const result = await mqttHandler.updateContainer(config);

    expect(result).to.equal(config);
    assert.notCalled(gladys.system.removeContainer);
    assert.notCalled(installContainerMock.installContainer);
    assert.notCalled(gladys.system.restartContainer);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should updateContainer: still upgrade an unlabeled broker Gladys configured', async () => {
    const config = {
      brokerContainerAvailable: true,
      mosquittoVersion: '2',
    };
    gladys.system.getContainers = fake.resolves([
      { id: 'legacy', name: '/eclipse-mosquitto', image: 'eclipse-mosquitto:2' },
    ]);
    gladys.system.inspectContainer = fake.resolves({ Config: { Image: 'eclipse-mosquitto:2' } });

    await mqttHandler.updateContainer(config);

    assert.calledOnceWithExactly(gladys.system.removeContainer, 'legacy', { force: true });
    assert.calledOnce(installContainerMock.installContainer);
  });
});
