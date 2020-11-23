const proxyquire = require('proxyquire').noCallThru();
const { expect } = require('chai');

const TasmotaProtocolHandlerMock = require('./mock/TasmotaProtocolHandlerMock.test');

const TasmotaHandler = proxyquire('../../../../services/tasmota/lib', {
  './http': TasmotaProtocolHandlerMock,
  './mqtt': TasmotaProtocolHandlerMock,
});

const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../../../../services/tasmota/lib/tasmota.constants');

const gladys = {};
const serviceId = 'service-uuid-random';

describe('Tasmota - getProtocolFromDevice', () => {
  let tasmotaHandler;

  beforeEach(() => {
    tasmotaHandler = new TasmotaHandler(gladys, serviceId);
  });

  it('device without params -> default mqtt', () => {
    const device = {
      params: [],
    };
    const protocol = tasmotaHandler.getProtocolFromDevice(device);
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
    const protocol = tasmotaHandler.getProtocolFromDevice(device);
    expect(protocol).to.eq(DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT);
  });

  it('device with http params', () => {
    const device = {
      params: [
        {
          name: DEVICE_PARAM_NAME.PROTOCOL,
          value: DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].HTTP,
        },
      ],
    };
    const protocol = tasmotaHandler.getProtocolFromDevice(device);
    expect(protocol).to.eq(DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].HTTP);
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
    const protocol = tasmotaHandler.getProtocolFromDevice(device);
    expect(protocol).to.eq('unknown');
  });
});
