const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');

const { assert, fake } = sinon;
const { MockedMqttClient } = require('../mocks.test');
const { CONFIGURATION, DEFAULT } = require('../../../../services/mqtt/lib/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');

const saveConfiguration = proxyquire('../../../../services/mqtt/lib/saveConfiguration', {
  util: {
    // Fake promisify to revolve it directly
    promisify: () => () => {},
  },
});

const MqttHandler = proxyquire('../../../../services/mqtt/lib', {
  './saveConfiguration': saveConfiguration,
});

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.saveConfiguration', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should saveConfiguration: save all', async () => {
    const gladys = {
      variable: {
        setValue: fake.resolves('value'),
        getValue: fake.resolves(true),
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
        getValue: fake.resolves(true),
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
        getValue: fake.resolves(true),
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
    try {
      await mqttHandler.saveConfiguration(config);
      assert.fail('Should have fail');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
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
    }
  });

  it('should saveConfiguration: init docker container no present (no user)', async () => {
    const gladys = {
      variable: {
        destroy: fake.resolves('value'),
        setValue: fake.resolves('value'),
        getValue: fake.resolves(true),
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
    assert.callCount(gladys.variable.setValue, 3);
    assert.calledWith(gladys.variable.setValue, CONFIGURATION.MQTT_URL_KEY, config.mqttUrl, serviceId);
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY,
      config.useEmbeddedBroker,
      serviceId,
    );
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_MOSQUITTO_VERSION,
      DEFAULT.MOSQUITTO_VERSION,
      serviceId,
    );

    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.exec);
    assert.calledTwice(gladys.system.restartContainer);
  });

  it('should saveConfiguration: init docker container not running (no user)', async () => {
    const gladys = {
      variable: {
        destroy: fake.resolves('value'),
        setValue: fake.resolves('value'),
        getValue: fake.resolves(true),
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
    assert.callCount(gladys.variable.setValue, 3);
    assert.calledWith(gladys.variable.setValue, CONFIGURATION.MQTT_URL_KEY, config.mqttUrl, serviceId);
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY,
      config.useEmbeddedBroker,
      serviceId,
    );
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_MOSQUITTO_VERSION,
      DEFAULT.MOSQUITTO_VERSION,
      serviceId,
    );

    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.exec);
    assert.calledTwice(gladys.system.restartContainer);
  });

  it('should saveConfiguration: init docker container is running (no user)', async () => {
    const gladys = {
      variable: {
        destroy: fake.resolves('value'),
        setValue: fake.resolves('value'),
        getValue: fake.resolves(true),
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
    assert.callCount(gladys.variable.setValue, 3);
    assert.calledWith(gladys.variable.setValue, CONFIGURATION.MQTT_URL_KEY, config.mqttUrl, serviceId);
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY,
      config.useEmbeddedBroker,
      serviceId,
    );
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_MOSQUITTO_VERSION,
      DEFAULT.MOSQUITTO_VERSION,
      serviceId,
    );

    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.exec);
    assert.calledOnce(gladys.system.restartContainer);
  });

  it('should saveConfiguration: init docker container is running (with user no old)', async () => {
    const gladys = {
      variable: {
        destroy: fake.resolves('value'),
        setValue: fake.resolves('value'),
        getValue: fake.resolves(null),
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
      mqttUsername: 'user',
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    await mqttHandler.saveConfiguration(config);

    assert.callCount(gladys.variable.destroy, 1);
    assert.callCount(gladys.variable.setValue, 4);
    assert.calledWith(gladys.variable.setValue, CONFIGURATION.MQTT_URL_KEY, config.mqttUrl, serviceId);
    assert.calledWith(gladys.variable.setValue, CONFIGURATION.MQTT_USERNAME_KEY, config.mqttUsername, serviceId);
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY,
      config.useEmbeddedBroker,
      serviceId,
    );
    assert.calledWith(
      gladys.variable.setValue,
      CONFIGURATION.MQTT_MOSQUITTO_VERSION,
      DEFAULT.MOSQUITTO_VERSION,
      serviceId,
    );

    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.exec);
    assert.calledOnce(gladys.system.restartContainer);
  });
});
