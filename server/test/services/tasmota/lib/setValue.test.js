const sinon = require('sinon');

const { fake, assert } = sinon;
const { expect } = require('chai');
const TasmotaHandler = require('../../../../services/tasmota/lib');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

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

  it('not managed switch type', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:unknow:unknow',
      category: 'unknow',
      type: 'unknow',
    };
    const value = 72;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should ends on error');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
      expect(e.message).to.eq(
        'Tasmota device category not managed to set value on "tasmota:deviceTopic:unknow:unknow"',
      );
    }
  });

  it('publish ON through valid topic', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:switch:binary',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };
    const value = 1;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power', 'ON');
  });

  it('publish ON through valid topic POWER1', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:switch:binary:1',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };
    const value = 1;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power1', 'ON');
  });

  it('publish ON through valid topic POWER2', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:switch:binary:2',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };
    const value = 1;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power2', 'ON');
  });

  it('publish OFF through valid topic', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:switch:binary',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };
    const value = 0;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power', 'OFF');
  });

  it('not managed switch type', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:switch:unknow',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: 'unknow',
    };
    const value = 72;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should ends on error');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
      expect(e.message).to.eq('Tasmota device type not managed to set value on "tasmota:deviceTopic:switch:unknow"');
    }
  });

  it('publish ON through valid topic: light', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:light:binary',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };
    const value = 1;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power', 'ON');
  });

  it('publish OFF through valid topic: light', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:light:binary',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };
    const value = 0;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power', 'OFF');
  });

  it('publish black color through valid topic', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:light:color',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 0;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/color', '#000000');
  });

  it('publish white color through valid topic', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:light:color',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 16777215;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/color', '#ffffff');
  });

  it('publish brightness through valid topic', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:light:brightness',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    };
    const value = 72;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/dimmer', 72);
  });

  it('not managed light type', () => {
    const device = {
      external_id: 'tasmota:deviceTopic',
    };
    const feature = {
      external_id: 'tasmota:deviceTopic:light:unknow',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: 'unknow',
    };
    const value = 72;

    try {
      tasmotaHandler.setValue(device, feature, value);
      assert.fail('Should ends on error');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
      expect(e.message).to.eq('Tasmota device type not managed to set value on "tasmota:deviceTopic:light:unknow"');
    }
  });
});
