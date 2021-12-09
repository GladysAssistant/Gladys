const { expect } = require('chai');
const NextcloudTalkService = require('../../../services/nextcloud-talk');

describe('nextcloud-talk', () => {
  it('should start service', async () => {
    const gladys = {
      variable: {
        getVariables: () => Promise.resolve([{ user_id: 'f0de00a8-8ba7-4a4e-8f5a-7a21e94f36a8', value: 'testToken' }]),
      },
    };
    const nextcloudTalkService = NextcloudTalkService(gladys, 'a4a59a7d-0001-4958-a794-37e38790142f');
    await nextcloudTalkService.start();
  });
  it('should failed to start service', async () => {
    const gladys = {
      variable: {
        getVariables: () => Promise.resolve([]),
      },
    };
    const nextcloudTalkService = NextcloudTalkService(gladys, 'a4a59a7d-0001-4958-a794-37e38790142f');
    await expect(nextcloudTalkService.start()).to.be.rejectedWith(Error);
  });
  it('should stop service', async () => {
    const gladys = {
      variable: {
        getVariables: () => Promise.resolve([{ user_id: 'f0de00a8-8ba7-4a4e-8f5a-7a21e94f36a8', value: 'testToken' }]),
      },
    };
    const nextcloudTalkService = NextcloudTalkService(gladys, 'a4a59a7d-0001-4958-a794-37e38790142f');
    nextcloudTalkService.message.bots = [{ stopPolling: () => {} }];
    await nextcloudTalkService.stop();
  });
});
