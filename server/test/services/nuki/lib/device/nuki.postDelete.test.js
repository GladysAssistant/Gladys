const sinon = require('sinon');
const { serviceId } = require('../../mocks/consts.test');

const { assert, fake } = sinon;

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

describe('Nuki - postDelete', () => {
  let nukiHandler;
  let nukiMQTTHandler;

  beforeEach(() => {
    nukiHandler = new NukiHandler(gladys, serviceId);
    nukiMQTTHandler = new NukiMQTTHandler(nukiHandler);
    sinon.spy(nukiMQTTHandler, 'handleMessage');
  });

  afterEach(() => {
    sinon.reset();
  });

  it('postDelete', () => {
    const device = {
      external_id: '0:1:2',
    };
    nukiHandler.postDelete(device);
    assert.calledWith(gladys.service.getService, 'mqtt');
    assert.callCount(mqttService.device.unsubscribe, 1);
    mqttService.device.unsubscribe.calledWith('nuki/1/#', nukiMQTTHandler.handleMessage.bind(nukiMQTTHandler));
  });
});
