const EventEmitter = require('events');
const sinon = require('sinon').createSandbox();
const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');

const { assert, fake } = sinon;
const { MockedMqttClient } = require('../mocks.test');

const { CONFIGURATION, DEFAULT } = require('../../../../services/mqtt/lib/constants');
const MqttHandler = require('../../../../services/mqtt/lib');

describe('mqttHandler.init', () => {
  it('should init', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves('value'),
      },
      system: {
        isDocker: fake.resolves(false),
      },
      device: {
        get: fake.resolves([{ external_id: 'homeassistant:my-device', params: [], features: [] }]),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    const listenToHomeAssistantDeviceStateIfNeeded = sinon.spy(mqttHandler, 'listenToHomeAssistantDeviceStateIfNeeded');
    await mqttHandler.init();
    assert.callCount(gladys.variable.getValue, 3);
    assert.calledWith(gladys.device.get, { service: 'mqtt' });
    assert.calledOnce(listenToHomeAssistantDeviceStateIfNeeded);
    expect(Object.keys(mqttHandler.topicBinds)).is.deep.eq([...DEFAULT.TOPICS, 'homeassistant/#']);
  });

  it('should recreate a missing embedded broker with the stored credentials, then connect to it', async () => {
    const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';
    const recreateMissingContainer = proxyquire('../../../../services/mqtt/lib/recreateMissingContainer', {
      util: {
        // Fake promisify to resolve it directly
        promisify: () => () => {},
      },
    });
    const MqttHandlerWithoutSleep = proxyquire('../../../../services/mqtt/lib', {
      './recreateMissingContainer': recreateMissingContainer,
    });

    // Database restored from a backup of an instance using the embedded broker
    const storedVariables = {
      [CONFIGURATION.MQTT_URL_KEY]: 'mqtt://localhost',
      [CONFIGURATION.MQTT_USERNAME_KEY]: 'gladys',
      [CONFIGURATION.MQTT_PASSWORD_KEY]: 'stored-password',
      [CONFIGURATION.MQTT_EMBEDDED_BROKER_KEY]: '1',
      [CONFIGURATION.MQTT_MOSQUITTO_VERSION]: DEFAULT.MOSQUITTO_VERSION,
    };
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
      variable: {
        getValue: fake((key) => Promise.resolve(storedVariables[key])),
        setValue: fake.resolves(null),
      },
      system: {
        isDocker: fake.resolves(true),
        getNetworkMode: fake.resolves('host'),
        // New machine: no broker container
        getContainers: fake.resolves([]),
        getGladysBasePath: fake.resolves({ basePathOnHost: '/var/lib/gladysassistant' }),
        pull: fake.resolves(null),
        createContainer: fake.resolves({ id: 'new-broker' }),
        restartContainer: fake.resolves(null),
        exec: fake.resolves(true),
        removeContainer: fake.resolves(null),
      },
      device: {
        get: fake.resolves([]),
      },
    };
    const mqttLibrary = {
      connect: fake.returns(new EventEmitter()),
    };

    const mqttHandler = new MqttHandlerWithoutSleep(gladys, mqttLibrary, serviceId);
    // Writes in /var/lib/gladysassistant/mosquitto
    mqttHandler.configureContainer = fake.resolves(null);
    const saveConfiguration = sinon.spy(mqttHandler, 'saveConfiguration');

    await mqttHandler.init();

    assert.calledOnce(gladys.system.createContainer);
    assert.calledOnceWithExactly(gladys.system.exec, 'new-broker', {
      Cmd: ['mosquitto_passwd', '-b', DEFAULT.PASSWORD_FILE_PATH, 'gladys', 'stored-password'],
    });
    // The recreated broker is up-to-date: no upgrade follows
    assert.notCalled(gladys.system.removeContainer);
    assert.notCalled(saveConfiguration);
    // Connected with the stored credentials, not new ones
    assert.calledOnce(mqttLibrary.connect);
    expect(mqttLibrary.connect.firstCall.args[0]).to.equal('mqtt://localhost');
    expect(mqttLibrary.connect.firstCall.args[1]).to.include({ username: 'gladys', password: 'stored-password' });
  });
});
