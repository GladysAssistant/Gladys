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
        dataCallback('{"POWER":"ON"}');
    }
    fake.returns(null);
  },
  buildUrl: (device) => {
    return device.name;
  },
};

const TasmotaSetValueMock = proxyquire('../../../../../services/tasmota/lib/http/tasmota.http.setValue', {
  './tasmota.http.request': requestMock,
});

const TasmotaHTTPHandler = proxyquire('../../../../../services/tasmota/lib/http', {
  './tasmota.http.setValue': TasmotaSetValueMock,
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

describe('Tasmota - HTTP - setValue', () => {
  let tasmotaHandler;

  beforeEach(() => {
    const tasmota = new TasmotaHandler(gladys, serviceId);
    tasmotaHandler = tasmota.protocols.http;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('setValue with success', () => {
    const device = {
      name: 'success',
      external_id: 'tasmota:network',
    };
    const address = '192.168.1.1';
    const command = 'command';
    const value = 'value';
    tasmotaHandler.setValue(device, address, command, value);

    assert.calledOnce(gladys.event.emit);
  });

  it('setValue with auth-error', () => {
    const device = {
      name: 'auth-error',
      external_id: 'tasmota:network',
    };
    const address = '192.168.1.1';
    const command = 'command';
    const value = 'value';
    tasmotaHandler.setValue(device, address, command, value);

    assert.notCalled(gladys.event.emit);
  });

  it('setValue with error', () => {
    const device = {
      name: 'error',
      external_id: 'tasmota:network',
    };
    const address = '192.168.1.1';
    const command = 'command';
    const value = 'value';
    tasmotaHandler.setValue(device, address, command, value);

    assert.notCalled(gladys.event.emit);
  });
});
