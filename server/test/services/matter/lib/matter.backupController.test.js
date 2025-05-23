const sinon = require('sinon');
const path = require('path');
const fse = require('fs-extra');
const { expect } = require('chai');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');
const { VARIABLES } = require('../../../../services/matter/utils/constants');

const config = require('../../../../config/config');

describe('Matter.backupController', () => {
  let matterHandler;
  let environment;
  let storageService;
  let backupContent;
  let gladys;
  let previousMatterPath;
  let newMatterPath;

  beforeEach(async () => {
    backupContent = null;
    previousMatterPath = process.env.MATTER_FOLDER_PATH;
    newMatterPath = '/tmp/gladysmattertest';
    process.env.MATTER_FOLDER_PATH = newMatterPath;
    await fse.remove(newMatterPath);
    await fse.ensureDir(newMatterPath);
    await fse.writeFile(path.join(newMatterPath, 'matter-controller-data'), 'test');
    // Mock environment and storage service
    environment = {
      get: fake.returns({
        location: '',
      }),
      default: {},
    };

    storageService = {
      location: '',
    };
    // Mock commissioning controller
    const commissioningController = {
      close: fake.resolves(null),
      start: fake.resolves(null),
      getCommissionedNodesDetails: fake.returns([]),
      getNode: fake.resolves({
        getDevices: fake.returns([]),
      }),
    };
    gladys = {
      job: {
        wrapper: (type, fn) => fn,
        updateProgress: fake.resolves(null),
      },
      variable: {
        getValue: (variable) => {
          if (variable === VARIABLES.MATTER_BACKUP) {
            return backupContent;
          }
          return null;
        },
        setValue: (variable, value) => {
          if (variable === VARIABLES.MATTER_BACKUP) {
            backupContent = value;
          }
        },
      },
      config: {
        storage: config.test.storage,
      },
      scheduler: {
        scheduleJob: fake.returns(null),
      },
    };
    // Create matter instance with mocked dependencies
    const MatterMain = {
      Environment: {
        default: environment,
      },
      StorageService: storageService,
      Logger: {
        level: 0,
      },
      LogLevel: fake.returns(1),
    };
    const ProjectChipMatter = {
      CommissioningController: fake.returns(commissioningController),
    };

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
    await matterHandler.init();
  });

  afterEach(async () => {
    await fse.remove(newMatterPath);
    process.env.MATTER_FOLDER_PATH = previousMatterPath;
  });

  it('should backup the matter controller', async () => {
    await matterHandler.backupController('job-1');
    assert.called(matterHandler.gladys.job.updateProgress);
    expect(backupContent).to.have.lengthOf.above(0);
  });
  it('should not backup the matter controller, commissioning controller is not initialized', async () => {
    matterHandler.commissioningController = null;
    await matterHandler.backupController('job-1');
    assert.notCalled(matterHandler.gladys.job.updateProgress);
    expect(backupContent).to.equal(null);
  });
});
