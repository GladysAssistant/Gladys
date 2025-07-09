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
  });

  it('should refresh devices', async () => {
    await matterHandler.refreshDevices();
    expect(matterHandler.devices).to.have.lengthOf(2);
    expect(matterHandler.nodesMap.size).to.equal(1);
    await matterHandler.refreshDevices();
    expect(matterHandler.devices).to.have.lengthOf(2);
    expect(matterHandler.nodesMap.size).to.equal(1);
  });
});
