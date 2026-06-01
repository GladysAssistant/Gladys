const { expect } = require('chai');
// eslint-disable-next-line import/no-unresolved
const { BooleanState, Switch, FanControl } = require('@matter/main/clusters');

const { convertToGladysDevice } = require('../../../../services/matter/utils/convertToGladysDevice');

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
      getRockSupportAttribute: async () => 7,
      getWindSupportAttribute: async () => 3,
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
  });
});
