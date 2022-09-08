const sinon = require('sinon');
const { expect } = require('chai');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../../../services/tasmota/lib');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../../../../utils/constants');

const messages = require('../../../device-creation/SonoffDualR3.json');

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

describe('Tasmota - MQTT - create Sonoff Dual R3 device', () => {
  const tasmota = new TasmotaHandler(gladys, serviceId);
  const tasmotaHandler = tasmota.protocols.mqtt;
  tasmotaHandler.mqttService = mqttService;

  beforeEach(() => {
    sinon.reset();
  });

  it('decode STATUS message', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/STATUS', JSON.stringify(messages.STATUS));

    expect(tasmotaHandler.discoveredDevices).to.deep.eq({});
    expect(tasmotaHandler.pendingDevices).to.deep.eq({
      'tasmota-device-topic': {
        name: 'Relais_Tasmota1',
        params: [
          {
            name: 'protocol',
            value: 'mqtt',
          },
        ],
        model: 0,
        external_id: 'tasmota:tasmota-device-topic',
        selector: 'tasmota-tasmota-device-topic',
        service_id: serviceId,
        should_poll: false,
        features: [],
      },
    });

    assert.notCalled(gladys.event.emit);
    assert.notCalled(gladys.stateManager.get);
    assert.calledOnceWithExactly(mqttService.device.publish, 'cmnd/tasmota-device-topic/STATUS', '11');
  });

  it('decode STATUS11 message', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/STATUS11', JSON.stringify(messages.STATUS11));

    expect(tasmotaHandler.discoveredDevices).to.deep.eq({});
    expect(tasmotaHandler.pendingDevices).to.deep.eq({
      'tasmota-device-topic': {
        name: 'Relais_Tasmota1',
        params: [
          {
            name: 'protocol',
            value: 'mqtt',
          },
        ],
        model: 0,
        external_id: 'tasmota:tasmota-device-topic',
        selector: 'tasmota-tasmota-device-topic',
        service_id: serviceId,
        should_poll: false,
        features: [
          {
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
            external_id: 'tasmota:tasmota-device-topic:POWER1',
            selector: 'tasmota-tasmota-device-topic-power1',
            name: 'Switch 1',
            read_only: false,
            has_feedback: true,
            min: 0,
            max: 1,
            last_value: 0,
          },
          {
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
            external_id: 'tasmota:tasmota-device-topic:POWER2',
            selector: 'tasmota-tasmota-device-topic-power2',
            name: 'Switch 2',
            read_only: false,
            has_feedback: true,
            min: 0,
            max: 1,
            last_value: 0,
          },
        ],
      },
    });

    assert.calledOnceWithExactly(mqttService.device.publish, 'cmnd/tasmota-device-topic/STATUS', '8');
    assert.notCalled(gladys.stateManager.get);
    assert.calledTwice(gladys.event.emit);
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:POWER1',
      state: 0,
    });
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:POWER2',
      state: 0,
    });
  });

  it('decode STATUS8 message', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/STATUS8', JSON.stringify(messages.STATUS8));

    const expectedDevice = {
      name: 'Relais_Tasmota1',
      params: [
        {
          name: 'protocol',
          value: 'mqtt',
        },
      ],
      model: 0,
      external_id: 'tasmota:tasmota-device-topic',
      selector: 'tasmota-tasmota-device-topic',
      service_id: serviceId,
      should_poll: false,
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'tasmota:tasmota-device-topic:POWER1',
          selector: 'tasmota-tasmota-device-topic-power1',
          name: 'Switch 1',
          read_only: false,
          has_feedback: true,
          min: 0,
          max: 1,
          last_value: 0,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
          external_id: 'tasmota:tasmota-device-topic:POWER2',
          selector: 'tasmota-tasmota-device-topic-power2',
          name: 'Switch 2',
          read_only: false,
          has_feedback: true,
          min: 0,
          max: 1,
          last_value: 0,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Power1',
          selector: 'tasmota-tasmota-device-topic-energy-power1',
          name: 'Power 1',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 0,
          unit: DEVICE_FEATURE_UNITS.KILOWATT,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Power2',
          selector: 'tasmota-tasmota-device-topic-energy-power2',
          name: 'Power 2',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 0,
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
          last_value: 0,
          unit: DEVICE_FEATURE_UNITS.VOLT,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Current1',
          selector: 'tasmota-tasmota-device-topic-energy-current1',
          name: 'Energy 1',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 0,
          unit: DEVICE_FEATURE_UNITS.AMPERE,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.SWITCH,
          type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Current2',
          selector: 'tasmota-tasmota-device-topic-energy-current2',
          name: 'Energy 2',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 0,
          unit: DEVICE_FEATURE_UNITS.AMPERE,
        },
      ],
    };
    expect(tasmotaHandler.discoveredDevices).to.deep.eq({
      'tasmota-device-topic': expectedDevice,
    });
    expect(tasmotaHandler.pendingDevices).to.deep.eq({});

    assert.notCalled(mqttService.device.publish);

    assert.calledOnceWithExactly(gladys.stateManager.get, 'deviceByExternalId', 'tasmota:tasmota-device-topic');
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_MQTT_DEVICE,
      payload: expectedDevice,
    });
  });
});
