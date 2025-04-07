const sinon = require('sinon');
const { expect, assert } = require('chai');

const { fake } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.pairDevice', () => {
  let matterHandler;

  beforeEach(() => {
    const gladys = {};
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  it('should pair a device', async () => {
    const pairingCode = '1450-134-1614';
    const clusterClients = new Map();
    clusterClients.set(6, {
      addOnOffAttributeListener: fake.returns(null),
    });
    matterHandler.commissioningController = {
      commissionNode: fake.resolves(12345n),
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
        getDevices: fake.returns([
          {
            id: 'device-1',
            name: 'Test Device',
            number: 1,
            clusterClients: new Map(),
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
    await matterHandler.pairDevice(pairingCode);
    expect(matterHandler.devices).to.have.lengthOf(1);
    expect(matterHandler.nodesMap.size).to.equal(1);
  });
  it('should not pair a device, commissioning failed', async () => {
    const pairingCode = '1450-134-1614';
    matterHandler.commissioningController = {
      commissionNode: fake.rejects(new Error('Commissioning failed')),
    };
    const promise = matterHandler.pairDevice(pairingCode);
    await assert.isRejected(promise, 'Commissioning failed');
    expect(matterHandler.devices).to.have.lengthOf(0);
    expect(matterHandler.nodesMap.size).to.equal(0);
  });
});
