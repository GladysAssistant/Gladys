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

describe('TasmotaHandler - handle new state Color Scheme', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('decode RESULT message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/RESULT', '{ "Scheme": 1 }');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:Scheme`,
      state: 1,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });
});
