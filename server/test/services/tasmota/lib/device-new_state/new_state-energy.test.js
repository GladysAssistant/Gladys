const sinon = require('sinon');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../services/tasmota/lib');
const { EVENTS } = require('../../../../../utils/constants');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'service-uuid-random';

describe('TasmotaHandler - handle new state ENERGY', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('decode SENSOR Voltage message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/SENSOR', JSON.stringify({ ENERGY: { Voltage: 125 } }));

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Voltage`,
      state: 0.125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode SENSOR Current message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/SENSOR', JSON.stringify({ ENERGY: { Current: 125 } }));

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Current`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode SENSOR Power message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/SENSOR', JSON.stringify({ ENERGY: { Power: 125 } }));

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Power`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });
});
