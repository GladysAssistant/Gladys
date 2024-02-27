const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { serviceId } = require('../../mocks/consts.test');
const NukiProtocolHandlerMock = require('../../mocks/nuki.protocol.mock.test');

const { assert } = sinon;
const mockInstance = new NukiProtocolHandlerMock();

const NukiHandler = proxyquire('../../../../../services/nuki/lib', {
  './mqtt': NukiProtocolHandlerMock,
});

const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../../../../../services/nuki/lib/utils/nuki.constants');

const gladys = {};

describe('Nuki - scan', () => {
  let nukiHandler;

  beforeEach(() => {
    nukiHandler = new NukiHandler(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('mqtt protocol', () => {
    nukiHandler.scan(DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT);
    assert.calledOnce(mockInstance.scan);
  });
});
