const { assert, fake } = require('sinon');
const TasmotaController = require('../../../../services/tasmota/api/tasmota.controller');

const discoveredDevices = [{ device: 'first' }, { device: 'second' }];
const tasmotaHandler = {
  getMqttDiscoveredDevices: fake.returns(discoveredDevices),
};

describe('GET /api/v1/service/tasmota/discover/mqtt', () => {
  let controller;

  beforeEach(() => {
    controller = TasmotaController(tasmotaHandler);
  });

  it('Get discovered MQTT devices', () => {
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/tasmota/discover/mqtt'].controller(undefined, res);
    assert.calledOnce(tasmotaHandler.getMqttDiscoveredDevices);
    assert.calledWith(res.json, discoveredDevices);
  });
});
