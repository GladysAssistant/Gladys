const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { expect } = require('chai');

const { fake, assert } = sinon;

const requestMock = {
  request: (url, dataCallback, authErrorCallback, errorCallback) => {
    switch (url) {
      case 'success-sts': {
        dataCallback('{ "StatusSTS": {"POWER":"ON"} }');
        break;
      }
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
  buildUrl: (device) => {
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
  stateManager: {
    get: fake.returns(null),
  },
};
const serviceId = 'service-uuid-random';

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
    tasmotaHandler.discoveredDevices[address] = { name: address };

    const username = undefined;
    const password = undefined;
    tasmotaHandler.subStatus(address, username, password, 11);

    expect(tasmotaHandler.discoveredDevices).deep.eq({
      [address]: { name: address },
    });
    assert.calledOnce(gladys.event.emit);
  });

  it('status with success (status = 8)', () => {
    const address = 'success';
    tasmotaHandler.discoveredDevices[address] = { name: address };

    const username = undefined;
    const password = undefined;
    tasmotaHandler.subStatus(address, username, password, 8);

    expect(tasmotaHandler.discoveredDevices).deep.eq({
      [address]: { name: address },
    });
    assert.calledOnce(gladys.event.emit);
  });

  it('status with success (status = 8) adds feature from StatusSTS', () => {
    const address = 'success-sts';
    tasmotaHandler.discoveredDevices[address] = {
      name: address,
      external_id: 'tasmota:device-1',
      features: [],
    };

    const username = undefined;
    const password = undefined;
    tasmotaHandler.subStatus(address, username, password, 8);

    expect(tasmotaHandler.discoveredDevices[address].features).to.have.lengthOf(1);
    expect(tasmotaHandler.discoveredDevices[address].features[0].external_id).to.eq('tasmota:device-1:POWER');
    expect(tasmotaHandler.discoveredDevices[address].features[0].last_value).to.eq(1);
  });

  it('status with auth-error', () => {
    const address = 'auth-error';
    tasmotaHandler.discoveredDevices[address] = { name: address };

    const username = 'user';
    const password = 'pass';
    tasmotaHandler.subStatus(address, username, password, 11);

    expect(tasmotaHandler.discoveredDevices).deep.eq({
      [address]: { name: address, needAuthentication: true },
    });
    assert.calledOnce(gladys.event.emit);
  });

  it('status with error', () => {
    const address = 'error';
    tasmotaHandler.discoveredDevices[address] = { name: address };

    const username = undefined;
    const password = undefined;
    tasmotaHandler.subStatus(address, username, password, 8);

    expect(tasmotaHandler.discoveredDevices).deep.eq({});
    assert.notCalled(gladys.event.emit);
  });
});
