const { expect } = require('chai');
const { fake } = require('sinon');
const NextcloudTalkService = require('../../../services/nextcloud-talk');

describe('nextcloud-talk', () => {
  it('should start service', async () => {
    const gladys = {
      variable: {
        getVariables: fake.resolves([{ user_id: 'f0de00a8-8ba7-4a4e-8f5a-7a21e94f36a8', value: 'testToken' }]),
      },
    };
    const nextcloudTalkService = NextcloudTalkService(gladys, 'a4a59a7d-0001-4958-a794-37e38790142f');
    await nextcloudTalkService.start();
  });
  it('should failed to start service', async () => {
    const gladys = {
      variable: {
        getVariables: fake.resolves([]),
      },
    };
    const nextcloudTalkService = NextcloudTalkService(gladys, 'a4a59a7d-0001-4958-a794-37e38790142f');
    await expect(nextcloudTalkService.start()).to.be.rejectedWith(Error);
  });
  it('should stop service', async () => {
    const gladys = {
      variable: {
        getVariables: fake.resolves([{ user_id: 'f0de00a8-8ba7-4a4e-8f5a-7a21e94f36a8', value: 'testToken' }]),
      },
    };
    const nextcloudTalkService = NextcloudTalkService(gladys, 'a4a59a7d-0001-4958-a794-37e38790142f');
    await nextcloudTalkService.stop();
  });
  it('should return if service is used', async () => {
    const gladys = {};
    const nextcloudTalkService = NextcloudTalkService(gladys, 'a4a59a7d-0001-4958-a794-37e38790142f');
    const used = await nextcloudTalkService.isUsed();
    expect(used).to.equal(false);
  });
});
