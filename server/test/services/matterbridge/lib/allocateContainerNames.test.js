const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const MatterbridgeManager = require('../../../../services/matterbridge/lib');
const { CONFIGURATION } = require('../../../../services/matterbridge/lib/constants');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const NAME = 'gladys-matterbridge';

describe('Matterbridge allocateContainerNames', () => {
  let matterbridgeManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      system: {
        getContainers: fake.resolves([]),
      },
      variable: {
        setValue: fake.resolves(null),
      },
    };
    matterbridgeManager = new MatterbridgeManager(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should allocate the default name on a fresh install', async () => {
    const config = {};
    await matterbridgeManager.allocateContainerNames(config);
    expect(config.matterbridgeContainerName).to.equal(NAME);
    // The resolved name is persisted immediately, before any container is created
    assert.calledOnceWithExactly(gladys.variable.setValue, CONFIGURATION.MATTERBRIDGE_CONTAINER_NAME, NAME, serviceId);
  });

  it('should adopt a legacy healthy container (image proves it is ours)', async () => {
    gladys.system.getContainers = fake.resolves([
      { id: 'ours', name: `/${NAME}`, image: 'luligu/matterbridge:latest' },
    ]);
    const config = {};
    await matterbridgeManager.allocateContainerNames(config);
    expect(config.matterbridgeContainerName).to.equal(NAME);
  });

  it('should allocate a suffixed name when a foreign container owns the default name', async () => {
    gladys.system.getContainers = fake(async ({ filters }) => {
      if (filters.name[0] === NAME) {
        return [{ id: 'foreign', name: `/${NAME}`, image: 'nginx:latest' }];
      }
      return [];
    });
    const config = {};
    await matterbridgeManager.allocateContainerNames(config);
    expect(config.matterbridgeContainerName).to.match(/^gladys-matterbridge-[a-z0-9]{7}$/);
  });

  it('should ignore a user container that only matches as a substring', async () => {
    gladys.system.getContainers = fake.resolves([{ id: 'user', name: '/gladys-matterbridge-old', image: 'nginx' }]);
    const config = {};
    await matterbridgeManager.allocateContainerNames(config);
    expect(config.matterbridgeContainerName).to.equal(NAME);
  });

  it('should reuse an already persisted name without any Docker lookup', async () => {
    const config = { matterbridgeContainerName: 'gladys-matterbridge-persisted' };
    await matterbridgeManager.allocateContainerNames(config);
    expect(config.matterbridgeContainerName).to.equal('gladys-matterbridge-persisted');
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.variable.setValue);
  });

  it('should reject and persist nothing when the Docker lookup fails', async () => {
    gladys.system.getContainers = fake.rejects(new Error('docker socket unavailable'));
    const config = {};

    let error;
    try {
      await matterbridgeManager.allocateContainerNames(config);
    } catch (e) {
      error = e;
    }

    expect(error).to.be.an('error');
    expect(config.matterbridgeContainerName).to.equal(undefined);
    assert.notCalled(gladys.variable.setValue);
  });
});
