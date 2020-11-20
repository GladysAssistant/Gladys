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

describe('Tasmota - MQTT - handle new state Color speed', () => {
  let tasmotaHandler;

  beforeEach(() => {
    const tasmota = new TasmotaHandler(gladys, serviceId);
    tasmotaHandler = tasmota.protocols.mqtt;

    sinon.reset();
  });

  it('decode RESULT message', () => {
    tasmotaHandler.handleMessage('stat/tasmota-device-topic/RESULT', '{ "Speed": 11 }');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:Speed`,
      state: 11,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });
});
