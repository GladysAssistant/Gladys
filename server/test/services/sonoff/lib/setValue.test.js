const sinon = require('sinon');

const { fake, assert } = sinon;
const { expect } = require('chai');
const SonoffHandler = require('../../../../services/sonoff/lib');

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
    const device = {
      external_id: 'deviceInvalidTopic',
    };
    const feature = undefined;
    const value = 1;

    try {
      sonoffHandler.setValue(device, feature, value);
      assert.fail('Should ends on error');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
      expect(e.message).to.eq(
        'Sonoff device external_id is invalid : "deviceInvalidTopic" should starts with "sonoff:"',
      );
    }
  });

  it('publish through null topic', () => {
    const device = {
      external_id: 'sonoff:',
    };
    const feature = undefined;
    const value = 1;

    try {
      sonoffHandler.setValue(device, feature, value);
      assert.fail('Should ends on error');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
      expect(e.message).to.eq('Sonoff device external_id is invalid : "sonoff:" have no MQTT topic');
    }
  });

  it('publish ON through valid topic', () => {
    const device = {
      external_id: 'sonoff:deviceTopic',
    };
    const feature = undefined;
    const value = 1;

    sonoffHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power', 'ON');
  });

  it('publish OFF through valid topic', () => {
    const device = {
      external_id: 'sonoff:deviceTopic',
    };
    const feature = undefined;
    const value = 0;

    sonoffHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/deviceTopic/power', 'OFF');
  });
});
