const sinon = require('sinon');

const { assert, fake } = sinon;
const TasmotaController = require('../../../../services/tasmota/api/tasmota.controller');

const discoveredDevices = [{ device: 'first' }, { device: 'second' }];
const tasmotaHandler = {
  getDiscoveredDevices: fake.returns(discoveredDevices),
  scan: fake.resolves(discoveredDevices),
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
    const req = {
      params: {
        protocol: 'mqtt',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/tasmota/discover/:protocol'].controller(req, res);
    assert.calledOnce(tasmotaHandler.getDiscoveredDevices);
    assert.notCalled(tasmotaHandler.scan);
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
    const req = {
      params: {
        protocol: 'http',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    controller['post /api/v1/service/tasmota/discover/:protocol'].controller(req, res);
    assert.notCalled(tasmotaHandler.getDiscoveredDevices);
    assert.calledOnce(tasmotaHandler.scan);
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
    const req = {
      params: {
        protocol: 'http',
      },
    };
    const res = {
      json: fake.returns(null),
    };

    controller['get /api/v1/service/tasmota/discover/:protocol'].controller(req, res);
    assert.calledOnce(tasmotaHandler.getDiscoveredDevices);
    assert.notCalled(tasmotaHandler.scan);
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
    const req = { params: { protocol: 'http' }, body: { any: 'value' } };
    const res = {
      json: fake.returns(null),
    };

    controller['post /api/v1/service/tasmota/discover/:protocol'].controller(req, res);
    assert.notCalled(tasmotaHandler.getDiscoveredDevices);
    assert.calledWith(tasmotaHandler.scan, req.params.protocol, req.body);
    assert.calledWith(res.json, { success: true });
  });
});
