const sinon = require('sinon');

const { fake, assert } = sinon;
const TasmotaHandler = require('../../../../../../services/tasmota/lib');

const mqttService = {
  device: {
    publish: fake.resolves(null),
  },
};
const gladys = {};
const serviceId = 'service-uuid-random';

describe('Tasmota - MQTT - setValue - FAIL', () => {
  let tasmotaHandler;

  beforeEach(() => {
    tasmotaHandler = new TasmotaHandler(gladys, serviceId);
    tasmotaHandler.protocols.mqtt.mqttService = mqttService;
    sinon.reset();
  });

  it('Set value voltage', () => {
    const device = {
      params: [],
    };
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
    const device = {
      params: [],
    };
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
    const device = {
      params: [],
    };
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

  it('Set value apparent power', () => {
    const device = {
      params: [],
    };
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:ENERGY:ApparentPower',
    };
    const value = 1;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should fail');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
    }
  });

  it('Set value reactive power', () => {
    const device = {
      params: [],
    };
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:ENERGY:ReactivePower',
    };
    const value = 1;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should fail');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
    }
  });

  it('Set value energy yesterday', () => {
    const device = {
      params: [],
    };
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:ENERGY:Yesterday',
    };
    const value = 1;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should fail');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
    }
  });

  it('Set value energy today', () => {
    const device = {
      params: [],
    };
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:ENERGY:Today',
    };
    const value = 1;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should fail');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
    }
  });

  it('Set value energy total', () => {
    const device = {
      params: [],
    };
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:ENERGY:Total',
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
