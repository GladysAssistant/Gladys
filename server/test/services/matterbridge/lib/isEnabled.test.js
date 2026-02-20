const { expect } = require('chai');
const { fake } = require('sinon');

const MatterbridgeManager = require('../../../../services/matterbridge/lib');

const gladys = {
  variable: {
    getValue: fake.resolves(null),
  },
};
const serviceId = '625a8a9a-aa9d-474f-8cec-0718dd4ade04';

describe('Matterbridge isEnabled', () => {
  let matterbridgeService;
  beforeEach(() => {
    matterbridgeService = new MatterbridgeManager(gladys, serviceId);
  });

  it('should return false when value not exist', async () => {
    const result = await matterbridgeService.isEnabled();
    expect(result).to.equal(false);
  });

  it('should return false', async () => {
    gladys.variable.getValue = fake.resolves('0');

    const result = await matterbridgeService.isEnabled();
    expect(result).to.equal(false);
  });

  it('should return true', async () => {
    gladys.variable.getValue = fake.resolves('1');

    const result = await matterbridgeService.isEnabled();
    expect(result).to.equal(true);
  });
});
