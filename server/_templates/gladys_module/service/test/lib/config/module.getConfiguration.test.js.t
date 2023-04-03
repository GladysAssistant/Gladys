---
to: test/services/<%= module %>/lib/config/<%= module %>.getConfiguration.test.js
---
const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const <%= className %>Service = require('../../../../../services/<%= module %>/index');
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


describe('<%= module %>.getConfiguration config command', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should get configuration of service', async () => {
    const <%= attributeName %>Service = <%= className %>Service(gladys, serviceId);
    const result = await <%= attributeName %>Service.device.getConfiguration();
    const expected = {
      login: null,
      password: null,
    };
    assert.calledThrice(gladys.variable.getValue);
    expect(result).deep.eq(expected);
  });
});
