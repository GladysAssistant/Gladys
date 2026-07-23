const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const { MockedMqttClient } = require('../mocks.test');
const { CONFIGURATION } = require('../../../../services/mqtt/lib/constants');
const MqttHandler = require('../../../../services/mqtt/lib');

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';
const NAME = 'eclipse-mosquitto';

describe('mqttHandler.getBrokerContainerName', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should reuse an already persisted name without any Docker lookup', async () => {
    const gladys = {
      variable: { getValue: fake.resolves('eclipse-mosquitto-persisted'), setValue: fake.resolves(null) },
      system: { getContainers: fake.resolves([]) },
    };
    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);

    const name = await mqttHandler.getBrokerContainerName();

    expect(name).to.equal('eclipse-mosquitto-persisted');
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should resolve and persist the default name on a fresh install', async () => {
    const gladys = {
      variable: { getValue: fake.resolves(null), setValue: fake.resolves(null) },
      system: { getContainers: fake.resolves([]) },
    };
    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);

    const name = await mqttHandler.getBrokerContainerName();

    expect(name).to.equal(NAME);
    assert.calledOnceWithExactly(gladys.variable.setValue, CONFIGURATION.MQTT_CONTAINER_NAME, NAME, serviceId);
  });

  it('should adopt an existing mosquitto broker (image proves it is ours)', async () => {
    const gladys = {
      variable: { getValue: fake.resolves(null), setValue: fake.resolves(null) },
      system: {
        getContainers: fake.resolves([{ id: 'ours', name: `/${NAME}`, image: 'eclipse-mosquitto:2.0.15' }]),
      },
    };
    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);

    const name = await mqttHandler.getBrokerContainerName();

    expect(name).to.equal(NAME);
    assert.calledOnceWithExactly(gladys.variable.setValue, CONFIGURATION.MQTT_CONTAINER_NAME, NAME, serviceId);
  });

  it('should allocate a suffixed name when a foreign container owns the default name', async () => {
    const gladys = {
      variable: { getValue: fake.resolves(null), setValue: fake.resolves(null) },
      system: {
        getContainers: fake(async ({ filters }) => {
          if (filters.name[0] === NAME) {
            return [{ id: 'foreign', name: `/${NAME}`, image: 'nginx:latest' }];
          }
          return [];
        }),
      },
    };
    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);

    const name = await mqttHandler.getBrokerContainerName();

    expect(name).to.match(/^eclipse-mosquitto-[a-z0-9]{7}$/);
    assert.calledOnceWithExactly(gladys.variable.setValue, CONFIGURATION.MQTT_CONTAINER_NAME, name, serviceId);
  });

  it('should ignore a user container that only matches as a substring', async () => {
    const gladys = {
      variable: { getValue: fake.resolves(null), setValue: fake.resolves(null) },
      system: {
        getContainers: fake.resolves([{ id: 'user', name: '/eclipse-mosquitto-custom', image: 'eclipse-mosquitto' }]),
      },
    };
    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);

    const name = await mqttHandler.getBrokerContainerName();

    expect(name).to.equal(NAME);
  });
});
