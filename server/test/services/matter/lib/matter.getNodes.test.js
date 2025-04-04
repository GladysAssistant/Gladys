const sinon = require('sinon');
const { expect } = require('chai');

const { fake } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.getNodes', () => {
  let matterHandler;

  beforeEach(() => {
    const gladys = {};
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  it('should return all nodes', async () => {
    matterHandler.commissioningController = {
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
      ]),
    };
    const nodes = matterHandler.getNodes();
    expect(nodes).to.have.lengthOf(1);
    expect(nodes).to.deep.equal([
      {
        node_id: '1234',
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
