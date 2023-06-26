const sinon = require('sinon');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../../../services/tasmota/lib');
const { EVENTS } = require('../../../../../../../utils/constants');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'service-uuid-random';

describe('Tasmota - MQTT - handle new state ENERGY', () => {
  let tasmotaHandler;

  beforeEach(() => {
    const tasmota = new TasmotaHandler(gladys, serviceId);
    tasmotaHandler = tasmota.protocols.mqtt;

    sinon.reset();
  });

  it('decode SENSOR Voltage message', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/SENSOR', JSON.stringify({ ENERGY: { Voltage: 125 } }));

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Voltage`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode SENSOR Current message', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/SENSOR', JSON.stringify({ ENERGY: { Current: 125 } }));

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Current`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode SENSOR Apparent power message', () => {
    tasmotaHandler.handleMessage(
      'stat/tasmota-device-topic/SENSOR',
      JSON.stringify({ ENERGY: { ApparentPower: 125 } }),
    );

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:ApparentPower`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode SENSOR Reactive power message', () => {
    tasmotaHandler.handleMessage(
      'stat/tasmota-device-topic/SENSOR',
      JSON.stringify({ ENERGY: { ReactivePower: 125 } }),
    );

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:ReactivePower`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode SENSOR Power message', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/SENSOR', JSON.stringify({ ENERGY: { Power: 125 } }));

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Power`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode SENSOR Energy yesterday message', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/SENSOR', JSON.stringify({ ENERGY: { Yesterday: 125 } }));

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Yesterday`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode SENSOR Energy today message', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/SENSOR', JSON.stringify({ ENERGY: { Today: 125 } }));

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Today`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode SENSOR Energy total message', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/SENSOR', JSON.stringify({ ENERGY: { Total: 125 } }));

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Total`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });
});
