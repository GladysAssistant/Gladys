const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const MatterbridgeManager = require('../../../../services/matterbridge/lib');
const { ConflictError } = require('../../../../utils/coreErrors');

const container = {
  id: 'docker-test',
  name: '/gladys-matterbridge',
  labels: { 'io.gladysassistant.service': 'matterbridge' },
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
    };

    await matterbridgeManager.checkForContainerUpdates(config);

    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.removeContainer);
  });

  it('should update container (no version)', async () => {
    const config = {};

    await matterbridgeManager.checkForContainerUpdates(config);

    assert.calledOnce(gladys.system.getContainers);
    assert.calledOnce(gladys.system.removeContainer);
  });

  it('should update container (no container found)', async () => {
    gladys.system.getContainers = fake.resolves([]);
    const config = {
      dockerMatterbridgeVersion: '0',
    };

    await matterbridgeManager.checkForContainerUpdates(config);

    assert.calledOnce(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);
  });

  it('should not remove a user container whose name only contains ours', async () => {
    gladys.system.getContainers = fake.resolves([{ id: 'user-container', name: '/gladys-matterbridge-2' }]);
    const config = {
      dockerMatterbridgeVersion: '0',
    };

    await matterbridgeManager.checkForContainerUpdates(config);

    assert.calledOnce(gladys.system.getContainers);
    assert.notCalled(gladys.system.removeContainer);
    expect(config.dockerMatterbridgeVersion).to.equal('1');
  });

  it('should fail without removing a user container carrying our name', async () => {
    gladys.system.getContainers = fake.resolves([
      { id: 'user-container', name: '/gladys-matterbridge', image: 'nginx:alpine' },
    ]);
    gladys.system.inspectContainer = fake.resolves({ Config: { Image: 'nginx:alpine' } });
    const config = {
      dockerMatterbridgeVersion: '0',
    };

    let error;
    try {
      await matterbridgeManager.checkForContainerUpdates(config);
    } catch (e) {
      error = e;
    }

    expect(error).to.be.instanceOf(ConflictError);
    assert.notCalled(gladys.system.removeContainer);
    expect(config.dockerMatterbridgeVersion).to.equal('0');
  });
});
