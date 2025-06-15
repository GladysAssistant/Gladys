const sinon = require('sinon');
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
    };
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  it('should return all nodes', async () => {
    const clusterClients = new Map();
    clusterClients.set(6, {
      id: 2,
      name: 'OnOff',
      attributes: {
        onOff: {},
      },
      commands: {},
    });
    matterHandler.commissioningController = {
      getNode: fake.returns({
        isConnected: true,
        getDevices: fake.returns([
          {
            number: 1,
            name: 'Test Device',
            clusterClients: new Map(),
            childEndpoints: [
              {
                name: 'Test Device child',
                number: 2,
                clusterClients,
                childEndpoints: [],
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
    const nodes = await matterHandler.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes).to.deep.equal([
      {
        node_id: '1234',
        is_connected: true,
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
});
