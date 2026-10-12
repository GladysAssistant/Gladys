const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { assert, fake } = sinon;
const { MockedMqttClient } = require('../mocks.test');

const MqttHandler = require('../../../../services/mqtt/lib');

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.getConfiguration', () => {
  it('should getConfiguration: not Docker', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves('value'),
      },
      system: {
        isDocker: fake.resolves(false),
        getContainers: fake.resolves([]),
        getNetworkMode: fake.resolves('host'),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    const config = await mqttHandler.getConfiguration();

    const expectedConfig = {
      mqttUrl: 'value',
      mqttUsername: 'value',
      mqttPassword: 'value',
      useEmbeddedBroker: false,
      dockerBased: false,
      brokerContainerAvailable: false,
      networkModeValid: false,
      mosquittoVersion: null,
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 3);
    assert.calledOnce(gladys.system.isDocker);
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.getNetworkMode);
  });

  it('should getConfiguration: Docker no container', async () => {
    const gladys = {
      variable: {
        getValue: sinon
          .stub()
          .onCall(3)
          .resolves(null)
          .onCall(4)
          .resolves(null)
          .resolves('value'),
      },
      system: {
        isDocker: fake.resolves(true),
        getContainers: fake.resolves([]),
        getNetworkMode: fake.resolves('bridge'),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    const config = await mqttHandler.getConfiguration();

    const expectedConfig = {
      mqttUrl: 'value',
      mqttUsername: 'value',
      mqttPassword: 'value',
      useEmbeddedBroker: false,
      dockerBased: true,
      brokerContainerAvailable: false,
      networkModeValid: false,
      mosquittoVersion: null,
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 5);
    assert.calledOnce(gladys.system.isDocker);
    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.getNetworkMode);
  });

  it('should getConfiguration: Docker existing container', async () => {
    const gladys = {
      variable: {
        getValue: sinon
          .stub()
          .onCall(3)
          .resolves(null)
          .onCall(4)
          .resolves('2')
          .resolves('value'),
      },
      system: {
        isDocker: fake.resolves(true),
        getContainers: fake.resolves([
          {
            name: '/eclipse-mosquitto',
            image: 'eclipse-mosquitto:any-tag',
            labels: { 'io.gladysassistant.service': 'mqtt' },
          },
        ]),
        getNetworkMode: fake.resolves('bridge'),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    const config = await mqttHandler.getConfiguration();

    const expectedConfig = {
      mqttUrl: 'value',
      mqttUsername: 'value',
      mqttPassword: 'value',
      useEmbeddedBroker: false,
      dockerBased: true,
      brokerContainerAvailable: true,
      networkModeValid: false,
      mosquittoVersion: '2',
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 5);
    assert.calledOnce(gladys.system.isDocker);
    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.getNetworkMode);
  });

  it('should getConfiguration: Docker existing container (not use embedded)', async () => {
    const gladys = {
      variable: {
        getValue: sinon
          .stub()
          .onCall(3)
          .resolves('0')
          .onCall(4)
          .resolves(null)
          .resolves('value'),
      },
      system: {
        isDocker: fake.resolves(true),
        getContainers: fake.resolves([
          {
            name: '/eclipse-mosquitto',
            image: 'eclipse-mosquitto:any-tag',
            labels: { 'io.gladysassistant.service': 'mqtt' },
          },
        ]),
        getNetworkMode: fake.resolves('host'),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    const config = await mqttHandler.getConfiguration();

    const expectedConfig = {
      mqttUrl: 'value',
      mqttUsername: 'value',
      mqttPassword: 'value',
      useEmbeddedBroker: false,
      dockerBased: true,
      brokerContainerAvailable: true,
      networkModeValid: true,
      mosquittoVersion: null,
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 5);
    assert.calledOnce(gladys.system.isDocker);
    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.getNetworkMode);
  });

  it('no config on Docker', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves(null),
      },
      system: {
        isDocker: fake.resolves(true),
        getContainers: fake.resolves([]),
        getNetworkMode: fake.resolves('brigde'),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    const config = await mqttHandler.getConfiguration();

    const expectedConfig = {
      mqttUrl: null,
      mqttUsername: null,
      mqttPassword: null,
      useEmbeddedBroker: false,
      dockerBased: true,
      brokerContainerAvailable: false,
      networkModeValid: false,
      mosquittoVersion: null,
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 5);
    assert.calledOnce(gladys.system.isDocker);
    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.getNetworkMode);
  });

  it('no config not on Docker', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves(null),
      },
      system: {
        isDocker: fake.resolves(false),
        getContainers: fake.resolves([]),
        getNetworkMode: fake.resolves('host'),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    const config = await mqttHandler.getConfiguration();

    const expectedConfig = {
      mqttUrl: null,
      mqttUsername: null,
      mqttPassword: null,
      useEmbeddedBroker: false,
      dockerBased: false,
      brokerContainerAvailable: false,
      networkModeValid: false,
      mosquittoVersion: null,
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 3);
    assert.calledOnce(gladys.system.isDocker);
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.getNetworkMode);
  });

  it('gladys on right network', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves(null),
      },
      system: {
        isDocker: fake.resolves(true),
        getContainers: fake.resolves([]),
        getNetworkMode: fake.resolves('host'),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    const config = await mqttHandler.getConfiguration();

    const expectedConfig = {
      mqttUrl: null,
      mqttUsername: null,
      mqttPassword: null,
      useEmbeddedBroker: true,
      dockerBased: true,
      brokerContainerAvailable: false,
      networkModeValid: true,
      mosquittoVersion: null,
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 5);
    assert.calledOnce(gladys.system.isDocker);
    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.getNetworkMode);
  });
  it('should not crash, even if docker based but not with docker socket mounted', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves(null),
      },
      system: {
        isDocker: fake.resolves(true),
        getContainers: fake.rejects(new Error('SYSTEM_NOT_RUNNING_DOCKER')),
        getNetworkMode: fake.rejects(new Error('SYSTEM_NOT_RUNNING_DOCKER')),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    const config = await mqttHandler.getConfiguration();

    const expectedConfig = {
      mqttUrl: null,
      mqttUsername: null,
      mqttPassword: null,
      useEmbeddedBroker: false,
      dockerBased: true,
      brokerContainerAvailable: false,
      networkModeValid: false,
      mosquittoVersion: null,
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 5);
    assert.calledOnce(gladys.system.isDocker);
    assert.calledOnce(gladys.system.getNetworkMode);
  });

  it('should getConfiguration: a user broker carrying our name is not our embedded broker', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves(null),
      },
      system: {
        isDocker: fake.resolves(true),
        getContainers: fake.resolves([
          {
            id: 'user-broker',
            name: '/eclipse-mosquitto',
            image: 'eclipse-mosquitto:2',
          },
        ]),
        inspectContainer: fake.resolves({ Config: { Image: 'eclipse-mosquitto:2' } }),
        getNetworkMode: fake.resolves('host'),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    const config = await mqttHandler.getConfiguration();

    // Without the label, a mosquitto created from the public image is only ours if Gladys
    // stored a version for it, which happens on every install: here it is a user one
    expect(config.brokerContainerAvailable).to.equal(false);
    assert.calledOnceWithExactly(gladys.system.inspectContainer, 'user-broker');

    // A broker created before the label existed, but configured by Gladys, is ours
    gladys.variable.getValue = fake.resolves('2');
    const configWithLegacyBroker = await mqttHandler.getConfiguration();
    expect(configWithLegacyBroker.brokerContainerAvailable).to.equal(true);

    gladys.system.inspectContainer = fake.resolves({ Config: { Image: 'nginx:alpine' } });
    const configWithForeignBroker = await mqttHandler.getConfiguration();
    expect(configWithForeignBroker.brokerContainerAvailable).to.equal(false);
  });

  it('should getConfiguration: a container whose name only contains ours is ignored', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves(null),
      },
      system: {
        isDocker: fake.resolves(true),
        getContainers: fake.resolves([
          {
            name: '/eclipse-mosquitto-teslamate',
            image: 'eclipse-mosquitto:2',
            labels: { 'io.gladysassistant.service': 'mqtt' },
          },
        ]),
        getNetworkMode: fake.resolves('host'),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, serviceId);
    const config = await mqttHandler.getConfiguration();

    expect(config.brokerContainerAvailable).to.equal(false);
  });
});
