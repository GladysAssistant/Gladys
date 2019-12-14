const sinon = require('sinon');

const { fake, assert } = sinon;
const { expect } = require('chai');
const SonoffHandler = require('../../../../services/sonoff/lib');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const mqttService = {
  device: {
    publish: fake.returns(null),
  },
};
const gladys = {};

describe('SonoffHandler - setValue', () => {
  const sonoffHandler = new SonoffHandler(gladys, 'service-uuid-random');
  sonoffHandler.mqttService = mqttService;

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
      sonoffHandler.setValue(device, feature, value);
      assert.fail('Should ends on error');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
      expect(e.message).to.eq(
        'Sonoff device external_id is invalid: "deviceInvalidTopic" should starts with "sonoff:"',
      );
    }
  });

  it('publish through null topic', () => {
    const device = undefined;
    const feature = {
      external_id: 'sonoff:',
    };
    const value = 1;

    try {
      sonoffHandler.setValue(device, feature, value);
      assert.fail('Should ends on error');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
      expect(e.message).to.eq('Sonoff device external_id is invalid: "sonoff:" have no MQTT topic');
    }
  });

  it('publish ON through valid topic', () => {
    const device = {
      external_id: 'sonoff:deviceTopic',
    };
    const feature = {
      external_id: 'sonoff:deviceTopic:switch:binary',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };
    const value = 1;

    sonoffHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power', 'ON');
  });

  it('publish ON through valid topic POWER1', () => {
    const device = {
      external_id: 'sonoff:deviceTopic',
    };
    const feature = {
      external_id: 'sonoff:deviceTopic:switch:binary:1',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };
    const value = 1;

    sonoffHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power1', 'ON');
  });

  it('publish ON through valid topic POWER2', () => {
    const device = {
      external_id: 'sonoff:deviceTopic',
    };
    const feature = {
      external_id: 'sonoff:deviceTopic:switch:binary:2',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };
    const value = 1;

    sonoffHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power2', 'ON');
  });

  it('publish OFF through valid topic', () => {
    const device = {
      external_id: 'sonoff:deviceTopic',
    };
    const feature = {
      external_id: 'sonoff:deviceTopic:switch:binary',
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
    };
    const value = 0;

    sonoffHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power', 'OFF');
  });

  it('publish ON through valid topic: light', () => {
    const device = {
      external_id: 'sonoff:deviceTopic',
    };
    const feature = {
      external_id: 'sonoff:deviceTopic:light:binary',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };
    const value = 1;

    sonoffHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power', 'ON');
  });

  it('publish OFF through valid topic: light', () => {
    const device = {
      external_id: 'sonoff:deviceTopic',
    };
    const feature = {
      external_id: 'sonoff:deviceTopic:light:binary',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };
    const value = 0;

    sonoffHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power', 'OFF');
  });

  it('publish black color through valid topic', () => {
    const device = {
      external_id: 'sonoff:deviceTopic',
    };
    const feature = {
      external_id: 'sonoff:deviceTopic:light:color',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 0;

    sonoffHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/color', '#000000');
  });

  it('publish white color through valid topic', () => {
    const device = {
      external_id: 'sonoff:deviceTopic',
    };
    const feature = {
      external_id: 'sonoff:deviceTopic:light:color',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
    };
    const value = 16777215;

    sonoffHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/color', '#ffffff');
  });

  it('publish brightness through valid topic', () => {
    const device = {
      external_id: 'sonoff:deviceTopic',
    };
    const feature = {
      external_id: 'sonoff:deviceTopic:light:brightness',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
    };
    const value = 72;

    sonoffHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/dimmer', 72);
  });
});
