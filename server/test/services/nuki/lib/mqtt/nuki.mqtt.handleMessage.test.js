const chai = require('chai');

const { expect } = chai;

const sinon = require('sinon');

const { assert, fake } = sinon;
const { serviceId } = require('../../mocks/consts.test');
const { mqttService } = require('../../mocks/mqtt.mock.test');
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
  service: {
    getService: fake.returns(true),
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
    assert.calledOnce(gladys.event.emit);
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

  it('should ignore non-Nuki homeassistant discovery messages (Zigbee2MQTT)', () => {
    const zigbee2mqttMessage = JSON.stringify({
      availability: [{ topic: 'zigbee2mqtt/bridge/state' }],
      device: {
        identifiers: ['zigbee2mqtt_0x00158d0001234567'],
        manufacturer: 'Xiaomi',
        model: 'Aqara temperature sensor',
        name: 'Temperature Sensor',
      },
      name: 'Temperature',
      state_topic: 'zigbee2mqtt/Temperature Sensor',
      unique_id: '0x00158d0001234567_temperature_zigbee2mqtt',
    });
    nukiHandler.handleMessage('homeassistant/sensor/0x00158d0001234567/temperature/config', zigbee2mqttMessage);
    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
    expect(nukiHandler.discoveredDevices).to.deep.equal({});
  });

  it('should ignore non-Nuki homeassistant discovery messages (Tasmota)', () => {
    const tasmotaMessage = JSON.stringify({
      name: 'Tasmota Switch',
      stat_t: 'tele/tasmota_switch/STATE',
      avty_t: 'tele/tasmota_switch/LWT',
      pl_avail: 'Online',
      pl_not_avail: 'Offline',
      cmd_t: 'cmnd/tasmota_switch/POWER',
      val_tpl: '{{value_json.POWER}}',
      pl_off: 'OFF',
      pl_on: 'ON',
      uniq_id: 'tasmota_switch_RL_1',
      dev: {
        ids: ['tasmota_switch'],
        name: 'Tasmota Switch',
        mdl: 'Sonoff Basic',
        mf: 'Tasmota',
      },
    });
    nukiHandler.handleMessage('homeassistant/switch/tasmota_switch/config', tasmotaMessage);
    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
    expect(nukiHandler.discoveredDevices).to.deep.equal({});
  });

  it('should ignore empty homeassistant messages', () => {
    nukiHandler.handleMessage('homeassistant/sensor/test/config', '');
    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });

  it('should ignore malformed homeassistant messages', () => {
    nukiHandler.handleMessage('homeassistant/sensor/test/config', 'not valid json');
    assert.notCalled(mqttService.device.publish);
    assert.notCalled(gladys.event.emit);
  });
});
