const sinon = require('sinon');
const { expect } = require('chai');

const { fake } = sinon;

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
        onOff: {},
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
        getDevices: fake.returns([
          {
            id: 'device-1',
            name: 'Test Device',
            number: 1,
            getAllClusterClients: () => Array.from(clusterClients.values()),
            getClusterClientById: (id) => clusterClients.get(id),
            getChildEndpoints: () => [
              {
                id: 'child-endpoint-1',
                name: 'Child Endpoint',
                number: 2,
                getAllClusterClients: () => Array.from(clusterClients.values()),
                getClusterClientById: (id) => clusterClients.get(id),
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

  it('should continue with other devices when one node fails', async () => {
    let callCount = 0;
    // First node throws an error, second node succeeds
    matterHandler.commissioningController = {
      getCommissionedNodesDetails: fake.returns([
        {
          nodeId: 11111n,
          deviceData: {
            basicInformation: {
              vendorName: 'Unreachable Vendor',
              productName: 'Unreachable Product',
            },
          },
        },
        {
          nodeId: 22222n,
          deviceData: {
            basicInformation: {
              vendorName: 'Reachable Vendor',
              productName: 'Reachable Product',
            },
          },
        },
      ]),
      getNode: sinon.stub().callsFake(async () => {
        callCount += 1;
        if (callCount === 1) {
          throw new Error('Node is not reachable right now');
        }
        return {
          getDevices: fake.returns([
            {
              id: 'device-2',
              name: 'Reachable Device',
              number: 1,
              getAllClusterClients: () => Array.from(clusterClients.values()),
              getClusterClientById: (id) => clusterClients.get(id),
              getChildEndpoints: () => [],
            },
          ]),
        };
      }),
    };

    await matterHandler.refreshDevices();
    // Should have 1 device from the second node (first node failed)
    expect(matterHandler.devices).to.have.lengthOf(1);
    expect(matterHandler.devices[0].name).to.include('Reachable');
  });
});
