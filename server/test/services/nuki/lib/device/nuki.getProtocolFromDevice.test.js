const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');

const { serviceId } = require('../../mocks/consts.test');
const NukiProtocolHandlerMock = require('../../mocks/nuki.protocol.mock.test');

const NukiHandler = proxyquire('../../../../../services/nuki/lib', {
  './mqtt': NukiProtocolHandlerMock,
});

const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../../../../../services/nuki/lib/utils/nuki.constants');

const gladys = {};

describe('Nuki - getProtocolFromDevice', () => {
  let nukiHandler;

  beforeEach(() => {
    nukiHandler = new NukiHandler(gladys, serviceId);
  });

  it('device without params -> default mqtt', () => {
    const device = {
      params: [],
    };
    const protocol = nukiHandler.getProtocolFromDevice(device);
    expect(protocol).to.eq(DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT);
  });

  it('device with mqtt params', () => {
    const device = {
      params: [
        {
          name: DEVICE_PARAM_NAME.PROTOCOL,
          value: DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT,
        },
      ],
    };
    const protocol = nukiHandler.getProtocolFromDevice(device);
    expect(protocol).to.eq(DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT);
  });

  it('device with unknown params', () => {
    const device = {
      params: [
        {
          name: DEVICE_PARAM_NAME.PROTOCOL,
          value: 'unknown',
        },
      ],
    };
    const protocol = nukiHandler.getProtocolFromDevice(device);
    expect(protocol).to.eq('unknown');
  });
});
