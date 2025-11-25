const chai = require('chai');

const { expect } = chai;

const sinon = require('sinon');

const { assert, fake } = sinon;
const { serviceId } = require('../../mocks/consts.test');
const NukiHandler = require('../../../../../services/nuki/lib');
const NukiMQTTHandler = require('../../../../../services/nuki/lib/mqtt');
const { MAPPING_STATES_NUKI_TO_GLADYS } = require('../../../../../services/nuki/lib/utils/nuki.constants');

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
  event: {
    emit: fake.returns(null),
  },
  stateManager: {
    get: fake.returns(null),
  },
};
const mqttService = {
  device: {
    publish: fake.returns(null),
  },
};

describe('Nuki - MQTT - Handle message', () => {
  let nukiHandler;

  beforeEach(async () => {
    const nuki = new NukiHandler(gladys, serviceId);
    nukiHandler = new NukiMQTTHandler(nuki);
    nukiHandler.mqttService = mqttService;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should change NUKI lock state not handled', () => {
    nukiHandler.handleMessage('nuki/my_device/LOCK', JSON.stringify({ HELLO: 'with_value ?' }));
    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });

  it('should do nothing on unkown NUKI topic', () => {
    nukiHandler.handleMessage('stat/my_device/UNKOWN', '{ "POWER": "ON"}');
    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });

  it('should update NUKI battery state', () => {
    nukiHandler.handleMessage('nuki/my_device/batteryChargeState', '42');
    assert.notCalled(mqttService.device.publish);
    assert.calledOnce(gladys.event.emit);
  });

  it('should notify Gladys with NUKI state', () => {
    nukiHandler.handleMessage('nuki/my_device/state', '0');
    assert.notCalled(mqttService.device.publish);
    assert.calledTwice(gladys.event.emit);
    const expectedDeviceState = {
      device_feature_external_id: 'nuki:my_device:state',
      state: MAPPING_STATES_NUKI_TO_GLADYS[0],
    };
    expect(gladys.event.emit.getCall(1).args[1]).to.deep.equal(expectedDeviceState);
  });

  it('should handle NUKI commandResponse', () => {
    nukiHandler.handleMessage('nuki/my_device/commandResponse', '255');
    assert.notCalled(mqttService.device.publish);
  });

  it('should notify Gladys with NUKI lockActionEvent : UNLOCK', () => {
    nukiHandler.handleMessage('nuki/my_device/lockActionEvent', '1,172,0,0,0');
    assert.notCalled(mqttService.device.publish);
    assert.calledOnce(gladys.event.emit);
  });

  it('should notify Gladys with NUKI lockActionEvent: LOCK', () => {
    nukiHandler.handleMessage('nuki/my_device/lockActionEvent', '2,172,0,0,0');
    assert.notCalled(mqttService.device.publish);
    assert.calledOnce(gladys.event.emit);
  });
});
