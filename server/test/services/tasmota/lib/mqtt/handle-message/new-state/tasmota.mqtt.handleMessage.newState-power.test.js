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

describe('Tasmota - MQTT - handle new state POWER', () => {
  let tasmotaHandler;

  beforeEach(() => {
    const tasmota = new TasmotaHandler(gladys, serviceId);
    tasmotaHandler = tasmota.protocols.mqtt;

    sinon.reset();
  });

  it('decode RESULT message => ON', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/RESULT', '{"POWER":"ON"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:POWER`,
      state: 1,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode RESULT message => OFF', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/RESULT', '{"POWER":"OFF"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:POWER`,
      state: 0,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode POWER<x> RESULT message => ON', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/RESULT', '{"POWER5":"ON"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:POWER5`,
      state: 1,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });

  it('decode POWER<x> RESULT message => OFF', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/RESULT', '{"POWER5":"OFF"}');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:POWER5`,
      state: 0,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });
});
