const sinon = require('sinon');
const Promise = require('bluebird');
const { expect } = require('chai');

const { fake } = sinon;

const { MockedMqttClient } = require('../mocks.test');

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
  event: {
    emit: fake.returns(null),
  },
};

const MqttHandler = require('../../../../services/mqtt/lib');

describe('Mqtt.setDebugMode', () => {
  const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  beforeEach(async () => {
    sinon.reset();
  });

  it('should set debug mode at true', () => {
    mqttHandler.setDebugMode(true);
    expect(mqttHandler).to.have.property('debugMode', true);
  });
  it('should set debug mode at true, then have it set to false', async () => {
    mqttHandler.debugModeTimeout = 0;
    mqttHandler.setDebugMode(true);
    expect(mqttHandler).to.have.property('debugMode', true);
    await Promise.delay(5);
    expect(mqttHandler).to.have.property('debugMode', false);
  });
  it('should set debug mode at false', () => {
    mqttHandler.setDebugMode(false);
    expect(mqttHandler).to.have.property('debugMode', false);
  });
});
