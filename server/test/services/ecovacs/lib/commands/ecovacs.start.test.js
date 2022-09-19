const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { serviceId } = require('../../consts.test');

const { assert, fake } = sinon;
const config = { accountId: 'email@valid.ok', password: 'S0m3Th1ngTru3', countryCode: 'fr' };
const ecovacsGetConfigurationMock = fake.resolves(config);
const ecovacsConnectCommandMock = fake.resolves(true);
const EcovacsHandler = proxyquire('../../../../../services/ecovacs/lib', {
  './config/ecovacs.getConfiguration.js': { getConfiguration: ecovacsGetConfigurationMock },
  './commands/ecovacs.connect.js': { connect: ecovacsConnectCommandMock },
});
const EcovacsService = proxyquire('../../../../../services/ecovacs', {
  './lib': EcovacsHandler,
});

describe('ecovacs.start command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should init default values at start and try to connect', async () => {
    const ecovacsService = EcovacsService({}, serviceId);
    ecovacsService.device.configured = false;
    await ecovacsService.device.start();
    assert.calledOnce(ecovacsService.device.getConfiguration);
    expect(ecovacsService.device.configured).to.equal(true);
    assert.calledOnce(ecovacsService.device.connect);
  });

  it('should init default values at start and should not connect', async () => {
    const ecovacsService = EcovacsService({}, serviceId);
    ecovacsService.device.configured = false;
    ecovacsService.device.connected = true;
    await ecovacsService.device.start();
    assert.calledOnce(ecovacsService.device.getConfiguration);
    expect(ecovacsService.device.configured).to.equal(true);
    assert.notCalled(ecovacsService.device.connect);
  });
});
