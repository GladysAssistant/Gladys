const NextcloudTalkService = require('../../../services/nextcloud-talk');

const gladys = {
  variable: {
    getVariables: () => Promise.resolve([{ user_id: 'f0de00a8-8ba7-4a4e-8f5a-7a21e94f36a8', value: 'testToken' }]),
  },
};

describe('nextcloud-talk', () => {
  const nextcloudTalkService = NextcloudTalkService(gladys, 'a4a59a7d-0001-4958-a794-37e38790142f');
  it('should start service', async () => {
    await nextcloudTalkService.start();
  });
  it('should stop service', async () => {
    await nextcloudTalkService.stop();
  });
});
