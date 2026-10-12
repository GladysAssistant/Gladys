const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');

const { assert, fake } = sinon;

const { MockedMqttClient } = require('../mocks.test');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { CONFIGURATION, DEFAULT } = require('../../../../services/mqtt/lib/constants');
const { ConflictError } = require('../../../../utils/coreErrors');

const execMock = { exec: fake.resolves('command well executed') };
const installContainer = proxyquire('../../../../services/mqtt/lib/installContainer', {
  '../../../utils/childProcess': execMock,
});
const saveConfiguration = proxyquire('../../../../services/mqtt/lib/saveConfiguration', {
  util: {
    // Fake promisify to revolve it directly
    promisify: () => () => {},
  },
});

const MqttHandler = proxyquire('../../../../services/mqtt/lib', {
  './installContainer': installContainer,
  './saveConfiguration': saveConfiguration,
});

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.installContainer', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should installContainer: pull failed', async () => {
    const error = new Error('error message');
    const gladys = {
      event: {
        emit: fake.resolves(true),
      },
      system: {
        getNetworkMode: fake.rejects(error),
        getGladysBasePath: fake.resolves({
          basePathOnHost: '/var/lib/gladysassistant',
          basePathOnContainer: '/var/lib/gladysassistant',
        }),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    mqttHandler.configureContainer = fake.resolves(null);

    try {
      await mqttHandler.installContainer();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).to.be.eq(error);
      assert.notCalled(mqttHandler.configureContainer);
      assert.calledOnce(gladys.event.emit);
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.MQTT.INSTALLATION_STATUS,
        payload: {
          status: DEFAULT.INSTALLATION_STATUS.ERROR,
          detail: error,
        },
      });
    }
  });

  it('should installContainer: pull success', async () => {
    const gladys = {
      event: {
        emit: fake.resolves(true),
      },
      service: {
        getLocalServiceByName: fake.resolves(null),
      },
      system: {
        pull: fake.resolves(false),
        createContainer: fake.resolves(false),
        getContainers: fake.resolves([
          {
            id: 'container',
            name: '/eclipse-mosquitto',
            state: 'running',
            labels: { 'io.gladysassistant.service': 'mqtt' },
          },
        ]),
        exec: fake.resolves(true),
        restartContainer: fake.resolves(true),
        getNetworkMode: fake.resolves('host'),
        getGladysBasePath: fake.resolves({
          basePathOnHost: '/var/lib/gladysassistant',
          basePathOnContainer: '/var/lib/gladysassistant',
        }),
      },
      variable: {
        setValue: fake.resolves(true),
        getValue: fake.resolves(true),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    mqttHandler.configureContainer = fake.resolves(null);

    await mqttHandler.installContainer();

    assert.callCount(gladys.variable.setValue, 5);
    assert.calledOnce(mqttHandler.configureContainer);
    assert.calledOnce(gladys.system.pull);
    assert.calledOnce(gladys.system.createContainer);
    assert.calledOnce(gladys.system.getNetworkMode);
    assert.calledOnce(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.INSTALLATION_STATUS,
      payload: {
        status: DEFAULT.INSTALLATION_STATUS.DONE,
      },
    });
  });

  it('should installContainer: pull success (no save config)', async () => {
    const gladys = {
      event: {
        emit: fake.resolves(true),
      },
      system: {
        pull: fake.resolves(false),
        createContainer: fake.resolves(false),
        getContainers: fake.resolves([
          {
            id: 'container',
            name: '/eclipse-mosquitto',
            state: 'running',
            labels: { 'io.gladysassistant.service': 'mqtt' },
          },
        ]),
        exec: fake.resolves(true),
        restartContainer: fake.resolves(true),
        getNetworkMode: fake.resolves('host'),
        getGladysBasePath: fake.resolves({
          basePathOnHost: '/var/lib/gladysassistant',
          basePathOnContainer: '/var/lib/gladysassistant',
        }),
      },
      variable: {
        setValue: fake.resolves(true),
        getValue: fake.resolves(true),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    mqttHandler.configureContainer = fake.resolves(null);

    await mqttHandler.installContainer(false);

    assert.notCalled(gladys.variable.setValue);
    assert.calledOnce(mqttHandler.configureContainer);
    assert.calledOnce(gladys.system.pull);
    assert.calledOnce(gladys.system.createContainer);
    assert.calledOnce(gladys.system.getNetworkMode);
    assert.calledOnce(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.INSTALLATION_STATUS,
      payload: {
        status: DEFAULT.INSTALLATION_STATUS.DONE,
      },
    });
  });

  it('should installContainer: fail when our name is taken by a user container', async () => {
    const gladys = {
      event: {
        emit: fake.resolves(true),
      },
      system: {
        pull: fake.resolves(false),
        createContainer: fake.resolves(false),
        getContainers: fake.resolves([{ id: 'user-container', name: '/eclipse-mosquitto', image: 'nginx' }]),
        inspectContainer: fake.resolves({ Config: { Image: 'nginx:alpine' } }),
        getNetworkMode: fake.resolves('host'),
        getGladysBasePath: fake.resolves({
          basePathOnHost: '/var/lib/gladysassistant',
          basePathOnContainer: '/var/lib/gladysassistant',
        }),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    mqttHandler.configureContainer = fake.resolves(null);

    let error;
    try {
      await mqttHandler.installContainer();
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(ConflictError);
    assert.notCalled(gladys.system.pull);
    assert.notCalled(gladys.system.createContainer);
    assert.calledOnce(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.INSTALLATION_STATUS,
      payload: {
        status: DEFAULT.INSTALLATION_STATUS.ERROR,
        detail: error,
      },
    });
  });

  it('should installContainer: fail when our name is taken by an unlabeled broker Gladys never configured', async () => {
    const gladys = {
      event: {
        emit: fake.resolves(true),
      },
      system: {
        pull: fake.resolves(false),
        createContainer: fake.resolves(false),
        getContainers: fake.resolves([{ id: 'user-broker', name: '/eclipse-mosquitto', image: 'eclipse-mosquitto:2' }]),
        inspectContainer: fake.resolves({ Config: { Image: 'eclipse-mosquitto:2' } }),
        getNetworkMode: fake.resolves('host'),
        getGladysBasePath: fake.resolves({
          basePathOnHost: '/var/lib/gladysassistant',
          basePathOnContainer: '/var/lib/gladysassistant',
        }),
      },
      variable: {
        // no stored Mosquitto version: Gladys never configured a broker
        getValue: fake.resolves(null),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    mqttHandler.configureContainer = fake.resolves(null);

    let error;
    try {
      await mqttHandler.installContainer();
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(ConflictError);
    assert.calledWith(gladys.variable.getValue, CONFIGURATION.MQTT_MOSQUITTO_VERSION, serviceId);
    assert.notCalled(gladys.system.pull);
    assert.notCalled(gladys.system.createContainer);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MQTT.INSTALLATION_STATUS,
      payload: {
        status: DEFAULT.INSTALLATION_STATUS.ERROR,
        detail: error,
      },
    });
  });
});
