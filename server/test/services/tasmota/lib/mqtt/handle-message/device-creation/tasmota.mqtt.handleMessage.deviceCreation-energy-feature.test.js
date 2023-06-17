const sinon = require('sinon');
const { expect } = require('chai');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../../../services/tasmota/lib');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
} = require('../../../../../../../utils/constants');

const messages = require('../../../device-creation/energy.json');

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

describe('Tasmota - MQTT - create device with ENERGY features', () => {
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
        name: 'Tasmota',
        params: [
          {
            name: 'protocol',
            value: 'mqtt',
          },
        ],
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
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/STATUS11', JSON.stringify(messages.STATUS11));

    expect(tasmotaHandler.discoveredDevices).to.deep.eq({});
    expect(tasmotaHandler.pendingDevices).to.deep.eq({
      'tasmota-device-topic': {
        name: 'Tasmota',
        params: [
          {
            name: 'protocol',
            value: 'mqtt',
          },
        ],
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
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/STATUS8', JSON.stringify(messages.STATUS8));

    const expectedDevice = {
      name: 'Tasmota',
      params: [
        {
          name: 'protocol',
          value: 'mqtt',
        },
      ],
      model: 13,
      external_id: 'tasmota:tasmota-device-topic',
      selector: 'tasmota-tasmota-device-topic',
      service_id: serviceId,
      should_poll: false,
      features: [
        {
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Total',
          selector: 'tasmota-tasmota-device-topic-energy-total',
          name: 'Energy total',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 999999,
          last_value: 6.911,
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Yesterday',
          selector: 'tasmota-tasmota-device-topic-energy-yesterday',
          name: 'Energy yesterday',
          read_only: true,
          has_feedback: false,
          keep_history: false,
          min: 0,
          max: 999999,
          last_value: 1.2,
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.ENERGY,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Today',
          selector: 'tasmota-tasmota-device-topic-energy-today',
          name: 'Energy today',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 999999,
          last_value: 0.001,
          unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Power',
          selector: 'tasmota-tasmota-device-topic-energy-power',
          name: 'Power',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 57,
          unit: DEVICE_FEATURE_UNITS.WATT,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:ApparentPower',
          selector: 'tasmota-tasmota-device-topic-energy-apparentpower',
          name: 'Apparent power',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 60,
          unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:ReactivePower',
          selector: 'tasmota-tasmota-device-topic-energy-reactivepower',
          name: 'Reactive power',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 10,
          unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE,
        },
        {
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
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
          category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
          type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
          external_id: 'tasmota:tasmota-device-topic:ENERGY:Current',
          selector: 'tasmota-tasmota-device-topic-energy-current',
          name: 'Intensity',
          read_only: true,
          has_feedback: false,
          min: 0,
          max: 10000,
          last_value: 20.0,
          unit: DEVICE_FEATURE_UNITS.AMPERE,
        },
      ],
    };
    expect(tasmotaHandler.discoveredDevices).to.deep.eq({
      'tasmota-device-topic': expectedDevice,
    });
    expect(tasmotaHandler.pendingDevices).to.deep.eq({});

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:ENERGY:ApparentPower',
      state: 60,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:ENERGY:ReactivePower',
      state: 10,
    });
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
      state: 20.0,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:ENERGY:Total',
      state: 6.911,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:ENERGY:Yesterday',
      state: 1.2,
    });
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'tasmota:tasmota-device-topic:ENERGY:Today',
      state: 0.001,
    });
    assert.calledWith(gladys.stateManager.get, 'deviceByExternalId', 'tasmota:tasmota-device-topic');
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TASMOTA.NEW_MQTT_DEVICE,
      payload: expectedDevice,
    });
    assert.notCalled(mqttService.device.publish);
  });
});
