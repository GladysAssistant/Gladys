const sinon = require('sinon');
const path = require('path');
const fse = require('fs-extra');
const { expect } = require('chai');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.reset', () => {
  let matterHandler;
  let gladys;
  let previousMatterPath;
  let testMatterPath;

  beforeEach(async () => {
    previousMatterPath = process.env.MATTER_FOLDER_PATH;
    testMatterPath = '/tmp/gladys-matter-reset-test';
    process.env.MATTER_FOLDER_PATH = testMatterPath;

    // Create test directory with some files
    await fse.ensureDir(testMatterPath);
    await fse.writeFile(path.join(testMatterPath, 'test-file'), 'test content');

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

  afterEach(async () => {
    await fse.remove(testMatterPath);
    process.env.MATTER_FOLDER_PATH = previousMatterPath;
  });

  it('should reset matter integration', async () => {
    matterHandler.commissioningController = {
      close: fake.resolves(null),
    };
    matterHandler.devices = [{ name: 'device1' }];
    matterHandler.nodesMap = new Map([['node1', {}]]);
    matterHandler.stateChangeListeners = new Set(['listener1']);

    // Verify directory exists before reset
    const existsBefore = await fse.pathExists(testMatterPath);
    expect(existsBefore).to.equal(true);

    await matterHandler.reset();

    assert.calledOnce(matterHandler.stop);
    assert.calledOnceWithExactly(gladys.variable.destroy, 'MATTER_BACKUP', 'service-1');
    assert.calledOnceWithExactly(gladys.variable.setValue, 'MATTER_ENABLED', 'false', 'service-1');

    // Verify directory was deleted
    const existsAfter = await fse.pathExists(testMatterPath);
    expect(existsAfter).to.equal(false);

    // Verify in-memory state is reset
    expect(matterHandler.commissioningController).to.equal(null);
    expect(matterHandler.devices).to.deep.equal([]);
    expect(matterHandler.nodesMap.size).to.equal(0);
    expect(matterHandler.stateChangeListeners.size).to.equal(0);
  });
});
