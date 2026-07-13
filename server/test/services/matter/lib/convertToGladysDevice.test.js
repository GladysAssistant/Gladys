const { expect } = require('chai');

const {
  BooleanState,
  Switch,
  FanControl,
  RvcOperationalState,
  RvcRunMode,
  RvcCleanMode,
  PowerSource,
  Thermostat,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');

const {
  convertToGladysDevice,
  matterExternalIdToSelector,
} = require('../../../../services/matter/utils/convertToGladysDevice');

describe('Matter.convertToGladysDevice', () => {
  const serviceId = 'service-1';
  const nodeId = 12345n;
  const basicInformation = {
    vendorName: 'Test Vendor',
    productName: 'Test Product',
  };

  it('should create a read-only binary feature for BooleanState cluster', async () => {
    const clusterClient = {
      id: BooleanState.Complete.id,
      name: 'BooleanState',
      endpointId: 1,
    };

    const device = {
      name: 'Test Device',
      number: 1,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '1');

    expect(gladysDevice.features).to.have.lengthOf(1);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'BooleanState - 1',
      selector: matterExternalIdToSelector('matter:12345:1:69'),
      category: 'switch',
      type: 'binary',
      read_only: true,
      has_feedback: true,
      external_id: 'matter:12345:1:69',
      min: 0,
      max: 1,
    });
  });

  it('should build stable selectors from external_id', async () => {
    expect(matterExternalIdToSelector('matter:12345:1:514:mode')).to.eq('matter-12345-1-514-mode');

    const clusterClient = {
      id: BooleanState.Complete.id,
      name: 'BooleanState',
      endpointId: 1,
    };

    const device = {
      name: 'Renamed Device',
      number: 1,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '1');

    expect(gladysDevice.selector).to.eq(matterExternalIdToSelector('matter:12345:1'));
    expect(gladysDevice.features[0].selector).to.eq(matterExternalIdToSelector('matter:12345:1:69'));
    expect(gladysDevice.features[0].selector).to.not.match(/-[a-z0-9]{4}$/);
  });

  it('should create a button click feature for Switch cluster', async () => {
    const clusterClient = {
      id: Switch.Complete.id,
      name: 'Switch',
      endpointId: 2,
    };

    const device = {
      name: 'Test Device',
      number: 2,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '1:child_endpoint:2');

    expect(gladysDevice.features).to.have.lengthOf(1);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'Switch - 2 (Click)',
      selector: gladysDevice.features[0].selector,
      category: 'button',
      type: 'click',
      read_only: true,
      has_feedback: true,
      external_id: 'matter:12345:1:child_endpoint:2:59:click',
      min: 0,
      max: 84,
    });
  });

  it('should create fan control features for FanControl cluster', async () => {
    const clusterClient = {
      id: FanControl.Complete.id,
      name: 'FanControl',
      endpointId: 1,
      supportedFeatures: {
        multiSpeed: true,
        rocking: true,
        wind: true,
        airflowDirection: true,
      },
      getSpeedMaxAttribute: async () => 10,
      getRockSupportAttribute: async () => ({ rockLeftRight: true, rockUpDown: true, rockRound: true }),
      getWindSupportAttribute: async () => ({ sleepWind: true, naturalWind: true }),
    };

    const device = {
      name: 'Fan Device',
      number: 3,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '3');

    expect(gladysDevice.features).to.have.lengthOf(8);

    const externalIds = gladysDevice.features.map((feature) => feature.external_id);
    expect(externalIds).to.include.members([
      `matter:12345:3:${FanControl.Complete.id}:mode`,
      `matter:12345:3:${FanControl.Complete.id}:percent`,
      `matter:12345:3:${FanControl.Complete.id}:percent-current`,
      `matter:12345:3:${FanControl.Complete.id}:speed`,
      `matter:12345:3:${FanControl.Complete.id}:speed-current`,
      `matter:12345:3:${FanControl.Complete.id}:rock`,
      `matter:12345:3:${FanControl.Complete.id}:wind`,
      `matter:12345:3:${FanControl.Complete.id}:airflow-direction`,
    ]);

    const speedFeature = gladysDevice.features.find((feature) => feature.external_id.endsWith(':speed'));
    expect(speedFeature).to.deep.include({
      category: 'fan',
      type: 'speed',
      read_only: false,
      max: 10,
      min: 0,
    });

    const rockFeature = gladysDevice.features.find((feature) => feature.external_id.endsWith(':rock'));
    expect(rockFeature).to.deep.include({
      category: 'fan',
      type: 'rock-setting',
      read_only: false,
      max: 7,
      min: 0,
    });

    const windFeature = gladysDevice.features.find((feature) => feature.external_id.endsWith(':wind'));
    expect(windFeature).to.deep.include({
      category: 'fan',
      type: 'wind-setting',
      read_only: false,
      max: 3,
      min: 0,
    });
  });

  it('should use fallback fan attribute bounds when Matter values are missing', async () => {
    const clusterClient = {
      id: FanControl.Complete.id,
      name: 'FanControl',
      endpointId: 1,
      supportedFeatures: {
        multiSpeed: true,
        rocking: true,
        wind: true,
      },
      getSpeedMaxAttribute: async () => null,
      getRockSupportAttribute: async () => null,
      getWindSupportAttribute: async () => null,
    };

    const device = {
      name: 'Fan Device',
      number: 3,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '3');

    const speedFeature = gladysDevice.features.find((feature) => feature.external_id.endsWith(':speed'));
    const rockFeature = gladysDevice.features.find((feature) => feature.external_id.endsWith(':rock'));
    const windFeature = gladysDevice.features.find((feature) => feature.external_id.endsWith(':wind'));

    expect(speedFeature.max).to.eq(255);
    expect(rockFeature.max).to.eq(7);
    expect(windFeature.max).to.eq(3);
  });

  it('should create vacuum cleaner features for RvcOperationalState cluster', async () => {
    const clusterClient = {
      id: RvcOperationalState.Complete.id,
      name: 'RvcOperationalState',
      endpointId: 2,
    };

    const device = {
      name: 'Robot Vacuum',
      number: 2,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '1:child_endpoint:2');

    expect(gladysDevice.features).to.have.lengthOf(2);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'RvcOperationalState - 2 (State)',
      selector: gladysDevice.features[0].selector,
      category: 'vacuum-cleaner',
      type: 'state',
      read_only: true,
      has_feedback: true,
      external_id: 'matter:12345:1:child_endpoint:2:97:state',
      min: 0,
      max: 255,
    });
    expect(gladysDevice.features[1]).to.deep.equal({
      name: 'RvcOperationalState - 2 (Dock)',
      selector: gladysDevice.features[1].selector,
      category: 'vacuum-cleaner',
      type: 'dock',
      read_only: false,
      has_feedback: false,
      external_id: 'matter:12345:1:child_endpoint:2:97:dock',
      min: 0,
      max: 1,
    });
  });

  it('should create vacuum cleaner run mode feature for RvcRunMode cluster', async () => {
    const clusterClient = {
      id: RvcRunMode.Complete.id,
      name: 'RvcRunMode',
      endpointId: 2,
    };

    const device = {
      name: 'Robot Vacuum',
      number: 2,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '2');

    expect(gladysDevice.features).to.have.lengthOf(1);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'RvcRunMode - 2',
      selector: gladysDevice.features[0].selector,
      category: 'vacuum-cleaner',
      type: 'run-mode',
      read_only: false,
      has_feedback: true,
      external_id: 'matter:12345:2:84',
      min: 0,
      max: 2,
    });
  });

  it('should create vacuum cleaner clean mode feature for RvcCleanMode cluster', async () => {
    const clusterClient = {
      id: RvcCleanMode.Complete.id,
      name: 'RvcCleanMode',
      endpointId: 2,
    };

    const device = {
      name: 'Robot Vacuum',
      number: 2,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '2');

    expect(gladysDevice.features).to.have.lengthOf(1);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'RvcCleanMode - 2',
      selector: gladysDevice.features[0].selector,
      category: 'vacuum-cleaner',
      type: 'clean-mode',
      read_only: false,
      has_feedback: true,
      external_id: 'matter:12345:2:85',
      min: 0,
      max: 6,
    });
  });

  it('should create battery feature for PowerSource cluster with battery support', async () => {
    const clusterClient = {
      id: PowerSource.Complete.id,
      name: 'PowerSource',
      endpointId: 2,
      supportedFeatures: {
        battery: true,
      },
    };

    const device = {
      name: 'Robot Vacuum',
      number: 2,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '2');

    expect(gladysDevice.features).to.have.lengthOf(1);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'PowerSource - 2 (Battery)',
      selector: gladysDevice.features[0].selector,
      category: 'battery',
      type: 'integer',
      read_only: true,
      has_feedback: true,
      unit: 'percent',
      external_id: 'matter:12345:2:47:battery',
      min: 0,
      max: 100,
    });
  });

  it('should not create battery feature for PowerSource cluster without battery support', async () => {
    const clusterClient = {
      id: PowerSource.Complete.id,
      name: 'PowerSource',
      endpointId: 2,
      supportedFeatures: {
        wired: true,
      },
    };

    const device = {
      name: 'Wired Device',
      number: 2,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '2');

    expect(gladysDevice.features).to.have.lengthOf(0);
  });

  it('should create thermostat local temperature and setpoint features for Thermostat cluster', async () => {
    const clusterClient = {
      id: Thermostat.Complete.id,
      name: 'Thermostat',
      endpointId: 4,
      supportedFeatures: {
        heating: true,
        cooling: true,
      },
    };

    const device = {
      name: 'Water Heater',
      number: 4,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '1:child_endpoint:4');

    expect(gladysDevice.features).to.have.lengthOf(3);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'Thermostat - 4 (Local temperature)',
      selector: gladysDevice.features[0].selector,
      category: 'temperature-sensor',
      type: 'decimal',
      read_only: true,
      has_feedback: true,
      unit: 'celsius',
      external_id: 'matter:12345:1:child_endpoint:4:513:local-temperature',
      min: -100,
      max: 200,
    });
    expect(gladysDevice.features[1]).to.deep.include({
      name: 'Thermostat - 4 (Heating)',
      category: 'thermostat',
      type: 'target-temperature',
      external_id: 'matter:12345:1:child_endpoint:4:513:heating',
    });
    expect(gladysDevice.features[2]).to.deep.include({
      name: 'Thermostat - 4 (Cooling)',
      category: 'air-conditioning',
      type: 'target-temperature',
      external_id: 'matter:12345:1:child_endpoint:4:513:cooling',
    });
  });
});
