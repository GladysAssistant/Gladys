const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const { MockedMqttClient } = require('../mocks.test');
const { CONFIGURATION } = require('../../../../services/mqtt/lib/constants');
const MqttHandler = require('../../../../services/mqtt/lib');

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

const build = (overrides = {}) => {
  const gladys = {
    variable: { getValue: fake.resolves(null), setValue: fake.resolves(null) },
    system: { getContainers: fake.resolves([]) },
  };
  const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
  mqttHandler.getBrokerContainerName = fake.resolves('eclipse-mosquitto');
  mqttHandler.isBrokerPortAvailable = fake.resolves(true);
  Object.assign(mqttHandler, overrides);
  return { gladys, mqttHandler };
};

describe('mqttHandler.getBrokerPort', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should reuse an already persisted port without any lookup', async () => {
    const { gladys, mqttHandler } = build();
    gladys.variable.getValue = fake.resolves('1885');

    const port = await mqttHandler.getBrokerPort();

    expect(port).to.equal(1885);
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should keep the default port when our broker already exists (existing install)', async () => {
    const { gladys, mqttHandler } = build();
    gladys.system.getContainers = fake.resolves([
      { id: 'ours', name: '/eclipse-mosquitto', image: 'eclipse-mosquitto' },
    ]);
    // Even if 1883 looks busy, we never move an existing broker
    mqttHandler.isBrokerPortAvailable = fake.resolves(false);

    const port = await mqttHandler.getBrokerPort();

    expect(port).to.equal(1883);
    assert.calledOnceWithExactly(gladys.variable.setValue, CONFIGURATION.MQTT_BROKER_PORT, '1883', serviceId);
  });

  it('should use the default port on a fresh install when 1883 is free', async () => {
    const { gladys, mqttHandler } = build();
    mqttHandler.isBrokerPortAvailable = fake.resolves(true);

    const port = await mqttHandler.getBrokerPort();

    expect(port).to.equal(1883);
    assert.calledOnceWithExactly(gladys.variable.setValue, CONFIGURATION.MQTT_BROKER_PORT, '1883', serviceId);
  });

  it('should relocate to the next free port when 1883 is taken (skipping reserved 1884)', async () => {
    const { gladys, mqttHandler } = build();
    // 1883 taken, 1884 is reserved (skipped without testing), 1885 free
    mqttHandler.isBrokerPortAvailable = fake(async (port) => port === 1885);

    const port = await mqttHandler.getBrokerPort();

    expect(port).to.equal(1885);
    assert.neverCalledWith(mqttHandler.isBrokerPortAvailable, 1884);
    assert.calledOnceWithExactly(gladys.variable.setValue, CONFIGURATION.MQTT_BROKER_PORT, '1885', serviceId);
  });

  it('should throw when no free port is found after the max attempts', async () => {
    const { mqttHandler } = build();
    mqttHandler.isBrokerPortAvailable = fake.resolves(false);

    let error;
    try {
      await mqttHandler.getBrokerPort();
    } catch (e) {
      error = e;
    }
    expect(error).to.be.an('error');
    expect(error.message).to.contain('unable to find a free broker port');
  });
});
