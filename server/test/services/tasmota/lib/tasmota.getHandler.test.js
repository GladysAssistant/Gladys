const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');

const { assert } = sinon;
const TasmotaProtocolHandlerMock = require('./mock/TasmotaProtocolHandlerMock.test');

const TasmotaHandler = proxyquire('../../../../services/tasmota/lib', {
  './http': TasmotaProtocolHandlerMock,
  './mqtt': TasmotaProtocolHandlerMock,
});

const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../../../../services/tasmota/lib/tasmota.constants');
const { NotFoundError } = require('../../../../utils/coreErrors');

const gladys = {};
const serviceId = 'service-uuid-random';

describe('Tasmota - getHandler', () => {
  let tasmotaHandler;

  beforeEach(() => {
    tasmotaHandler = new TasmotaHandler(gladys, serviceId);
  });

  it('no protocol', () => {
    try {
      tasmotaHandler.getHandler(null);
      assert.fail('Should fail if no protocol requested');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
      expect(e.message).to.eq('Tasmota: "null" protocol is not managed');
    }
  });

  it('invalid protocol', () => {
    try {
      tasmotaHandler.getHandler('unkown');
      assert.fail('Should fail if no protocol requested');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
      expect(e.message).to.eq('Tasmota: "unkown" protocol is not managed');
    }
  });

  it('http protocol', () => {
    const handler = tasmotaHandler.getHandler(DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].HTTP);
    expect(handler).to.be.instanceOf(TasmotaProtocolHandlerMock);
  });

  it('mqtt protocol', () => {
    const handler = tasmotaHandler.getHandler(DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT);
    expect(handler).to.be.instanceOf(TasmotaProtocolHandlerMock);
  });
});
