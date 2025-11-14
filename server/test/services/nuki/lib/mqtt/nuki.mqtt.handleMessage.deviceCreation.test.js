const sinon = require('sinon');
const { expect } = require('chai');

const { fake, assert } = sinon;
const NukiHandler = require('../../../../../services/nuki/lib');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
} = require('../../../../../utils/constants');

const messages = require('./lock.json');

const mqttService = {
  device: {
    publish: fake.returns(null),
  },
};
const gladys = {
  event: {
    emit: fake.returns(null),
  },
  stateManager: {
    get: fake.returns(null),
  },
};
const serviceId = 'service-uuid-random';

describe('Nuki - MQTT - create LOCK device with BATTERY and LOCK features', () => {
  const nuki = new NukiHandler(gladys, serviceId);
  const nukiHandler = nuki.protocols.mqtt;
  nukiHandler.mqttService = mqttService;

  beforeEach(() => {
    sinon.reset();
  });

  it('decode HOMEASSISTANT (topic for device creation) message', () => {
    nukiHandler.handleMessage('homeassistant/lock/nuki_398172F4_lock/config', JSON.stringify(messages));
    const expectedExternalId = 'nuki:398172F4';
    const expectedDevice = {
      external_id: expectedExternalId,
      model: 'Smart Lock 3.0 Pro',
      name: 'Smart Lock 3.0 Pro',
      selector: 'nuki-398172f4',
      service_id: 'service-uuid-random',
      should_poll: false,
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.BATTERY,
          external_id: 'nuki:398172F4:battery',
          has_feedback: true,
          keep_history: true,
          max: 100,
          min: 0,
          name: 'battery',
          read_only: true,
          selector: 'nuki:398172F4:battery',
          type: DEVICE_FEATURE_TYPES.LOCK.INTEGER,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.LOCK,
          external_id: 'nuki:398172F4:button',
          has_feedback: true,
          keep_history: true,
          max: 1,
          min: 0,
          name: 'lock',
          read_only: false,
          selector: 'nuki:398172F4:button',
          type: DEVICE_FEATURE_TYPES.LOCK.BINARY,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.LOCK,
          external_id: 'nuki:398172F4:state',
          has_feedback: true,
          keep_history: true,
          max: 255,
          min: 0,
          name: 'lock-state',
          read_only: true,
          selector: 'nuki:398172F4:state',
          type: DEVICE_FEATURE_TYPES.LOCK.STATE,
        },
      ],
      params: [
        {
          name: 'protocol',
          value: 'mqtt',
        },
      ],
    };

    expect(nukiHandler.discoveredDevices[expectedExternalId]).to.deep.eq(expectedDevice);

    assert.notCalled(mqttService.device.publish);
    assert.calledOnce(gladys.stateManager.get); // from nuki.mergeWithExistingDevices
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NUKI.NEW_MQTT_DEVICE,
      payload: expectedDevice,
    });
  });
});
