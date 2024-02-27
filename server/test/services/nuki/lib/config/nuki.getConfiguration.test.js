const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const NukiService = require('../../../../../services/nuki/index');
const { serviceId } = require('../../mocks/consts.test');

const gladys = {
  variable: {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  },
  device: {
    get: fake.resolves([]),
  },
};

describe('nuki.getConfiguration config command', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should get configuration of service', async () => {
    const nukiService = NukiService(gladys, serviceId);
    const result = await nukiService.device.getConfiguration();
    const expected = {
      login: null,
      password: null,
    };
    assert.calledTwice(gladys.variable.getValue);
    expect(result).deep.eq(expected);
  });
});
