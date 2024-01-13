const sinon = require('sinon');

const { fake, assert } = sinon;
const { serviceId } = require('../../mocks/consts.test');
const NukiHandler = require('../../../../../services/nuki/lib');
const NukiMQTTHandler = require('../../../../../services/nuki/lib/mqtt');

const mqttService = {
  device: {
    unsubscribe: fake.returns(null),
  },
};
const gladys = {
  service: {
    getService: fake.returns(mqttService),
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

  it('disconnect with unsubscription', () => {
    nukiHandler.disconnect();
    assert.calledOnce(mqttService.device.unsubscribe);
    assert.calledWith(mqttService.device.unsubscribe, 'homeassistant/#');    
  });
});
