const sinon = require('sinon');

const { fake, assert } = sinon;
const { expect } = require('chai');
const { serviceId } = require('../../mocks/consts.test');
const NukiHandler = require('../../../../../services/nuki/lib');

const mqttService = {
  device: {
    publish: fake.returns(null),
  },
};
const gladys = {};

describe('Nuki - MQTT - setValue', () => {
  let nukiHandler;

  beforeEach(() => {
    nukiHandler = new NukiHandler(gladys, serviceId);
    nukiHandler.protocols.mqtt.mqttService = mqttService;
    sinon.reset();
  });

  it('publish through invalid topic', () => {
    const device = undefined;
    const feature = {
      external_id: 'deviceInvalidTopic',
    };
    const value = 1;

    try {
      nukiHandler.setValue(device, feature, value);
      assert.fail('Should ends on error');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
      expect(e.message).to.eq('Nuki device external_id is invalid: "deviceInvalidTopic" should starts with "nuki:"');
    }
  });

  it('publish through null topic', () => {
    const device = undefined;
    const feature = {
      external_id: 'nuki:',
    };
    const value = 1;

    try {
      nukiHandler.setValue(device, feature, value);
      assert.fail('Should ends on error');
    } catch (e) {
      assert.notCalled(mqttService.device.publish);
      expect(e.message).to.eq('Nuki device external_id is invalid: "nuki:" have no network indicator');
    }
  });
});
