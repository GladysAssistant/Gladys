const { expect } = require('chai');
const net = require('net');
const sinon = require('sinon');

const { MockedMqttClient } = require('../mocks.test');
const MqttHandler = require('../../../../services/mqtt/lib');

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

const listenOnFreePort = () =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, '0.0.0.0', () => resolve(server));
  });

describe('mqttHandler.isBrokerPortAvailable', () => {
  let mqttHandler;

  beforeEach(() => {
    mqttHandler = new MqttHandler({}, MockedMqttClient, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should return false when the port is already in use', async () => {
    const server = await listenOnFreePort();
    const { port } = server.address();

    const available = await mqttHandler.isBrokerPortAvailable(port);

    expect(available).to.equal(false);
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  it('should return true when the port is free', async () => {
    // Take a port then release it: it is guaranteed free right after closing
    const server = await listenOnFreePort();
    const { port } = server.address();
    await new Promise((resolve) => {
      server.close(resolve);
    });

    const available = await mqttHandler.isBrokerPortAvailable(port);

    expect(available).to.equal(true);
  });
});
