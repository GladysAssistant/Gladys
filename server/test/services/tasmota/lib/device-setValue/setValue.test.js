const sinon = require('sinon');

const { fake, assert } = sinon;
const { expect } = require('chai');
const TasmotaHandler = require('../../../../../services/tasmota/lib');

const mqttService = {
  device: {
    publish: fake.returns(null),
  },
};
const gladys = {};

describe('TasmotaHandler - setValue', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, 'service-uuid-random');
  tasmotaHandler.mqttService = mqttService;

  beforeEach(() => {
    sinon.reset();
  });

  it('publish through invalid topic', () => {
    const device = undefined;
    const feature = {
      external_id: 'deviceInvalidTopic',
    };
    const value = 1;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should ends on error');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
      expect(e.message).to.eq(
        'Tasmota device external_id is invalid: "deviceInvalidTopic" should starts with "tasmota:"',
      );
    }
  });

  it('publish through null topic', () => {
    const device = undefined;
    const feature = {
      external_id: 'tasmota:',
    };
    const value = 1;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should ends on error');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
      expect(e.message).to.eq('Tasmota device external_id is invalid: "tasmota:" have no MQTT topic');
    }
  });
});
