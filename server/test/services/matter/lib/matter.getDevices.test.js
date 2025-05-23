const { expect } = require('chai');
const { fake } = require('sinon');

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.getDevices', () => {
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

  it('should return all devices', async () => {
    matterHandler.devices.push({
      external_id: 'matter:1234:1',
    });
    const devices = matterHandler.getDevices();
    expect(devices).to.have.lengthOf(1);
    expect(devices).to.deep.equal([
      {
        external_id: 'matter:1234:1',
      },
    ]);
  });
});
