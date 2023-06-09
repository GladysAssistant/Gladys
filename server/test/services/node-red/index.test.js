const sinon = require('sinon');

const { assert, fake } = sinon;

const NodeRedService = require('../../../services/node-red');

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

describe('node-red service', () => {
  // PREPARE
  let nodeRedService;

  beforeEach(() => {
    nodeRedService = NodeRedService(gladys, 'f87b7af2-ca8e-44fc-b754-444354b42fee');
    nodeRedService.device.init = fake.resolves(null);
    nodeRedService.device.disconnect = fake.resolves(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    // EXECUTE
    await nodeRedService.start();
    // ASSERT
    assert.calledOnce(nodeRedService.device.init);
    assert.notCalled(nodeRedService.device.disconnect);
  });
  it('should stop service', async () => {
    // EXECUTE
    await nodeRedService.stop();
    // ASSERT
    assert.calledOnce(nodeRedService.device.disconnect);
    assert.notCalled(nodeRedService.device.init);
  });
});
