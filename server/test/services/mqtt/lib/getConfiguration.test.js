const sinon = require('sinon');
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
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 4);
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
          .resolves('value'),
      },
      system: {
        isDocker: fake.resolves(true),
        getContainers: fake.resolves([
          {
            image: 'eclipse-mosquitto:any-tag',
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
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 4);
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
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 4);
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
    };
    expect(config).to.deep.eq(expectedConfig);

    assert.callCount(gladys.variable.getValue, 4);
    assert.calledOnce(gladys.system.isDocker);
    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.getNetworkMode);
  });
});
