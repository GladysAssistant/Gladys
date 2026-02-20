const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();
const { serviceId } = require('../../mocks/consts.test');
const { mqttService } = require('../../mocks/mqtt.mock.test');

const NukiProtocolHandlerMock = require('../../mocks/nuki.protocol.mock.test');

const mockInstance = new NukiProtocolHandlerMock();

const NukiHandler = proxyquire('../../../../../services/nuki/lib', {
  './mqtt': NukiProtocolHandlerMock,
  './http': NukiProtocolHandlerMock,
});

const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../../../../../services/nuki/lib/utils/nuki.constants');

describe('Nuki - start service', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('Should start service and connect all protocols', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves(true),
      },
      service: {
        getService: fake.returns(mqttService),
      },
    };

    const nukiHandler = new NukiHandler(gladys, serviceId);
    await nukiHandler.start();
    assert.callCount(mockInstance.connect, Object.keys(DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL]).length);
  });

  it('Should failed to start service since neither mqtt nor web is configured', async () => {
    mqttService.isUsed = fake.resolves(false);
    const gladys = {
      variable: {
        getValue: fake.resolves(false),
      },
      service: {
        getService: fake.returns(mqttService),
      },
    };
    const nukiHandler = new NukiHandler(gladys, serviceId);

    await expect(nukiHandler.start()).to.be.rejectedWith(Error);
    assert.notCalled(mockInstance.connect);
  });
});
