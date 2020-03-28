const sinon = require('sinon');
const { expect } = require('chai');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../services/tasmota/lib');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
} = require('../../../../../utils/constants');

const messages = require('./energy.json');

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

describe('TasmotaHandler - create device with ENERGY features', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, serviceId);

  beforeEach(() => {
    tasmotaHandler.mqttService = mqttService;
    sinon.reset();
  });

  it('decode STATUS message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/STATUS', JSON.stringify(messages.STATUS));

    expect(tasmotaHandler.mqttDevices).to.deep.eq({});
    expect(tasmotaHandler.pendingMqttDevices).to.deep.eq({
      'tasmota-device-topic': {
        name: 'Tasmota',
        model: 13,
        external_id: 'tasmota:tasmota-device-topic',
        selector: 'tasmota-tasmota-device-topic',
        service_id: serviceId,
        should_poll: false,
        features: [],
      },
    });

    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.stateManager.get);
    assert.calledWith(mqttService.device.publish, 'cmnd/tasmota-device-topic/STATUS', '11');
  });

  it('decode STATUS11 message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/STATUS11', JSON.stringify(messages.STATUS11));

    expect(tasmotaHandler.mqttDevices).to.deep.eq({});
    expect(tasmotaHandler.pendingMqttDevices).to.deep.eq({
      'tasmota-device-topic': {
        name: 'Tasmota',
        model: 13,
        external_id: 'tasmota:tasmota-device-topic',
        selector: 'tasmota-tasmota-device-topic',
        service_id: serviceId,
        should_poll: false,
        features: [],
      },
    });

    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.stateManager.get);
    assert.calledWith(mqttService.device.publish, 'cmnd/tasmota-device-topic/STATUS', '8');
  });

  it('decode STATUS8 message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/STATUS8', JSON.stringify(messages.STATUS8));

    const expectedDevice = {
      name: 'Tasmota',
      model: 13,
      external_id: 'tasmota:tasmota-device-topic',
      selector: 'tasmota-tasmota-device-topic',
      service_id: serviceId,
      should_poll: false,
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Power',
          selector: 'tasmota-tasmota-device-topic-energy-power',
          name: 'Power',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 57,
          unit: DEVICE_FEATURE_UNITS.KILOWATT,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Voltage',
          selector: 'tasmota-tasmota-device-topic-energy-voltage',
          name: 'Voltage',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 12,
          unit: DEVICE_FEATURE_UNITS.VOLT,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Current',
          selector: 'tasmota-tasmota-device-topic-energy-current',
          name: 'Energy',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 20,
          unit: DEVICE_FEATURE_UNITS.AMPERE,
        },
      ],
    };
    expect(tasmotaHandler.mqttDevices).to.deep.eq({
      'tasmota-device-topic': expectedDevice,
    });
    expect(tasmotaHandler.pendingMqttDevices).to.deep.eq({});

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:ENERGY:Power',
      state: 57,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:ENERGY:Voltage',
      state: 12,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:ENERGY:Current',
      state: 20,
    });
    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'tasmota:tasmota-device-topic');
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_DEVICE,
      payload: expectedDevice,
    });
    assert.notCalled(mqttService.device.publish);
  });
});
