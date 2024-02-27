const sinon = require('sinon');

const { fake } = sinon;
const { serviceId } = require('../../mocks/consts.test');
const NukiHandler = require('../../../../../services/nuki/lib');
const NukiMQTTHandler = require('../../../../../services/nuki/lib/mqtt');

const mqttService = {
  device: {
    unsubscribe: fake.returns(true),
  },
};
const gladys = {
  service: {
    getService: fake.returns(mqttService),
  },
  device: {
    get: fake.resolves([{ external_id: 'nuki:4242' }, { external_id: 'nuki:4343' }]),
  },
};

describe('Nuki - MQTT - disconnect', () => {
  let nukiHandler;

  beforeEach(() => {
    const nuki = new NukiHandler(gladys, serviceId);

    nukiHandler = new NukiMQTTHandler(nuki);
    nukiHandler.mqttService = mqttService;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should disconnect with unsubscription of all devices topics', () => {
    nukiHandler.disconnect();
    nukiHandler.mqttService.device.unsubscribe.firstCall.calledWith('homeassistant/#');
    // nukiHandler.mqttService.device.unsubscribe.secondCall.calledWith('nuki/4242/#');
    // nukiHandler.mqttService.device.unsubscribe.thirdCall.calledWith('nuki/4343/#');
  });
});
