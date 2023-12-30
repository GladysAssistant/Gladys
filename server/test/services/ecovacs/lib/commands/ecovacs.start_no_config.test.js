const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const { serviceId } = require('../../consts.test');

const { assert, fake } = sinon;
const config = { login: '', password: '', countryCode: '' };
const ecovacsGetConfigurationMock = fake.resolves(config);
const ecovacsConnectCommandMock = fake.resolves(true);
const ecovacsLoadVacbotsCommandMock = fake.resolves(true);
const EcovacsHandler = proxyquire('../../../../../services/ecovacs/lib', {
  './config/ecovacs.getConfiguration.js': { getConfiguration: ecovacsGetConfigurationMock },
  './commands/ecovacs.connect.js': { connect: ecovacsConnectCommandMock },
  './commands/ecovacs.loadVacbots.js': { loadVacbots: ecovacsLoadVacbotsCommandMock },
});
const EcovacsService = proxyquire('../../../../../services/ecovacs', {
  './lib': EcovacsHandler,
});

describe('ecovacs.start command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should not connect and not be configured at start', async () => {
    const ecovacsService = EcovacsService({}, serviceId);
    ecovacsService.device.configured = false;
    ecovacsService.device.connected = true;
    await ecovacsService.device.start();
    assert.calledOnce(ecovacsService.device.getConfiguration);
    expect(ecovacsService.device.configured).to.equal(false);
    assert.notCalled(ecovacsService.device.connect);
    assert.calledOnce(ecovacsService.device.loadVacbots);
  });
});
