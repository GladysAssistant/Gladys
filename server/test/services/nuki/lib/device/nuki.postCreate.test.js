const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { serviceId } = require('../../mocks/consts.test');
const NukiProtocolHandlerMock = require('../../mocks/nuki.protocol.mock.test');

const { assert } = sinon;
const mockInstance = new NukiProtocolHandlerMock();

const NukiHandler = proxyquire('../../../../../services/nuki/lib', {
  './mqtt': NukiProtocolHandlerMock,
});

const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../../../../../services/nuki/lib/utils/nuki.constants');

const gladys = {};

describe('Nuki - postCreate', () => {
  let nukiHandler;

  beforeEach(() => {
    nukiHandler = new NukiHandler(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should subscribe to mqtt device topic', () => {
    const device = {
      params: [
        {
          name: DEVICE_PARAM_NAME.PROTOCOL,
          value: DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT,
        },
      ],
    };
    nukiHandler.postCreate(device);
    assert.calledOnce(mockInstance.subscribeDeviceTopic);
  });

  it('should do nothing', () => {
    const device = {
      params: [
        {
          name: DEVICE_PARAM_NAME.PROTOCOL,
          value: DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].HTTP,
        },
      ],
    };
    nukiHandler.postCreate(device);
    assert.notCalled(mockInstance.subscribeDeviceTopic);
  });
});
