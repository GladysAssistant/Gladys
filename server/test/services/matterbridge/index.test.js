const sinon = require('sinon');

const { assert, fake } = sinon;

const MatterbridgeService = require('../../../services/matterbridge');

const gladys = {
  event: {
    emit: fake.returns,
  },
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};

describe('matterbridge service', () => {
  // PREPARE
  let matterbridgeService;

  beforeEach(() => {
    matterbridgeService = MatterbridgeService(gladys, 'f87b7af2-ca8e-44fc-b754-444354b42fee');
    matterbridgeService.device.init = fake.resolves(null);
    matterbridgeService.device.disconnect = fake.resolves(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    // EXECUTE
    await matterbridgeService.start();
    // ASSERT
    assert.calledOnce(matterbridgeService.device.init);
    assert.notCalled(matterbridgeService.device.disconnect);
  });
  it('should stop service', async () => {
    // EXECUTE
    await matterbridgeService.stop();
    // ASSERT
    assert.calledOnce(matterbridgeService.device.disconnect);
    assert.notCalled(matterbridgeService.device.init);
  });
});
