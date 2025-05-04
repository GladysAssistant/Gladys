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

describe('NukiHandler.setValue', () => {
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
      expect(e.message).to.eq('Nuki device external_id is invalid: "nuki:" have no topic indicator');
    }
  });

  it('should call mqtt handler setValue', () => {
    const device = {
      external_id: 'nuki:1234',
      params: [ { name: 'protocol', value: 'mqtt' } ]
    };
    const feature = {
      external_id: 'nuki:1234:button',    
    };
    const value = 0;
    nukiHandler.setValue(device, feature, value);
  });

  it('should call mqtt handler setValue', () => {
    const device = {
      external_id: 'nuki:1234',
      params: [ { name: 'protocol', value: 'mqtt' } ]
    };
    const feature = {
      external_id: 'nuki:1234:button',    
    };
    const value = 1;
    nukiHandler.setValue(device, feature, value);
  });

  
  it('should call http handler setValue', () => {
    const device = {
      external_id: 'nuki:1234',
      params: [ { name: 'protocol', value: 'mqtt' } ]
    };
    const feature = {
      external_id: 'nuki:1234:button',    
    };
    const value = 0;
    nukiHandler.setValue(device, feature, value);
  });
});
