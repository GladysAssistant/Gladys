const sinon = require('sinon');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.stop', () => {
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

  it('should stop matter', async () => {
    matterHandler.commissioningController = {
      close: fake.resolves(null),
    };
    await matterHandler.stop();
    assert.calledOnce(matterHandler.commissioningController.close);
  });
});
