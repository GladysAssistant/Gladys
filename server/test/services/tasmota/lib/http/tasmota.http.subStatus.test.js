const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { expect } = require('chai');

const { fake, assert } = sinon;

const requestMock = {
  request: (url, dataCallback, authErrorCallback, errorCallback) => {
    const [, , baseUrl] = url.split('/');
    switch (baseUrl) {
      case 'auth-error': {
        authErrorCallback();
        break;
      }
      case 'error': {
        errorCallback();
        break;
      }
      default:
        dataCallback(
          '{ "Status": {"POWER":"ON", "FriendlyName": ["device_name", "device_name_2"], "Module": "module"}}',
        );
    }
    fake.returns(null);
  },
  buildUrl: (url, device) => {
    return device.name;
  },
};

const TasmotaSubStatusMock = proxyquire('../../../../../services/tasmota/lib/http/tasmota.http.subStatus', {
  './tasmota.http.request': requestMock,
});

const TasmotaHTTPHandler = proxyquire('../../../../../services/tasmota/lib/http', {
  './tasmota.http.subStatus': TasmotaSubStatusMock,
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
const device = {};

describe('Tasmota - HTTP - status', () => {
  let tasmotaHandler;

  beforeEach(() => {
    const tasmota = new TasmotaHandler(gladys, serviceId);
    tasmotaHandler = tasmota.protocols.http;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('status with success (status = 11)', () => {
    const address = 'success';
    tasmotaHandler.discoveredDevices[address] = device;
    const username = undefined;
    const password = undefined;
    tasmotaHandler.subStatus(address, username, password, 11);

    expect(tasmotaHandler.discoveredDevices).deep.eq({
      [address]: device,
    });
    assert.calledOnce(gladys.event.emit);
  });

  it('status with success (status = 8)', () => {
    const address = 'success';
    tasmotaHandler.discoveredDevices[address] = device;

    const username = undefined;
    const password = undefined;
    tasmotaHandler.subStatus(address, username, password, 8);

    expect(tasmotaHandler.discoveredDevices).deep.eq({
      [address]: device,
    });
    assert.calledOnce(gladys.event.emit);
  });

  it('status with auth-error', () => {
    const address = 'auth-error';
    tasmotaHandler.discoveredDevices[address] = device;

    const username = 'user';
    const password = 'pass';
    tasmotaHandler.subStatus(address, username, password, 11);

    expect(tasmotaHandler.discoveredDevices).deep.eq({
      [address]: device,
    });
    assert.calledOnce(gladys.event.emit);
  });

  it('status with error', () => {
    const address = 'error';
    tasmotaHandler.discoveredDevices[address] = device;

    const username = undefined;
    const password = undefined;
    tasmotaHandler.subStatus(address, username, password, 8);

    expect(tasmotaHandler.discoveredDevices).deep.eq({});
    assert.notCalled(gladys.event.emit);
  });
});
