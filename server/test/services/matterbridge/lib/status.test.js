const { expect } = require('chai');
const { fake } = require('sinon');

const MatterbridgeManager = require('../../../../services/matterbridge/lib');

const gladys = {
  variable: {
    getValue: fake.resolves('1'),
  },
};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('Matterbridge status', () => {
  // PREPARE
  let matterbridgeManager;

  beforeEach(() => {
    matterbridgeManager = new MatterbridgeManager(gladys, serviceId);
    matterbridgeManager.matterbridgeExist = true;
    matterbridgeManager.matterbridgeRunning = true;
    matterbridgeManager.dockerBased = true;
    matterbridgeManager.networkModeValid = false;
  });

  it('get status', async () => {
    // EXECUTE
    const result = await matterbridgeManager.status();
    // ASSERT
    expect(result.matterbridgeExist).that.equal(true);
    expect(result.matterbridgeRunning).that.equal(true);
    expect(result.matterbridgeEnabled).that.equal(true);
    expect(result.dockerBased).that.equal(true);
    expect(result.networkModeValid).that.equal(false);
  });
});
