const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const MatterbridgeManager = require('../../../../services/matterbridge/lib');

const gladys = {
  variable: {
    getValue: fake.resolves('1'),
  },
  service: {
    getService: fake.returns(null),
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
    expect(result.matterBridgeEnabled).that.equal(false);
  });

  it('should tell the Matter bridge of Gladys is turned on', async () => {
    gladys.service.getService = fake.returns({ bridge: { isEnabled: fake.resolves(true) } });
    const result = await matterbridgeManager.status();
    expect(result.matterBridgeEnabled).that.equal(true);
    gladys.service.getService = fake.returns(null);
  });

  it('should tell the Matter bridge of Gladys is off when its service has no bridge', async () => {
    gladys.service.getService = fake.returns({});
    const result = await matterbridgeManager.status();
    expect(result.matterBridgeEnabled).that.equal(false);
    gladys.service.getService = fake.returns(null);
  });
});
