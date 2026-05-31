const sinon = require('sinon');
const { expect } = require('chai');

const { fake } = sinon;

// eslint-disable-next-line import/no-unresolved
const { BooleanState, Switch, LevelControl, MediaPlayback, KeypadInput } = require('@matter/main/clusters');

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

  it('should create a light brightness feature for LevelControl lighting cluster', async () => {
    const clusterClient = {
      id: LevelControl.Complete.id,
      name: 'LevelControl',
      endpointId: 3,
      supportedFeatures: {
        lighting: true,
      },
      getMinLevelAttribute: fake.resolves(10),
      getMaxLevelAttribute: fake.resolves(200),
    };

    const device = {
      name: 'Test Device',
      number: 3,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '3');

    expect(gladysDevice.features).to.have.lengthOf(1);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'LevelControl - 3',
      selector: gladysDevice.features[0].selector,
      category: 'light',
      type: 'brightness',
      read_only: false,
      has_feedback: true,
      external_id: `matter:12345:3:${LevelControl.Complete.id}`,
      min: 10,
      max: 200,
    });
  });

  it('should fallback to default min/max for LevelControl when attributes throw', async () => {
    const clusterClient = {
      id: LevelControl.Complete.id,
      name: 'LevelControl',
      endpointId: 4,
      supportedFeatures: {
        lighting: true,
      },
      getMinLevelAttribute: async () => {
        throw new Error('not supported');
      },
      getMaxLevelAttribute: async () => {
        throw new Error('not supported');
      },
    };

    const device = {
      name: 'Test Device',
      number: 4,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '4');

    expect(gladysDevice.features).to.have.lengthOf(1);
    expect(gladysDevice.features[0].min).to.equal(0);
    expect(gladysDevice.features[0].max).to.equal(254);
  });

  it('should create television features for MediaPlayback cluster', async () => {
    const clusterClient = {
      id: MediaPlayback.Complete.id,
      name: 'MediaPlayback',
      endpointId: 6,
    };

    const device = {
      name: 'Test Device',
      number: 6,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '6');

    expect(gladysDevice.features).to.have.lengthOf(3);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'MediaPlayback - 6 (Play)',
      selector: gladysDevice.features[0].selector,
      category: 'television',
      type: 'play',
      read_only: false,
      has_feedback: true,
      external_id: `matter:12345:6:${MediaPlayback.Complete.id}:play`,
      min: 0,
      max: 1,
    });
    expect(gladysDevice.features[1]).to.deep.equal({
      name: 'MediaPlayback - 6 (Pause)',
      selector: gladysDevice.features[1].selector,
      category: 'television',
      type: 'pause',
      read_only: false,
      has_feedback: true,
      external_id: `matter:12345:6:${MediaPlayback.Complete.id}:pause`,
      min: 0,
      max: 1,
    });
    expect(gladysDevice.features[2]).to.deep.equal({
      name: 'MediaPlayback - 6 (Stop)',
      selector: gladysDevice.features[2].selector,
      category: 'television',
      type: 'stop',
      read_only: false,
      has_feedback: true,
      external_id: `matter:12345:6:${MediaPlayback.Complete.id}:stop`,
      min: 0,
      max: 1,
    });
  });

  it('should create a television volume feature for LevelControl non-lighting cluster', async () => {
    const clusterClient = {
      id: LevelControl.Complete.id,
      name: 'LevelControl',
      endpointId: 5,
      supportedFeatures: {
        lighting: false,
      },
      getMinLevelAttribute: fake.resolves(0),
      getMaxLevelAttribute: fake.resolves(254),
    };

    const device = {
      name: 'Test Device',
      number: 5,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '5');

    expect(gladysDevice.features).to.have.lengthOf(1);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'LevelControl - 5 (Volume)',
      selector: gladysDevice.features[0].selector,
      category: 'television',
      type: 'volume',
      read_only: false,
      has_feedback: true,
      external_id: `matter:12345:5:${LevelControl.Complete.id}:volume`,
      min: 0,
      max: 254,
    });
  });

  it('should create television keypad features for KeypadInput cluster', async () => {
    const clusterClient = {
      id: KeypadInput.Complete.id,
      name: 'KeypadInput',
      endpointId: 7,
    };

    const device = {
      name: 'Test Device',
      number: 7,
      getAllClusterClients: () => [clusterClient],
      getChildEndpoints: () => [],
    };

    const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, basicInformation, '7');

    expect(gladysDevice.features).to.have.lengthOf(6);
    expect(gladysDevice.features[0]).to.deep.equal({
      name: 'KeypadInput - 7 (Up)',
      selector: gladysDevice.features[0].selector,
      category: 'television',
      type: 'up',
      read_only: false,
      has_feedback: true,
      external_id: `matter:12345:7:${KeypadInput.Complete.id}:up`,
      min: 0,
      max: 1,
    });
    expect(gladysDevice.features[1]).to.deep.equal({
      name: 'KeypadInput - 7 (Down)',
      selector: gladysDevice.features[1].selector,
      category: 'television',
      type: 'down',
      read_only: false,
      has_feedback: true,
      external_id: `matter:12345:7:${KeypadInput.Complete.id}:down`,
      min: 0,
      max: 1,
    });
    expect(gladysDevice.features[2]).to.deep.equal({
      name: 'KeypadInput - 7 (Left)',
      selector: gladysDevice.features[2].selector,
      category: 'television',
      type: 'left',
      read_only: false,
      has_feedback: true,
      external_id: `matter:12345:7:${KeypadInput.Complete.id}:left`,
      min: 0,
      max: 1,
    });
    expect(gladysDevice.features[3]).to.deep.equal({
      name: 'KeypadInput - 7 (Right)',
      selector: gladysDevice.features[3].selector,
      category: 'television',
      type: 'right',
      read_only: false,
      has_feedback: true,
      external_id: `matter:12345:7:${KeypadInput.Complete.id}:right`,
      min: 0,
      max: 1,
    });
    expect(gladysDevice.features[4]).to.deep.equal({
      name: 'KeypadInput - 7 (Enter)',
      selector: gladysDevice.features[4].selector,
      category: 'television',
      type: 'enter',
      read_only: false,
      has_feedback: true,
      external_id: `matter:12345:7:${KeypadInput.Complete.id}:enter`,
      min: 0,
      max: 1,
    });
    expect(gladysDevice.features[5]).to.deep.equal({
      name: 'KeypadInput - 7 (Return)',
      selector: gladysDevice.features[5].selector,
      category: 'television',
      type: 'return',
      read_only: false,
      has_feedback: true,
      external_id: `matter:12345:7:${KeypadInput.Complete.id}:return`,
      min: 0,
      max: 1,
    });
  });
});
