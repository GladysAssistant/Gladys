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
  let clusterClients;

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

    clusterClients = new Map();

    // On/Off
    clusterClients.set(6, {
      id: 6,
      name: 'OnOff',
      endpointId: 1,
      attributes: {
        onOff: {},
      },
      commands: {},
      addOnOffAttributeListener: fake.returns(null),
    });

    // Occupancy
    clusterClients.set(1030, {
      id: 1030,
      name: 'OccupancySensing',
      endpointId: 1,
      attributes: {
        occupancy: {},
      },
      commands: {},
      addOccupancyAttributeListener: fake.returns(null),
    });

    // Illuminance
    clusterClients.set(1024, {
      id: 1024,
      name: 'IlluminanceMeasurement',
      endpointId: 1,
      attributes: {
        measuredValue: {},
      },
      commands: {},
      addMeasuredValueAttributeListener: fake.returns(null),
    });

    // Temperature sensor
    clusterClients.set(1026, {
      id: 1026,
      name: 'TemperatureMeasurement',
      endpointId: 1,
      attributes: {
        measuredValue: {},
      },
      commands: {},
      addMeasuredValueAttributeListener: fake.returns(null),
    });

    // Window Shutters
    clusterClients.set(258, {
      id: 258,
      name: 'WindowCovering',
      endpointId: 1,
      attributes: {
        currentPositionLiftPercent100ths: {},
      },
      commands: {},
      addCurrentPositionLiftPercent100thsAttributeListener: fake.returns(null),
    });

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
            number: 1,
            clusterClients,
            childEndpoints: [
              {
                id: 'child-endpoint-1',
                name: 'Child Endpoint',
                number: 2,
                clusterClients,
              },
            ],
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
      Logger: {
        level: 0,
      },
      LogLevel: fake.returns(1),
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
    expect(matterHandler.devices).to.have.lengthOf(2);
    expect(matterHandler.devices).to.deep.equal([
      {
        name: 'Test Vendor (Test Product) 1',
        external_id: 'matter:12345:1',
        selector: 'matter:12345:1',
        service_id: 'service-1',
        should_poll: false,
        features: [
          {
            name: 'OnOff - 1',
            category: 'switch',
            type: 'binary',
            read_only: false,
            has_feedback: true,
            external_id: 'matter:12345:1:6',
            selector: 'matter:12345:1:6',
            min: 0,
            max: 1,
          },
          {
            name: 'OccupancySensing - 1',
            category: 'motion-sensor',
            type: 'binary',
            read_only: true,
            has_feedback: true,
            external_id: 'matter:12345:1:1030',
            selector: 'matter:12345:1:1030',
            min: 0,
            max: 1,
          },
          {
            name: 'IlluminanceMeasurement - 1',
            category: 'light-sensor',
            type: 'decimal',
            read_only: true,
            has_feedback: true,
            unit: 'lux',
            external_id: 'matter:12345:1:1024',
            selector: 'matter:12345:1:1024',
            min: 1,
            max: 6553,
          },
          {
            name: 'TemperatureMeasurement - 1',
            category: 'temperature-sensor',
            type: 'decimal',
            read_only: true,
            has_feedback: true,
            unit: 'celsius',
            external_id: 'matter:12345:1:1026',
            selector: 'matter:12345:1:1026',
            min: -100,
            max: 200,
          },
          {
            name: 'WindowCovering - 1 (Position)',
            category: 'shutter',
            type: 'position',
            read_only: false,
            has_feedback: true,
            unit: 'celsius',
            external_id: 'matter:12345:1:258:position',
            selector: 'matter:12345:1:258:position',
            min: 0,
            max: 100,
          },
          {
            name: 'WindowCovering - 1 (State)',
            category: 'shutter',
            type: 'state',
            read_only: false,
            has_feedback: true,
            unit: 'celsius',
            external_id: 'matter:12345:1:258:state',
            selector: 'matter:12345:1:258:state',
            min: 0,
            max: 1,
          },
        ],
        params: [],
      },
      {
        name: 'Test Vendor (Test Product) 2',
        external_id: 'matter:12345:1:child_endpoint:2',
        selector: 'matter:12345:1:child_endpoint:2',
        service_id: 'service-1',
        should_poll: false,
        features: [
          {
            name: 'OnOff - 1',
            category: 'switch',
            type: 'binary',
            read_only: false,
            has_feedback: true,
            external_id: 'matter:12345:1:child_endpoint:2:6',
            selector: 'matter:12345:1:child_endpoint:2:6',
            min: 0,
            max: 1,
          },
          {
            name: 'OccupancySensing - 1',
            category: 'motion-sensor',
            type: 'binary',
            read_only: true,
            has_feedback: true,
            external_id: 'matter:12345:1:child_endpoint:2:1030',
            selector: 'matter:12345:1:child_endpoint:2:1030',
            min: 0,
            max: 1,
          },
          {
            name: 'IlluminanceMeasurement - 1',
            category: 'light-sensor',
            type: 'decimal',
            read_only: true,
            has_feedback: true,
            unit: 'lux',
            external_id: 'matter:12345:1:child_endpoint:2:1024',
            selector: 'matter:12345:1:child_endpoint:2:1024',
            min: 1,
            max: 6553,
          },
          {
            name: 'TemperatureMeasurement - 1',
            category: 'temperature-sensor',
            type: 'decimal',
            read_only: true,
            has_feedback: true,
            unit: 'celsius',
            external_id: 'matter:12345:1:child_endpoint:2:1026',
            selector: 'matter:12345:1:child_endpoint:2:1026',
            min: -100,
            max: 200,
          },
          {
            name: 'WindowCovering - 1 (Position)',
            category: 'shutter',
            type: 'position',
            read_only: false,
            has_feedback: true,
            unit: 'celsius',
            external_id: 'matter:12345:1:child_endpoint:2:258:position',
            selector: 'matter:12345:1:child_endpoint:2:258:position',
            min: 0,
            max: 100,
          },
          {
            name: 'WindowCovering - 1 (State)',
            category: 'shutter',
            type: 'state',
            read_only: false,
            has_feedback: true,
            unit: 'celsius',
            external_id: 'matter:12345:1:child_endpoint:2:258:state',
            selector: 'matter:12345:1:child_endpoint:2:258:state',
            min: 0,
            max: 1,
          },
        ],
        params: [],
      },
    ]);
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
