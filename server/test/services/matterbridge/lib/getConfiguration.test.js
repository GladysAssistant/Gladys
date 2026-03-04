const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const MatterbridgeManager = require('../../../../services/matterbridge/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('Matterbridge getConfiguration', () => {
  let matterbridgeManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        getValue: fake.resolves('1'),
      },
    };

    matterbridgeManager = new MatterbridgeManager(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should get configuration', async () => {
    const config = await matterbridgeManager.getConfiguration();

    expect(config).to.deep.equal({
      dockerMatterbridgeVersion: '1',
    });
  });
});
