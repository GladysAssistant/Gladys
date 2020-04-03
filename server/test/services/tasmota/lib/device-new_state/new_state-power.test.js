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

describe('TasmotaHandler - handle new state POWER', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('decode RESULT message => ON', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/RESULT', '{"POWER":"ON"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:POWER`,
      state: 1,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode RESULT message => OFF', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/RESULT', '{"POWER":"OFF"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:POWER`,
      state: 0,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode POWER<x> RESULT message => ON', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/RESULT', '{"POWER5":"ON"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:POWER5`,
      state: 1,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode POWER<x> RESULT message => OFF', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/RESULT', '{"POWER5":"OFF"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:POWER5`,
      state: 0,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });
});
