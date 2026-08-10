const sinon = require('sinon');

const { assert, fake } = sinon;
const { MockedMqttClient } = require('../mocks.test');
const MqttHandler = require('../../../../services/mqtt/lib');

const SERVICE_ID = 'faea9c35-759a-44d5-bcc9-2af1de37b8b4';

describe('mqttHandler.postCreate/postUpdate/postDelete', () => {
  let mqttHandler;

  beforeEach(() => {
    mqttHandler = new MqttHandler({}, MockedMqttClient, SERVICE_ID);
    mqttHandler.listenToHomeAssistantDeviceStateIfNeeded = fake.returns(null);
    mqttHandler.unListenToHomeAssistantDevice = fake.returns(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should listen to Home Assistant state topics on device creation', async () => {
    const device = { external_id: 'homeassistant:my-device' };
    await mqttHandler.postCreate(device);
    assert.calledWith(mqttHandler.listenToHomeAssistantDeviceStateIfNeeded, device);
  });

  it('should listen to Home Assistant state topics on device update', async () => {
    const device = { external_id: 'homeassistant:my-device' };
    await mqttHandler.postUpdate(device);
    assert.calledWith(mqttHandler.listenToHomeAssistantDeviceStateIfNeeded, device);
  });

  it('should stop listening to Home Assistant state topics on device deletion', async () => {
    const device = { external_id: 'homeassistant:my-device' };
    await mqttHandler.postDelete(device);
    assert.calledWith(mqttHandler.unListenToHomeAssistantDevice, device);
  });
});
