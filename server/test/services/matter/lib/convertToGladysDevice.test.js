const { expect } = require('chai');

const {
  BooleanState,
  Switch,
  RvcOperationalState,
  RvcRunMode,
  RvcCleanMode,
  PowerSource,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');

const { convertToGladysDevice } = require('../../../../services/matter/utils/convertToGladysDevice');

describe('Matter.convertToGladysDevice', () => {
  const serviceId = 'service-1';
  const nodeId = 12345n;
  const basicInformation = {
    vendorName: 'Test Vendor',
    productName: 'Test Product',
  };

  it('should create a read-only binary feature for BooleanState cluster', async () => {
    const clusterClients = new Map();
    clusterClients.set(BooleanState.Complete.id, {
      id: BooleanState.Complete.id,
      name: 'BooleanState',
      endpointId: 1,
    });

    const device = {
      name: 'Test Device',
      number: 1,
      clusterClients,
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '1');

    expect(gladysDevice.features).to.have.lengthOf(1);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'BooleanState - 1',
      selector: gladysDevice.features[0].selector,
      category: 'switch',
      type: 'binary',
      read_only: true,
      has_feedback: true,
      external_id: 'matter:12345:1:69',
      min: 0,
      max: 1,
    });
  });

  it('should create a button click feature for Switch cluster', async () => {
    const clusterClients = new Map();
    clusterClients.set(Switch.Complete.id, {
      id: Switch.Complete.id,
      name: 'Switch',
      endpointId: 2,
    });

    const device = {
      name: 'Test Device',
      number: 2,
      clusterClients,
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

  it('should create vacuum cleaner features for RvcOperationalState cluster', async () => {
    const clusterClients = new Map();
    clusterClients.set(RvcOperationalState.Complete.id, {
      id: RvcOperationalState.Complete.id,
      name: 'RvcOperationalState',
      endpointId: 2,
    });

    const device = {
      name: 'Robot Vacuum',
      number: 2,
      clusterClients,
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
    const clusterClients = new Map();
    clusterClients.set(RvcRunMode.Complete.id, {
      id: RvcRunMode.Complete.id,
      name: 'RvcRunMode',
      endpointId: 2,
    });

    const device = {
      name: 'Robot Vacuum',
      number: 2,
      clusterClients,
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
      max: 255,
    });
  });

  it('should create vacuum cleaner clean mode feature for RvcCleanMode cluster', async () => {
    const clusterClients = new Map();
    clusterClients.set(RvcCleanMode.Complete.id, {
      id: RvcCleanMode.Complete.id,
      name: 'RvcCleanMode',
      endpointId: 2,
    });

    const device = {
      name: 'Robot Vacuum',
      number: 2,
      clusterClients,
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
      max: 255,
    });
  });

  it('should create battery feature for PowerSource cluster with battery support', async () => {
    const clusterClients = new Map();
    clusterClients.set(PowerSource.Complete.id, {
      id: PowerSource.Complete.id,
      name: 'PowerSource',
      endpointId: 2,
      supportedFeatures: {
        battery: true,
      },
    });

    const device = {
      name: 'Robot Vacuum',
      number: 2,
      clusterClients,
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
    const clusterClients = new Map();
    clusterClients.set(PowerSource.Complete.id, {
      id: PowerSource.Complete.id,
      name: 'PowerSource',
      endpointId: 2,
      supportedFeatures: {
        wired: true,
      },
    });

    const device = {
      name: 'Wired Device',
      number: 2,
      clusterClients,
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '2');

    expect(gladysDevice.features).to.have.lengthOf(0);
  });
});
