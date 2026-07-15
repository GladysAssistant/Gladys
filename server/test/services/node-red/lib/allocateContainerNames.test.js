const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const NodeRedManager = require('../../../../services/node-red/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const NAME = 'gladys-node-red';

describe('NodeRed allocateContainerNames', () => {
  let nodeRedManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      system: {
        getContainers: fake.resolves([]),
      },
    };
    nodeRedManager = new NodeRedManager(gladys, null, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should allocate the default name on a fresh install', async () => {
    const config = {};
    await nodeRedManager.allocateContainerNames(config);
    expect(config.nodeRedContainerName).to.equal(NAME);
  });

  it('should adopt a legacy healthy container (image proves it is ours)', async () => {
    gladys.system.getContainers = fake.resolves([{ id: 'ours', name: `/${NAME}`, image: 'nodered/node-red:3.1' }]);
    const config = {};
    await nodeRedManager.allocateContainerNames(config);
    expect(config.nodeRedContainerName).to.equal(NAME);
  });

  it('should allocate a suffixed name when a foreign container owns the default name', async () => {
    gladys.system.getContainers = fake(async ({ filters }) => {
      if (filters.name[0] === NAME) {
        return [{ id: 'foreign', name: `/${NAME}`, image: 'nginx:latest' }];
      }
      return [];
    });
    const config = {};
    await nodeRedManager.allocateContainerNames(config);
    expect(config.nodeRedContainerName).to.match(/^gladys-node-red-[a-z0-9]{7}$/);
  });

  it('should ignore a user container that only matches as a substring', async () => {
    gladys.system.getContainers = fake.resolves([{ id: 'user', name: '/gladys-node-red-old', image: 'nginx' }]);
    const config = {};
    await nodeRedManager.allocateContainerNames(config);
    expect(config.nodeRedContainerName).to.equal(NAME);
  });

  it('should reuse an already persisted name without any Docker lookup', async () => {
    const config = { nodeRedContainerName: 'gladys-node-red-persisted' };
    await nodeRedManager.allocateContainerNames(config);
    expect(config.nodeRedContainerName).to.equal('gladys-node-red-persisted');
    assert.notCalled(gladys.system.getContainers);
  });
});
