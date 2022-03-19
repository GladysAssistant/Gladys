const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { assert } = sinon;

const TuyaHandlerMock = require('./mock/tuya.mock.test');

const TuyaService = proxyquire('../../../services/tuya/index', { './lib': TuyaHandlerMock });

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaService', () => {
  const tuyaService = TuyaService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await tuyaService.start();
    assert.calledOnce(tuyaService.device.connect);
    assert.notCalled(tuyaService.device.disconnect);
  });

  it('should stop service', async () => {
    tuyaService.stop();
    assert.notCalled(tuyaService.device.connect);
    assert.calledOnce(tuyaService.device.disconnect);
  });
});
