const { expect } = require('chai');

const MqttHandler = require('../../../../services/mqtt/lib');

const serviceId = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.status', () => {
  it('should get status', async () => {
    const mqttHandler = new MqttHandler({}, {}, serviceId);
    const status = mqttHandler.status();

    expect(status).to.have.property('configured');
    expect(status).to.have.property('connected');
  });
});
