const sinon = require('sinon');

const { assert, fake } = sinon;

const MatterbridgeManager = require('../../../../services/matterbridge/lib');

const container = {
  id: 'docker-test',
  name: '/gladys-matterbridge',
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('Matterbridge checkForContainerUpdates', () => {
  let matterbridgeManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      system: {
        getContainers: fake.resolves([container]),
        removeContainer: fake.resolves(true),
      },
    };

    matterbridgeManager = new MatterbridgeManager(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not update container (same version)', async () => {
    const config = {
      dockerMatterbridgeVersion: '1',
    };

    await matterbridgeManager.checkForContainerUpdates(config);

    assert.notCalled(gladys.system.removeContainer);
  });

  it('should update container (different version)', async () => {
    const config = {
      dockerMatterbridgeVersion: '0',
      matterbridgeContainerName: 'gladys-matterbridge',
    };

    await matterbridgeManager.checkForContainerUpdates(config);

    assert.calledOnceWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['gladys-matterbridge'] },
    });
    assert.calledOnceWithExactly(gladys.system.removeContainer, 'docker-test', { force: true });
  });

  it('should update container (no version)', async () => {
    const config = {
      matterbridgeContainerName: 'gladys-matterbridge',
    };

    await matterbridgeManager.checkForContainerUpdates(config);

    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.removeContainer);
  });

  it('should ignore a user container matching only as a substring', async () => {
    gladys.system.getContainers = fake.resolves([{ id: 'user-container', name: '/gladys-matterbridge-old' }]);
    const config = {
      dockerMatterbridgeVersion: '0',
      matterbridgeContainerName: 'gladys-matterbridge',
    };

    await matterbridgeManager.checkForContainerUpdates(config);

    assert.notCalled(gladys.system.removeContainer);
  });

  it('should remove the resolved (suffixed) container on a version bump', async () => {
    gladys.system.getContainers = fake.resolves([{ id: 'docker-test', name: '/gladys-matterbridge-ab12cd3' }]);
    const config = {
      dockerMatterbridgeVersion: '0',
      matterbridgeContainerName: 'gladys-matterbridge-ab12cd3',
    };

    await matterbridgeManager.checkForContainerUpdates(config);

    assert.calledOnceWithExactly(gladys.system.getContainers, {
      all: true,
      filters: { name: ['gladys-matterbridge-ab12cd3'] },
    });
    assert.calledOnceWithExactly(gladys.system.removeContainer, 'docker-test', { force: true });
  });

  it('should update container (no container found)', async () => {
    gladys.system.getContainers = fake.resolves([]);
    const config = {
      dockerMatterbridgeVersion: '0',
      matterbridgeContainerName: 'gladys-matterbridge',
    };

    await matterbridgeManager.checkForContainerUpdates(config);

    assert.calledOnce(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);
  });
});
