const sinon = require('sinon');

const { assert } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const TasmotaMock = require('./tasmota.mock.test');

const TasmotaService = proxyquire('../../../services/tasmota/index', {
  './lib': TasmotaMock,
});

describe('TasmotaService', () => {
  const tasmotaService = TasmotaService({}, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  beforeEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await tasmotaService.start();
    assert.calledOnce(tasmotaService.device.connect);
    assert.notCalled(tasmotaService.device.disconnect);
  });

  it('should stop service', async () => {
    tasmotaService.stop();
    assert.notCalled(tasmotaService.device.connect);
    assert.calledOnce(tasmotaService.device.disconnect);
  });
});
