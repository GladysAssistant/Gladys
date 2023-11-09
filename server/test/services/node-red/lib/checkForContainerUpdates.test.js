const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const NodeRedManager = require('../../../../services/node-red/lib');
const { DEFAULT } = require('../../../../services/node-red/lib/constants');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('NodeRed checkForContainerUpdates', () => {
  let nodeRedManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      system: {
        getContainers: fake.resolves([]),
        removeContainer: fake.resolves(true),
      },
    };

    nodeRedManager = new NodeRedManager(gladys, null, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('not updated, but no containers runnning -> it should only update config', async () => {
    // PREPARE
    const config = {
      dockerNodeRedVersion: 'BAD_REVISION',
    };
    // EXECUTE
    await nodeRedManager.checkForContainerUpdates(config);
    // ASSERT
    assert.calledWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['gladys-node-red'] },
    });
    assert.notCalled(gladys.system.removeContainer);

    expect(config).deep.equal({
      dockerNodeRedVersion: DEFAULT.DOCKER_NODE_RED_VERSION,
    });
  });

  it('not updated, found both containers -> it should remove containers and update config', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([{ id: 'container-id' }]);
    const config = {
      dockerNodeRedVersion: 'BAD_REVISION',
    };
    // EXECUTE
    await nodeRedManager.checkForContainerUpdates(config);
    // ASSERT
    assert.calledWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['gladys-node-red'] },
    });

    assert.calledWithExactly(gladys.system.removeContainer, 'container-id', { force: true });

    expect(config).deep.equal({
      dockerNodeRedVersion: DEFAULT.DOCKER_NODE_RED_VERSION,
    });
  });

  it('already updated -> it should do nothing', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([{ id: 'container-id' }]);
    const config = {
      dockerNodeRedVersion: DEFAULT.DOCKER_NODE_RED_VERSION,
    };
    // EXECUTE
    await nodeRedManager.checkForContainerUpdates(config);
    // ASSERT
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);

    expect(config).deep.equal({
      dockerNodeRedVersion: DEFAULT.DOCKER_NODE_RED_VERSION,
    });
  });
});
