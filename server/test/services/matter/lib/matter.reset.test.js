const sinon = require('sinon');
const path = require('path');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.reset', () => {
  let matterHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: fake.returns(null),
      },
      variable: {
        destroy: fake.resolves(null),
        setValue: fake.resolves(null),
      },
      config: {
        storage: '/var/lib/gladys/gladys.db',
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
    matterHandler.stop = fake.resolves(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should reset matter integration', async () => {
    const fseRemoveFake = fake.resolves(null);

    const { reset } = proxyquire('../../../../services/matter/lib/matter.reset', {
      'fs-extra': {
        remove: fseRemoveFake,
      },
    });

    matterHandler.commissioningController = {
      close: fake.resolves(null),
    };
    matterHandler.devices = [{ name: 'device1' }];
    matterHandler.nodesMap = new Map([['node1', {}]]);
    matterHandler.stateChangeListeners = new Set(['listener1']);

    await reset.call(matterHandler);

    assert.calledOnce(matterHandler.stop);
    assert.calledOnceWithExactly(gladys.variable.destroy, 'MATTER_BACKUP', 'service-1');
    assert.calledOnceWithExactly(gladys.variable.setValue, 'MATTER_ENABLED', 'false', 'service-1');
    assert.calledOnceWithExactly(fseRemoveFake, path.join('/var/lib/gladys', 'matter'));

    // Verify in-memory state is reset
    sinon.assert.match(matterHandler.commissioningController, null);
    sinon.assert.match(matterHandler.devices, []);
    sinon.assert.match(matterHandler.nodesMap.size, 0);
    sinon.assert.match(matterHandler.stateChangeListeners.size, 0);
  });

  it('should reset matter integration with custom MATTER_FOLDER_PATH', async () => {
    const originalEnv = process.env.MATTER_FOLDER_PATH;
    process.env.MATTER_FOLDER_PATH = '/custom/matter/path';

    const fseRemoveFake = fake.resolves(null);

    const { reset } = proxyquire('../../../../services/matter/lib/matter.reset', {
      'fs-extra': {
        remove: fseRemoveFake,
      },
    });

    await reset.call(matterHandler);

    assert.calledOnceWithExactly(fseRemoveFake, '/custom/matter/path');

    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.MATTER_FOLDER_PATH;
    } else {
      process.env.MATTER_FOLDER_PATH = originalEnv;
    }
  });
});
