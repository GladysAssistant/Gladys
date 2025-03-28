const sinon = require('sinon');
const { expect } = require('chai');

const { fake } = sinon;

const config = require('../../../../config/config');

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.init', () => {
  let matterHandler;
  let environment;
  let storageService;
  let commissioningController;

  beforeEach(() => {
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
    commissioningController = {
      start: fake.resolves(null),
      getCommissionedNodesDetails: fake.returns([
        {
          nodeId: 12345n,
          deviceData: {
            basicInformation: {
              vendorName: 'Test Vendor',
              productName: 'Test Product',
            },
          },
        },
      ]),
      getNode: fake.resolves({
        getDevices: fake.returns([
          {
            id: 'device-1',
            name: 'Test Device',
          },
        ]),
      }),
    };

    // Create matter instance with mocked dependencies
    const MatterMain = {
      Environment: {
        default: environment,
      },
      StorageService: storageService,
    };
    const ProjectChipMatter = {
      CommissioningController: fake.returns(commissioningController),
    };
    const gladys = {
      config: {
        storage: config.test.storage,
      },
    };

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  afterEach(() => {});

  it('should initialize matter service successfully', async () => {
    await matterHandler.init();
    expect(matterHandler.devices).to.have.lengthOf(1);
    expect(matterHandler.nodesMap.size).to.equal(1);
  });

  it('should handle empty nodes list', async () => {
    commissioningController = {
      start: fake.resolves(null),
      getCommissionedNodesDetails: fake.returns([]),
      getNode: fake.resolves({
        getDevices: fake.returns([]),
      }),
    };
    const ProjectChipMatter = {
      CommissioningController: fake.returns(commissioningController),
    };
    matterHandler.ProjectChipMatter = ProjectChipMatter;
    await matterHandler.init();
    expect(matterHandler.devices).to.have.lengthOf(0);
    expect(matterHandler.nodesMap.size).to.equal(0);
  });
});
