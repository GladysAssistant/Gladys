const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { serviceId } = require('../../consts.test');

const { assert, fake } = sinon;
const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');

const EcovacsService = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiMock,
});

const gladys = {
  variable: {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  },
  device: {
    get: fake.resolves([]),
  },
};

describe('ecovacs.saveConfiguration config command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should save configuration of service', async () => {
    const ecovacsService = EcovacsService(gladys, serviceId);
    await ecovacsService.device.saveConfiguration({ login: 'john@doe.com', password: '666', country: 'fr' });
    assert.calledThrice(gladys.variable.setValue);
  });

  it('should save configuration of service without changing password', async () => {
    const ecovacsService = EcovacsService(gladys, serviceId);
    await ecovacsService.device.saveConfiguration({ login: 'john@doe.com', country: 'fr' });
    assert.calledTwice(gladys.variable.setValue);
  });
});
