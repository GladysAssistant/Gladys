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

describe('TasmotaHandler - handle new state Dimmer', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('decode RESULT Dimmer message', () => {
    tasmotaHandler.handleMqttMessage('stat/tasmota-device-topic/RESULT', '{ "Dimmer": 125 }');

    const expectedEvent = {
      device_feature_external_id: `tasmota:tasmota-device-topic:Dimmer`,
      state: 125,
    };

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });
});
