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

describe('TasmotaHandler - handle new state Color speed', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('decode RESULT message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/RESULT', '{ "Speed": 11 }');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:Speed`,
      state: 11,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });
});
