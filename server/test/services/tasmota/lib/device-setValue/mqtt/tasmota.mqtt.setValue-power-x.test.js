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

describe('Tasmota - MQTT - setValue - POWER<x>', () => {
  let tasmotaHandler;

  beforeEach(() => {
    tasmotaHandler = new TasmotaHandler(gladys, serviceId);
    tasmotaHandler.protocols.mqtt.mqttService = mqttService;
    sinon.reset();
  });

  it('Set power ON', () => {
    const device = {
      params: [],
    };
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:POWER123',
    };
    const value = 1;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/tasmota-device-topic/POWER123', 'ON');
  });

  it('Set power OFF', () => {
    const device = {
      params: [],
    };
    const feature = {
      external_id: 'tasmota:tasmota-device-topic:POWER123',
    };
    const value = 0;

    tasmotaHandler.setValue(device, feature, value);

    assert.calledWith(mqttService.device.publish, 'cmnd/tasmota-device-topic/POWER123', 'OFF');
  });
});
