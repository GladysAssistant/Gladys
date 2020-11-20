const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const requestMock = {
  request: (url, dataCallback, authErrorCallback, errorCallback) => {
    switch (url) {
      case 'auth-error': {
        authErrorCallback();
        break;
      }
      case 'error': {
        errorCallback();
        break;
      }
      default:
        dataCallback('{"StatusSTS": {"POWER":"ON"}}');
    }
    fake.returns(null);
  },
  buildUrl: (device) => {
    return device.name;
  },
};

const TasmotaGetValueMock = proxyquire('../../../../../services/tasmota/lib/http/tasmota.http.getValue', {
  './tasmota.http.request': requestMock,
});

const TasmotaHTTPHandler = proxyquire('../../../../../services/tasmota/lib/http', {
  './tasmota.http.getValue': TasmotaGetValueMock,
});

const TasmotaHandler = proxyquire('../../../../../services/tasmota/lib', {
  './http': TasmotaHTTPHandler,
});

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'service-uuid-random';

describe('Tasmota - HTTP - getValue', () => {
  let tasmotaHandler;

  beforeEach(() => {
    const tasmota = new TasmotaHandler(gladys, serviceId);
    tasmotaHandler = tasmota.protocols.http;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('getValue with success', () => {
    const device = {
      name: 'success',
      external_id: 'tasmota:network',
    };
    tasmotaHandler.getValue(device);

    assert.calledTwice(gladys.event.emit);
  });

  it('getValue with auth-error', () => {
    const device = {
      name: 'auth-error',
      external_id: 'tasmota:network',
    };
    tasmotaHandler.getValue(device);

    assert.notCalled(gladys.event.emit);
  });

  it('getValue with error', () => {
    const device = {
      name: 'error',
      external_id: 'tasmota:network',
    };
    tasmotaHandler.getValue(device);

    assert.notCalled(gladys.event.emit);
  });
});
