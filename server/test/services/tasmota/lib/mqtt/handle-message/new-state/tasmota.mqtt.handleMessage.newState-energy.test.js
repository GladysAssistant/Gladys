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
      state: 0.125,
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

  it('decode SENSOR Power message', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/SENSOR', JSON.stringify({ ENERGY: { Power: 125 } }));

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Power`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });
});
