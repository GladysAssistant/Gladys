const sinon = require('sinon');

const { fake, assert } = sinon;
const NukiHandler = require('../../../../../../services/nuki/lib');
const { EVENTS } = require('../../../../../../utils/constants');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'service-uuid-random';

describe('Nuki - MQTT - handle new battery state', () => {
  let nukiHandler;

  beforeEach(() => {
    const nuki = new NukiHandler(gladys, serviceId);
    nukiHandler = nuki.protocols.mqtt;

    sinon.reset();
  });

  it('decode RESULT message => 66', () => {
    nukiHandler.handleMessage('nuki/nuki-device-topic/batteryChargeState', '66');

    const expectedEvent = {
      device_feature_external_id: `nuki:nuki-device-topic:battery`,
      state: 66,
    };
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, expectedEvent);
  });
});
