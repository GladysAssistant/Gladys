const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { fake } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.getNodes', () => {
  let matterHandler;

  beforeEach(() => {
    const gladys = {
      job: {
        wrapper: fake.returns(null),
      },
      stateManager: {
        getAllKeys: fake.returns(['id-1', 'id-2']),
        get: (entity, id) =>
          ({
            'id-1': { name: 'Kitchen plug', selector: 'kitchen-plug', external_id: 'matter:1234:1' },
            'id-2': { name: 'Other node', selector: 'other-node', external_id: 'matter:12345:1' },
          }[id]),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  const setupController = () => {
    const clusterClient = {
      id: 2,
      name: 'OnOff',
      attributes: {
        onOff: {},
      },
      commands: {},
    };
    matterHandler.commissioningController = {
      getNode: fake.returns({
        isConnected: true,
        getDevices: fake.returns([
          {
            number: 1,
            name: 'Test Device',
            getAllClusterClients: () => [],
            getChildEndpoints: () => [
              {
                name: 'Test Device child',
                number: 2,
                getAllClusterClients: () => [clusterClient],
                getChildEndpoints: () => [],
              },
            ],
          },
        ]),
      }),
      getCommissionedNodesDetails: fake.returns([
        {
          nodeId: 1234n,
          deviceData: {
            basicInformation: {
              vendorName: 'Test Vendor',
              productName: 'Test Product',
              productId: '1234',
              productLabel: 'Test Product Label',
              vendorId: '1234',
            },
          },
        },
        {
          nodeId: 1235n,
          deviceData: undefined,
        },
      ]),
    };
  };

  it('should return all nodes', async () => {
    setupController();
    const nodes = await matterHandler.getNodes({ withGladysDevices: true });
    expect(nodes).to.have.lengthOf(1);
    expect(nodes).to.deep.equal([
      {
        node_id: '1234',
        is_connected: true,
        gladys_devices: [{ name: 'Kitchen plug', selector: 'kitchen-plug' }],
        devices: [
          {
            name: 'Test Device',
            number: '1',
            cluster_clients: [],
            child_endpoints: [
              {
                name: 'Test Device child',
                number: '2',
                cluster_clients: [
                  {
                    id: '2',
                    name: 'OnOff',
                    attributes: ['onOff'],
                    commands: [],
                    all_keys: ['id', 'name', 'attributes', 'commands'],
                  },
                ],
                child_endpoints: [],
              },
            ],
          },
        ],
        node_information: {
          vendor_name: 'Test Vendor',
          product_name: 'Test Product',
          product_id: '1234',
          product_label: 'Test Product Label',
          vendor_id: '1234',
        },
      },
    ]);
  });
  it('should not list the Gladys devices unless asked', async () => {
    setupController();
    const nodes = await matterHandler.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes[0]).to.not.have.property('gladys_devices');
    expect(nodes[0]).to.have.property('is_connected', true);
  });
});
