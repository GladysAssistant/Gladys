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

describe('Tasmota - MQTT - handle new state with array value', () => {
  let tasmotaHandler;

  beforeEach(() => {
    const tasmota = new TasmotaHandler(gladys, serviceId);
    tasmotaHandler = tasmota.protocols.mqtt;

    sinon.reset();
  });

  it('decode SENSOR multiple values message', () => {
    tasmotaHandler.handleMessage(
      'stat/tasmota-device-topic/SENSOR',
      JSON.stringify({ ENERGY: { Voltage: [125, 132] } }),
    );

    const expectedEvent1 = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Voltage1`,
      state: 125,
    };
    const expectedEvent2 = {
      device_feature_external_id: `tasmota:tasmota-device-topic:ENERGY:Voltage2`,
      state: 132,
    };

    assert.calledTwice(gladys.event.emit);
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent1);
    assert.calledWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent2);
  });
});
