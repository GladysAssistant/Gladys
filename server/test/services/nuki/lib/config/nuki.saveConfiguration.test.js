const sinon = require('sinon');
const { serviceId } = require('../../mocks/consts.test');

const { assert, fake } = sinon;
const NukiService = require('../../../../../services/nuki/index');

const gladys = {
  variable: {
    getValue: fake.resolves(null),
    setValue: fake.resolves(null),
  },
  device: {
    get: fake.resolves([]),
  },
};

describe('nuki.saveConfiguration config command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should save configuration of service', async () => {
    const nukiService = NukiService(gladys, serviceId);
    await nukiService.device.saveConfiguration({ login: 'john@doe.com', password: '666' });
    assert.calledTwice(gladys.variable.setValue);
  });
});
