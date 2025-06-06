const {
  Pm25ConcentrationMeasurement,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');

const sinon = require('sinon');
const { expect } = require('chai');

const { fake, assert } = sinon;

const config = require('../../../../config/config');

const MatterHandler = require('../../../../services/matter/lib');
const { VARIABLES } = require('../../../../services/matter/utils/constants');

describe('Matter.init', () => {
  let matterHandler;
  let environment;
  let storageService;
  let commissioningController;
  let clusterClients;
  let previousMatterPath;

  beforeEach(() => {
    previousMatterPath = process.env.MATTER_FOLDER_PATH;
    process.env.MATTER_FOLDER_PATH = '/tmp/gladysmattertest';

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

    // Color control
    clusterClients.set(768, {
      id: 768,
      name: 'ColorControl',
      endpointId: 1,
      attributes: {},
      commands: {},
      supportedFeatures: {
        hueSaturation: true,
      },
      addCurrentHueAttributeListener: fake.returns(null),
      addCurrentSaturationAttributeListener: fake.returns(null),
      getCurrentHueAttribute: fake.resolves(128),
      getCurrentSaturationAttribute: fake.resolves(128),
    });

    // Level control
    clusterClients.set(8, {
      id: 8,
      name: 'LevelControl',
      endpointId: 1,
      attributes: {},
      commands: {},
      supportedFeatures: {
        lighting: true,
      },
      getMinLevelAttribute: fake.resolves(0),
      getMaxLevelAttribute: fake.resolves(100),
    });

    // Relative humidity measurement
    clusterClients.set(1029, {
      id: 1029,
      name: 'RelativeHumidityMeasurement',
      endpointId: 1,
      attributes: {
        measuredValue: {},
      },
      commands: {},
      addMeasuredValueAttributeListener: fake.returns(null),
    });

    // Thermostat
    clusterClients.set(513, {
      id: 513,
      name: 'Thermostat',
      endpointId: 1,
      attributes: {
        occupiedHeatingSetpoint: {},
        occupiedCoolingSetpoint: {},
      },
      supportedFeatures: {
        heating: true,
        cooling: true,
      },
      commands: {},
      addOccupiedHeatingSetpointAttributeListener: fake.returns(null),
      addOccupiedCoolingSetpointAttributeListener: fake.returns(null),
    });

    // PM2.5 concentration measurement
    clusterClients.set(Pm25ConcentrationMeasurement.Complete.id, {
      id: Pm25ConcentrationMeasurement.Complete.id,
      name: 'Pm25ConcentrationMeasurement',
      endpointId: 1,
      attributes: {
        measuredValue: {},
      },
      commands: {},
      addMeasuredValueAttributeListener: fake.returns(null),
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
        {
          nodeId: 12346n,
          deviceData: undefined,
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
      scheduler: {
        scheduleJob: fake.returns(null),
      },
      job: {
        wrapper: (type, fn) => fn,
      },
      variable: {
        getValue: fake.resolves(null),
      },
    };

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  afterEach(() => {
    process.env.MATTER_FOLDER_PATH = previousMatterPath;
  });

  it('should initialize matter service successfully', async () => {
    await matterHandler.init();
    expect(matterHandler.devices).to.have.lengthOf(2);
    // Device selector should be a slug of the name with 4 random characters at the end
    expect(matterHandler.devices[0].selector).to.satisfy(
      (selector) => selector.startsWith('matter-test-device-') && selector.length === 'matter-test-device-'.length + 4,
    );
    // Feature selector should be a slug of the name with 4 random characters at the end
    expect(matterHandler.devices[0].features[0].selector).to.satisfy(
      (selector) =>
        selector.startsWith('matter-test-device-onoff-') && selector.length === 'matter-test-device-onoff-'.length + 4,
    );
    expect(matterHandler.devices).to.deep.equal([
      {
        name: 'Test Vendor (Test Product) 1',
        external_id: 'matter:12345:1',
        selector: matterHandler.devices[0].selector,
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
            selector: matterHandler.devices[0].features[0].selector,
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
            selector: matterHandler.devices[0].features[1].selector,
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
            selector: matterHandler.devices[0].features[2].selector,
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
            selector: matterHandler.devices[0].features[3].selector,
            min: -100,
            max: 200,
          },
          {
            name: 'WindowCovering - 1 (Position)',
            category: 'shutter',
            type: 'position',
            read_only: false,
            has_feedback: true,
            unit: 'percent',
            external_id: 'matter:12345:1:258:position',
            selector: matterHandler.devices[0].features[4].selector,
            min: 0,
            max: 100,
          },
          {
            name: 'WindowCovering - 1 (State)',
            category: 'shutter',
            type: 'state',
            read_only: false,
            has_feedback: true,
            unit: null,
            external_id: 'matter:12345:1:258:state',
            selector: matterHandler.devices[0].features[5].selector,
            min: 0,
            max: 1,
          },
          {
            name: 'ColorControl - 1 (Color)',
            category: 'light',
            type: 'color',
            read_only: false,
            has_feedback: true,
            external_id: 'matter:12345:1:768:color',
            selector: matterHandler.devices[0].features[6].selector,
            min: 0,
            max: 6579300,
          },
          {
            name: 'LevelControl - 1',
            category: 'light',
            type: 'brightness',
            read_only: false,
            has_feedback: true,
            external_id: 'matter:12345:1:8',
            selector: matterHandler.devices[0].features[7].selector,
            min: 0,
            max: 100,
          },
          {
            name: 'RelativeHumidityMeasurement - 1',
            category: 'humidity-sensor',
            type: 'decimal',
            read_only: true,
            has_feedback: true,
            unit: 'percent',
            external_id: 'matter:12345:1:1029',
            selector: matterHandler.devices[0].features[8].selector,
            min: 0,
            max: 100,
          },
          {
            name: 'Thermostat - 1 (Heating)',
            category: 'thermostat',
            type: 'target-temperature',
            read_only: false,
            has_feedback: true,
            unit: 'celsius',
            external_id: 'matter:12345:1:513:heating',
            selector: matterHandler.devices[0].features[9].selector,
            min: -100,
            max: 200,
          },
          {
            name: 'Thermostat - 1 (Cooling)',
            category: 'air-conditioning',
            type: 'target-temperature',
            read_only: false,
            has_feedback: true,
            unit: 'celsius',
            external_id: 'matter:12345:1:513:cooling',
            selector: matterHandler.devices[0].features[10].selector,
            min: -100,
            max: 200,
          },
          {
            category: 'pm25-sensor',
            external_id: 'matter:12345:1:1066',
            has_feedback: true,
            max: 1500,
            min: 0,
            name: 'Pm25ConcentrationMeasurement - 1',
            read_only: true,
            selector: matterHandler.devices[0].features[11].selector,
            type: 'decimal',
            unit: 'microgram-per-cubic-meter',
          },
        ],
        params: [],
      },
      {
        name: 'Test Vendor (Test Product) 2',
        external_id: 'matter:12345:1:child_endpoint:2',
        selector: matterHandler.devices[1].selector,
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
            selector: matterHandler.devices[1].features[0].selector,
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
            selector: matterHandler.devices[1].features[1].selector,
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
            selector: matterHandler.devices[1].features[2].selector,
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
            selector: matterHandler.devices[1].features[3].selector,
            min: -100,
            max: 200,
          },
          {
            name: 'WindowCovering - 1 (Position)',
            category: 'shutter',
            type: 'position',
            read_only: false,
            has_feedback: true,
            unit: 'percent',
            external_id: 'matter:12345:1:child_endpoint:2:258:position',
            selector: matterHandler.devices[1].features[4].selector,
            min: 0,
            max: 100,
          },
          {
            name: 'WindowCovering - 1 (State)',
            category: 'shutter',
            type: 'state',
            read_only: false,
            has_feedback: true,
            unit: null,
            external_id: 'matter:12345:1:child_endpoint:2:258:state',
            selector: matterHandler.devices[1].features[5].selector,
            min: 0,
            max: 1,
          },
          {
            name: 'ColorControl - 1 (Color)',
            category: 'light',
            type: 'color',
            read_only: false,
            has_feedback: true,
            external_id: 'matter:12345:1:child_endpoint:2:768:color',
            selector: matterHandler.devices[1].features[6].selector,
            min: 0,
            max: 6579300,
          },
          {
            name: 'LevelControl - 1',
            category: 'light',
            type: 'brightness',
            read_only: false,
            has_feedback: true,
            external_id: 'matter:12345:1:child_endpoint:2:8',
            selector: matterHandler.devices[1].features[7].selector,
            min: 0,
            max: 100,
          },
          {
            name: 'RelativeHumidityMeasurement - 1',
            category: 'humidity-sensor',
            type: 'decimal',
            read_only: true,
            has_feedback: true,
            unit: 'percent',
            external_id: 'matter:12345:1:child_endpoint:2:1029',
            selector: matterHandler.devices[1].features[8].selector,
            min: 0,
            max: 100,
          },
          {
            name: 'Thermostat - 1 (Heating)',
            category: 'thermostat',
            type: 'target-temperature',
            read_only: false,
            has_feedback: true,
            unit: 'celsius',
            external_id: 'matter:12345:1:child_endpoint:2:513:heating',
            selector: matterHandler.devices[1].features[9].selector,
            min: -100,
            max: 200,
          },
          {
            name: 'Thermostat - 1 (Cooling)',
            category: 'air-conditioning',
            type: 'target-temperature',
            read_only: false,
            has_feedback: true,
            unit: 'celsius',
            external_id: 'matter:12345:1:child_endpoint:2:513:cooling',
            selector: matterHandler.devices[1].features[10].selector,
            min: -100,
            max: 200,
          },
          {
            category: 'pm25-sensor',
            external_id: 'matter:12345:1:child_endpoint:2:1066',
            has_feedback: true,
            max: 1500,
            min: 0,
            name: 'Pm25ConcentrationMeasurement - 1',
            read_only: true,
            selector: matterHandler.devices[1].features[11].selector,
            type: 'decimal',
            unit: 'microgram-per-cubic-meter',
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
  it('should init and restore backup', async () => {
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
    matterHandler.gladys.variable.getValue = (variable) => {
      if (variable === VARIABLES.MATTER_BACKUP) {
        return 'lala';
      }
      return null;
    };
    matterHandler.restoreBackup = fake.resolves(null);
    await matterHandler.init();
    assert.called(matterHandler.restoreBackup);
    expect(matterHandler.devices).to.have.lengthOf(0);
    expect(matterHandler.nodesMap.size).to.equal(0);
  });
});
