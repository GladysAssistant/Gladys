const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;
const NukiService = require('../../../../../services/nuki');
const { serviceId } = require('../../mocks/consts.test');

const mqttService = {
  isUsed: fake.resolves(true),
};

const gladys = {
  variable: {
    getValue: fake.resolves(true),
  },
  service: {
    getService: fake.returns(mqttService),
  },
};

describe('nuki.status command', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should get service status', async () => {
    const nukiService = NukiService(gladys, serviceId);
    const result = await nukiService.device.getStatus();
    const expected = {
      mqttOk: true,
      webOk: true,
    };
    expect(result).deep.eq(expected);
  });
});
