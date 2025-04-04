const sinon = require('sinon');
const { expect } = require('chai');

const { fake } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.decommission', () => {
  let matterHandler;

  beforeEach(() => {
    const gladys = {};
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
});
