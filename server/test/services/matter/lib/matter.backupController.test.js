const sinon = require('sinon');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');
const { VARIABLES } = require('../../../../services/matter/utils/constants');

const config = require('../../../../config/config');

describe('Matter.backupController', () => {
  let matterHandler;
  let environment;
  let storageService;

  beforeEach(async () => {
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
    const gladys = {
      job: {
        wrapper: (type, fn) => fn,
        updateProgress: fake.resolves(null),
      },
      variable: {
        getValue: fake.resolves('true'),
        setValue: fake.resolves(null),
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

  it('should backup the matter controller', async () => {
    await matterHandler.backupController('job-1');
    assert.called(matterHandler.gladys.job.updateProgress);
    assert.calledWith(matterHandler.gladys.variable.setValue, VARIABLES.MATTER_BACKUP);
  });
});
