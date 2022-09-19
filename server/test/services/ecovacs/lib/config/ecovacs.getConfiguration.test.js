const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();
const EcovacsApiMock = require('../../mocks/ecovacs-api.mock.test');

const EcovacsService = proxyquire('../../../../../services/ecovacs/index', {
  'ecovacs-deebot': EcovacsApiMock,
});

const { serviceId } = require('../../consts.test');

const gladys = {
  variable: {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  },
  device: {
    get: fake.resolves([]),
  },
};

describe('ecovacs.getConfiguration config command', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should get configuration of service', async () => {
    const ecovacsService = EcovacsService(gladys, serviceId);
    const result = await ecovacsService.device.getConfiguration();
    const expected = {
      countryCode: null,
      login: null,
      password: null,
    };
    assert.calledThrice(gladys.variable.getValue);
    expect(result).deep.eq(expected);
  });
});
