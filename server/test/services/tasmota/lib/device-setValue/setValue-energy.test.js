const sinon = require('sinon');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../services/tasmota/lib');

const mqttService = {
  device: {
    publish: fake.resolves(null),
  },
};
const gladys = {};

describe('TasmotaHandler - setValue - FAIL', () => {
  const tasmotaHandler = new TasmotaHandler(gladys, 'service-uuid-random');
  tasmotaHandler.mqttService = mqttService;

  beforeEach(() => {
    sinon.reset();
  });

  it('Set value voltage', () => {
    const device = {};
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:ENERGY:Voltage',
    };
    const value = 1;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should fail');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
    }
  });

  it('Set value current', () => {
    const device = {};
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:ENERGY:Current',
    };
    const value = 1;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should fail');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
    }
  });

  it('Set value power', () => {
    const device = {};
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:ENERGY:Power',
    };
    const value = 1;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should fail');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
    }
  });
});
