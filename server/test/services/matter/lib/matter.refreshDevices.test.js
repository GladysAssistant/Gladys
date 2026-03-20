const sinon = require('sinon');
const { expect } = require('chai');

const { fake } = sinon;

// NodeStates enum values from @project-chip/matter.js/device
const NodeStates = {
  Connected: 0,
  Disconnected: 1,
  Reconnecting: 2,
  WaitingForDeviceDiscovery: 3,
};

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.refreshDevices', () => {
  let matterHandler;
  let clusterClients;

  beforeEach(() => {
    const gladys = {
      job: {
        wrapper: fake.returns(null),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
    clusterClients = new Map();
    // On/Off
    clusterClients.set(6, {
      id: 6,
      name: 'OnOff',
      endpointId: 1,
      attributes: {
        onOff: {
          get: fake.resolves(true),
        },
      },
      commands: {},
      addOnOffAttributeListener: fake.returns(null),
    });
    matterHandler.commissioningController = {
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
        isConnected: false,
        initialized: false,
        connect: fake.returns(null),
        events: {
          initialized: Promise.resolve(),
          stateChanged: {
            on: fake.returns(null),
          },
        },
        getDevices: fake.returns([
          {
            id: 'device-1',
            name: 'Test Device',
            number: 1,
            getClusterClientById: (id) => clusterClients.get(id),
            getAllClusterClients: () => Array.from(clusterClients.values()),
            getChildEndpoints: () => [
              {
                id: 'child-endpoint-1',
                name: 'Child Endpoint',
                number: 2,
                getClusterClientById: (id) => clusterClients.get(id),
                getAllClusterClients: () => Array.from(clusterClients.values()),
                getChildEndpoints: () => [],
              },
            ],
          },
        ]),
      }),
    };
  });

  it('should refresh devices', async () => {
    await matterHandler.refreshDevices();
    expect(matterHandler.devices).to.have.lengthOf(2);
    expect(matterHandler.nodesMap.size).to.equal(1);
    await matterHandler.refreshDevices();
    expect(matterHandler.devices).to.have.lengthOf(2);
    expect(matterHandler.nodesMap.size).to.equal(1);
  });

  it('should trigger stateChanged handler on reconnect', async () => {
    let stateChangedCallback;
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
      job: {
        wrapper: fake.returns(null),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};
    const handler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');

    const onOffCluster = {
      id: 6,
      name: 'OnOff',
      endpointId: 1,
      attributes: {
        onOff: {
          get: fake.resolves(true),
        },
      },
      commands: {},
      addOnOffAttributeListener: fake.returns(null),
    };
    const testClusterClients = new Map();
    testClusterClients.set(6, onOffCluster);

    handler.commissioningController = {
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
        isConnected: false,
        initialized: false,
        connect: fake.returns(null),
        events: {
          initialized: Promise.resolve(),
          stateChanged: {
            on: (callback) => {
              stateChangedCallback = callback;
            },
          },
        },
        getDevices: fake.returns([
          {
            id: 'device-1',
            name: 'Test Device',
            number: 1,
            getClusterClientById: (id) => testClusterClients.get(id),
            getAllClusterClients: () => Array.from(testClusterClients.values()),
            getChildEndpoints: () => [],
          },
        ]),
      }),
    };

    await handler.refreshDevices();
    expect(handler.devices).to.have.lengthOf(1);

    // Simulate reconnect by calling the stateChanged callback with NodeStates.Connected
    await stateChangedCallback(NodeStates.Connected);

    // Should have emitted state for the device
    sinon.assert.called(gladys.event.emit);
  });

  it('should handle error in stateChanged reconnect handler gracefully', async () => {
    let stateChangedCallback;
    const gladys = {
      event: {
        emit: fake.throws(new Error('Emit failed')),
      },
      job: {
        wrapper: fake.returns(null),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};
    const handler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');

    const onOffCluster = {
      id: 6,
      name: 'OnOff',
      endpointId: 1,
      attributes: {
        onOff: {
          get: fake.resolves(true),
        },
      },
      commands: {},
      addOnOffAttributeListener: fake.returns(null),
    };
    const testClusterClients = new Map();
    testClusterClients.set(6, onOffCluster);

    handler.commissioningController = {
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
        isConnected: false,
        initialized: false,
        connect: fake.returns(null),
        events: {
          initialized: Promise.resolve(),
          stateChanged: {
            on: (callback) => {
              stateChangedCallback = callback;
            },
          },
        },
        getDevices: fake.returns([
          {
            id: 'device-1',
            name: 'Test Device',
            number: 1,
            getClusterClientById: (id) => testClusterClients.get(id),
            getAllClusterClients: () => Array.from(testClusterClients.values()),
            getChildEndpoints: () => [],
          },
        ]),
      }),
    };

    await handler.refreshDevices();

    // Simulate reconnect - should not throw despite emit error
    await stateChangedCallback(NodeStates.Connected);
  });

  it('should not refresh states when node state is not Connected', async () => {
    let stateChangedCallback;
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
      job: {
        wrapper: fake.returns(null),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};
    const handler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');

    const onOffCluster = {
      id: 6,
      name: 'OnOff',
      endpointId: 1,
      attributes: {
        onOff: {
          get: fake.resolves(true),
        },
      },
      commands: {},
      addOnOffAttributeListener: fake.returns(null),
    };
    const testClusterClients = new Map();
    testClusterClients.set(6, onOffCluster);

    handler.commissioningController = {
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
        isConnected: false,
        initialized: false,
        connect: fake.returns(null),
        events: {
          initialized: Promise.resolve(),
          stateChanged: {
            on: (callback) => {
              stateChangedCallback = callback;
            },
          },
        },
        getDevices: fake.returns([
          {
            id: 'device-1',
            name: 'Test Device',
            number: 1,
            getClusterClientById: (id) => testClusterClients.get(id),
            getAllClusterClients: () => Array.from(testClusterClients.values()),
            getChildEndpoints: () => [],
          },
        ]),
      }),
    };

    await handler.refreshDevices();
    // Reset emit call count after initial setup
    gladys.event.emit.resetHistory();

    // Simulate state change to Disconnected (not Connected)
    await stateChangedCallback(NodeStates.Disconnected);

    // Should NOT have emitted any state since not Connected
    sinon.assert.notCalled(gladys.event.emit);
  });
});
