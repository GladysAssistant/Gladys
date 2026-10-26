const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const NodeRedManager = require('../../../../services/node-red/lib');
const { ConflictError } = require('../../../../utils/coreErrors');

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
        name: '/gladys-node-red',
        image: 'nodered/node-red:3.1',
        labels: { 'io.gladysassistant.service': 'node-red' },
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
        name: '/gladys-node-red',
        image: 'nodered/node-red:3.1',
        labels: { 'io.gladysassistant.service': 'node-red' },
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

  it('should recognize a container created before the label existed by its image', async () => {
    gladys.system.getContainers = fake.resolves([
      {
        id: 'container-id',
        name: '/gladys-node-red',
        image: 'nodered/node-red:3.1',
      },
    ]);
    gladys.system.inspectContainer = fake.resolves({ Config: { Image: 'nodered/node-red:3.1' } });
    const config = {
      dockerNodeRedVersion: '5',
    };

    await nodeRedManager.checkForContainerUpdates(config);

    assert.calledOnceWithExactly(gladys.system.inspectContainer, 'container-id');
    assert.calledWithExactly(gladys.system.removeContainer, 'container-id', { force: true });
  });

  it('should ignore a user container whose name only contains ours', async () => {
    gladys.system.getContainers = fake.resolves([
      {
        id: 'user-container',
        name: '/gladys-node-red-old',
        image: 'nodered/node-red:3.1',
      },
    ]);
    const config = {
      dockerNodeRedVersion: '5',
    };

    await nodeRedManager.checkForContainerUpdates(config);

    assert.notCalled(gladys.system.removeContainer);
  });

  it('should fail without removing a user container carrying our name', async () => {
    gladys.system.getContainers = fake.resolves([
      {
        id: 'user-container',
        name: '/gladys-node-red',
        image: 'nginx:alpine',
      },
    ]);
    gladys.system.inspectContainer = fake.resolves({ Config: { Image: 'nginx:alpine' } });
    const config = {
      dockerNodeRedVersion: '5',
    };

    let error;
    try {
      await nodeRedManager.checkForContainerUpdates(config);
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(ConflictError);
    assert.notCalled(gladys.system.removeContainer);
  });
});
