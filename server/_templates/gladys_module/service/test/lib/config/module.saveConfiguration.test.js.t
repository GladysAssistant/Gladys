---
to: test/services/<%= module %>/lib/config/<%= module %>.getConfiguration.test.js
---
const sinon = require('sinon');
const { serviceId } = require('../../mocks/consts.test');

const { assert, fake } = sinon;
const <%= className %>Service = require('../../../../../services/<%= module %>/index');

const gladys = {
  variable: {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  },
  device: {
    get: fake.resolves([]),
  },
};

describe('<%= module %>.saveConfiguration config command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should save configuration of service', async () => {
    const <%= attributeName %>Service = <%= className %>Service(gladys, serviceId);
    await <%= attributeName %>Service.device.saveConfiguration({ login: 'john@doe.com', password: '666' });
    assert.calledTwice(gladys.variable.setValue);
  });
});
