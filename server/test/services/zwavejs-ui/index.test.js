const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const ZwaveJSUIHandlerMock = sinon.stub();
ZwaveJSUIHandlerMock.prototype.init = fake.returns(null);
ZwaveJSUIHandlerMock.prototype.devices = [];

const ZwaveJSUIService = proxyquire('../../../services/zwavejs-ui/index', { './lib': ZwaveJSUIHandlerMock });

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('ZwaveJSUIService', () => {
  const zwaveJSUIService = ZwaveJSUIService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await zwaveJSUIService.start();
    assert.calledOnce(zwaveJSUIService.device.init);
  });

  it('should stop service', async () => {
    zwaveJSUIService.stop();
    assert.notCalled(zwaveJSUIService.device.init);
  });

  it('isUsed: should return false, service not used', async () => {
    const used = await zwaveJSUIService.isUsed();
    expect(used).to.equal(false);
  });
});
