const sinon = require('sinon');

const { assert, fake } = sinon;
const TasmotaController = require('../../../../services/tasmota/api/tasmota.controller');

const discoveredDevices = [{ device: 'first' }, { device: 'second' }];
const tasmotaHandler = {
  getMqttDiscoveredDevices: fake.returns(discoveredDevices),
  forceScan: fake.returns(discoveredDevices),
  getHttpDiscoveredDevices: fake.returns(discoveredDevices),
  scanHttp: fake.returns(discoveredDevices),
};

describe('GET /api/v1/service/tasmota/discover/mqtt', () => {
  let controller;

  beforeEach(() => {
    controller = TasmotaController(tasmotaHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Get discovered MQTT devices', () => {
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/tasmota/discover/mqtt'].controller(undefined, res);
    assert.calledOnce(tasmotaHandler.getMqttDiscoveredDevices);
    assert.notCalled(tasmotaHandler.forceScan);
    assert.notCalled(tasmotaHandler.getHttpDiscoveredDevices);
    assert.notCalled(tasmotaHandler.scanHttp);
    assert.calledWith(res.json, discoveredDevices);
  });
});

describe('POST /api/v1/service/tasmota/discover/mqtt', () => {
  let controller;

  beforeEach(() => {
    controller = TasmotaController(tasmotaHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Look for MQTT devices', () => {
    const res = {
      json: fake.returns(null),
    };

    controller['post /api/v1/service/tasmota/discover/mqtt'].controller(undefined, res);
    assert.notCalled(tasmotaHandler.getMqttDiscoveredDevices);
    assert.calledOnce(tasmotaHandler.forceScan);
    assert.notCalled(tasmotaHandler.getHttpDiscoveredDevices);
    assert.notCalled(tasmotaHandler.scanHttp);
    assert.calledWith(res.json, { success: true });
  });
});

describe('GET /api/v1/service/tasmota/discover/http', () => {
  let controller;

  beforeEach(() => {
    controller = TasmotaController(tasmotaHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Get discovered HTTP devices', () => {
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/tasmota/discover/http'].controller(undefined, res);
    assert.notCalled(tasmotaHandler.getMqttDiscoveredDevices);
    assert.notCalled(tasmotaHandler.forceScan);
    assert.calledOnce(tasmotaHandler.getHttpDiscoveredDevices);
    assert.notCalled(tasmotaHandler.scanHttp);
    assert.calledWith(res.json, discoveredDevices);
  });
});

describe('POST /api/v1/service/tasmota/discover/http', () => {
  let controller;

  beforeEach(() => {
    controller = TasmotaController(tasmotaHandler);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('Look for HTTP devices', () => {
    const req = { body: { any: 'value' } };
    const res = {
      json: fake.returns(null),
    };

    controller['post /api/v1/service/tasmota/discover/http'].controller(req, res);
    assert.notCalled(tasmotaHandler.getMqttDiscoveredDevices);
    assert.notCalled(tasmotaHandler.forceScan);
    assert.notCalled(tasmotaHandler.getHttpDiscoveredDevices);
    assert.calledWith(tasmotaHandler.scanHttp, req.body);
    assert.calledWith(res.json, { success: true });
  });
});
