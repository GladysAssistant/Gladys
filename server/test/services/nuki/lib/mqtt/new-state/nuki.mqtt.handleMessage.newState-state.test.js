const sinon = require('sinon');

const { fake } = sinon;
const NukiHandler = require('../../../../../../services/nuki/lib');
const { EVENTS } = require('../../../../../../utils/constants');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'service-uuid-random';

describe('Nuki - MQTT - handle new state POWER', () => {
  let nukiHandler;

  beforeEach(() => {
    const nuki = new NukiHandler(gladys, serviceId);
    nukiHandler = nuki.protocols.mqtt;

    sinon.reset();
  });

  it('decode RESULT message => ON', () => {
    nukiHandler.handleMessage('nuki/nuki-device-topic/state', '1');

    const firstExpectedEvent = {
      device_feature_external_id: `nuki:nuki-device-topic:button`,
      state: 1,
    };
    const secondExpectedEvent = {
      device_feature_external_id: `nuki:nuki-device-topic:state`,
      state: 1,
    };
    gladys.event.emit.firstCall.calledWith(EVENTS.DEVICE.NEW_STATE, firstExpectedEvent);
    gladys.event.emit.secondCall.calledWith(EVENTS.DEVICE.NEW_STATE, secondExpectedEvent);
  });
});
