const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const TasmotaStatusMock = {
  status: fake.returns(null),
};

const TasmotaHTTPHandler = proxyquire('../../../../../services/tasmota/lib/http', {
  './tasmota.http.status': TasmotaStatusMock,
});

const TasmotaHandler = proxyquire('../../../../../services/tasmota/lib', {
  './http': TasmotaHTTPHandler,
});

const gladys = {};
const serviceId = 'service-uuid-random';

describe('Tasmota - HTTP - scan', () => {
  let tasmotaHandler;

  beforeEach(() => {
    const tasmota = new TasmotaHandler(gladys, serviceId);
    tasmotaHandler = tasmota.protocols.http;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('scan IP range', () => {
    const options = {
      firstAddress: '192.255.255.255',
      lastAddress: '193.0.0.2',
    };
    tasmotaHandler.scan(options);

    assert.calledWith(TasmotaStatusMock.status, '192.255.255.255');
    assert.calledWith(TasmotaStatusMock.status, '193.0.0.0');
    assert.calledWith(TasmotaStatusMock.status, '193.0.0.1');
  });

  it('scan single IP', () => {
    const options = {
      singleAddress: '193.0.0.2',
    };
    tasmotaHandler.scan(options);

    assert.calledWith(TasmotaStatusMock.status, '193.0.0.2');
  });
});
