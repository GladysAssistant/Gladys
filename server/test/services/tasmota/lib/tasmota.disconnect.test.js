const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

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

describe('Tasmota - disconnect', () => {
  let tasmotaHandler;

  beforeEach(() => {
    tasmotaHandler = new TasmotaHandler(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('disconnect all protocols', () => {
    tasmotaHandler.disconnect();

    assert.callCount(mockInstance.disconnect, Object.keys(DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL]).length);
  });
});
