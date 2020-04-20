const sinon = require('sinon');

const { assert, fake } = sinon;
const { MockedMqttClient } = require('../mocks.test');
const { CONFIGURATION, DEFAULT } = require('../../../../services/mqtt/lib/constants');
const MqttHandler = require('../../../../services/mqtt/lib');

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.saveConfiguration', () => {
  it('should saveConfiguration: save all', async () => {
    const gladys = {
      variable: {
        setValue: fake.resolves('value'),
      },
    };

    const config = {
      mqttUrl: 'mqttUrl',
      mqttUsername: 'mqttUsername',
      mqttPassword: 'mqttPassword',
      useEmbeddedBroker: false,
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    await mqttHandler.saveConfiguration(config);

    assert.callCount(gladys.variable.setValue, 4);
    assert.calledWith(gladys.variable.setValue, CONFIGURATION.MQTT_URL_KEY, config.mqttUrl, serviceId);
    assert.calledWith(gladys.variable.setValue, CONFIGURATION.MQTT_USERNAME_KEY, config.mqttUsername, serviceId);
    assert.calledWith(gladys.variable.setValue, CONFIGURATION.MQTT_PASSWORD_KEY, config.mqttPassword, serviceId);
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY,
      config.useEmbeddedBroker,
      serviceId,
    );
  });

  it('should saveConfiguration: destroy all', async () => {
    const gladys = {
      variable: {
        destroy: fake.resolves('value'),
        setValue: fake.resolves('value'),
      },
    };

    const config = {
      mqttUrl: 'mqttUrl',
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    await mqttHandler.saveConfiguration(config);

    assert.callCount(gladys.variable.destroy, 3);
    assert.callCount(gladys.variable.setValue, 1);
    assert.calledWith(gladys.variable.destroy, CONFIGURATION.MQTT_USERNAME_KEY, serviceId);
    assert.calledWith(gladys.variable.destroy, CONFIGURATION.MQTT_PASSWORD_KEY);
    assert.calledWith(gladys.variable.destroy, CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY, serviceId);
  });

  it('should saveConfiguration: init docker but no container', async () => {
    const gladys = {
      variable: {
        destroy: fake.resolves('value'),
        setValue: fake.resolves('value'),
      },
      system: {
        getContainers: fake.resolves([]),
        exec: fake.resolves(true),
        restartContainer: fake.resolves(true),
      },
    };

    const config = {
      mqttUrl: 'mqttUrl',
      useEmbeddedBroker: true,
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    await mqttHandler.saveConfiguration(config);

    assert.callCount(gladys.variable.destroy, 2);
    assert.callCount(gladys.variable.setValue, 2);
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY,
      config.useEmbeddedBroker,
      serviceId,
    );

    assert.calledOnce(gladys.system.getContainers);
    assert.notCalled(gladys.system.exec);
    assert.notCalled(gladys.system.restartContainer);
  });

  it('should saveConfiguration: init docker container no present', async () => {
    const gladys = {
      variable: {
        destroy: fake.resolves('value'),
        setValue: fake.resolves('value'),
      },
      system: {
        getContainers: fake.resolves([
          {
            image: 'another-image',
          },
        ]),
        exec: fake.resolves(true),
        restartContainer: fake.resolves(true),
      },
    };

    const config = {
      mqttUrl: 'mqttUrl',
      useEmbeddedBroker: true,
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    await mqttHandler.saveConfiguration(config);

    assert.callCount(gladys.variable.destroy, 2);
    assert.callCount(gladys.variable.setValue, 2);
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY,
      config.useEmbeddedBroker,
      serviceId,
    );

    assert.calledOnce(gladys.system.getContainers);
    assert.calledTwice(gladys.system.exec);
    assert.calledTwice(gladys.system.restartContainer);
  });

  it('should saveConfiguration: init docker container not running', async () => {
    const gladys = {
      variable: {
        destroy: fake.resolves('value'),
        setValue: fake.resolves('value'),
      },
      system: {
        getContainers: fake.resolves([
          {
            image: DEFAULT.MQTT_IMAGE,
          },
        ]),
        exec: fake.resolves(true),
        restartContainer: fake.resolves(true),
      },
    };

    const config = {
      mqttUrl: 'mqttUrl',
      useEmbeddedBroker: true,
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    await mqttHandler.saveConfiguration(config);

    assert.callCount(gladys.variable.destroy, 2);
    assert.callCount(gladys.variable.setValue, 2);
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY,
      config.useEmbeddedBroker,
      serviceId,
    );

    assert.calledOnce(gladys.system.getContainers);
    assert.calledTwice(gladys.system.exec);
    assert.calledTwice(gladys.system.restartContainer);
  });

  it('should saveConfiguration: init docker container is running', async () => {
    const gladys = {
      variable: {
        destroy: fake.resolves('value'),
        setValue: fake.resolves('value'),
      },
      system: {
        getContainers: fake.resolves([
          {
            image: DEFAULT.MQTT_IMAGE,
            state: 'running',
          },
        ]),
        exec: fake.resolves(true),
        restartContainer: fake.resolves(true),
      },
    };

    const config = {
      mqttUrl: 'mqttUrl',
      useEmbeddedBroker: true,
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    await mqttHandler.saveConfiguration(config);

    assert.callCount(gladys.variable.destroy, 2);
    assert.callCount(gladys.variable.setValue, 2);
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY,
      config.useEmbeddedBroker,
      serviceId,
    );

    assert.calledOnce(gladys.system.getContainers);
    assert.calledTwice(gladys.system.exec);
    assert.calledOnce(gladys.system.restartContainer);
  });
});
