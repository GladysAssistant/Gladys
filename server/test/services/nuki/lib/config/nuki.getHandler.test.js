const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');
const { serviceId } = require('../../mocks/consts.test');

const { assert } = sinon;
const NukiProtocolHandlerMock = require('../../mocks/nuki.protocol.mock.test');

const NukiHandler = proxyquire('../../../../../services/nuki/lib', {
  './mqtt': NukiProtocolHandlerMock,
});

const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../../../../../services/nuki/lib/utils/nuki.constants');
const { NotFoundError } = require('../../../../../utils/coreErrors');

const gladys = {};

describe('Nuki - getHandler', () => {
  let nukiHandler;

  beforeEach(() => {
    nukiHandler = new NukiHandler(gladys, serviceId);
  });

  it('no protocol', () => {
    try {
      nukiHandler.getHandler(null);
      assert.fail('Should fail if no protocol requested');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
      expect(e.message).to.eq('Nuki: "null" protocol is not managed');
    }
  });

  it('invalid protocol', () => {
    try {
      nukiHandler.getHandler('unkown');
      assert.fail('Should fail if no protocol requested');
    } catch (e) {
      expect(e).to.be.instanceOf(NotFoundError);
      expect(e.message).to.eq('Nuki: "unkown" protocol is not managed');
    }
  });

  it('mqtt protocol', () => {
    const handler = nukiHandler.getHandler(DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT);
    expect(handler).to.be.instanceOf(NukiProtocolHandlerMock);
  });
});
