const sinon = require('sinon');
const { expect } = require('chai');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.decommission', () => {
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

  it('should decommission a device', async () => {
    matterHandler.nodesMap.set(1234n, {
      decommission: fake.resolves(null),
    });
    matterHandler.devices.push({
      external_id: 'matter:1234:1',
    });
    await matterHandler.decommission(1234n);
    expect(matterHandler.devices).to.have.lengthOf(0);
    expect(matterHandler.nodesMap.size).to.equal(0);
  });
  it('should force decommission a device and remove it from the nodes map', async () => {
    matterHandler.nodesMap.set(1234n, {
      decommission: fake.rejects('Impossible to decommission'),
    });
    matterHandler.devices.push({
      external_id: 'matter:1234:1',
    });
    matterHandler.commissioningController = {
      removeNode: fake.resolves(null),
    };
    await matterHandler.decommission(1234n);
    assert.calledOnce(matterHandler.commissioningController.removeNode);
    expect(matterHandler.devices).to.have.lengthOf(0);
    expect(matterHandler.nodesMap.size).to.equal(0);
  });
});
