const sinon = require('sinon');

const { assert } = sinon;
const TasmotaHandler = require('../../../../../services/tasmota/lib');

describe('Tasmota - MQTT - scan', () => {
  it('re-subscribes to telemetry topics', () => {
    const mqttService = {
      device: {
        unsubscribe: sinon.fake(),
        subscribe: sinon.fake(),
      },
    };

    const gladys = {};
    const tasmotaHandler = new TasmotaHandler(gladys, 'service-uuid-random');
    const protocolHandler = tasmotaHandler.protocols.mqtt;
    protocolHandler.mqttService = mqttService;

    protocolHandler.scan();

    assert.calledOnceWithExactly(mqttService.device.unsubscribe, 'tele/+/+');
    assert.calledOnce(mqttService.device.subscribe);
    assert.calledWith(mqttService.device.subscribe, 'tele/+/+');
  });
});
