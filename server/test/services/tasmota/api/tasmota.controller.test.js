const { assert, fake } = require('sinon');
const TasmotaController = require('../../../../services/tasmota/api/tasmota.controller');

const discoveredDevices = [{ device: 'first' }, { device: 'second' }];
const tasmotaHandler = {
  getDiscoveredDevices: fake.returns(discoveredDevices),
};

describe('GET /api/v1/service/tasmota/discover', () => {
  let controller;

  beforeEach(() => {
    controller = TasmotaController(tasmotaHandler);
  });

  it('Discover', () => {
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/tasmota/discover'].controller(undefined, res);
    assert.calledOnce(tasmotaHandler.getDiscoveredDevices);
    assert.calledWith(res.json, discoveredDevices);
  });
});
