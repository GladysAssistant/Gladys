const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { expect } = require('chai');
const { DEVICE_POLL_FREQUENCIES } = require('../../../../../utils/constants');

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

const TasmotaSubStatusMock = {
  subStatus: fake.resolves(null),
};
const TasmotaStatusMock = proxyquire('../../../../../services/tasmota/lib/http/tasmota.http.status', {
  './tasmota.http.request': requestMock,
});

const TasmotaHTTPHandler = proxyquire('../../../../../services/tasmota/lib/http', {
  './tasmota.http.status': TasmotaStatusMock,
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

  it('status with success', () => {
    const address = 'success';
    const device = {
      name: 'device_name',
      model: 'module',
      external_id: `tasmota:${address}`,
      selector: `tasmota-${address}`,
      features: [],
      service_id: serviceId,
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
      params: [
        {
          name: 'protocol',
          value: 'http',
        },
      ],
    };
    const username = undefined;
    const password = undefined;
    tasmotaHandler.status(address, username, password);

    expect(tasmotaHandler.discoveredDevices).deep.eq({
      [address]: device,
    });
    assert.calledWith(TasmotaSubStatusMock.subStatus, address, username, password, 11);
  });

  it('status with success (user/pass)', () => {
    const address = 'success';
    const device = {
      name: 'device_name',
      model: 'module',
      external_id: `tasmota:${address}`,
      selector: `tasmota-${address}`,
      features: [],
      service_id: serviceId,
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
      params: [
        {
          name: 'protocol',
          value: 'http',
        },
        {
          name: 'username',
          value: 'user',
        },
        {
          name: 'password',
          value: 'pass',
        },
      ],
    };
    const username = 'user';
    const password = 'pass';
    tasmotaHandler.status(address, username, password);

    expect(tasmotaHandler.discoveredDevices).deep.eq({
      [address]: device,
    });
    assert.calledWith(TasmotaSubStatusMock.subStatus, address, username, password, 11);
  });

  it('status with auth-error', () => {
    const address = 'auth-error';
    const device = {
      needAuthentication: true,
      name: address,
      external_id: `tasmota:${address}`,
      selector: `tasmota-${address}`,
      features: [],
      service_id: serviceId,
      should_poll: true,
      poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
      params: [
        {
          name: 'protocol',
          value: 'http',
        },
      ],
    };
    const username = undefined;
    const password = undefined;
    tasmotaHandler.status(address, username, password);

    expect(tasmotaHandler.discoveredDevices).deep.eq({
      [address]: device,
    });
    assert.notCalled(TasmotaSubStatusMock.subStatus);
  });

  it('status with error', () => {
    const address = 'error';
    const username = 'user';
    const password = 'pass';
    tasmotaHandler.status(address, username, password);

    expect(tasmotaHandler.discoveredDevices).deep.eq({});
    assert.notCalled(TasmotaSubStatusMock.subStatus);
  });
});
