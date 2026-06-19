const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const NodeRedManager = require('../../../../services/node-red/lib');

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

  it('should remove container when image does not match selected major version', async () => {
    gladys.system.getContainers = fake.resolves([
      {
        id: 'container-id',
        image: 'nodered/node-red:3.1',
      },
    ]);
    const config = {
      dockerNodeRedVersion: '5',
    };

    await nodeRedManager.checkForContainerUpdates(config);

    assert.calledWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['gladys-node-red'] },
    });
    assert.calledWithExactly(gladys.system.removeContainer, 'container-id', { force: true });
  });

  it('should do nothing when container image matches selected major version', async () => {
    gladys.system.getContainers = fake.resolves([
      {
        id: 'container-id',
        image: 'nodered/node-red:3.1',
      },
    ]);
    const config = {
      dockerNodeRedVersion: '3',
    };

    await nodeRedManager.checkForContainerUpdates(config);

    assert.calledWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['gladys-node-red'] },
    });
    assert.notCalled(gladys.system.removeContainer);
  });

  it('should do nothing when no container is installed', async () => {
    const config = {
      dockerNodeRedVersion: '3',
    };

    await nodeRedManager.checkForContainerUpdates(config);

    assert.calledOnce(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);
    expect(config).deep.equal({
      dockerNodeRedVersion: '3',
    });
  });
});
