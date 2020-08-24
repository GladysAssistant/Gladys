const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

const { assert } = sinon;

const TasmotaProtocolHandlerMock = require('./mock/TasmotaProtocolHandlerMock.test');

const mockInstance = new TasmotaProtocolHandlerMock();

const TasmotaHandler = proxyquire('../../../../services/tasmota/lib', {
  './http': TasmotaProtocolHandlerMock,
  './mqtt': TasmotaProtocolHandlerMock,
});

const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../../../../services/tasmota/lib/tasmota.constants');

const gladys = {};
const serviceId = 'service-uuid-random';

describe('Tasmota - poll', () => {
  let tasmotaHandler;

  beforeEach(() => {
    tasmotaHandler = new TasmotaHandler(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('poll value', () => {
    const device = {
      params: [
        {
          name: DEVICE_PARAM_NAME.PROTOCOL,
          value: DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].HTTP,
        },
      ],
    };
    tasmotaHandler.poll(device);
    assert.calledOnce(mockInstance.getValue);
  });
});
